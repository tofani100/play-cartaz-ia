/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, legacyDb } from './firebaseConfig';
import { BannerCampaign, ClientProfile, ProductItem, BannerFormat, ALL_BANNER_FORMATS } from '../tiposGeradorBanner';
import { compressImageToDataUrl } from '../utils/imageCompressor';
import {
  saveLocalImage,
  getLocalImage,
  saveLocalCampaign,
  getLocalCampaign,
  getLocalClientCampaign,
  saveLocalClients,
  getLocalClients,
  safeSaveCampaignToLocalStorage,
  safeSaveClientsToLocalStorage,
} from './localImageDb';

const CAMPAIGN_DOC_PATH = 'campaigns';
const ACTIVE_CAMPAIGN_ID = 'active_campaign';
const CLIENTS_DOC_PATH = 'clients';
const CLIENTS_LIST_ID = 'all_clients';
const IMAGES_COLLECTION = 'product_images';

// Cache em memória de imagens já gravadas no Firestore nesta sessão (evita re-uploads repetidos e economiza 99% de cota)
const uploadedImageFingerprints = new Map<string, string>();

function getImageFingerprint(dataUrl: string): string {
  if (!dataUrl) return '';
  return `${dataUrl.length}:${dataUrl.slice(0, 32)}:${dataUrl.slice(-32)}`;
}

/**
 * Re-exporta a compressão universal para compatibilidade retroativa
 */
export async function compressImageForCloud(
  dataUrl: string,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.76
): Promise<string> {
  return compressImageToDataUrl(dataUrl, maxWidth, maxHeight, quality);
}

/**
 * Salva uma imagem de produto em documento isolado no Firestore (coleção product_images/{productId})
 * e também na RAM + IndexedDB local. Evita regravar no Firestore se a mesma imagem já estiver salva.
 */
