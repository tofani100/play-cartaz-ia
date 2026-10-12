import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  projectId: 'cartaz-ia-playcomunique',
  appId: '1:197813011852:web:50dedd7c880168f29342a9',
  storageBucket: 'cartaz-ia-playcomunique.firebasestorage.app',
  apiKey: 'AIzaSyAkr0jo3972Kv2Zz1m9YQu4Bt033ZfgZMA',
  authDomain: 'cartaz-ia-playcomunique.firebaseapp.com',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function syncClientsDoc() {
  const campSnap = await getDoc(doc(db, 'campaigns', 'active_campaign'));
  if (!campSnap.exists()) {
    console.error('active_campaign does not exist!');
    return;
  }
  const camp = campSnap.data();
  console.log('Campaign products count:', camp.products?.length);

  // Convert each product's imageUrl to static or cloud-img reference so all_clients stays ~20KB
  const cleanProducts = camp.products.map(p => {
    let img = p.imageUrl;
    if (img && img.startsWith('data:image')) {
      img = `cloud-img:${p.id}`;
    }
    return {
      ...p,
      imageUrl: img,
    };
  });

  const clientSnap = await getDoc(doc(db, 'clients', 'all_clients'));
  const currentClients = clientSnap.exists() ? clientSnap.data().clients || [] : [];

  const updatedClients = currentClients.map(c => {
    if (c.id === 'cli-belissima' || c.name.toLowerCase().includes('belíssima')) {
      return {
        ...c,
        name: 'Belíssima Casa di Frutas',
        tradeName: 'Belíssima Casa di Frutas',
        logoUrl: '/logos/belissima-casa-di-frutas.png',
        themeId: 'hortifruti-green',
        segment: 'Hortifrúti & Frutas Selecionadas',
        products: cleanProducts,
      };
    }
    return c;
  });

  if (!updatedClients.some(c => c.id === 'cli-belissima' || c.name.toLowerCase().includes('belíssima'))) {
    updatedClients.unshift({
      id: 'cli-belissima',
      name: 'Belíssima Casa di Frutas',
      tradeName: 'Belíssima Casa di Frutas',
      logoUrl: '/logos/belissima-casa-di-frutas.png',
      themeId: 'hortifruti-green',
      segment: 'Hortifrúti & Frutas Selecionadas',
      products: cleanProducts,
    });
  }

  await setDoc(doc(db, 'clients', 'all_clients'), {
    clients: updatedClients,
    updatedAt: new Date().toISOString(),
  });
  console.log('Successfully saved clients/all_clients with Belíssima Casa di Frutas!');
}

syncClientsDoc().catch(console.error);
