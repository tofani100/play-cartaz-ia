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
 * Salva uma imagem em base64 no IndexedDB indexada pelo ID do produto
 */
export async function saveLocalImage(productId: string, dataUrl: string): Promise<void> {
  if (!productId || !dataUrl) return;
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
 * Recupera uma imagem em base64 do IndexedDB pelo ID do produto
 */
export async function getLocalImage(productId: string): Promise<string | null> {
  if (!productId) return null;
  try {
    const db = await getDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_IMAGES, 'readonly');
      const store = tx.objectStore(STORE_IMAGES);
      const req = store.get(productId);
      req.onsuccess = () => {
        resolve(req.result ? req.result.dataUrl : null);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Salva a campanha ativa completa no IndexedDB como backup instantâneo
 */
export async function saveLocalCampaign(campaign: any): Promise<void> {
  if (!campaign) return;
  try {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CAMPAIGN, 'readwrite');
      const store = tx.objectStore(STORE_CAMPAIGN);
      store.put({ id: 'active_campaign', data: campaign, updatedAt: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Erro ao gravar campanha local:', err);
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