export async function saveProductImageToCloud(productId: string, imageUrl: string): Promise<string> {
  if (!imageUrl || !productId) {
    return imageUrl;
  }

  // Se já for URL HTTP/HTTPS externa, caminho estático ou ponteiro cloud-img, não precisa comprimir/subir
  if (
    imageUrl.startsWith('http://') ||
    imageUrl.startsWith('https://') ||
    imageUrl.startsWith('/') ||
    imageUrl.startsWith('cloud-img:')
  ) {
    return imageUrl;
  }

  try {
    // Se a imagem data:image já for pequena (< 65KB), mantém; caso contrário otimiza
    const optimized =
      imageUrl.length < 65000
        ? imageUrl
        : await compressImageToDataUrl(imageUrl, 800, 800, 0.76);

    // 1. Salva na RAM (0ms) e no IndexedDB local
    saveLocalImage(productId, optimized).catch(() => {});

    // 2. Verifica se já subiu exatamente esta imagem para o Firestore nesta sessão
    const fp = getImageFingerprint(optimized);
    if (uploadedImageFingerprints.get(productId) === fp) {
      return optimized;
    }

    // 3. Salva em documento dedicado no Firestore
    const imageDocRef = doc(db, IMAGES_COLLECTION, productId);
    await setDoc(
      imageDocRef,
      {
        productId,
        imageUrl: optimized,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    uploadedImageFingerprints.set(productId, fp);
    return optimized;
  } catch (err) {
    console.warn('[CloudSync] Aviso ao salvar imagem isolada no Firestore:', err);
    return imageUrl;
  }
}

/**
 * Carrega a imagem de um produto da RAM/IndexedDB local ou do Firestore (documento isolado)
 */
export async function loadProductImageFromCloud(productId: string): Promise<string | null> {
  if (!productId) return null;

  // 1. Tenta RAM / IndexedDB local primeiro (super-rápido, 0ms)
  try {
    const local = await getLocalImage(productId);
    if (local && !local.startsWith('cloud-img:')) {
      uploadedImageFingerprints.set(productId, getImageFingerprint(local));
      return local;
    }
  } catch (_) {}

  // 2. Tenta documento isolado no Firestore principal
  try {
    const docRef = doc(db, IMAGES_COLLECTION, productId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const img = snap.data()?.imageUrl || null;
      if (img && !img.startsWith('cloud-img:')) {
        uploadedImageFingerprints.set(productId, getImageFingerprint(img));
        saveLocalImage(productId, img).catch(() => {});
        return img;
      }
    }
  } catch (err) {
    console.warn('[CloudSync] Aviso ao buscar imagem no Firestore principal:', err);
  }

  // 3. Fallback: tenta buscar na instância legada se for imagem antiga e migra automaticamente
  try {
    const legacyRef = doc(legacyDb, IMAGES_COLLECTION, productId);
    const legacySnap = await getDoc(legacyRef);
    if (legacySnap.exists()) {
      const img = legacySnap.data()?.imageUrl || null;
      if (img && !img.startsWith('cloud-img:')) {
        uploadedImageFingerprints.set(productId, getImageFingerprint(img));
        saveLocalImage(productId, img).catch(() => {});
        setDoc(doc(db, IMAGES_COLLECTION, productId), {
          productId,
          imageUrl: img,
          updatedAt: new Date().toISOString(),
        }, { merge: true }).catch(() => {});
        return img;
      }
    }
  } catch (_) {}

  return null;
}

/**
 * Restaura todas as imagens ('cloud-img:') e reconcilia formatsData de uma campanha vinda da nuvem ou cache
 */
export async function restoreCampaignData(data: BannerCampaign): Promise<BannerCampaign> {
  if (!data) return data;

  // 1. Restaura imagens da lista mestre de produtos
  const restoredProducts = await Promise.all(
    (data.products || []).filter(Boolean).map(async (p) => {
      if (p.imageUrl && p.imageUrl.startsWith('cloud-img:')) {
        const prodId = p.imageUrl.replace('cloud-img:', '');
        const resolved = await loadProductImageFromCloud(prodId);
        if (resolved) {
          return { ...p, imageUrl: resolved };
        }
        return p;
      }
      if (p.imageUrl && p.imageUrl.startsWith('data:image')) {
        saveLocalImage(p.id, p.imageUrl).catch(() => {});
        uploadedImageFingerprints.set(p.id, getImageFingerprint(p.imageUrl));
      } else if (!p.imageUrl && p.id) {
        const cached = await loadProductImageFromCloud(p.id);
        if (cached) {
          return { ...p, imageUrl: cached };
        }
      }
      return p;
    })
  );

  // 2. Restaura logotipo do cliente se necessário
  let restoredLogoUrl = data.clientLogoUrl || '';
  if (restoredLogoUrl.startsWith('cloud-img:')) {
    const logoKey = restoredLogoUrl.replace('cloud-img:', '');
    const cloudLogo = await loadProductImageFromCloud(logoKey);
    if (cloudLogo) restoredLogoUrl = cloudLogo;
  } else if (data.clientId && (!restoredLogoUrl || restoredLogoUrl.startsWith('/logos/belissima'))) {
    const cachedLogo = await getLocalImage(`logo_${data.clientId}`);
    if (cachedLogo && !cachedLogo.startsWith('cloud-img:')) {
      restoredLogoUrl = cachedLogo;
    }
  } else if (data.clientId && restoredLogoUrl.startsWith('data:image')) {
    saveLocalImage(`logo_${data.clientId}`, restoredLogoUrl).catch(() => {});
    uploadedImageFingerprints.set(`logo_${data.clientId}`, getImageFingerprint(restoredLogoUrl));
  }

  // 3. Reconcilia formatsData garantindo que todos os formatos tenham os mesmos produtos e imagens reais
  let restoredFormatsData = data.formatsData;
  if (restoredFormatsData) {
    restoredFormatsData = { ...restoredFormatsData };
    for (const fmtKey of ALL_BANNER_FORMATS) {
      const fmt = restoredFormatsData[fmtKey];
      if (fmt) {
        const fmtProductsRaw = Array.isArray(fmt.products) ? fmt.products.filter(Boolean) : [];
        // Reconcilia na ordem exata de restoredProducts para nunca perder novos itens nem manter itens deletados
        const reconciledFmtProducts: ProductItem[] = restoredProducts.map((masterProd, idx) => {
          if (fmtKey === '16:9') {
            return { ...masterProd };
          }
          const existingFmtProd = fmtProductsRaw.find((fp) => fp.id === masterProd.id) || fmtProductsRaw[idx];
          if (!existingFmtProd || existingFmtProd.id !== masterProd.id) {
            return { ...masterProd };
          }
          const validImg =
            existingFmtProd.imageUrl && !existingFmtProd.imageUrl.startsWith('cloud-img:')
              ? existingFmtProd.imageUrl
              : masterProd.imageUrl;
          return {
            ...masterProd,
            ...existingFmtProd,
            imageUrl: validImg || masterProd.imageUrl || '',
          };
        });

        restoredFormatsData[fmtKey] = {
          ...fmt,
          products: reconciledFmtProducts,
        };
      }
    }
  }

  return {
    ...data,
    clientLogoUrl: restoredLogoUrl || data.clientLogoUrl,
    products: restoredProducts,
    formatsData: restoredFormatsData || data.formatsData,
  };
}

/**
 * Restaura todas as imagens e formatos de uma lista de clientes vinda do Firestore ou cache
 */
export async function restoreClientsList(rawClients: ClientProfile[]): Promise<ClientProfile[]> {
  if (!rawClients || !Array.isArray(rawClients)) return [];

  return Promise.all(
    rawClients.map(async (c) => {
      let restoredLogo = c.logoUrl || '';
      if (restoredLogo.startsWith('cloud-img:')) {
        const logoId = restoredLogo.replace('cloud-img:', '');
        const resolvedLogo = await loadProductImageFromCloud(logoId);
        if (resolvedLogo) restoredLogo = resolvedLogo;
      } else if (!restoredLogo || restoredLogo.startsWith('/logos/belissima')) {
        const cachedLogo = await getLocalImage(`logo_${c.id}`);
        if (cachedLogo && !cachedLogo.startsWith('cloud-img:')) {
          restoredLogo = cachedLogo;
        }
      } else if (restoredLogo.startsWith('data:image')) {
        saveLocalImage(`logo_${c.id}`, restoredLogo).catch(() => {});
        uploadedImageFingerprints.set(`logo_${c.id}`, getImageFingerprint(restoredLogo));
      }

      const restoredProducts = await Promise.all(
        (c.products || []).filter(Boolean).map(async (p) => {
          if (p.imageUrl && p.imageUrl.startsWith('cloud-img:')) {
            const prodId = p.imageUrl.replace('cloud-img:', '');
            const resolved = await loadProductImageFromCloud(prodId);
            if (resolved) return { ...p, imageUrl: resolved };
            return p;
          }
          if (p.imageUrl && p.imageUrl.startsWith('data:image')) {
            saveLocalImage(p.id, p.imageUrl).catch(() => {});
            uploadedImageFingerprints.set(p.id, getImageFingerprint(p.imageUrl));
          } else if (!p.imageUrl && p.id) {
            const resolved = await loadProductImageFromCloud(p.id);
            if (resolved) return { ...p, imageUrl: resolved };
          }
          return p;
        })
      );

      // Reconcilia formatsData do cliente para que nenhum formato tenha foto vazia ou produtos defasados
      let restoredFormats = c.formatsData;
      if (restoredFormats) {
        restoredFormats = { ...restoredFormats };
        for (const fmtKey of ALL_BANNER_FORMATS) {
          const fmt = restoredFormats[fmtKey];
          if (fmt) {
            const fmtProductsRaw = Array.isArray(fmt.products) ? fmt.products.filter(Boolean) : [];
            const reconciledFmtProducts: ProductItem[] = restoredProducts.map((masterProd, idx) => {
              if (fmtKey === '16:9') {
                return { ...masterProd };
              }
              const existingFmtProd = fmtProductsRaw.find((fp) => fp.id === masterProd.id) || fmtProductsRaw[idx];
              if (!existingFmtProd || existingFmtProd.id !== masterProd.id) {
                return { ...masterProd };
              }
              const validImg =
                existingFmtProd.imageUrl && !existingFmtProd.imageUrl.startsWith('cloud-img:')
                  ? existingFmtProd.imageUrl
                  : masterProd.imageUrl;
              return {
                ...masterProd,
                ...existingFmtProd,
                imageUrl: validImg || masterProd.imageUrl || '',
              };
            });
            restoredFormats[fmtKey] = {
              ...fmt,
              products: reconciledFmtProducts,
            };
          }
        }
      }

      return {
        ...c,
        logoUrl: restoredLogo,
        products: restoredProducts,
        formatsData: restoredFormats,
      };
    })
  );
}

/**
 * Salva a campanha completa no Firebase Firestore:
 * 1. Garante que qualquer imagem nova (data:image) esteja salva em product_images/{id}
 * 2. Salva em campaigns/active_campaign (campanha global em exibição)
 * 3. Salva em campaigns/client_{clientId} (documento dedicado exclusivo daquele cliente)
 */
export async function saveCampaignToCloud(campaign: BannerCampaign): Promise<boolean> {
  try {
    if (!campaign || !campaign.products) return false;

    // 1. Trata e otimiza o logotipo da campanha
    let processedLogoUrl = campaign.clientLogoUrl || '';
    if (processedLogoUrl && processedLogoUrl.startsWith('data:image')) {
      processedLogoUrl = await compressImageToDataUrl(processedLogoUrl, 600, 600, 0.88);
      if (campaign.clientId) {
        saveProductImageToCloud(`logo_${campaign.clientId}`, processedLogoUrl).catch(() => {});
      }
    }

    // 2. Garante que toda imagem data:image de produto esteja salva em product_images/{id} (com deduplicação em RAM)
    const rawProducts = (campaign.products || []).filter(Boolean);
    const processedProducts: ProductItem[] = await Promise.all(
      rawProducts.map(async (p) => {
        if (p.imageUrl && p.imageUrl.startsWith('data:image')) {
          const savedImg = await saveProductImageToCloud(p.id, p.imageUrl);
          return { ...p, imageUrl: savedImg };
        }
        return p;
      })
    );

    // 2.1 Mantém cópia local integral no IndexedDB e localStorage compacto ANTES de sanitizar para nuvem
    const fullLocalCampaign: BannerCampaign = {
      ...campaign,
      clientLogoUrl: processedLogoUrl || campaign.clientLogoUrl,
      products: processedProducts,
    };
    saveLocalCampaign(fullLocalCampaign).catch(() => {});
    safeSaveCampaignToLocalStorage(fullLocalCampaign);

    // 2.2 Elimina duplicação pesada de imagens em formatsData (cada formato herda da lista principal)
    const sanitizedFormatsData = campaign.formatsData ? JSON.parse(JSON.stringify(campaign.formatsData)) : undefined;
    if (sanitizedFormatsData) {
      Object.keys(sanitizedFormatsData).forEach((fmtKey) => {
        const fmt = sanitizedFormatsData[fmtKey];
        if (fmt) {
          if ( fmt.customStyles?.bannerBgImageUrl?.startsWith('data:image') && campaign.customStyles?.bannerBgImageUrl === fmt.customStyles.bannerBgImageUrl && fmtKey !== '16:9') {
            fmt.customStyles.bannerBgImageUrl = '';
          }
          if (Array.isArray(fmt.products)) {
            fmt.products = fmt.products.filter(Boolean).map((p: ProductItem) => {
              const cleaned = { ...p };
              if (cleaned.imageUrl && (cleaned.imageUrl.startsWith('data:image') || cleaned.imageUrl.startsWith('cloud-img:'))) {
                cleaned.imageUrl = '';
              }
              if (cleaned.customStyles?.bannerBgImageUrl?.startsWith('data:image')) {
                cleaned.customStyles = { ...cleaned.customStyles, bannerBgImageUrl: '' };
              }
              return cleaned;
            });
          }
        }
      });
    }

    // 2.3 Blindagem contra o teto rígido de 1MB do Firestore:
    // Se o documento ultrapassar 600KB, converte imagens de produtos para 'cloud-img:${p.id}'
    // (todas as imagens já foram garantidas na coleção dedicada product_images acima)
    const cloudProducts = [...processedProducts];
    let testPayload = {
      ...campaign,
      clientLogoUrl: processedLogoUrl || campaign.clientLogoUrl,
      products: cloudProducts,
      formatsData: sanitizedFormatsData || campaign.formatsData,
    };
    let jsonSize = JSON.stringify(testPayload).length;
    if (jsonSize > 600000) {
      for (let i = 0; i < cloudProducts.length && jsonSize > 600000; i++) {
        if (cloudProducts[i].imageUrl && cloudProducts[i].imageUrl.startsWith('data:image')) {
          cloudProducts[i] = {
            ...cloudProducts[i],
            imageUrl: `cloud-img:${cloudProducts[i].id}`,
          };
          testPayload.products = cloudProducts;
          jsonSize = JSON.stringify(testPayload).length;
        }
      }
    }

    const syncTimestamp = (campaign as any)._syncTimestamp || new Date().toISOString();
    const sanitizedPayload = JSON.parse(
      JSON.stringify({
        ...testPayload,
        _syncTimestamp: syncTimestamp,
        _lastSaveId: (campaign as any)._lastSaveId || '',
        _senderTabId: (campaign as any)._senderTabId || '',
        _version: '2.7.0',
      })
    );

    // 3. Grava no documento central (active_campaign) E no documento dedicado do cliente (client_{clientId})
    const campaignDocRef = doc(db, CAMPAIGN_DOC_PATH, ACTIVE_CAMPAIGN_ID);
    const writes: Promise<void>[] = [setDoc(campaignDocRef, sanitizedPayload)];

    if (campaign.clientId) {
      const clientCampaignDocRef = doc(db, CAMPAIGN_DOC_PATH, `client_${campaign.clientId}`);
      writes.push(setDoc(clientCampaignDocRef, sanitizedPayload));
    }

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout de gravação Firestore')), 8000)
    );
    await Promise.race([Promise.all(writes), timeoutPromise]);

    // 4. Backup no servidor Express local (se estiver rodando)
    try {
      fetch('/api/campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullLocalCampaign),
      }).catch(() => {});
    } catch (_) {}

    return true;
  } catch (err: any) {
    console.error('[CloudSync] Erro ao salvar campanha no Firebase Firestore:', err?.message || err);
    return false;
  }
}

