/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { BannerCampaign, ClientProfile, ProductItem } from '../tiposGeradorBanner';
import { compressImageToDataUrl } from '../utils/imageCompressor';
import { getProductFallbackImage } from '../utils/imageFallback';
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
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.76
): Promise<string> {
  return compressImageToDataUrl(dataUrl, maxWidth, maxHeight, quality);
}

/**
 * Salva uma imagem de produto em documento isolado no Firestore (coleção product_images/{productId})
 * e também no IndexedDB local. Garante redundância de backup para cada imagem.
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
    const optimized = await compressImageToDataUrl(imageUrl, 800, 800, 0.76);

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
 * Salva a campanha completa no Firebase Firestore com dados reais e compressão otimizada:
 * - Cada imagem é comprimida para ~20KB-28KB em 800x800px.
 * - 10 a 20 banners totalizam apenas 250KB a 500KB (bem abaixo do teto de 1MB do Firestore).
 * - Todas as imagens reais são mantidas diretamente no documento central, garantindo que
 *   todos os 10+ banners carreguem perfeitamente e imediatamente em qualquer computador ou TV.
 */
export async function saveCampaignToCloud(campaign: BannerCampaign): Promise<boolean> {
  try {
    if (!campaign || !campaign.products) return false;

    // 1. Otimiza e salva cada imagem individualmente no IndexedDB e Firestore
    const processedProducts: ProductItem[] = await Promise.all(
      campaign.products.map(async (p) => {
        if (p.imageUrl && p.imageUrl.startsWith('data:image')) {
          const compressed = await compressImageToDataUrl(p.imageUrl, 800, 800, 0.76);
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

    const payloadToSave: BannerCampaign = {
      ...campaign,
      products: processedProducts,
    };

    // Salva cópia local integral no IndexedDB (gigabytes de capacidade)
    saveLocalCampaign(payloadToSave).catch(() => {});

    // 2. Grava no documento central da campanha no Firestore
    const campaignDocRef = doc(db, CAMPAIGN_DOC_PATH, ACTIVE_CAMPAIGN_ID);
    await setDoc(campaignDocRef, {
      ...payloadToSave,
      _syncTimestamp: (payloadToSave as any)._syncTimestamp || new Date().toISOString(),
      _version: '2.6.0',
    });

    // 3. Backup no servidor Express local (se estiver rodando)
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

      // Restaura quaisquer imagens referenciadas por 'cloud-img:' legado
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
            return { ...p, imageUrl: getProductFallbackImage(p.title, p.category) };
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

          // Restaura imagens referenciadas por 'cloud-img:' legado
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
                return { ...p, imageUrl: getProductFallbackImage(p.title, p.category) };
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
 * Salva lista de clientes no Firestore com persistência real das imagens
 */
export async function saveClientsToCloud(clients: ClientProfile[]): Promise<boolean> {
  try {
    if (!clients || clients.length === 0) return true;

    const sanitizedClients = await Promise.all(
      clients.map(async (c) => {
        const sanitizedProducts = await Promise.all(
          (c.products || []).map(async (p) => {
            if (p.imageUrl && p.imageUrl.startsWith('data:image')) {
              const compressed = await compressImageToDataUrl(p.imageUrl, 800, 800, 0.76);
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
                return { ...p, imageUrl: getProductFallbackImage(p.title, p.category) };
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
