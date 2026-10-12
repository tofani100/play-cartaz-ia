import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  projectId: 'cartaz-ia-playcomunique',
  appId: '1:197813011852:web:50dedd7c880168f29342a9',
  storageBucket: 'cartaz-ia-playcomunique.firebasestorage.app',
  apiKey: 'AIzaSyAkr0jo3972Kv2Zz1m9YQu4Bt033ZfgZMA',
  authDomain: 'cartaz-ia-playcomunique.firebaseapp.com',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function inspectDoc(col, id) {
  const s = await getDoc(doc(db, col, id));
  console.log(`=== ${col}/${id} === (exists: ${s.exists()})`);
  if (s.exists()) {
    const data = s.data();
    console.log('clientName:', data.clientName);
    console.log('campaignTitle:', data.campaignTitle);
    console.log('_syncTimestamp:', data._syncTimestamp);
    console.log('products count:', data.products?.length);
    if (data.products) {
      data.products.forEach((p, i) => {
        console.log(`  [${i}] id=${p.id} title="${p.title}" price=${p.price} origPrice=${p.originalPrice} badge="${p.badge}" hasImg=${Boolean(p.imageUrl)}`);
      });
    }
  }
}

async function run() {
  await inspectDoc('campaigns', 'current_campaign');
  await inspectDoc('campaigns', 'active_campaign');
}

run().catch(console.error);