/**
 * Carrega a campanha específica de um cliente do Firestore (campaigns/client_{clientId})
 */
export async function loadClientCampaignFromCloud(clientId: string): Promise<BannerCampaign | null> {
  if (!clientId) return null;
  try {
    const docRef = doc(db, CAMPAIGN_DOC_PATH, `client_${clientId}`);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as BannerCampaign;
      const restored = await restoreCampaignData(data);
      saveLocalCampaign(restored).catch(() => {});
      return restored;
    }
  } catch (err: any) {
    console.warn(`[CloudSync] Aviso ao carregar campanha do cliente ${clientId}:`, err?.message);
  }

  try {
    const localClientCamp = await getLocalClientCampaign(clientId);
    if (localClientCamp && localClientCamp.products?.length > 0) {
      return await restoreCampaignData(localClientCamp);
    }
  } catch (_) {}

  return null;
}

/**
 * Carrega a campanha ativa da Nuvem com restauração paralela de imagens e verificação de versão mais recente
 */
export async function loadCampaignFromCloud(): Promise<BannerCampaign | null> {
  let cloudData: BannerCampaign | null = null;

  // 1. Tenta carregar do Firestore primeiro
  try {
    const docRef = doc(db, CAMPAIGN_DOC_PATH, ACTIVE_CAMPAIGN_ID);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const rawData = snap.data() as BannerCampaign;
      // Verifica também se o documento dedicado do cliente ativo possui um timestamp mais recente
      if (rawData.clientId) {
        try {
          const clientDocSnap = await getDoc(doc(db, CAMPAIGN_DOC_PATH, `client_${rawData.clientId}`));
          if (clientDocSnap.exists()) {
            const clientDocData = clientDocSnap.data() as BannerCampaign;
            const activeTs = (rawData as any)._syncTimestamp || '';
            const clientTs = (clientDocData as any)._syncTimestamp || '';
            if (clientTs > activeTs && (clientDocData.products?.length || 0) > 0) {
              cloudData = await restoreCampaignData(clientDocData);
            }
          }
        } catch (_) {}
      }
      if (!cloudData) {
        cloudData = await restoreCampaignData(rawData);
      }
    }
  } catch (err: any) {
    console.warn('[CloudSync] Firestore indisponível no momento:', err?.message);
  }

  // 2. Verifica IndexedDB local: se o cache local for do mesmo cliente e tiver timestamp mais recente (ex: F5 imediato), preserva e sincroniza!
  try {
    const local = await getLocalCampaign();
    if (local && local.products?.length > 0) {
      if (!cloudData) {
        console.log('[CloudSync] Campanha restaurada do IndexedDB local.');
        return await restoreCampaignData(local);
      }
      const cloudTs = (cloudData as any)._syncTimestamp || '';
      const localTs = (local as any)._syncTimestamp || '';
      if (
        local.clientId === cloudData.clientId &&
        localTs &&
        cloudTs &&
        new Date(localTs).getTime() > new Date(cloudTs).getTime()
      ) {
        console.log('[CloudSync] Cache local mais recente detectado, sincronizando com a Nuvem...');
        const restoredLocal = await restoreCampaignData(local);
        saveCampaignToCloud(restoredLocal).catch(() => {});
        return restoredLocal;
      }
    }
  } catch (_) {}

  if (cloudData) {
    saveLocalCampaign(cloudData).catch(() => {});
    safeSaveCampaignToLocalStorage(cloudData);
    console.log('[CloudSync] Campanha carregada com sucesso do Firebase Firestore na Nuvem! ✨');
    return cloudData;
  }

  // 3. Fallback: Servidor Express local
  try {
    const res = await fetch('/api/campaign');
    if (res.ok) {
      const serverData = await res.json();
      if (serverData && serverData.success && serverData.data) {
        console.log('[CloudSync] Campanha carregada do backend local.');
        return await restoreCampaignData(serverData.data);
      }
    }
  } catch (_) {}

  // 4. Fallback: LocalStorage do navegador
  try {
    const saved = localStorage.getItem('playcomunique_campanha');
    if (saved) {
      return await restoreCampaignData(JSON.parse(saved));
    }
  } catch (_) {}

  return null;
}

