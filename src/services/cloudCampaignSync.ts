/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { BannerCampaign, ClientProfile, ProductItem } from '../tiposGeradorBanner';

const CAMPAIGN_DOC_PATH = 'campaigns';
const ACTIVE_CAMPAIGN_ID = 'active_campaign';
const CLIENTS_DOC_PATH = 'clients';
const CLIENTS_LIST_ID = 'all_clients';
const IMAGES_COLLECTION = 'product_images';

/**
 * Comprime imagens em base64 no navegador para garantir carregamento instantâneo
 * e compatibilidade total com o banco de dados na nuvem (Firestore).
 */
export async function compressImageForCloud(
  dataUrl: string,
  maxWidth = 1000,
  maxHeight = 1000,
  quality = 0.82
): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith('data:image')) {
    return dataUrl;
  }

  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(dataUrl);
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Tenta JPEG com compressão otimizada
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    } catch (e) {
      resolve(dataUrl);
    }
  });
}

/**
 * Salva uma imagem pesada de produto em documento isolado no Firestore
 */
export async function saveProductImageToCloud(productId: string, imageUrl: string): Promise<string> {
  if (!imageUrl || !imageUrl.startsWith('data:image')) {
    return imageUrl;
  }

  try {
    const optimized = await compressImageForCloud(imageUrl);
    const imageDocRef = doc(db, IMAGES_COLLECTION, productId);
    await setDoc(imageDocRef, {
      productId,
      imageUrl: optimized,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    return optimized;
  } catch (err) {
    console.warn('[CloudSync] Aviso ao salvar imagem isolada no Firestore:', err);
    return imageUrl;
  }
}

/**
 * Carrega a imagem de um produto do Firestore se estiver armazenada em documento isolado
 */
export async function loadProductImageFromCloud(productId: string): Promise<string | null> {
  try {
    const docRef = doc(db, IMAGES_COLLECTION, productId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data()?.imageUrl || null;
    }
  } catch (err) {
    console.warn('[CloudSync] Aviso ao buscar imagem no Firestore:', err);
  }
  return null;
}

/**
 * Salva a campanha completa no Firebase Firestore (Nuvem) com espelhamento local
 */
export async function saveCampaignToCloud(campaign: BannerCampaign): Promise<boolean> {
  try {
    // 1. Otimiza produtos e salva imagens no Firestore
    const optimizedProducts: ProductItem[] = await Promise.all(
      campaign.products.map(async (p) => {
        if (p.imageUrl && p.imageUrl.startsWith('data:image')) {
          const compressed = await compressImageForCloud(p.imageUrl);
          // Grava também no documento isolado para persistência duradoura
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
      products: optimizedProducts,
    };

    // 2. Grava no documento da campanha no Firestore
    const campaignDocRef = doc(db, CAMPAIGN_DOC_PATH, ACTIVE_CAMPAIGN_ID);
    await setDoc(campaignDocRef, {
      ...payloadToSave,
      _syncTimestamp: (payloadToSave as any)._syncTimestamp || new Date().toISOString(),
      _version: '2.5.0',
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
 * Carrega a campanha da Nuvem (Firebase Firestore).
 * Se offline ou erro, busca do backend local ou localStorage.
 */
export async function loadCampaignFromCloud(): Promise<BannerCampaign | null> {
  // 1. Tenta carregar do Firestore primeiro
  try {
    const docRef = doc(db, CAMPAIGN_DOC_PATH, ACTIVE_CAMPAIGN_ID);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as BannerCampaign;
      console.log('[CloudSync] Campanha carregada com sucesso do Firebase Firestore na Nuvem! ✨');
      return data;
    }
  } catch (err: any) {
    console.warn('[CloudSync] Firestore indisponível no momento, tentando backend local:', err?.message);
  }

  // 2. Fallback: Tenta carregar do servidor Express local
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

  // 3. Fallback: LocalStorage do navegador
  try {
    const saved = localStorage.getItem('playcomunique_campanha');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (_) {}

  return null;
}

/**
 * Ouve alterações em tempo real no Firestore (TV Player ou múltiplos computadores)
 */
export function subscribeToCloudCampaign(onUpdate: (campaign: BannerCampaign) => void): () => void {
  try {
    const docRef = doc(db, CAMPAIGN_DOC_PATH, ACTIVE_CAMPAIGN_ID);
    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as BannerCampaign;
          onUpdate(data);
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
 * Salva lista de clientes no Firestore
 */
export async function saveClientsToCloud(clients: ClientProfile[]): Promise<boolean> {
  try {
    const docRef = doc(db, CLIENTS_DOC_PATH, CLIENTS_LIST_ID);
    await setDoc(docRef, {
      clients,
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (err) {
    console.error('[CloudSync] Erro ao salvar clientes no Firestore:', err);
    return false;
  }
}

/**
 * Carrega lista de clientes do Firestore
 */
export async function loadClientsFromCloud(): Promise<ClientProfile[] | null> {
  try {
    const docRef = doc(db, CLIENTS_DOC_PATH, CLIENTS_LIST_ID);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data()?.clients || null;
    }
  } catch (err) {
    console.warn('[CloudSync] Erro ao carregar clientes do Firestore:', err);
  }
  return null;
}
