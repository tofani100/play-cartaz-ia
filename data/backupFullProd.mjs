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

async function backup() {
  console.log('--- INICIANDO BACKUP COMPLETO DE SEGURANÇA (cartaz-ia-playcomunique) ---');
  
  const backupData = {
    timestamp: new Date().toISOString(),
    sourceProject: 'cartaz-ia-playcomunique',
    collections: {}
  };

  // 1. campaigns
  console.log('Fazendo backup de campaigns...');
  const campSnap = await getDocs(collection(db, 'campaigns'));
  backupData.collections['campaigns'] = {};
  campSnap.forEach(d => {
    backupData.collections['campaigns'][d.id] = d.data();
  });
  console.log(`-> campaigns: ${campSnap.size} docs`);

  // 2. clients
  console.log('Fazendo backup de clients...');
  const clientSnap = await getDocs(collection(db, 'clients'));
  backupData.collections['clients'] = {};
  clientSnap.forEach(d => {
    backupData.collections['clients'][d.id] = d.data();
  });
  console.log(`-> clients: ${clientSnap.size} docs`);

  // 3. product_images
  console.log('Fazendo backup de product_images...');
  const imgSnap = await getDocs(collection(db, 'product_images'));
  backupData.collections['product_images'] = {};
  imgSnap.forEach(d => {
    backupData.collections['product_images'][d.id] = d.data();
  });
  console.log(`-> product_images: ${imgSnap.size} docs`);

  const filename = `backup_full_prod_${Date.now()}.json`;
  const outPath = path.resolve('data', 'backups', filename);
  fs.writeFileSync(outPath, JSON.stringify(backupData, null, 2), 'utf-8');

  console.log(`\n✅ BACKUP CONCLUÍDO COM SUCESSO! Salvo em:\n${outPath}`);
  console.log(`Tamanho do arquivo: ${(fs.statSync(outPath).size / 1024).toFixed(1)} KB`);
}

backup().catch(console.error);
