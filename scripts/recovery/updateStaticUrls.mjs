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

const staticImageMap = {
  'prod-ai-1790482860935-0': '/produtos-belissima/01-agua-de-coco-belissima.webp',
  'prod-ai-1790482860935-1': '/produtos-belissima/02-coco-verde-unidades.webp',
  'prod-ai-1790482860935-2': '/produtos-belissima/03-suco-de-laranja-belissima.webp',
  'prod-ai-1790482860935-3': '/produtos-belissima/04-pessego-nacional.webp',
  'prod-ai-1790482860935-4': '/produtos-belissima/05-goma-tapioca-brasile.webp',
  'prod-ai-1790482860935-5': '/produtos-belissima/06-uva-vitoria-bandeja.webp',
  'prod-ai-1790482860935-6': '/produtos-belissima/07-polpa-tomate-paganini.webp',
  'prod-ai-1790482860935-7': '/produtos-belissima/08-uva-melodia-bandeja.webp',
  'prod-ai-1790482860935-8': '/produtos-belissima/09-melao-rei.webp',
  'prod-ai-1790482860935-9': '/produtos-belissima/10-brocolis-americano.webp',
  'prod-ai-1790482860935-10': '/produtos-belissima/11-panceta-suina.webp',
  'prod-ai-1790482860935-11': '/produtos-belissima/12-ovos-caipira-lecoq.webp',
  'prod-ai-1790482860935-12': '/produtos-belissima/13-morango-bandejas.webp',
  'prod-ai-1790482860935-13': '/produtos-belissima/14-laranja-pera.webp',
  'prod-ai-1790482860935-14': '/produtos-belissima/15-alface-rubi-macos.webp',
  'prod-ai-1790482860935-15': '/produtos-belissima/16-jabuticaba.webp',
  'prod-ai-1790482860935-16': '/produtos-belissima/17-hamburguer-artesanal-costela.webp',
  'prod-ai-1790482860935-17': '/produtos-belissima/18-geleia-queensberry.webp',
  'prod-ai-1790482860935-18': '/produtos-belissima/19-carne-moida-primeira.webp',
  'prod-ai-1790482860935-19': '/produtos-belissima/20-file-tilapia-copacol.webp',
  'prod-ai-1790723702464-0': '/produtos-belissima/21-goiaba-vermelha-caseira-belissima.webp',
};

async function updateActiveWithStaticUrls() {
  const campSnap = await getDoc(doc(db, 'campaigns', 'active_campaign'));
  if (!campSnap.exists()) return;
  const camp = campSnap.data();

  const optimizedProducts = camp.products.map(p => {
    const staticUrl = staticImageMap[p.id];
    return {
      ...p,
      imageUrl: staticUrl || p.imageUrl,
    };
  });

  const updatedCamp = {
    ...camp,
    products: optimizedProducts,
    _syncTimestamp: new Date().toISOString(),
  };

  await setDoc(doc(db, 'campaigns', 'active_campaign'), updatedCamp);
  console.log('Saved active_campaign with fast static CDN paths!');

  // Also update clients
  const clientSnap = await getDoc(doc(db, 'clients', 'all_clients'));
  if (clientSnap.exists()) {
    const cdata = clientSnap.data();
    const updatedClients = (cdata.clients || []).map(c => {
      if (c.id === 'cli-belissima' || c.name.toLowerCase().includes('belíssima')) {
        return {
          ...c,
          products: optimizedProducts,
        };
      }
      return c;
    });
    await setDoc(doc(db, 'clients', 'all_clients'), {
      clients: updatedClients,
      updatedAt: new Date().toISOString(),
    });
    console.log('Saved clients/all_clients with fast static CDN paths!');
  }
}

updateActiveWithStaticUrls().catch(console.error);
