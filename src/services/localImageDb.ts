/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Banco de dados local IndexedDB para armazenamento persistente de imagens e campanhas.
 * Elimina o limite rígido de 5MB do LocalStorage e fornece gigabytes de espaço no navegador.
 */

const DB_NAME = 'PlayComunique_LocalDB_V1';
const DB_VERSION = 1;
const STORE_IMAGES = 'product_images';
const STORE_CAMPAIGN = 'campaign_cache';

let dbInstance: IDBDatabase | null = null;
const memoryImageMap = new Map<string, string>();

export function getMemoryImageSync(productId: string): string | null {
  if (!productId) return null;
  return memoryImageMap.get(productId) || null;
}

export function setMemoryImageSync(productId: string, dataUrl: string): void {
  if (!productId || !dataUrl) return;
  memoryImageMap.set(productId, dataUrl);
}

function getDb(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB não suportado no ambiente atual'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_IMAGES)) {
        db.createObjectStore(STORE_IMAGES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_CAMPAIGN)) {
        db.createObjectStore(STORE_CAMPAIGN, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Salva uma imagem em base64 na memória RAM (0ms) e no IndexedDB indexada pelo ID do produto
 */
export async function saveLocalImage(productId: string, dataUrl: string): Promise<void> {
  if (!productId || !dataUrl) return;
  if (dataUrl.startsWith('data:image')) {
    memoryImageMap.set(productId, dataUrl);
  }
  try {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_IMAGES, 'readwrite');
      const store = tx.objectStore(STORE_IMAGES);
      store.put({ id: productId, dataUrl, updatedAt: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Erro ao gravar imagem local:', err);
  }
}

/**
 * Recupera uma imagem em base64 da memória RAM ou do IndexedDB pelo ID do produto
 */
export async function getLocalImage(productId: string): Promise<string | null> {
  if (!productId) return null;
  const fromMem = memoryImageMap.get(productId);
  if (fromMem) return fromMem;

  try {
    const db = await getDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_IMAGES, 'readonly');
      const store = tx.objectStore(STORE_IMAGES);
      const req = store.get(productId);
      req.onsuccess = () => {
        const res = req.result ? req.result.dataUrl : null;
        if (res && res.startsWith('data:image')) {
          memoryImageMap.set(productId, res);
        }
        resolve(res);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Salva a campanha ativa completa no IndexedDB (e também indexada pelo ID do cliente)
 */
export async function saveLocalCampaign(campaign: any): Promise<void> {
  if (!campaign) return;
  try {
    if (Array.isArray(campaign.products)) {
      campaign.products.forEach((p: any) => {
        if (p?.id && p?.imageUrl && p.imageUrl.startsWith('data:image')) {
          saveLocalImage(p.id, p.imageUrl).catch(() => {});
        }
      });
    }
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CAMPAIGN, 'readwrite');
      const store = tx.objectStore(STORE_CAMPAIGN);
      store.put({ id: 'active_campaign', data: campaign, updatedAt: Date.now() });
      if (campaign.clientId) {
        store.put({ id: `client_${campaign.clientId}`, data: campaign, updatedAt: Date.now() });
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Erro ao gravar campanha local:', err);
  }
}

/**
 * Recupera a campanha específica de um cliente do IndexedDB
 */
export async function getLocalClientCampaign(clientId: string): Promise<any | null> {
  if (!clientId) return null;
  try {
    const db = await getDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_CAMPAIGN, 'readonly');
      const store = tx.objectStore(STORE_CAMPAIGN);
      const req = store.get(`client_${clientId}`);
      req.onsuccess = () => {
        resolve(req.result ? req.result.data : null);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Recupera a campanha ativa completa do IndexedDB
 */
export async function getLocalCampaign(): Promise<any | null> {
  try {
    const db = await getDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_CAMPAIGN, 'readonly');
      const store = tx.objectStore(STORE_CAMPAIGN);
      const req = store.get('active_campaign');
      req.onsuccess = () => {
        resolve(req.result ? req.result.data : null);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Salva a lista completa de clientes no IndexedDB como redundância de alta capacidade
 */
export async function saveLocalClients(clients: any[]): Promise<void> {
  if (!clients || !Array.isArray(clients)) return;
  try {
    clients.forEach((c: any) => {
      if (c?.id && c?.logoUrl && c.logoUrl.startsWith('data:image')) {
        saveLocalImage(`logo_${c.id}`, c.logoUrl).catch(() => {});
      }
      if (Array.isArray(c?.products)) {
        c.products.forEach((p: any) => {
          if (p?.id && p?.imageUrl && p.imageUrl.startsWith('data:image')) {
            saveLocalImage(p.id, p.imageUrl).catch(() => {});
          }
        });
      }
    });
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CAMPAIGN, 'readwrite');
      const store = tx.objectStore(STORE_CAMPAIGN);
      store.put({ id: 'all_clients', data: clients, updatedAt: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Erro ao gravar clientes locais:', err);
  }
}

/**
 * Recupera a lista completa de clientes do IndexedDB
 */
export async function getLocalClients(): Promise<any[] | null> {
  try {
    const db = await getDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_CAMPAIGN, 'readonly');
      const store = tx.objectStore(STORE_CAMPAIGN);
      const req = store.get('all_clients');
      req.onsuccess = () => {
        resolve(req.result ? req.result.data : null);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Grava a campanha no localStorage de forma compacta (sem duplicar base64 em formatsData)
 * garantindo que NUNCA estoure o limite de 5MB do localStorage mesmo com dezenas de banners.
 */
export function safeSaveCampaignToLocalStorage(campaign: any): void {
  if (!campaign || typeof window === 'undefined') return;
  try {
    // 1. Garante que todas as imagens data:image estejam salvas na memória e IndexedDB
    if (Array.isArray(campaign.products)) {
      campaign.products.forEach((p: any) => {
        if (p?.id && p?.imageUrl && p.imageUrl.startsWith('data:image')) {
          saveLocalImage(p.id, p.imageUrl).catch(() => {});
        }
      });
    }

    // 2. Cria cópia leve para o localStorage sem duplicar base64 nos 5 formatos de formatsData
    const compactFormats = campaign.formatsData ? JSON.parse(JSON.stringify(campaign.formatsData)) : undefined;
    if (compactFormats) {
      Object.keys(compactFormats).forEach((fmtKey) => {
        const fmt = compactFormats[fmtKey];
        if (fmt && Array.isArray(fmt.products)) {
          fmt.products = fmt.products.filter(Boolean).map((p: any) => {
            if (p?.imageUrl && (p.imageUrl.startsWith('data:image') || p.imageUrl.startsWith('cloud-img:'))) {
              return { ...p, imageUrl: '' };
            }
            return p;
          });
        }
      });
    }

    const compactCampaign = {
      ...campaign,
      formatsData: compactFormats,
    };

    let serialized = JSON.stringify(compactCampaign);
    // Se ainda passar de 1.8MB no localStorage, substitui base64 por ponteiros cloud-img: (as imagens reais já estão no IndexedDB e Firestore)
    if (serialized.length > 1800000 && Array.isArray(compactCampaign.products)) {
      compactCampaign.products = compactCampaign.products.map((p: any) => {
        if (p?.imageUrl && p.imageUrl.startsWith('data:image')) {
          return { ...p, imageUrl: `cloud-img:${p.id}` };
        }
        return p;
      });
      serialized = JSON.stringify(compactCampaign);
    }

    localStorage.setItem('playcomunique_campanha', serialized);
  } catch (e) {
    console.warn('[LocalStorage] Aviso ao compactar campanha para localStorage:', e);
  }
}

/**
 * Grava a lista de clientes no localStorage de forma compacta sem estourar o limite de 5MB
 */
export function safeSaveClientsToLocalStorage(clients: any[]): void {
  if (!clients || !Array.isArray(clients) || typeof window === 'undefined') return;
  try {
    const compactClients = clients.map((c: any) => {
      if (c?.id && c?.logoUrl && c.logoUrl.startsWith('data:image')) {
        saveLocalImage(`logo_${c.id}`, c.logoUrl).catch(() => {});
      }
      const compactProducts = (c?.products || []).map((p: any) => {
        if (p?.id && p?.imageUrl && p.imageUrl.startsWith('data:image')) {
          saveLocalImage(p.id, p.imageUrl).catch(() => {});
          return { ...p, imageUrl: `cloud-img:${p.id}` };
        }
        return p;
      });
      let compactFormats = c?.formatsData ? JSON.parse(JSON.stringify(c.formatsData)) : undefined;
      if (compactFormats) {
        Object.keys(compactFormats).forEach((fmtKey) => {
          const fmt = compactFormats[fmtKey];
          if (fmt && Array.isArray(fmt.products)) {
            fmt.products = fmt.products.filter(Boolean).map((p: any) => {
              if (p?.imageUrl && (p.imageUrl.startsWith('data:image') || p.imageUrl.startsWith('cloud-img:'))) {
                return { ...p, imageUrl: '' };
              }
              return p;
            });
          }
        });
      }
      return {
        ...c,
        products: compactProducts,
        formatsData: compactFormats,
      };
    });

    localStorage.setItem('playcomunique_clientes', JSON.stringify(compactClients));
  } catch (e) {
    console.warn('[LocalStorage] Aviso ao compactar clientes para localStorage:', e);
  }
}

