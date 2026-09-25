/**
 * Motor de Engenharia de Prompt Publicitário (Web Designer & Marketing Digital Sênior)
 * Especializado em gerar ambientações fotográficas de altíssimo impacto para varejo e TV Indoor.
 * 
 * Princípio Fundamental:
 * - A imagem gerada pela IA NUNCA deve conter letras, textos, preços ou selos.
 * - O app já renderiza a tipografia oficial, selos e logotipos com precisão vetorial.
 * - A imagem deve ser 100% fotografia comercial ambientada, suculenta e hiper-realista.
 */

export interface ProductPromptContext {
  title: string;
  brand?: string;
  category?: string;
  unit?: string;
  businessSegment?: string;
}

export interface GeneratedPrompts {
  /** Prompt hiper-otimizado em inglês para modelos como Imagen 3, Midjourney, DALL-E */
  aiModelPrompt: string;
  /** Prompt pronto e polido em português para o usuário colar no Gemini Pro Web */
  geminiWebPrompt: string;
  /** Descrição do arquétipo de ambientação comercial utilizado */
  ambienceArchetype: string;
}

/**
 * Identifica o arquétipo comercial de ambientação baseado no título, marca e categoria
 */
function normalize(str: string): string {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function getProductAmbienceDetails(item: ProductPromptContext): {
  settingEn: string;
  settingPt: string;
  archetype: string;
} {
  const rawText = `${item.title} ${item.brand || ''} ${item.category || ''}`;
  const text = normalize(rawText);

  // 1. Cafés e Matinais
  if (
    text.includes('cafe') || 
    text.includes('café') || 
    text.includes('caboclo') || 
    text.includes('pilao') || 
    text.includes('melitta') || 
    text.includes('nescafe') || 
    text.includes('cappuccino') || 
    text.includes('matinal')
  ) {
    return {
      archetype: 'Café da Fazenda & Cozinha Rústica Gourmet',
      settingEn: 'placed on a warm rustic wooden farm table, scattered roasted aromatic coffee beans, traditional Brazilian cloth drip coffee filter pouring hot steaming coffee into ceramic mugs, soft morning sunlight, cozy warm bakery atmosphere',
      settingPt: 'mesa rústica de madeira de fazenda, grãos de café torrados espalhados, coador tradicional de pano passando café quente fumegando em xícaras de louça, luz matinal dourada e aconchegante'
    };
  }

  // 2. Carnes, Açougue & Churrasco
  if (
    text.includes('picanha') || 
    text.includes('carne') || 
    text.includes('bovino') || 
    text.includes('alcatra') || 
    text.includes('costela') || 
    text.includes('linguiça') || 
    text.includes('churrasco') || 
    text.includes('friboi')
  ) {
    return {
      archetype: 'Churrascaria Gourmet & Steakhouse',
      settingEn: 'placed on a dark slate cutting board next to a sizzling iron grill with glowing embers, coarse rock salt, fresh rosemary sprigs, subtle appetizing barbecue smoke rising, dramatic warm steakhouse lighting',
      settingPt: 'tábua de corte rústica escura ao lado de grelha fumegante com brasas suaves, pedras de sal grosso, raminho de alecrim fresco, leve fumaça apetitosa de brasa e iluminação quente de steakhouse'
    };
  }

  // 3. Cervejas, Chopp & Happy Hour
  if (text.includes('cerveja') || text.includes('heineken') || text.includes('chopp') || text.includes('pilsen') || text.includes('malte')) {
    return {
      archetype: 'Bar Premium & Boteco Gelado',
      settingEn: 'chilled with natural frosty condensation droplets running down the bottle, set in a rustic wooden bar counter beside a frosted glass with cold beer, scattered ice cubes, warm amber tavern bokeh background',
      settingPt: 'garrafa extremamente gelada com gotas de condensação escorrendo pelo vidro, apoiada em balcão de bar rústico ao lado de copo suado com gelo, clima de happy hour sofisticado'
    };
  }

  // 4. Refrigerantes & Sucos
  if (text.includes('coca') || text.includes('refrigerante') || text.includes('suco') || text.includes('guaraná') || text.includes('guarana') || text.includes('refri')) {
    return {
      archetype: 'Refrescância Tropical & Almoço de Domingo',
      settingEn: 'placed on a bright modern dining table with cold crystal condensation droplets, tall crystal glass with ice cubes and fresh citrus slices, dynamic refreshing splash droplets, bright vibrant daylight',
      settingPt: 'mesa de refeição moderna e iluminada, gotas de condensação gelada na embalagem, copo de vidro alto com cubos de gelo e fatias de frutas frescas, sensação de refrescância pura'
    };
  }

  // 5. Hortifrúti, Frutas, Legumes & Feira
  if (
    text.includes('fruta') || 
    text.includes('banana') || 
    text.includes('maçã') || 
    text.includes('maca') || 
    text.includes('tomate') || 
    text.includes('laranja') || 
    text.includes('horti') || 
    text.includes('legume') || 
    text.includes('verdura')
  ) {
    return {
      archetype: 'Pomar & Feira Livre Artesanal',
      settingEn: 'arranged inside or next to a rustic handmade wooden market crate, fresh sparkling morning dew drops on produce, bright natural sunbeams, orchard leaves, farm-to-table organic harvest aesthetic',
      settingPt: 'dentro de um caixote rústico de madeira clara de feira artesanal, gotas brilhantes de orvalho fresco da manhã, iluminação solar vibrante, conceito 100% fresco do campo'
    };
  }

  // 6. Laticínios, Queijos & Padaria
  if (
    text.includes('leite') || 
    text.includes('queijo') || 
    text.includes('iogurte') || 
    text.includes('manteiga') || 
    text.includes('pão') || 
    text.includes('pao') || 
    text.includes('bolo') || 
    text.includes('piracanjuba') || 
    text.includes('ninho')
  ) {
    return {
      archetype: 'Café Colonial & Padaria Artesanal',
      settingEn: 'placed on a rustic wooden breakfast table with freshly baked artisan bread slices, golden wheat stalks, ceramic jug, soft warm linen cloth, inviting morning breakfast lighting',
      settingPt: 'mesa de café colonial em madeira nobre, fatias de pão artesanal crocante, espigas de trigo douradas, tecido de linho rústico e iluminação acolhedora de café da manhã'
    };
  }

  // 7. Mercearia & Grãos (Arroz, Feijão, Açúcar, Óleo)
  if (
    text.includes('arroz') || 
    text.includes('feijao') || 
    text.includes('feijão') || 
    text.includes('açucar') || 
    text.includes('açúcar') || 
    text.includes('oleo') || 
    text.includes('óleo') || 
    text.includes('farinha') || 
    text.includes('camil') || 
    text.includes('tio jorge')
  ) {
    return {
      archetype: 'Cozinha Gourmet Brasileira & Ingredientes Selecionados',
      settingEn: 'placed on a granite kitchen countertop surrounded by raw grains in small artisanal clay bowls, wooden spoon, fresh bay leaves, garlic cloves, warm home cooking ambiance',
      settingPt: 'bancada gourmet de cozinha de restaurante, pequenos recipientes de barro com grãos crus selecionados ao redor, colher de pau, folhas de louro e atmosfera de comida caseira de qualidade'
    };
  }

  // 8. Limpeza & Lavanderia (Sabão, Detergente, Amaciante)
  if (
    text.includes('sabao') || 
    text.includes('sabão') || 
    text.includes('omo') || 
    text.includes('ypê') || 
    text.includes('ype') || 
    text.includes('detergente') || 
    text.includes('amaciante') || 
    text.includes('limpeza')
  ) {
    return {
      archetype: 'Lavanderia Moderna & Pureza Cristalina',
      settingEn: 'placed on a pristine polished white marble surface with clean crystal water ripples, stack of fluffy folded white towels, airy modern laundry room setting, bright crisp commercial lighting',
      settingPt: 'superfície de mármore branco polido e reluzente, respingos sutis de água cristalina, toalhas brancas macias dobradas ao lado, sensação de frescor, limpeza e brilho impecável'
    };
  }

  // 9. Varejo Geral / Default
  return {
    archetype: 'Comercial de Varejo de Luxo',
    settingEn: 'staged on a premium textured podium with subtle soft depth of field, warm cinematic commercial advertising studio lighting, elegant premium grocery background',
    settingPt: 'ambientado sobre bancada elegante de varejo com iluminação publicitária de estúdio, profundidade de campo suave e clima profissional de supermercado premium'
  };
}

/**
 * Gera tanto o prompt técnico para Imagen 3 / APIs de imagem
 * quanto o prompt em linguagem natural para o usuário colar no Gemini Pro Web
 */
export function buildCommercialProductPrompts(item: ProductPromptContext): GeneratedPrompts {
  const cleanTitle = item.title.trim();
  const brandPart = item.brand ? `by ${item.brand}` : '';
  const { settingEn, settingPt, archetype } = getProductAmbienceDetails(item);

  // 1. Prompt de Alta Precisão para Modelos de Imagem (Imagen 3 / APIs)
  const aiModelPrompt = [
    `Professional commercial advertising packshot photograph of ${cleanTitle} ${brandPart}.`,
    `The product package is authentic, high fidelity and centered on the scene: ${settingEn}.`,
    `Commercial retail advertising photography, 8k resolution, photorealistic, cinematic studio lighting, shot on 85mm f/2.8 lens, appetizing, vibrant, depth of field.`,
    `STRICT NEGATIVES: NO TEXT, NO LOGOS, NO LETTERS, NO WORDS, NO NUMBERS, NO PRICE TAGS, NO WATERMARKS, NO SALE BADGES, NO LABELS OVERLAY, clean background and realistic staging only.`
  ].join(' ');

  // 2. Prompt amigável em Português para o Gemini Web (exatamente no estilo do Print 1 do usuário)
  const geminiWebPrompt = `crie um banner promocional padrão com a imagem deste produto, vou divulgar em uma tv, não incluir textos adicionais somente fotos do produto ambientado ${cleanTitle}, ambientação: ${settingPt}. Iluminação comercial profissional de estúdio de alta resolução, ângulo publicitário impactante.`;

  return {
    aiModelPrompt,
    geminiWebPrompt,
    ambienceArchetype: archetype
  };
}

/**
 * Utilitário universal para cópia para área de transferência com fallback automático
 * Funciona em HTTP, HTTPS, iframes e contextos restritos.
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  // Tentativa 1 (Síncrona imediata): execCommand('copy') no loop do evento de clique
  // Executado IMEDIATAMENTE sem nenhum 'await' anterior para reter o User Gesture / Transient Activation do clique do mouse!
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    textArea.style.opacity = '0.01';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    
    textArea.focus();
    textArea.select();
    textArea.setSelectionRange(0, text.length);

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);

    if (successful) {
      // Se teve sucesso, opcionalmente sincroniza com a API assíncrona se disponível
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(text).catch(() => {});
      }
      return true;
    }
  } catch (err) {
    console.warn('[Clipboard] execCommand síncrono falhou:', err);
  }

  // Tentativa 2: API moderna navigator.clipboard
  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      console.warn('[Clipboard] navigator.clipboard.writeText falhou:', e);
    }
  }

  return false;
}

