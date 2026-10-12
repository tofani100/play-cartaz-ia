import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, collection, getDocs } from 'firebase/firestore';
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

const dumpDir = 'C:\\Users\\Samsung\\.gemini\\antigravity\\brain\\da335eb3-d6e0-4861-ada0-f4c1c071d678\\scratch\\recovered_images';
if (!fs.existsSync(dumpDir)) fs.mkdirSync(dumpDir, { recursive: true });

async function dumpImages() {
  const imgsSnap = await getDocs(collection(db, 'product_images'));
  console.log(`Found ${imgsSnap.size} images in Firestore.`);
  
  for (const d of imgsSnap.docs) {
    const data = d.data();
    if (data.imageUrl && data.imageUrl.startsWith('data:image')) {
      const matches = data.imageUrl.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
      if (matches) {
        const ext = matches[1];
        const outPath = path.join(dumpDir, `${d.id}.${ext}`);
        fs.writeFileSync(outPath, Buffer.from(matches[2], 'base64'));
        console.log(`Saved: ${d.id}.${ext} (${(matches[2].length / 1024).toFixed(1)} KB)`);
      }
    }
  }
}

dumpImages().catch(console.error);
