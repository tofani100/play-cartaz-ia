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

async function check() {
  console.log('--- CHECKING CAMPAIGN ---');
  const campSnap = await getDoc(doc(db, 'campaigns', 'active_campaign'));
  console.log('CAMPAIGN EXISTS:', campSnap.exists());
  if (campSnap.exists()) {
    const data = campSnap.data();
    console.log('Campaign clientName:', data.clientName);
    console.log('Products count:', data.products?.length);
    console.log('Products:');
    data.products?.forEach((p, idx) => {
      console.log(`  #${idx + 1} id=${p.id} title="${p.title}" imgUrl=${p.imageUrl ? p.imageUrl.slice(0, 50) + '...' : 'none'}`);
    });
  }

  console.log('\n--- CHECKING CLIENTS ---');
  const clientSnap = await getDoc(doc(db, 'clients', 'all_clients'));
  console.log('CLIENTS EXISTS:', clientSnap.exists());
  if (clientSnap.exists()) {
    const cdata = clientSnap.data();
    console.log('Clients count:', cdata.clients?.length);
    cdata.clients?.forEach((c) => {
      console.log(`\nClient: ${c.name} (id: ${c.id}) - Products count: ${c.products?.length}`);
      c.products?.forEach((p, idx) => {
        console.log(`    #${idx + 1} id=${p.id} title="${p.title}" img=${p.imageUrl ? p.imageUrl.slice(0, 40) + '...' : 'none'}`);
      });
    });
  }

  console.log('\n--- CHECKING PRODUCT_IMAGES ---');
  const imgsSnap = await getDocs(collection(db, 'product_images'));
  console.log('Images docs count:', imgsSnap.size);
  imgsSnap.forEach(d => {
    const ddata = d.data();
    console.log(`  Img doc: ${d.id}, updatedAt: ${ddata.updatedAt}, imgLen: ${ddata.imageUrl?.length}`);
  });
}

check().catch(console.error);
