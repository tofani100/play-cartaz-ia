/**
 * Script para reparar e sanitizar o Firestore PROD:
 * 1. Carrega active_campaign
 * 2. Adiciona o produto #29 "Cerveja" (Amstel Ultra) se ainda não estiver no array
 * 3. Sanitiza formatsData (remove duplicações de imagens base64 nos 5 formatos)
 * 4. Salva active_campaign sanitizado (deve ficar < 300 KB)
 * 5. Sanitiza clients/all_clients (remove duplicações de base64 nos formatos dos clientes)
 * 6. Salva clients/all_clients sanitizado (deve ficar < 150 KB)
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, setDoc } = require('firebase/firestore');

const firebaseConfig = {
  projectId: 'cartaz-ia-playcomunique',
  apiKey: 'AIzaSyAkr0jo3972Kv2Zz1m9YQu4Bt033ZfgZMA'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  console.log('--- 1. Carregando active_campaign ---');
  const campRef = doc(db, 'campaigns', 'active_campaign');
  const campSnap = await getDoc(campRef);
  if (!campSnap.exists()) {
    console.error('active_campaign não existe!');
    process.exit(1);
  }

  const campaign = campSnap.data();
  console.log('Produtos atuais na campanha:', campaign.products?.length);

  // Busca a imagem do produto #29
  const p29ImgSnap = await getDoc(doc(db, 'product_images', 'prod-manual-1792180034725'));
  let p29Img = '';
  if (p29ImgSnap.exists()) {
    p29Img = p29ImgSnap.data().imageUrl;
    console.log('Imagem do item #29 encontrada! Tamanho:', p29Img.length);
  }

  // Verifica se o item #29 já está na lista
  const hasP29 = campaign.products.some(p => p.id === 'prod-manual-1792180034725' || p.title === 'Cerveja');
  if (!hasP29) {
    console.log('Adicionando Item #29 (Cerveja - Amstel Ultra)...');
    campaign.products.push({
      id: 'prod-manual-1792180034725',
      title: 'Cerveja',
      brand: 'Amstel',
      category: 'Bebidas',
      unit: 'unidade',
      price: '9,90',
      originalPrice: '12,90',
      discountPercentage: 23,
      badge: 'OFERTA DO DIA',
      imageUrl: p29Img || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80',
    });
  }

  // Sanitiza formatsData: nenhum formato deve duplicar imagens base64 dos produtos!
  if (campaign.formatsData) {
    Object.keys(campaign.formatsData).forEach(fmtKey => {
      const fmt = campaign.formatsData[fmtKey];
      if (fmt && Array.isArray(fmt.products)) {
        fmt.products = fmt.products.filter(Boolean).map(p => {
          // Se for imagem base64 ou idêntica ao mestre, esvazia no formato secundário
          if (p && p.imageUrl && (p.imageUrl.startsWith('data:image') || p.imageUrl.startsWith('cloud-img:'))) {
            return { ...p, imageUrl: '' };
          }
          return p;
        });
        const existingIds = new Set(fmt.products.map(p => p.id));
        campaign.products.forEach(cp => {
          if (!existingIds.has(cp.id)) {
            fmt.products.push({
              ...cp,
              imageUrl: '',
            });
          }
        });
      }
    });
  }

  campaign._syncTimestamp = new Date().toISOString();
  campaign._version = '2.6.1';

  const campPayload = JSON.parse(JSON.stringify(campaign));
  const campSize = JSON.stringify(campPayload).length;
  console.log('Novo tamanho de active_campaign:', campSize, 'bytes (~' + (campSize/1024).toFixed(1) + ' KB)');

  if (campSize > 1000000) {
    console.error('ERRO: active_campaign ainda está muito grande! (> 1MB)');
    process.exit(1);
  }

  await setDoc(campRef, campPayload);
  console.log('✅ active_campaign salvo com SUCESSO no Firestore!');

  // --- 2. Sanitizando clients/all_clients ---
  console.log('\n--- 2. Carregando clients/all_clients ---');
  const clientsRef = doc(db, 'clients', 'all_clients');
  const clientsSnap = await getDoc(clientsRef);
  if (clientsSnap.exists()) {
    const clientsData = clientsSnap.data();
    const rawClients = clientsData.clients || [];
    console.log('Total de clientes:', rawClients.length);

    const sanitizedClients = rawClients.map(c => {
      // Sanitiza formatsData do cliente
      let sanitizedFormats = c.formatsData;
      if (sanitizedFormats) {
        sanitizedFormats = JSON.parse(JSON.stringify(sanitizedFormats));
        Object.keys(sanitizedFormats).forEach(fmtKey => {
          const fmt = sanitizedFormats[fmtKey];
          if (fmt && Array.isArray(fmt.products)) {
            fmt.products = fmt.products.filter(Boolean).map(p => {
              if (p && p.imageUrl && p.imageUrl.startsWith('data:image')) {
                return { ...p, imageUrl: '' };
              }
              return p;
            });
          }
        });
      }

      // Se for Belíssima Casa di Frutas, sincroniza com os 29 produtos da campanha
      if (c.id === 'cli-belissima' || c.name === 'Belíssima Casa di Frutas') {
        return {
          ...c,
          products: campaign.products.map(p => ({
            ...p,
            imageUrl: p.imageUrl.startsWith('data:image') ? `cloud-img:${p.id}` : p.imageUrl
          })),
          formatsData: sanitizedFormats,
        };
      }

      // Para os outros clientes, converte base64 para cloud-img para não estourar 1MB
      const sanitizedProducts = (c.products || []).map(p => {
        if (p.imageUrl && p.imageUrl.startsWith('data:image')) {
          return { ...p, imageUrl: `cloud-img:${p.id}` };
        }
        return p;
      });

      return {
        ...c,
        products: sanitizedProducts,
        formatsData: sanitizedFormats,
      };
    });

    const clientsPayload = JSON.parse(JSON.stringify({
      clients: sanitizedClients,
      updatedAt: new Date().toISOString(),
    }));

    const clientsSize = JSON.stringify(clientsPayload).length;
    console.log('Novo tamanho de clients/all_clients:', clientsSize, 'bytes (~' + (clientsSize/1024).toFixed(1) + ' KB)');

    if (clientsSize > 1000000) {
      console.error('ERRO: clients/all_clients ainda está muito grande! (> 1MB)');
      process.exit(1);
    }

    await setDoc(clientsRef, clientsPayload);
    console.log('✅ clients/all_clients salvo com SUCESSO no Firestore!');
  }

  console.log('\n--- TUDO CONCLUÍDO COM SUCESSO! ---');
  process.exit(0);
}

run().catch(err => {
  console.error('Erro na execução:', err);
  process.exit(1);
});
