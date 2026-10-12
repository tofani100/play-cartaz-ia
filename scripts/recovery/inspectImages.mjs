import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  projectId: 'cartaz-ia-playcomunique',
  appId: '1:197813011852:web:50dedd7c880168f29342a9',
  storageBucket: 'cartaz-ia-playcomunique.firebasestorage.app',
  apiKey: 'AIzaSyAkr0jo3972Kv2Zz1m9YQu4Bt033ZfgZMA',
  authDomain: 'cartaz-ia-playcomunique.firebaseapp.com',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function inspectImages() {
  const imgsSnap = await getDocs(collection(db, 'product_images'));
  console.log('Total images docs:', imgsSnap.size);
  imgsSnap.forEach(d => {
    const data = d.data();
    console.log(`Doc ID: ${d.id}`);
    console.log(`  Keys:`, Object.keys(data));
    console.log(`  updatedAt:`, data.updatedAt);
    console.log(`  imageUrl prefix:`, data.imageUrl ? data.imageUrl.substring(0, 50) : null);
  });
}

inspectImages().catch(console.error);
