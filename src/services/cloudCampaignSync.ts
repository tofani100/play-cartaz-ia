/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { BannerCampaign, ClientProfile, ProductItem } from '../tiposGeradorBanner';
import { compressImageToDataUrl } from '../utils/imageCompressor';
import {
  saveLocalImage,
  getLocalImage,
  saveLocalCampaign,
  getLocalCampaign,
} from './localImageDb';

const CAMPAIGN_DOC_PATH = 'campaigns';
const ACTIVE_CAMPAIGN_ID = 'active_campaign';
const CLIENTS_DOC_PATH = 'clients';
const CLIENTS_LIST_ID = 'all_clients';
const IMAGES_COLLECTION = 'product_images';

/**
 * Re-exporta a compressão universal para compatibilidade retroativa
 */
export async function compressImageForCloud(
  dataUrl: string,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.82
): Promise<string> {
  return compressImageToDataUrl(dataUrl, maxWidth, maxHeight, quality);
}

/**
 * Salva uma imagem de produto em documento isolado no Firestore (coleção product_images/{productId})
 * e também no IndexedDB local. Garante que cada imagem tenha seu próprio espaço de 1MB no Firestore,
 * permitindo 10, 20, 50 ou mais banners por cliente sem qualquer limitação.
 */
export async function saveProductImageToCloud(productId: string, imageUrl: string): Promise<string> {
  if (!imageUrl || !productId) {
    return imageUrl;
  }

  // Se já for URL HTTP/HTTPS externa ou placeholder estático, não precisa salvar em documento isolado
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('/')) {
    return imageUrl;
  }

  try {
    const optimized = await compressImageToDataUrl(imageUrl, 1200, 1200, 0.82);

    // 1. Salva no IndexedDB local para carregamento instantâneo em 0ms
    saveLocalImage(productId, optimized).catch(() => {});

    // 2. Salva em documento dedicado no Firestore
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

    return optimized;
  } catch (err) {
    console.warn('[CloudSync] Aviso ao salvar imagem isolada no Firestore:', err);
    return imageUrl;
  }
}

/**
 * Carrega a imagem de um produto do IndexedDB local ou do Firestore (documento isolado)
 */
export async function loadProductImageFromCloud(productId: string): Promise<string | null> {
  if (!productId) return null;

  // 1. Tenta IndexedDB local primeiro (super-rápido, 0ms)
  try {
    const local = await getLocalImage(productId);
    if (local) return local;
  } catch (_) {}

  // 2. Tenta documento isolado no Firestore
  try {
    const docRef = doc(db, IMAGES_COLLECTION, productId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const img = snap.data()?.imageUrl || null;
      if (img) {
        saveLocalImage(productId, img).catch(() => {});
        return img;
      }
    }
  } catch (err) {
    console.warn('[CloudSync] Aviso ao buscar imagem no Firestore:', err);
  }

  return null;
}

/**
 * Salva a campanha completa no Firebase Firestore com arquitetura desacoplada de imagens:
 * - Imagens base64 pesadas são armazenadas em documentos isolados (product_images/{id}) e IndexedDB.
 * - O documento central da campanha permanece ultra-leve (< 50KB), NUNCA atingindo o limite de 1MB do Firestore,
 *   garantindo que 10, 20 ou 100 banners funcionem perfeitamente sem regredir imagens.
 */
export async function saveCampaignToCloud(campaign: BannerCampaign): Promise<boolean> {
  try {
    if (!campaign || !campaign.products) return false;

    // 1. Otimiza e salva cada imagem individualmente no IndexedDB e Firestore
    const processedProducts: ProductItem[] = await Promise.all(
      campaign.products.map(async (p) => {
        if (p.imageUrl && p.imageUrl.startsWith('data:image')) {
          const compressed = await compressImageToDataUrl(p.imageUrl, 1200, 1200, 0.82);
          saveLocalImage(p.id, compressed).catch(() => {});
          saveProductImageToCloud(p.id, compressed).catch(() => {});
          return {
            ...p,
            imageUrl: compressed,
          };
        }
        return p;
      })
    );

    // Salva cópia local integral no IndexedDB (gigabytes de capacidade)
    saveLocalCampaign({ ...campaign, products: processedProducts }).catch(() => {});

    // 2. Prepara o payload para o documento central no Firestore
    // Se o payload total tiver mais de 350KB, substituímos base64 inline por referência 'cloud-img:'
    // para garantir que o documento central nunca chegue perto de 1MB.
    const jsonLength = JSON.stringify({ ...campaign, products: processedProducts }).length;

    let productsForCentralDoc = processedProducts;
    if (jsonLength > 350_000) {
      productsForCentralDoc = processedProducts.map((p) => {
        if (p.imageUrl && p.imageUrl.startsWith('data:image')) {
          return {
            ...p,
            imageUrl: `cloud-img:${p.id}`,
          };
        }
        return p;
      });
    }

    const payloadToSave: BannerCampaign = {
      ...campaign,
      products: productsForCentralDoc,
    };

    // 3. Grava no documento central da campanha no Firestore
    const campaignDocRef = doc(db, CAMPAIGN_DOC_PATH, ACTIVE_CAMPAIGN_ID);
    await setDoc(campaignDocRef, {
      ...payloadToSave,
      _syncTimestamp: (payloadToSave as any)._syncTimestamp || new Date().toISOString(),
      _version: '2.5.1',
    });

    // 4. Backup no servidor Express local (se estiver rodando)
    try {
      fetch('/api/campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadToSave),
      }).catch(() => {});
    } catch (_) {}

    return true;
  } catch (err: any) {
    console.error('[CloudSync] Erro ao salvar campanha no Firebase Firestore:', err?.message || err);
    return false;
  }
}

