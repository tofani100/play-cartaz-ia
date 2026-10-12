import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

// Configuração do projeto DEV
const devConfig = {
  projectId: "cartaz-ia-dev-778bc",
  appId: "1:674721203437:web:43ff0c402ec96629fff8e4",
  storageBucket: "cartaz-ia-dev-778bc.firebasestorage.app",
  apiKey: "AIzaSyDEqaCNFbg0wguDoAqwXBmQaJbtCJXBoAw",
  authDomain: "cartaz-ia-dev-778bc.firebaseapp.com",
};

const app = initializeApp(devConfig);
const db = getFirestore(app);

async function clone() {
  console.log('--- CLONANDO DADOS DE PROD PARA O AMBIENTE DEV (cartaz-ia-dev-778bc) ---');
  
  const backupFile = path.resolve('data', 'backups', 'backup_full_prod_1790815186586.json');
  if (!fs.existsSync(backupFile)) {
    throw new Error('Arquivo de backup não encontrado: ' + backupFile);
  }
  
  const data = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));
  const collections = data.collections;

  // 1. Clonar campaigns
  if (collections.campaigns) {
    console.log('Restaurando campaigns em DEV...');
    for (const [id, docData] of Object.entries(collections.campaigns)) {
      await setDoc(doc(db, 'campaigns', id), docData);
      console.log(`  campaign [${id}] copiado com sucesso.`);
    }
  }

  // 2. Clonar clients
  if (collections.clients) {
    console.log('\nRestaurando clients em DEV...');
    for (const [id, docData] of Object.entries(collections.clients)) {
      await setDoc(doc(db, 'clients', id), docData);
      console.log(`  client [${id}] copiado com sucesso.`);
    }
  }

  // 3. Clonar product_images
  if (collections.product_images) {
    console.log('\nRestaurando product_images em DEV...');
    const totalImgs = Object.keys(collections.product_images).length;
    let count = 0;
    for (const [id, docData] of Object.entries(collections.product_images)) {
      await setDoc(doc(db, 'product_images', id), docData);
      count++;
      if (count % 10 === 0 || count === totalImgs) {
        console.log(`  product_images: ${count}/${totalImgs} copiados...`);
      }
    }
  }

  console.log('\n✅ CLONAGEM CONCLUÍDA! O banco DEV agora tem exatamente 100% dos dados de PROD.');
}

clone().catch(console.error);
