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

// The 20 recovered products + Goiaba Vermelha + Novo Produto
const PRODUCTS_DATA = [
  {
    id: 'prod-ai-1790482860935-0',
    title: '2 ( duas ) Garrafas Água de Coco BELÍSSIMA 1 litro.',
    brand: 'Belíssima',
    category: 'Bebidas',
    unit: '2 UNIDADES',
    price: '24,90',
    originalPrice: '29,90',
    discountPercentage: 17,
    badge: 'IMPERDÍVEL',
    imageDisplayMode: 'ambient',
    isHero: true,
  },
  {
    id: 'prod-ai-1790482860935-1',
    title: '2 ( duas ) unidades de Coco Verde.',
    brand: 'Belíssima',
    category: 'Hortifrúti',
    unit: '2 UNIDADES',
    price: '10,00',
    originalPrice: '12,50',
    discountPercentage: 20,
    badge: 'IMPERDÍVEL',
    imageDisplayMode: 'ambient',
  },
  {
    id: 'prod-ai-1790482860935-2',
    title: '2 ( duas ) garrafas de Suco de Laranja Natural BELÍSSIMA de 1 Litro.',
    brand: 'Belíssima',
    category: 'Bebidas',
    unit: '2 UNIDADES',
    price: '29,90',
    originalPrice: '37,38',
    discountPercentage: 20,
    badge: 'IMPERDÍVEL',
    imageDisplayMode: 'ambient',
  },
  {
    id: 'prod-ai-1790482860935-3',
    title: 'Pêssego Nacional kg.',
    brand: 'Nacional',
    category: 'Hortifrúti',
    unit: 'KG',
    price: '29,90',
    originalPrice: '37,38',
    discountPercentage: 20,
    badge: 'IMPERDÍVEL',
    imageDisplayMode: 'ambient',
  },
  {
    id: 'prod-ai-1790482860935-4',
    title: 'Goma de Tapioca Brasilê 500 gramas.',
    brand: 'Brasilê',
    category: 'Mercearia',
    unit: 'UNIDADE',
    price: '6,98',
    originalPrice: '8,98',
    discountPercentage: 22,
    badge: 'IMPERDÍVEL',
    imageDisplayMode: 'ambient',
  },
  {
    id: 'prod-ai-1790482860935-5',
    title: 'Uva Vitória Bandeja com 500 gramas.',
    brand: 'Nacional',
    category: 'Hortifrúti',
    unit: 'BANDEJA',
    price: '9,90',
    originalPrice: '12,38',
    discountPercentage: 20,
    badge: 'IMPERDÍVEL',
    imageDisplayMode: 'ambient',
  },
  {
    id: 'prod-ai-1790482860935-6',
    title: 'Polpa de Tomate Paganini 600 gramas.',
    brand: 'Paganini',
    category: 'Mercearia',
    unit: 'UNIDADE',
    price: '19,90',
    originalPrice: '24,88',
    discountPercentage: 20,
    badge: 'IMPERDÍVEL',
    imageDisplayMode: 'ambient',
  },
  {
    id: 'prod-ai-1790482860935-7',
    title: 'Uva Melodia Bandeja 500 gramas.',
    brand: 'CAJ',
    category: 'Hortifrúti',
    unit: 'UNIDADE',
    price: '9,90',
    originalPrice: '12,90',
    discountPercentage: 23,
    badge: 'IMPERDÍVEL',
    imageDisplayMode: 'ambient',
  },
  {
    id: 'prod-ai-1790482860935-8',
    title: 'Melão Rei / kg.',
    brand: 'Rei',
    category: 'Hortifrúti',
    unit: 'KG',
    price: '14,90',
    originalPrice: '18,90',
    discountPercentage: 21,
    badge: 'IMPERDÍVEL',
    imageDisplayMode: 'ambient',
  },
  {
    id: 'prod-ai-1790482860935-9',
    title: 'Brócolis Americano / Unidade.',
    brand: 'Hortifrúti',
    category: 'Hortifrúti',
    unit: 'UNIDADE',
    price: '6,98',
    originalPrice: '8,90',
    discountPercentage: 22,
    badge: 'IMPERDÍVEL',
    imageDisplayMode: 'ambient',
  },
  {
    id: 'prod-ai-1790482860935-10',
    title: 'Panceta Suína / kg.',
    brand: 'Açougue',
    category: 'Carnes & Aves',
    unit: 'KG',
    price: '19,95',
    originalPrice: '24,90',
    discountPercentage: 20,
    badge: 'IMPERDÍVEL',
    imageDisplayMode: 'ambient',
  },
  {
    id: 'prod-ai-1790482860935-11',
    title: 'Ovos Caipira Lecoq Caixa com 10 Unidades.',
    brand: 'Lecoq',
    category: 'Hortifrúti',
    unit: 'CAIXA',
    price: '12,99',
    originalPrice: '15,90',
    discountPercentage: 18,
    badge: 'OFERTA DO DIA',
    imageDisplayMode: 'ambient',
  },
  {
    id: 'prod-ai-1790482860935-12',
    title: 'Morango 2 ( duas ) Bandejas de 250 gramas.',
    brand: 'Selecionado',
    category: 'Hortifrúti',
    unit: 'BANDEJA',
    price: '20,00',
    originalPrice: '37,50',
    discountPercentage: 47,
    badge: 'IMPERDÍVEL',
    imageDisplayMode: 'ambient',
  },
  {
    id: 'prod-ai-1790482860935-13',
    title: 'Laranja Pera / kg.',
    brand: 'Nacional',
    category: 'Hortifrúti',
    unit: 'KG',
    price: '3,98',
    originalPrice: '4,99',
    discountPercentage: 20,
    badge: 'IMPERDÍVEL',
    imageDisplayMode: 'ambient',
  },
  {
    id: 'prod-ai-1790482860935-14',
    title: '2 ( dois ) Maços Alface Rubi.',
    brand: 'Hortifrúti',
    category: 'Hortifrúti',
    unit: 'UNIDADE',
    price: '4,90',
    originalPrice: '5,90',
    discountPercentage: 17,
    badge: 'IMPERDÍVEL',
    imageDisplayMode: 'ambient',
  },
  {
    id: 'prod-ai-1790482860935-15',
    title: 'Jabuticaba / kg.',
    brand: 'Nacional',
    category: 'Hortifrúti',
    unit: 'KG',
    price: '49,90',
    originalPrice: '59,90',
    discountPercentage: 17,
    badge: 'IMPERDÍVEL',
    imageDisplayMode: 'ambient',
  },
  {
    id: 'prod-ai-1790482860935-16',
    title: 'Hambúrguer Artesanal Costela / Unidade.',
    brand: 'Artesanal',
    category: 'Carnes & Aves',
    unit: 'UNIDADE',
    price: '7,99',
    originalPrice: '9,99',
    discountPercentage: 20,
    badge: 'IMPERDÍVEL',
    imageDisplayMode: 'ambient',
  },
  {
    id: 'prod-ai-1790482860935-17',
    title: 'Geléia Queensberry pote de 320 gramas / Unidade.',
    brand: 'Queensberry',
    category: 'Mercearia',
    unit: 'UNIDADE',
    price: '29,90',
    originalPrice: '37,90',
    discountPercentage: 21,
    badge: 'IMPERDÍVEL',
    imageDisplayMode: 'ambient',
  },
  {
    id: 'prod-ai-1790482860935-18',
    title: 'Carne Bovina Moída de Primeira / kg.',
    brand: 'Açougue',
    category: 'Carnes & Aves',
    unit: 'KG',
    price: '39,95',
    originalPrice: '49,90',
    discountPercentage: 20,
    badge: 'IMPERDÍVEL',
    imageDisplayMode: 'ambient',
  },
  {
    id: 'prod-ai-1790482860935-19',
    title: 'Filé de Tilápia Copacol 400 gramas / Pacote.',
    brand: 'Copacol',
    category: 'Pescados & Congelados',
    unit: 'PACOTE',
    price: '19,90',
    originalPrice: '24,90',
    discountPercentage: 20,
    badge: 'IMPERDÍVEL',
    imageDisplayMode: 'ambient',
  },
  {
    id: 'prod-ai-1790723702464-0',
    title: 'Goiaba Vermelha  Caseira Belíssima kg.',
    brand: 'Belíssima',
    category: 'Hortifrúti',
    unit: 'KG',
    price: '15,90',
    originalPrice: '59,00',
    discountPercentage: 73,
    badge: 'IMPERDÍVEL',
    imageDisplayMode: 'ambient',
  },
  {
    id: 'prod-manual-1790726025495',
    title: 'Novo Produto em Oferta',
    brand: 'Marca',
    category: 'Geral',
    unit: 'unidade',
    price: '9,90',
    originalPrice: '12,90',
    discountPercentage: 23,
    badge: 'OFERTA DO DIA',
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop&q=85',
    imageDisplayMode: 'ambient',
  },
];

