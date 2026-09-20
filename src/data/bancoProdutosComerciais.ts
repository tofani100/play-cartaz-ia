import { CuratedProduct } from '../types';

export const CURATED_PRODUCTS: CuratedProduct[] = [
  // BEBIDAS
  {
    id: 'prod-coca-2l',
    title: 'Refrigerante Coca-Cola Garrafa 2L',
    brand: 'Coca-Cola',
    category: 'Bebidas',
    defaultUnit: '2L',
    suggestedPrice: '8,99',
    suggestedOriginalPrice: '10,99',
    badge: 'OFERTA DO DIA',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Coca_Cola_Flasche_-_Original_Taste.jpg/960px-Coca_Cola_Flasche_-_Original_Taste.jpg',
    keywords: ['coca', 'coca cola', 'refrigerante', 'refri', 'cola', '2l', 'coca 2l'],
  },
  {
    id: 'prod-cerveja-heineken',
    title: 'Cerveja Heineken Puro Malte Long Neck 330ml',
    brand: 'Heineken',
    category: 'Bebidas',
    defaultUnit: '330ml',
    suggestedPrice: '6,49',
    suggestedOriginalPrice: '7,89',
    badge: 'GELADA',
    imageUrl: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=600&auto=format&fit=crop&q=80',
    keywords: ['heineken', 'cerveja', 'long neck', 'cerveja heineken', 'puro malte'],
  },
  {
    id: 'prod-suco-laranja',
    title: 'Suco de Laranja Integral 1L',
    brand: 'Natural One',
    category: 'Bebidas',
    defaultUnit: '1L',
    suggestedPrice: '11,90',
    suggestedOriginalPrice: '14,50',
    badge: '100% NATURAL',
    imageUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600&auto=format&fit=crop&q=80',
    keywords: ['suco', 'laranja', 'suco de laranja', 'natural one', 'integral'],
  },
  {
    id: 'prod-vinho-tinto',
    title: 'Vinho Tinto Chileno Cabernet Sauvignon 750ml',
    brand: 'Concha y Toro',
    category: 'Bebidas',
    defaultUnit: '750ml',
    suggestedPrice: '36,90',
    suggestedOriginalPrice: '45,00',
    badge: 'SELEÇÃO ESPECIAL',
    imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&auto=format&fit=crop&q=80',
    keywords: ['vinho', 'vinho tinto', 'cabernet', 'sauvignon', 'chileno', 'tinto'],
  },

  // CARNES & AÇOUGUE
  {
    id: 'prod-picanha',
    title: 'Picanha Bovina Resfriada Friboi kg',
    brand: 'Friboi',
    category: 'Carnes & Aves',
    defaultUnit: 'kg',
    suggestedPrice: '59,90',
    suggestedOriginalPrice: '74,90',
    badge: 'SUPER PREÇO',
    imageUrl: 'https://images.unsplash.com/photo-1558030006-450675393462?w=800&auto=format&fit=crop&q=85',
    keywords: ['picanha', 'carne', 'churrasco', 'friboi', 'friboy', 'picanha friboi', 'bovina'],
  },
  {
    id: 'prod-alcatra',
    title: 'Alcatra com Maminha Bovina kg',
    brand: 'Açougue Especial',
    category: 'Carnes & Aves',
    defaultUnit: 'kg',
    suggestedPrice: '38,90',
    suggestedOriginalPrice: '46,90',
    badge: 'QUARTA DA CARNE',
    imageUrl: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600&auto=format&fit=crop&q=80',
    keywords: ['alcatra', 'maminha', 'carne bovina', 'bovino', 'bife'],
  },
  {
    id: 'prod-file-frango',
    title: 'Filé de Peito de Frango Congelado Seara 1kg',
    brand: 'Seara',
    category: 'Carnes & Aves',
    defaultUnit: '1kg',
    suggestedPrice: '17,90',
    suggestedOriginalPrice: '22,90',
    badge: 'ECONOMIA',
    imageUrl: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=600&auto=format&fit=crop&q=80',
    keywords: ['frango', 'peito de frango', 'file de peito', 'seara', 'sadia', 'frango congelado'],
  },
  {
    id: 'prod-linguica-toscana',
    title: 'Linguiça Toscana para Churrasco Sadia kg',
    brand: 'Sadia',
    category: 'Carnes & Aves',
    defaultUnit: 'kg',
    suggestedPrice: '18,90',
    suggestedOriginalPrice: '23,90',
    badge: 'CHURRASCO',
    imageUrl: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=600&auto=format&fit=crop&q=80',
    keywords: ['linguica', 'toscana', 'linguica toscana', 'churrasco', 'sadia', 'perdigao'],
  },

  // MERCEARIA
  {
    id: 'prod-arroz-5kg',
    title: 'Arroz Branco Tio Jorge Tipo 1 5kg',
    brand: 'Tio Jorge',
    category: 'Mercearia',
    defaultUnit: '5kg',
    suggestedPrice: '24,90',
    suggestedOriginalPrice: '29,90',
    badge: 'PREÇO BAIXO',
    imageUrl: 'https://images.openfoodfacts.org/images/products/789/604/790/0270/front_pt.6.full.jpg',
    keywords: ['arroz', 'arroz 5kg', 'tio jorge', 'tio joao', 'camil', 'tipo 1'],
  },
  {
    id: 'prod-feijao-1kg',
    title: 'Feijão Carioca Camil Tipo 1 1kg',
    brand: 'Camil',
    category: 'Mercearia',
    defaultUnit: '1kg',
    suggestedPrice: '7,49',
    suggestedOriginalPrice: '9,29',
    badge: 'OFERTA',
    imageUrl: 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=600&auto=format&fit=crop&q=80',
    keywords: ['feijao', 'feijao carioca', 'camil', 'kicaldo', 'feijao 1kg'],
  },
  {
    id: 'prod-oleo-soja',
    title: 'Óleo de Soja Refinado Liza Pet 900ml',
    brand: 'Liza',
    category: 'Mercearia',
    defaultUnit: '900ml',
    suggestedPrice: '6,29',
    suggestedOriginalPrice: '7,59',
    badge: 'IMPERDÍVEL',
    imageUrl: 'https://images.openfoodfacts.org/images/products/789/603/609/0244/front_pt.11.400.jpg',
    keywords: ['oleo', 'oleo de soja', 'liza', 'soya', '900ml'],
  },
  {
    id: 'prod-cafe-caboclo-500g',
    title: 'Café Torrado e Moído Caboclo Tradicional a Vácuo 500g',
    brand: 'Caboclo',
    category: 'Mercearia',
    defaultUnit: '500g',
    suggestedPrice: '32,99',
    suggestedOriginalPrice: '39,99',
    badge: 'SUPER PREÇO',
    imageUrl: 'https://images.openfoodfacts.org/images/products/789/608/901/1470/front_pt.3.full.jpg',
    keywords: ['caboclo', 'cafe caboclo', 'café caboclo', 'vacuo', 'vácuo', 'tradicional a vacuo', 'cafe vacuo', 'cafe 500g'],
  },
  {
    id: 'prod-cafe-500g',
    title: 'Café Torrado e Moído Pilão Tradicional 500g',
    brand: 'Pilão',
    category: 'Mercearia',
    defaultUnit: '500g',
    suggestedPrice: '17,80',
    suggestedOriginalPrice: '21,90',
    badge: 'ACORDA BRASIL',
    imageUrl: 'https://images.openfoodfacts.org/images/products/789/608/901/2637/front_pt.9.400.jpg',
    keywords: ['cafe', 'cafe pilao', 'pilao', 'melitta', 'cafe 500g', 'torrado e moido', '3 coracoes'],
  },
  {
    id: 'prod-leite-condensado',
    title: 'Leite Condensado Moça Semidesnatado 395g',
    brand: 'Nestlé',
    category: 'Mercearia',
    defaultUnit: '395g',
    suggestedPrice: '5,99',
    suggestedOriginalPrice: '7,49',
    badge: 'DOCE OFERTA',
    imageUrl: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=600&auto=format&fit=crop&q=80',
    keywords: ['leite condensado', 'moca', 'nestle', 'leite moca', '395g'],
  },

  // LIMPEZA
  {
    id: 'prod-sabao-omo',
    title: 'Lava Roupas em Pó OMO Lavagem Perfeita 1,6kg',
    brand: 'OMO',
    category: 'Limpeza',
    defaultUnit: '1,6kg',
    suggestedPrice: '19,90',
    suggestedOriginalPrice: '25,90',
    badge: 'SUPER OFERTA',
    imageUrl: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=800&auto=format&fit=crop&q=85',
    keywords: ['omo', 'sabao', 'sabao em po', 'sabao omo', 'lavagem perfeita', 'lava roupas'],
  },
  {
    id: 'prod-detergente-ype',
    title: 'Detergente Líquido Ypê Neutro 500ml',
    brand: 'Ypê',
    category: 'Limpeza',
    defaultUnit: '500ml',
    suggestedPrice: '2,19',
    suggestedOriginalPrice: '2,89',
    badge: 'LEVE MAIS',
    imageUrl: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600&auto=format&fit=crop&q=80',
    keywords: ['detergente', 'ype', 'deterjente ype', 'neutro', 'detergente ype', '500ml'],
  },
  {
    id: 'prod-amaciante-comfort',
    title: 'Amaciante Concentrado Comfort Classic 1L',
    brand: 'Comfort',
    category: 'Limpeza',
    defaultUnit: '1L',
    suggestedPrice: '14,90',
    suggestedOriginalPrice: '19,90',
    badge: 'PERFUME DURADOURO',
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
    keywords: ['amaciante', 'comfort', 'downy', 'amaciante concentrado', '1l'],
  },
  {
    id: 'prod-desinfetante-veja',
    title: 'Limpador Multiuso Veja Tradicional 500ml',
    brand: 'Veja',
    category: 'Limpeza',
    defaultUnit: '500ml',
    suggestedPrice: '4,49',
    suggestedOriginalPrice: '5,79',
    badge: 'CASA LIMPA',
    imageUrl: 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=600&auto=format&fit=crop&q=80',
    keywords: ['veja', 'multiuso', 'limpador', 'desinfetante', 'veja multiuso'],
  },

  // HORTIFRÚTI
  {
    id: 'prod-banana-prata',
    title: 'Banana Prata Selecionada kg',
    brand: 'Hortifrúti',
    category: 'Hortifrúti',
    defaultUnit: 'kg',
    suggestedPrice: '5,99',
    suggestedOriginalPrice: '7,99',
    badge: 'QUARTA VERDE',
    imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=80',
    keywords: ['banana', 'banana prata', 'banana nanica', 'fruta', 'hortifruti'],
  },
  {
    id: 'prod-tomate-italiano',
    title: 'Tomate Italiano Especial kg',
    brand: 'Hortifrúti',
    category: 'Hortifrúti',
    defaultUnit: 'kg',
    suggestedPrice: '6,89',
    suggestedOriginalPrice: '8,90',
    badge: 'FRESQUINHO',
    imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80',
    keywords: ['tomate', 'tomate italiano', 'salada', 'legumes', 'hortifruti'],
  },
  {
    id: 'prod-maca-gala',
    title: 'Maçã Gala Nacional Fresca kg',
    brand: 'Hortifrúti',
    category: 'Hortifrúti',
    defaultUnit: 'kg',
    suggestedPrice: '7,99',
    suggestedOriginalPrice: '9,90',
    badge: 'DIRETO DO PRODUTOR',
    imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&auto=format&fit=crop&q=80',
    keywords: ['maca', 'maca gala', 'maca fuji', 'fruta'],
  },

  // LATICÍNIOS & FRIOS
  {
    id: 'prod-leite-integral-1l',
    title: 'Leite Integral UHT Piracanjuba 1L',
    brand: 'Piracanjuba',
    category: 'Laticínios & Frios',
    defaultUnit: '1L',
    suggestedPrice: '4,69',
    suggestedOriginalPrice: '5,89',
    badge: 'MAIS SAÚDE',
    imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80',
    keywords: ['leite', 'leite piracanjuba', 'leite integral', 'itambe', 'uht', '1l'],
  },
  {
    id: 'prod-queijo-mussarela',
    title: 'Queijo Mussarela Fatiado kg',
    brand: 'Tirolez',
    category: 'Laticínios & Frios',
    defaultUnit: 'kg',
    suggestedPrice: '39,90',
    suggestedOriginalPrice: '49,90',
    badge: 'QUALIDADE OURO',
    imageUrl: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=600&auto=format&fit=crop&q=80',
    keywords: ['queijo', 'mussarela', 'queijo mussarela', 'fatiado', 'frios'],
  },
  {
    id: 'prod-presunto-sadia',
    title: 'Presunto Cozido Sadia Fatiado kg',
    brand: 'Sadia',
    category: 'Laticínios & Frios',
    defaultUnit: 'kg',
    suggestedPrice: '26,90',
    suggestedOriginalPrice: '34,90',
    badge: 'SABOR SADIA',
    imageUrl: 'https://images.unsplash.com/photo-1528736235302-52922df5c122?w=600&auto=format&fit=crop&q=80',
    keywords: ['presunto', 'presunto sadia', 'presunto fatiado', 'seara'],
  },

  // HIGIENE
  {
    id: 'prod-creme-dental-colgate',
    title: 'Creme Dental Colgate Total 12 90g',
    brand: 'Colgate',
    category: 'Higiene & Beleza',
    defaultUnit: '90g',
    suggestedPrice: '4,99',
    suggestedOriginalPrice: '6,49',
    badge: 'CUIDADO TOTAL',
    imageUrl: 'https://images.unsplash.com/photo-1559591937-e10b14ea5e89?w=600&auto=format&fit=crop&q=80',
    keywords: ['colgate', 'creme dental', 'pasta de dente', 'total 12', 'dental'],
  },
  {
    id: 'prod-sabonete-dove',
    title: 'Sabonete em Barra Dove Original 90g',
    brand: 'Dove',
    category: 'Higiene & Beleza',
    defaultUnit: '90g',
    suggestedPrice: '3,89',
    suggestedOriginalPrice: '4,99',
    badge: 'HIDRATAÇÃO',
    imageUrl: 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=600&auto=format&fit=crop&q=80',
    keywords: ['dove', 'sabonete', 'sabonete dove', 'original'],
  },
];

