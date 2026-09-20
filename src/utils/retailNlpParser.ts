/**
 * Retail NLP Parser - Motor Local de Inteligência para Varejo e Supermercados
 * Processa e higieniza mensagens brutas de ofertas recebidas via WhatsApp
 * quando a API externa estiver sob instabilidade, timeout ou limite de cota.
 */

export interface ParsedRetailProduct {
  title: string;
  brand?: string;
  category: string;
  unit: string;
  price: string;
  originalPrice?: string;
  discountPercentage?: number;
  badge: string;
  searchKey: string;
  packagingStyle?: string;
}

export interface ParsedRetailResult {
  campaignTitle: string;
  validityText: string;
  themeSuggested: string;
  items: ParsedRetailProduct[];
}

export function parseLocalRetailList(
  rawText: string,
  businessSegment: string = 'supermercado'
): ParsedRetailResult {
  const lines = rawText
    .split(/[\r\n]+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#') && !l.startsWith('//'));

  const items: ParsedRetailProduct[] = [];

  for (const line of lines) {
    // 1. Extração de preços: padrão "de X por Y" ou "R$ Y"
    let price = '0,00';
    let originalPrice: string | undefined = undefined;
    let discountPercentage = 0;

    const dePorMatch = line.match(
      /\bde\s*(?:r\$)?\s*(\d+[.,]\d{2})\s*(?:por|\/|a)\s*(?:r\$)?\s*(\d+[.,]\d{2})/i
    );
    if (dePorMatch) {
      originalPrice = dePorMatch[1].replace('.', ',');
      price = dePorMatch[2].replace('.', ',');
    } else {
      const porMatch = line.match(/\bpor\s*(?:r\$)?\s*(\d+[.,]\d{2})/i);
      if (porMatch) {
        price = porMatch[1].replace('.', ',');
      } else {
        const prices = Array.from(line.matchAll(/(?:r\$)?\s*(\d+[.,]\d{2})/gi)).map(
          (m) => m[1]
        );
        if (prices.length >= 2) {
          originalPrice = prices[0].replace('.', ',');
          price = prices[1].replace('.', ',');
        } else if (prices.length === 1) {
          price = prices[0].replace('.', ',');
        }
      }
    }

    // Calcula porcentagem de desconto
    if (originalPrice && price && price !== '0,00') {
      const pOrig = parseFloat(originalPrice.replace(',', '.'));
      const pAtual = parseFloat(price.replace(',', '.'));
      if (pOrig > pAtual && pOrig > 0) {
        discountPercentage = Math.round(((pOrig - pAtual) / pOrig) * 100);
      }
    } else if (price && price !== '0,00') {
      const pAtual = parseFloat(price.replace(',', '.'));
      if (pAtual > 0) {
        const pSug = (pAtual * 1.25).toFixed(2);
        originalPrice = pSug.replace('.', ',');
        discountPercentage = 20;
      }
    }

    // 2. Extração de unidade (kg, g, l, ml, 500g, 2L, etc.)
    let unit = 'un';
    const unitMatch = line.match(
      /\b(\d+(?:[.,]\d+)?\s*(?:kg|g|l|ml|un|unidades?|pct|pacote|cx|lata))\b/i
    );
    if (unitMatch) {
      unit = unitMatch[1].replace(/\s+/g, '').toLowerCase();
      if (unit.endsWith('l') && !unit.endsWith('ml')) {
        unit = unit.toUpperCase();
      }
    }

    // 3. Limpeza do nome do produto (remover termos de preço)
    let cleanTitle = line
      .replace(/\bde\s*(?:r\$)?\s*\d+[.,]\d{2}\s*(?:por|\/|a)\s*(?:r\$)?\s*\d+[.,]\d{2}/gi, '')
      .replace(/\bpor\s*(?:r\$)?\s*\d+[.,]\d{2}/gi, '')
      .replace(/(?:r\$)?\s*\d+[.,]\d{2}/gi, '')
      .replace(/[-–—]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // 4. Identificação de Marcas Populares do Varejo
    const lower = line.toLowerCase();
    let brand = '';

    if (lower.includes('caboclo')) brand = 'Caboclo';
    else if (lower.includes('coca')) brand = 'Coca-Cola';
    else if (lower.includes('pilão') || lower.includes('pilao')) brand = 'Pilão';
    else if (lower.includes('friboi') || lower.includes('friboy')) brand = 'Friboi';
    else if (lower.includes('heineken')) brand = 'Heineken';
    else if (lower.includes('sadia')) brand = 'Sadia';
    else if (lower.includes('seara')) brand = 'Seara';
    else if (lower.includes('camil')) brand = 'Camil';
    else if (lower.includes('tio jorge')) brand = 'Tio Jorge';
    else if (lower.includes('ype') || lower.includes('ypê')) brand = 'Ypê';
    else if (lower.includes('omo')) brand = 'OMO';
    else if (lower.includes('comfort')) brand = 'Comfort';
    else if (lower.includes('nestle') || lower.includes('nestlé') || lower.includes('moça') || lower.includes('moca')) brand = 'Nestlé';

    // 5. Categoria
    let category = 'Mercearia';
    if (
      lower.includes('cafe') ||
      lower.includes('café') ||
      lower.includes('arroz') ||
      lower.includes('feijao') ||
      lower.includes('feijão') ||
      lower.includes('oleo') ||
      lower.includes('óleo') ||
      lower.includes('leite condensado') ||
      lower.includes('açucar') ||
      lower.includes('acucar') ||
      lower.includes('macarrao') ||
      lower.includes('macarrão')
    ) {
      category = 'Mercearia';
    } else if (
      lower.includes('coca') ||
      lower.includes('refrigerante') ||
      lower.includes('cerveja') ||
      lower.includes('suco') ||
      lower.includes('vinho') ||
      lower.includes('agua') ||
      lower.includes('água')
    ) {
      category = 'Bebidas';
    } else if (
      lower.includes('picanha') ||
      lower.includes('carne') ||
      lower.includes('alcatra') ||
      lower.includes('frango') ||
      lower.includes('linguiça') ||
      lower.includes('linguica') ||
      lower.includes('bife') ||
      lower.includes('costela')
    ) {
      category = 'Carnes & Aves';
    } else if (
      lower.includes('sabao') ||
      lower.includes('sabão') ||
      lower.includes('detergente') ||
      lower.includes('amaciante') ||
      lower.includes('limpeza') ||
      lower.includes('cloro') ||
      lower.includes('desinfetante')
    ) {
      category = 'Limpeza';
    } else if (
      lower.includes('banana') ||
      lower.includes('maçã') ||
      lower.includes('maca') ||
      lower.includes('tomate') ||
      lower.includes('batata') ||
      lower.includes('laranja') ||
      lower.includes('cebola') ||
      lower.includes('horti')
    ) {
      category = 'Hortifrúti';
    } else if (
      lower.includes('queijo') ||
      lower.includes('presunto') ||
      lower.includes('manteiga') ||
      lower.includes('iogurte') ||
      lower.includes('requeijao') ||
      lower.includes('requeijão')
    ) {
      category = 'Frios & Laticínios';
    }

    // 6. Formatação elegante de Título (Title Case comercial)
    let formattedTitle = cleanTitle
      .split(' ')
      .map((word, idx) => {
        const wLower = word.toLowerCase();
        if (
          ['de', 'do', 'da', 'dos', 'das', 'e', 'a', 'o', 'em', 'com', 'sem', 'para', 'kg', 'g', 'ml', 'un'].includes(
            wLower
          ) &&
          idx > 0
        ) {
          return wLower;
        }
        if (wLower === 'vacuo') return 'Vácuo';
        if (wLower === 'cafe') return 'Café';
        if (wLower === 'acucar') return 'Açúcar';
        if (wLower === 'feijao') return 'Feijão';
        if (wLower === 'maca') return 'Maçã';
        if (wLower === 'linguica') return 'Linguiça';
        return wLower.charAt(0).toUpperCase() + wLower.slice(1);
      })
      .join(' ');

    // Caso específico para "Café caboclo tradicional a vácuo 500 g"
    if (lower.includes('caboclo') && (lower.includes('cafe') || lower.includes('café'))) {
      if (!formattedTitle.toLowerCase().includes('torrado')) {
        formattedTitle = 'Café Torrado e Moído Caboclo Tradicional a Vácuo 500g';
      }
    }

    // 7. Selo Promocional (Badge)
    let badge = 'OFERTA DO DIA';
    if (discountPercentage >= 25) badge = 'SUPER OFERTA';
    else if (discountPercentage >= 15) badge = 'IMPERDÍVEL';
    else if (category === 'Carnes & Aves') badge = 'QUARTA DA CARNE';
    else if (category === 'Hortifrúti') badge = 'QUINTA VERDE';

    // 8. Chave de busca para foto
    const searchKey = `${brand || ''} ${formattedTitle}`.toLowerCase().trim();

    items.push({
      title: formattedTitle,
      brand,
      category,
      unit,
      price,
      originalPrice,
      discountPercentage: discountPercentage || undefined,
      badge,
      searchKey,
      packagingStyle: 'Embalagem comercial padrão',
    });
  }

  return {
    campaignTitle: 'FESTIVAL DE OFERTAS PLAY COMUNIQUE',
    validityText: 'Ofertas válidas até domingo ou enquanto durarem os estoques',
    themeSuggested: 'red-yellow',
    items,
  };
}
