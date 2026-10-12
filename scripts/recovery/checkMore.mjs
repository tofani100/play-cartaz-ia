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

async function checkMore() {
  const camps = await getDocs(collection(db, 'campaigns'));
  console.log('All campaigns docs:');
  camps.forEach(d => console.log('Camp doc id:', d.id));

  const clients = await getDocs(collection(db, 'clients'));
  console.log('All clients docs:');
  clients.forEach(d => console.log('Client doc id:', d.id));
}

checkMore().catch(console.error);
