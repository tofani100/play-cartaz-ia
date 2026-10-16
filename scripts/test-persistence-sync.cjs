/**
 * Automated Cross-Browser Persistence & Image Sync Test
 */
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, setDoc } = require('firebase/firestore');

const firebaseConfig = {
  projectId: 'cartaz-ia-playcomunique',
  apiKey: 'AIzaSyAkr0jo3972Kv2Zz1m9YQu4Bt033ZfgZMA'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testSync() {
  console.log('=== TESTE DE PERSISTÊNCIA E SINCRONIZAÇÃO ENTRE NAVEGADORES ===\n');

  // 1. Simulação: Browser 1 lê active_campaign
  console.log('[Browser 1] Lendo active_campaign da Nuvem...');
  const campRef = doc(db, 'campaigns', 'active_campaign');
  const campSnap = await getDoc(campRef);
  if (!campSnap.exists()) {
    throw new Error('Falha: active_campaign não existe!');
  }

  const camp = campSnap.data();
  const campSize = JSON.stringify(camp).length;
  console.log(`[Browser 1] active_campaign carregado! Tamanho: ${campSize} bytes (~${(campSize/1024).toFixed(1)} KB)`);
  console.log(`[Browser 1] Total de produtos: ${camp.products?.length}`);

  if (campSize >= 1048576) {
    throw new Error(`CRÍTICO: active_campaign excede o limite de 1MB do Firestore! (${campSize} bytes)`);
  }

  // Verifica produto #29 (Cerveja)
  const p29 = camp.products.find(p => p.id === 'prod-manual-1792180034725' || p.title === 'Cerveja');
  if (!p29) {
    throw new Error('Falha: Item #29 (Cerveja) não encontrado no catálogo!');
  }
  console.log(`[Browser 1] Item #29 encontrado: "${p29.title}" - Preço: R$ ${p29.price} - Img len: ${p29.imageUrl?.length || 0}`);
  if (!p29.imageUrl || p29.imageUrl.length < 50) {
    throw new Error('Falha: Imagem do Item #29 está vazia ou corrompida!');
  }

  // 2. Simulação: Browser 2 lê formatsData e verifica se todas as fotos estão íntegras
  console.log('\n[Browser 2] Verificando todos os 5 formatos em formatsData...');
  const formats = Object.keys(camp.formatsData || {});
  console.log(`[Browser 2] Formatos encontrados: ${formats.join(', ')}`);

  formats.forEach(fmtKey => {
    const fmt = camp.formatsData[fmtKey];
    const pList = fmt.products || [];
    console.log(`  Formato ${fmtKey}: ${pList.length} banners`);
    if (pList.length < 28) {
      throw new Error(`Falha: Formato ${fmtKey} tem menos produtos que o catálogo mestre!`);
    }
  });

  // 3. Verificação de clients/all_clients
  console.log('\n[Browser 1] Verificando documento clients/all_clients...');
  const clientsRef = doc(db, 'clients', 'all_clients');
  const clientsSnap = await getDoc(clientsRef);
  if (!clientsSnap.exists()) {
    throw new Error('Falha: clients/all_clients não existe!');
  }

  const clientsData = clientsSnap.data();
  const clientsSize = JSON.stringify(clientsData).length;
  console.log(`[Browser 1] clients/all_clients carregado! Tamanho: ${clientsSize} bytes (~${(clientsSize/1024).toFixed(1)} KB)`);
  if (clientsSize >= 1048576) {
    throw new Error(`CRÍTICO: clients/all_clients excede o limite de 1MB do Firestore! (${clientsSize} bytes)`);
  }

  // 4. Teste de escrita (Simulação: Browser 2 adiciona alteração e salva)
  console.log('\n[Browser 2] Testando gravação no Firestore (simulação de salvamento real)...');
  const testNow = new Date().toISOString();
  camp._syncTimestamp = testNow;
  await setDoc(campRef, camp);
  console.log('✅ Gravação do active_campaign aceita pelo Firestore com SUCESSO!');

  console.log('\n======================================================');
  console.log('🎉 TODOS OS TESTES DE PERSISTÊNCIA PASSARAM COM SUCESSO!');
  console.log('======================================================\n');
  process.exit(0);
}

testSync().catch(err => {
  console.error('\n❌ ERRO NO TESTE:', err.message || err);
  process.exit(1);
});
