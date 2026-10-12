import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

const firebaseConfig = {
  projectId: 'cartaz-ia-playcomunique',
  appId: '1:197813011852:web:50dedd7c880168f29342a9',
  storageBucket: 'cartaz-ia-playcomunique.firebasestorage.app',
  apiKey: 'AIzaSyAkr0jo3972Kv2Zz1m9YQu4Bt033ZfgZMA',
  authDomain: 'cartaz-ia-playcomunique.firebaseapp.com',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const knownCollections = [
  'campaigns',
  'clients',
  'product_images',
  'products',
  'banners',
  'images',
  'cartazes',
  'users',
  'history',
  'templates',
  'catalog'
];

async function scan() {
  for (const col of knownCollections) {
    try {
      const snap = await getDocs(collection(db, col));
      console.log(`Collection "${col}": ${snap.size} documents`);
      snap.forEach(d => {
        const data = d.data();
        const keys = Object.keys(data);
        console.log(`  - Doc ID: ${d.id}, keys: [${keys.join(', ')}]`);
        if (data.title) console.log(`      title: "${data.title}"`);
        if (data.clientName) console.log(`      clientName: "${data.clientName}"`);
        if (data.products) console.log(`      products.length: ${data.products.length}`);
        if (data.imageUrl) console.log(`      imageUrl prefix: ${data.imageUrl.slice(0, 50)}... (len: ${data.imageUrl.length})`);
        if (data.updatedAt) console.log(`      updatedAt: ${data.updatedAt}`);
      });
    } catch (e) {
      console.log(`Collection "${col}": error / doesn't exist (${e.message})`);
    }
  }
}

scan().catch(console.error);