/**
 * Ouve alterações em tempo real no Firestore com restauração automática de imagens
 */
export function subscribeToCloudCampaign(onUpdate: (campaign: BannerCampaign) => void): () => void {
  try {
    const docRef = doc(db, CAMPAIGN_DOC_PATH, ACTIVE_CAMPAIGN_ID);
    return onSnapshot(
      docRef,
      async (snap) => {
        if (snap.exists()) {
          const data = snap.data() as BannerCampaign;
          const restored = await restoreCampaignData(data);
          onUpdate(restored);
        }
      },
      (err) => {
        console.warn('[CloudSync] Erro no listener do Firestore:', err);
      }
    );
  } catch (e) {
    console.warn('[CloudSync] Não foi possível ativar listener em tempo real:', e);
    return () => {};
  }
}

/**
 * Salva lista de clientes no Firestore com persistência real das imagens e sincronização por cliente
 */
export async function saveClientsToCloud(clients: ClientProfile[]): Promise<boolean> {
  try {
    if (!clients || clients.length === 0) return true;

    // 1. Salva imediatamente cópia local integral no IndexedDB e versão compacta no localStorage
    saveLocalClients(clients).catch(() => {});
    safeSaveClientsToLocalStorage(clients);

    // 2. Otimiza logos e garante que imagens novas de produtos estejam em product_images/{id}
    const sanitizedClients = await Promise.all(
      clients.map(async (c) => {
        let clientLogo = c.logoUrl || '';
        if (clientLogo && clientLogo.startsWith('data:image')) {
          const compressedLogo = await compressImageToDataUrl(clientLogo, 600, 600, 0.88);
          await saveProductImageToCloud(`logo_${c.id}`, compressedLogo).catch(() => {});
          clientLogo = compressedLogo;
        }

        const sanitizedProducts = await Promise.all(
          (c.products || []).filter(Boolean).map(async (p) => {
            if (p.imageUrl && p.imageUrl.startsWith('data:image')) {
              await saveProductImageToCloud(p.id, p.imageUrl).catch(() => {});
              return {
                ...p,
                imageUrl: `cloud-img:${p.id}`,
              };
            }
            return p;
          })
        );

        let sanitizedClientFormats = c.formatsData;
        if (sanitizedClientFormats) {
          const clonedFormats: Partial<Record<BannerFormat, any>> = JSON.parse(JSON.stringify(sanitizedClientFormats));
          (Object.keys(clonedFormats) as BannerFormat[]).forEach((fmtKey) => {
            const fmt = clonedFormats[fmtKey];
            if (fmt && Array.isArray(fmt.products)) {
              fmt.products = fmt.products.filter(Boolean).map((p: ProductItem) => {
                if (p && p.imageUrl && (p.imageUrl.startsWith('data:image') || p.imageUrl.startsWith('cloud-img:'))) {
                  return { ...p, imageUrl: '' };
                }
                return p;
              });
            }
          });
          sanitizedClientFormats = clonedFormats as any;
        }

        return {
          ...c,
          logoUrl: clientLogo,
          products: sanitizedProducts,
          formatsData: sanitizedClientFormats,
        };
      })
    );

    const docRef = doc(db, CLIENTS_DOC_PATH, CLIENTS_LIST_ID);
    const sanitizedClientsPayload = JSON.parse(
      JSON.stringify({
        clients: sanitizedClients,
        updatedAt: new Date().toISOString(),
      })
    );
    const savePromise = setDoc(docRef, sanitizedClientsPayload);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout de gravação de clientes')), 8000)
    );
    await Promise.race([savePromise, timeoutPromise]);
    return true;
  } catch (err) {
    console.error('[CloudSync] Erro ao salvar clientes no Firestore:', err);
    return false;
  }
}