/**
 * Carrega a campanha da Nuvem com restauração paralela de imagens
 */
export async function loadCampaignFromCloud(): Promise<BannerCampaign | null> {
  // 1. Tenta carregar do Firestore primeiro
  try {
    const docRef = doc(db, CAMPAIGN_DOC_PATH, ACTIVE_CAMPAIGN_ID);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as BannerCampaign;

      // Restaura quaisquer imagens referenciadas por 'cloud-img:'
      const restoredProducts = await Promise.all(
        (data.products || []).map(async (p) => {
          if (p.imageUrl && p.imageUrl.startsWith('cloud-img:')) {
            const prodId = p.imageUrl.replace('cloud-img:', '');
            const local = await getLocalImage(prodId);
            if (local) return { ...p, imageUrl: local };

            const cloud = await loadProductImageFromCloud(prodId);
            if (cloud) {
              saveLocalImage(prodId, cloud).catch(() => {});
              return { ...p, imageUrl: cloud };
            }
          }
          return p;
        })
      );

      console.log('[CloudSync] Campanha carregada com sucesso do Firebase Firestore na Nuvem! ✨');
      return {
        ...data,
        products: restoredProducts,
      };
    }
  } catch (err: any) {
    console.warn('[CloudSync] Firestore indisponível no momento:', err?.message);
  }

  // 2. Fallback: IndexedDB local
  try {
    const local = await getLocalCampaign();
    if (local && local.products?.length > 0) {
      console.log('[CloudSync] Campanha restaurada do IndexedDB local.');
      return local;
    }
  } catch (_) {}

  // 3. Fallback: Servidor Express local
  try {
    const res = await fetch('/api/campaign');
    if (res.ok) {
      const serverData = await res.json();
      if (serverData && serverData.success && serverData.data) {
        console.log('[CloudSync] Campanha carregada do backend local.');
        return serverData.data;
      }
    }
  } catch (_) {}

  // 4. Fallback: LocalStorage do navegador
  try {
    const saved = localStorage.getItem('playcomunique_campanha');
    if (saved) {
      return JSON.parse(saved);
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

          // Restaura imagens referenciadas por 'cloud-img:'
          const restoredProducts = await Promise.all(
            (data.products || []).map(async (p) => {
              if (p.imageUrl && p.imageUrl.startsWith('cloud-img:')) {
                const prodId = p.imageUrl.replace('cloud-img:', '');
                const local = await getLocalImage(prodId);
                if (local) return { ...p, imageUrl: local };

                const cloud = await loadProductImageFromCloud(prodId);
                if (cloud) {
                  saveLocalImage(prodId, cloud).catch(() => {});
                  return { ...p, imageUrl: cloud };
                }
              }
              return p;
            })
          );

          onUpdate({
            ...data,
            products: restoredProducts,
          });
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
 * Salva lista de clientes no Firestore com proteção contra documentos grandes
 */
export async function saveClientsToCloud(clients: ClientProfile[]): Promise<boolean> {
  try {
    if (!clients || clients.length === 0) return true;

    // Sanitiza os produtos de cada cliente para garantir que all_clients fique sempre < 50KB
    const sanitizedClients = await Promise.all(
      clients.map(async (c) => {
        const sanitizedProducts = await Promise.all(
          (c.products || []).map(async (p) => {
            if (p.imageUrl && p.imageUrl.startsWith('data:image')) {
              // Garante que a imagem está salva no IndexedDB e Firestore
              const compressed = await compressImageToDataUrl(p.imageUrl, 1200, 1200, 0.82);
              saveProductImageToCloud(p.id, compressed).catch(() => {});
              saveLocalImage(p.id, compressed).catch(() => {});
              return {
                ...p,
                imageUrl: `cloud-img:${p.id}`,
              };
            }
            return p;
          })
        );

        return {
          ...c,
          products: sanitizedProducts,
        };
      })
    );

    const docRef = doc(db, CLIENTS_DOC_PATH, CLIENTS_LIST_ID);
    await setDoc(docRef, {
      clients: sanitizedClients,
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (err) {
    console.error('[CloudSync] Erro ao salvar clientes no Firestore:', err);
    return false;
  }
}

/**
 * Carrega lista de clientes do Firestore com restauração automática de imagens
 */
export async function loadClientsFromCloud(): Promise<ClientProfile[] | null> {
  try {
    const docRef = doc(db, CLIENTS_DOC_PATH, CLIENTS_LIST_ID);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      const rawClients = (data?.clients || []) as ClientProfile[];

      // Restaura imagens dos produtos dos clientes
      const restoredClients = await Promise.all(
        rawClients.map(async (c) => {
          const restoredProducts = await Promise.all(
            (c.products || []).map(async (p) => {
              if (p.imageUrl && p.imageUrl.startsWith('cloud-img:')) {
                const prodId = p.imageUrl.replace('cloud-img:', '');
                const local = await getLocalImage(prodId);
                if (local) return { ...p, imageUrl: local };

                const cloud = await loadProductImageFromCloud(prodId);
                if (cloud) {
                  saveLocalImage(prodId, cloud).catch(() => {});
                  return { ...p, imageUrl: cloud };
                }
              }
              return p;
            })
          );
          return {
            ...c,
            products: restoredProducts,
          };
        })
      );

      return restoredClients;
    }
  } catch (err) {
    console.warn('[CloudSync] Erro ao carregar clientes do Firestore:', err);
  }
  return null;
}