async function restoreAll() {
  console.log('Restoring products and images into Firestore...');
  
  // 1. Fetch images from product_images collection
  const fullProducts = [];
  for (const item of PRODUCTS_DATA) {
    let imgUrl = item.imageUrl;
    if (!imgUrl) {
      const snap = await getDoc(doc(db, 'product_images', item.id));
      if (snap.exists()) {
        imgUrl = snap.data().imageUrl;
        console.log(`Found image for ${item.title}: len=${imgUrl?.length}`);
      } else {
        console.warn(`No image found in product_images for ${item.id}`);
      }
    }
    fullProducts.push({
      ...item,
      imageUrl: imgUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop&q=85',
    });
  }

  // 2. Load current active campaign
  const campSnap = await getDoc(doc(db, 'campaigns', 'active_campaign'));
  const currentCamp = campSnap.exists() ? campSnap.data() : {};

  const restoredCampaign = {
    ...currentCamp,
    id: 'camp-1',
    clientId: 'cli-belissima',
    clientName: 'Belíssima Casa di Frutas',
    clientLogoUrl: '/logos/belissima-casa-di-frutas.png',
    showClientLogo: true,
    segment: 'Hortifrúti & Frutas Selecionadas',
    campaignTitle: 'FESTIVAL DE OFERTAS - BELÍSSIMA',
    campaignSubtitle: 'Ofertas válidas até SÁBADO ou enquanto durarem os estoques',
    validityText: 'Ofertas válidas até SÁBADO ou enquanto durarem os estoques',
    legalNotice: 'Imagens meramente ilustrativas; Proibido a venda de bebidas alcoólicas a menores de 18 anos!',
    footerBrandText: 'Desenvolvido por: playcomunique.com.br',
    tickerText: '★ BELÍSSIMA CASA DI FRUTAS - DESDE 2004 ★ QUALIDADE E FRESCOR NA SUA MESA ★ FRUTAS, LEGUMES E VERDURAS SELECIONADAS DIARIAMENTE ★ ACEITAMOS TODOS OS CARTÕES E PIX ★',
    format: '16:9',
    themeId: 'hortifruti-green',
    products: fullProducts,
    activeProductIndex: 0,
    _syncTimestamp: new Date().toISOString(),
    _version: '2.6.0',
  };

  // Save to active_campaign
  await setDoc(doc(db, 'campaigns', 'active_campaign'), restoredCampaign);
  console.log('Saved active_campaign successfully with', fullProducts.length, 'products!');

  // 3. Update clients/all_clients
  const clientSnap = await getDoc(doc(db, 'clients', 'all_clients'));
  const cdata = clientSnap.exists() ? clientSnap.data() : { clients: [] };
  const existingClients = cdata.clients || [];

  const updatedClients = existingClients.map((c) => {
    if (c.id === 'cli-belissima' || c.name.toLowerCase().includes('belíssima')) {
      return {
        ...c,
        name: 'Belíssima Casa di Frutas',
        tradeName: 'Belíssima Casa di Frutas',
        logoUrl: '/logos/belissima-casa-di-frutas.png',
        themeId: 'hortifruti-green',
        segment: 'Hortifrúti & Frutas Selecionadas',
        products: fullProducts,
      };
    }
    return c;
  });

  // Ensure Belíssima exists in clients list
  if (!updatedClients.some((c) => c.id === 'cli-belissima' || c.name.toLowerCase().includes('belíssima'))) {
    updatedClients.unshift({
      id: 'cli-belissima',
      name: 'Belíssima Casa di Frutas',
      tradeName: 'Belíssima Casa di Frutas',
      logoUrl: '/logos/belissima-casa-di-frutas.png',
      themeId: 'hortifruti-green',
      segment: 'Hortifrúti & Frutas Selecionadas',
      defaultTickerText: '★ BELÍSSIMA CASA DI FRUTAS - DESDE 2004 ★ QUALIDADE E FRESCOR NA SUA MESA ★',
      products: fullProducts,
    });
  }

  await setDoc(doc(db, 'clients', 'all_clients'), {
    clients: updatedClients,
    updatedAt: new Date().toISOString(),
  });
  console.log('Saved clients/all_clients with updated Belíssima Casa di Frutas catalog!');
}

restoreAll().catch(console.error);