/**
 * Carrega lista de clientes do Firestore com restauração automática de imagens, logos e formatos
 */
export async function loadClientsFromCloud(): Promise<ClientProfile[] | null> {
  try {
    const docRef = doc(db, CLIENTS_DOC_PATH, CLIENTS_LIST_ID);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      const rawClients = (data?.clients || []) as ClientProfile[];
      const restoredClients = await restoreClientsList(rawClients);

      saveLocalClients(restoredClients).catch(() => {});
      safeSaveClientsToLocalStorage(restoredClients);
      return restoredClients;
    }
  } catch (err) {
    console.warn('[CloudSync] Erro ao carregar clientes do Firestore:', err);
  }

  // Fallback para IndexedDB local
  try {
    const localClients = await getLocalClients();
    if (localClients && localClients.length > 0) {
      console.log('[CloudSync] Clientes restaurados do IndexedDB local.');
      return await restoreClientsList(localClients);
    }
  } catch (_) {}

  return null;
}

/**
 * Ouve alterações em tempo real na lista de clientes no Firestore (com restauração completa de imagens)
 */
export function subscribeToCloudClients(onUpdate: (clients: ClientProfile[]) => void): () => void {
  try {
    const docRef = doc(db, CLIENTS_DOC_PATH, CLIENTS_LIST_ID);
    return onSnapshot(
      docRef,
      async (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const rawClients = (data?.clients || []) as ClientProfile[];
          if (rawClients && rawClients.length > 0) {
            const restored = await restoreClientsList(rawClients);
            onUpdate(restored);
          }
        }
      },
      (err) => {
        console.warn('[CloudSync] Erro no listener de clientes do Firestore:', err);
      }
    );
  } catch (e) {
    console.warn('[CloudSync] Não foi possível ativar listener de clientes:', e);
    return () => {};
  }
}