export const BANCO_PRODUTOS_COMERCIAIS = CURATED_PRODUCTS;

export function findBestMatchingImage(searchKey: string, category?: string, unit?: string): string {
  const clean = (searchKey || '').toLowerCase();
  
  // 1. Direct keyword match in curated catalog of authentic retail packshots
  for (const prod of CURATED_PRODUCTS) {
    if (prod.keywords.some((k) => clean.includes(k) || k.includes(clean))) {
      return prod.imageUrl;
    }
  }

  // 2. Specific retail checks for common supermarket items (Real Packaging Photos)
  if (clean.includes('caboclo')) {
    return 'https://images.openfoodfacts.org/images/products/789/608/901/1470/front_pt.3.full.jpg';
  }
  if (clean.includes('pilão') || clean.includes('pilao')) {
    return 'https://images.openfoodfacts.org/images/products/789/608/901/2637/front_pt.9.400.jpg';
  }
  if (clean.includes('cafe') || clean.includes('café')) {
    return 'https://images.openfoodfacts.org/images/products/789/608/901/1470/front_pt.3.full.jpg';
  }
  if (clean.includes('coca') || clean.includes('refrigerante') || clean.includes('pepsi') || clean.includes('guarana')) {
    return 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Coca_Cola_Flasche_-_Original_Taste.jpg/960px-Coca_Cola_Flasche_-_Original_Taste.jpg';
  }
  if (clean.includes('omo') || clean.includes('sabao') || clean.includes('sabão') || clean.includes('detergente') || clean.includes('amaciante')) {
    return 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=800&auto=format&fit=crop&q=85';
  }
  if (clean.includes('picanha') || clean.includes('friboi') || clean.includes('churrasco')) {
    return 'https://images.unsplash.com/photo-1558030006-450675393462?w=800&auto=format&fit=crop&q=85';
  }
  if (clean.includes('arroz') || clean.includes('tio jorge')) {
    return 'https://images.openfoodfacts.org/images/products/789/604/790/0270/front_pt.6.full.jpg';
  }
  if (clean.includes('ninho') || clean.includes('leite em po') || clean.includes('leite em pó')) {
    return 'https://images.openfoodfacts.org/images/products/789/100/032/5858/front_pt.34.400.jpg';
  }
  if (clean.includes('uniao') || clean.includes('união') || clean.includes('acucar') || clean.includes('açúcar')) {
    return 'https://images.openfoodfacts.org/images/products/789/191/000/0197/front_pt.6.400.jpg';
  }
  if (clean.includes('liza') || clean.includes('oleo') || clean.includes('óleo')) {
    return 'https://images.openfoodfacts.org/images/products/789/603/609/0244/front_pt.11.400.jpg';
  }

  // 3. Category real photograph fallback
  if (category) {
    const catClean = category.toLowerCase();
    if (catClean.includes('carne') || catClean.includes('açougue') || catClean.includes('aves')) {
      return 'https://images.unsplash.com/photo-1558030006-450675393462?w=800&auto=format&fit=crop&q=85';
    }
    if (catClean.includes('bebida') || catClean.includes('cerveja')) {
      return 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Coca_Cola_Flasche_-_Original_Taste.jpg/960px-Coca_Cola_Flasche_-_Original_Taste.jpg';
    }
    if (catClean.includes('limpeza')) {
      return 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=800&auto=format&fit=crop&q=85';
    }
    if (catClean.includes('horti') || catClean.includes('fruta') || catClean.includes('legume')) {
      return 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800&auto=format&fit=crop&q=85';
    }
    if (catClean.includes('laticinio') || catClean.includes('frio') || catClean.includes('queijo')) {
      return 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=800&auto=format&fit=crop&q=85';
    }
  }

  // 4. Default high-resolution supermarket item real photograph
  return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=85';
}

export const buscarMelhorImagemProduto = findBestMatchingImage;

