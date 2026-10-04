import { BannerCampaign, BannerFormat, ThemeColors } from '../tiposGeradorBanner';
import { toCanvas, toPng } from 'html-to-image';
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import { FONT_EMBED_CSS } from './fontesEmbutidas';

/**
 * Converte strings para um formato limpo, legível e seguro para sistemas de arquivos
 * Remove acentos, caracteres especiais e substitui espaços por hifens
 */
export function sanitizeFilenamePart(text: string, maxLength = 35): string {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-zA-Z0-9\s_-]/g, '') // remove pontuações/caracteres inválidos
    .trim()
    .replace(/\s+/g, '-') // espaços viram hifens
    .replace(/-+/g, '-') // remove múltiplos hifens consecutivos
    .slice(0, maxLength);
}

/**
 * Retorna o rótulo descritivo de plataforma e formato para a engenharia de arquivos
 */
export function getPlatformFormatLabel(
  format: BannerFormat = '16:9',
  tabloidTarget?: 'whatsapp-mobile' | 'instagram-feed' | 'classic-a4' | 'instagram-square' | string
): string {
  if (format === 'tabloid') {
    switch (tabloidTarget) {
      case 'instagram-feed':
        return 'Tabloide-Instagram-Feed-4x5';
      case 'instagram-square':
        return 'Tabloide-Instagram-Feed-1x1';
      case 'classic-a4':
        return 'Tabloide-Encarte-A4-Impresso';
      case 'whatsapp-mobile':
      default:
        return 'Tabloide-WhatsApp-Status-9x16';
    }
  }

  switch (format) {
    case '16:9':
      return 'TV-16x9';
    case '9:16':
      return 'WhatsApp-Stories-9x16';
    case '4:5':
      return 'Instagram-Feed-4x5';
    case '1:1':
      return 'Feed-Quadrado-1x1';
    default:
      return 'Banner';
  }
}

export interface BuildExportFilenameParams {
  clientName?: string;
  productTitle?: string;
  campaignTitle?: string;
  format?: BannerFormat;
  tabloidTarget?: 'whatsapp-mobile' | 'instagram-feed' | 'classic-a4' | 'instagram-square' | string;
  index?: number;
  extension?: string;
}

/**
 * Engenharia Inteligente de Nomenclatura de Arquivos:
 * Combina [Cliente]_[Produto/Campanha]_[Formato-Plataforma]_[Data].[ext]
 */
export function buildExportFilename({
  clientName,
  productTitle,
  campaignTitle,
  format = '16:9',
  tabloidTarget,
  index,
  extension = 'png',
}: BuildExportFilenameParams): string {
  const cleanClient = sanitizeFilenamePart(clientName || 'Cliente', 30);
  
  let cleanItem = '';
  if (productTitle) {
    cleanItem = sanitizeFilenamePart(productTitle, 35);
  } else if (campaignTitle) {
    cleanItem = sanitizeFilenamePart(campaignTitle, 35);
  } else {
    cleanItem = 'Oferta';
  }

  const indexPrefix = typeof index === 'number' ? `${String(index + 1).padStart(2, '0')}-` : '';
  const platformLabel = getPlatformFormatLabel(format, tabloidTarget);
  
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  return `${cleanClient}_${indexPrefix}${cleanItem}_${platformLabel}_${dateStr}.${extension}`;
}

/**
 * Downloads the visual banner directly as a crisp high-resolution PNG using html-to-image
 */
export async function downloadElementAsPng(elementId: string, filename: string = 'banner-playcomunique.png') {
  const el = document.getElementById(elementId);
  if (!el) {
    console.error(`Elemento #${elementId} não encontrado.`);
    return;
  }

  try {
    const sourceW = el.offsetWidth || 1120;
    const sourceH = Math.max(el.offsetHeight || 0, el.scrollHeight || 0) || 630;
    const canvas = await toCanvas(el, {
      quality: 1.0,
      pixelRatio: 2, // 2x Retina / 4K crispness
      canvasWidth: sourceW,
      canvasHeight: sourceH,
      width: sourceW,
      height: sourceH,
      cacheBust: false,
      fontEmbedCSS: FONT_EMBED_CSS,
      filter: (node) => {
        if (node instanceof HTMLElement && (
          node.classList.contains('group-hover:opacity-100') || 
          node.classList.contains('no-export') ||
          node.dataset.exportHide === 'true' ||
          node.id === 'tv-card-toolbar'
        )) {
          return false;
        }
        return true;
      },
    });

    const dataUrl = canvas.toDataURL('image/png', 1.0);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (err) {
    console.warn('Erro ao exportar com html-to-image, acionando fallback de impressão:', err);
    window.print();
  }
}

export interface VideoExportResult {
  success: boolean;
  filename: string;
  blobUrl: string;
  sizeBytes: number;
}

interface ElementBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface ProductSlideLayers {
  fullCanvas: HTMLCanvasElement;
  bgCanvas: HTMLCanvasElement;
  titleCrop: HTMLCanvasElement | null;
  titleRect: ElementBox | null;
  cardCrop: HTMLCanvasElement | null;
  cardRect: ElementBox | null;
  priceCrop: HTMLCanvasElement | null;
  priceRect: ElementBox | null;
}

/**
 * Ensures any image URL is safely converted to a same-origin Data URL (base64)
 * using direct fetch with fallback to the high-speed weserv.nl CORS proxy.
 * Once an image is a Data URL, Canvas and html-to-image NEVER fail to render it.
 */
export async function getSafeImageDataUrl(url: string): Promise<string> {
  if (!url || typeof url !== 'string') return '';
  if (url.startsWith('data:')) return url;

  // 1. Direct fetch with CORS
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (res.ok) {
      const blob = await res.blob();
      return await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    }
  } catch {}

  // 2. High-speed CORS proxy fallback (weserv.nl)
  try {
    const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(url)}&output=webp&q=92`;
    const res = await fetch(proxyUrl);
    if (res.ok) {
      const blob = await res.blob();
      return await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    }
  } catch {}

  return url;
}

/**
 * Captura o banner como canvas com resolução de estúdio utilizando toCanvas (html-to-image).
 * Utiliza o motor nativo de renderização SVG foreignObject do próprio navegador (Chrome/Edge),
 * garantindo fidelidade 100% exata a fontes (Montserrat), espaçamento de letras (letter-spacing),
 * padding de selos e cores — sem falhas de texto transbordando do selo.
 * Quando `isTransparent` é true, remove o fundo do banner e isola o elemento solicitado com fundo 100% transparente.
 */
async function captureBannerToCanvas(
  el: HTMLElement,
  targetW: number,
  targetH: number,
  isTransparent?: boolean
): Promise<HTMLCanvasElement> {
  const sourceW = el.offsetWidth || targetW;
  const sourceH = el.offsetHeight || targetH;
  const ratio = targetW / (sourceW || 1);

  const options: any = {
    quality: 1.0,
    pixelRatio: ratio,
    canvasWidth: sourceW,
    canvasHeight: sourceH,
    width: sourceW,
    height: sourceH,
    cacheBust: false,
    fontEmbedCSS: FONT_EMBED_CSS,
    filter: (node: HTMLElement) => {
      if (node instanceof HTMLElement) {
        if (node.id === 'tv-card-toolbar' || node.classList.contains('group-hover:opacity-100')) {
          return false;
        }
        if (node.id && node.id.startsWith('btn-')) {
          return false;
        }
      }
      return true;
    },
  };

  if (isTransparent) {
    options.backgroundColor = 'transparent';
    options.style = {
      background: 'transparent',
      backgroundColor: 'transparent',
      backgroundImage: 'none',
      boxShadow: 'none',
      border: 'none',
    };
  }

  const canvas = await toCanvas(el, options);

  // Garante que as dimensões do canvas final correspondam com precisão matemática a targetW x targetH
  if (canvas.width !== targetW || canvas.height !== targetH) {
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = targetW;
    finalCanvas.height = targetH;
    const ctx = finalCanvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(canvas, 0, 0, targetW, targetH);
    return finalCanvas;
  }

  return canvas;
}

/**
 * Recorta o elemento animado diretamente do canvas completo em sua resolução real nativa.
 * A regra de ouro: cada crop é sempre recortado e desenhado em sua largura/altura real.
 */
/**
 * Obtém a caixa de destino de um elemento no canvas final de saída (ex: 1920x1080)
 */
function getElementDestRect(
  bannerEl: HTMLElement,
  element: HTMLElement,
  canvasW: number,
  canvasH: number
): ElementBox | null {
  const bannerRect = bannerEl.getBoundingClientRect();
  const elRect = element.getBoundingClientRect();

  if (bannerRect.width <= 0 || bannerRect.height <= 0 || elRect.width <= 0 || elRect.height <= 0) {
    return null;
  }

  const rx = (elRect.left - bannerRect.left) / bannerRect.width;
  const ry = (elRect.top - bannerRect.top) / bannerRect.height;
  const rw = elRect.width / bannerRect.width;
  const rh = elRect.height / bannerRect.height;

  if (rw <= 0 || rh <= 0) return null;

  return {
    x: rx * canvasW,
    y: ry * canvasH,
    w: rw * canvasW,
    h: rh * canvasH,
  };
}

/**
 * Caminho vetorial para desenhar retângulos arredondados com compatibilidade universal
 */
function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.arcTo(x + w, y, x + w, y + radius, radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.arcTo(x + w, y, x + w - radius, y + h, radius);
  ctx.lineTo(x + radius, y + h);
  ctx.arcTo(x, y + h, x, y + h - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}

/**
 * Extrai o card de produto/packshot do fullCanvas com cantos arredondados precisos e fundo 100% transparente.
 * Zero chamadas de rede e zero risco de falhas no SVG/CORS.
 */
function extractCardCrop(
  fullCanvas: HTMLCanvasElement,
  cardRect: ElementBox,
  borderRadius: number
): HTMLCanvasElement {
  const sx = Math.max(0, Math.min(fullCanvas.width - 1, Math.round(cardRect.x)));
  const sy = Math.max(0, Math.min(fullCanvas.height - 1, Math.round(cardRect.y)));
  const sw = Math.max(1, Math.min(fullCanvas.width - sx, Math.round(cardRect.w)));
  const sh = Math.max(1, Math.min(fullCanvas.height - sy, Math.round(cardRect.h)));
  const w = sw;
  const h = sh;

  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = w;
  cropCanvas.height = h;
  const ctx = cropCanvas.getContext('2d');
  if (!ctx) return cropCanvas;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (borderRadius > 0) {
    if (typeof (ctx as any).roundRect === 'function') {
      ctx.beginPath();
      (ctx as any).roundRect(0, 0, w, h, borderRadius);
      ctx.clip();
    } else {
      drawRoundedRectPath(ctx, 0, 0, w, h, borderRadius);
      ctx.clip();
    }
  }

  ctx.drawImage(
    fullCanvas,
    sx,
    sy,
    sw,
    sh,
    0,
    0,
    w,
    h
  );

  return cropCanvas;
}

/**
 * Extrai uma sub-região transparente de um canvas com padding opcional para sombras e desfoques,
 * mantendo as coordenadas de destino no canvas mestre perfeitamente alinhadas.
 */
function extractTransparentCrop(
  sourceCanvas: HTMLCanvasElement,
  rect: ElementBox,
  padX: number = 0,
  padY: number = 0
): { crop: HTMLCanvasElement; drawRect: ElementBox } {
  const sx = Math.max(0, Math.floor(rect.x - padX));
  const sy = Math.max(0, Math.floor(rect.y - padY));
  const sw = Math.max(1, Math.min(sourceCanvas.width - sx, Math.ceil(rect.w + padX * 2)));
  const sh = Math.max(1, Math.min(sourceCanvas.height - sy, Math.ceil(rect.h + padY * 2)));

  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = sw;
  cropCanvas.height = sh;
  const ctx = cropCanvas.getContext('2d');
  if (ctx) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(sourceCanvas, sx, sy, sw, sh, 0, 0, sw, sh);
  }

  return {
    crop: cropCanvas,
    drawRect: {
      x: sx,
      y: sy,
      w: sw,
      h: sh,
    },
  };
}

/**
 * Captura as camadas de cada slide com zero fantasmas e fidelidade total às fontes e layouts:
 * 1. bgCanvas: papel de parede, iluminação, cabeçalho e rodapé 100% limpos (centro oculto no DOM + SVG filter)
 * 2. fullCanvas: banner completo renderizado nativamente pelo browser com fontes Montserrat embutidas em base64
 * 3. titleCrop, cardCrop, priceCrop: camadas isoladas transparentes dos 3 blocos para animação no MP4
 */
async function captureProductSlideLayers(
  bannerEl: HTMLElement,
  canvasW: number,
  canvasH: number,
  _productImageUrl?: string
): Promise<ProductSlideLayers> {
  try {
    if (typeof document !== 'undefined' && document.fonts) {
      await document.fonts.ready;
    }
  } catch {}

  // Garante carregamento e decodificação 100% completos do bitmap da foto do produto antes de qualquer captura
  const imgEl = bannerEl.querySelector('#tv-anim-product-img') as HTMLImageElement | null;
  if (imgEl) {
    if (!imgEl.complete) {
      await new Promise<void>((resolve) => {
        imgEl.onload = () => resolve();
        imgEl.onerror = () => resolve();
        setTimeout(resolve, 800);
      });
    }
    if (typeof imgEl.decode === 'function') {
      try {
        await imgEl.decode();
      } catch {}
    }
  }

  // Garante estado de repouso perfeito nos elementos animados antes de qualquer captura
  const animatedNodes = bannerEl.querySelectorAll<HTMLElement>(
    '#tv-anim-title-block, #tv-anim-price-block, #tv-anim-product-card, #tv-anim-card-wrapper, #tv-badge-pill-1, #tv-badge-pill-2, #tv-anim-title-text'
  );
  animatedNodes.forEach((node) => {
    node.style.setProperty('opacity', '1', 'important');
    node.style.setProperty('visibility', 'visible', 'important');
    node.style.setProperty('transform', 'none', 'important');
  });
  await new Promise((r) => setTimeout(r, 60));

  // Elementos estruturais do banner para isolamento de camadas mantendo o layout flexbox
  const bgLayerEl = bannerEl.querySelector('#tv-banner-bg-layer') as HTMLElement | null;
  const headerEl = bannerEl.querySelector('#tv-banner-header') as HTMLElement | null;
  const footerEl = bannerEl.querySelector('#tv-banner-footer') as HTMLElement | null;
  const centerEl = bannerEl.querySelector('#tv-banner-center-content') as HTMLElement | null;
  const rightColEl = bannerEl.querySelector('#tv-anim-right-column') as HTMLElement | null;
  const titleBlockEl = bannerEl.querySelector('#tv-anim-title-block') as HTMLElement | null;
  const priceBlockEl = bannerEl.querySelector('#tv-anim-price-block') as HTMLElement | null;
  const cardEl = bannerEl.querySelector('#tv-anim-product-card') as HTMLElement | null;

  // Mede retângulos de destino no canvas de saída com todos os elementos em repouso
  const titleRect = titleBlockEl ? getElementDestRect(bannerEl, titleBlockEl, canvasW, canvasH) : null;
  const cardRect = cardEl ? getElementDestRect(bannerEl, cardEl, canvasW, canvasH) : null;
  const priceRect = priceBlockEl ? getElementDestRect(bannerEl, priceBlockEl, canvasW, canvasH) : null;

  // Mede o border-radius do card para o recorte com cantos arredondados
  let cardRadius = 24;
  if (cardEl) {
    try {
      const cs = window.getComputedStyle(cardEl);
      const rawR = parseFloat(cs.borderRadius) || 20;
      const bannerBox = bannerEl.getBoundingClientRect();
      const scale = bannerBox.width > 0 ? canvasW / bannerBox.width : 1;
      cardRadius = Math.round(rawR * scale);
    } catch {}
  }

  // Retângulos de segurança caso algum ID não seja detectado
  const safeTitleRect: ElementBox = titleRect || {
    x: canvasW * 0.05,
    y: canvasH * 0.16,
    w: canvasW * 0.44,
    h: canvasH * 0.32,
  };
  const safeCardRect: ElementBox = cardRect || {
    x: canvasW * 0.48,
    y: canvasH * 0.12,
    w: canvasW * 0.48,
    h: canvasH * 0.78,
  };
  const safePriceRect: ElementBox = priceRect || {
    x: canvasW * 0.05,
    y: canvasH * 0.50,
    w: canvasW * 0.44,
    h: canvasH * 0.36,
  };

  const finalTitleRect = titleRect || safeTitleRect;
  const finalCardRect = cardRect || safeCardRect;
  const finalPriceRect = priceRect || safePriceRect;

  // Helper para alternar visibilidade de nós preservando rigorosamente o layout e a geometria flexbox
  const setVisible = (nodes: (HTMLElement | null | undefined)[], isVisible: boolean) => {
    nodes.forEach((n) => {
      if (n) {
        if (isVisible) {
          n.style.removeProperty('visibility');
          n.style.removeProperty('opacity');
        } else {
          n.style.setProperty('visibility', 'hidden', 'important');
          n.style.setProperty('opacity', '0', 'important');
        }
      }
    });
  };

  let fullCanvas: HTMLCanvasElement;
  let bgCanvas: HTMLCanvasElement;
  let titleCanvas: HTMLCanvasElement;
  let priceCanvas: HTMLCanvasElement;

  try {
    // 1. Banner completo (fonte da verdade absoluta com fidelidade e decodificação 100%)
    fullCanvas = await captureBannerToCanvas(bannerEl, canvasW, canvasH);

    // 2. Camada base (fundo wallpaper, iluminação, cabeçalho e rodapé - centro oculto mantendo o layout exato)
    setVisible([centerEl], false);
    bgCanvas = await captureBannerToCanvas(bannerEl, canvasW, canvasH);
    setVisible([centerEl], true);

    // Torna o fundo do container mestre transparente para capturar as camadas isoladas
    bannerEl.style.setProperty('background', 'transparent', 'important');
    bannerEl.style.setProperty('background-color', 'transparent', 'important');
    bannerEl.style.setProperty('border-color', 'transparent', 'important');
    bannerEl.style.setProperty('box-shadow', 'none', 'important');

    // 3. Captura transparente isolada do Bloco de Título (oculta fundo, header, footer, card e preço sem alterar o layout)
    setVisible([bgLayerEl, headerEl, footerEl, rightColEl, priceBlockEl], false);
    setVisible([titleBlockEl], true);
    titleCanvas = await captureBannerToCanvas(bannerEl, canvasW, canvasH, true);
    setVisible([bgLayerEl, headerEl, footerEl, rightColEl, priceBlockEl], true);

    // 4. Captura transparente isolada do Bloco de Preço (oculta fundo, header, footer, card e título sem alterar o layout)
    setVisible([bgLayerEl, headerEl, footerEl, rightColEl, titleBlockEl], false);
    setVisible([priceBlockEl], true);
    priceCanvas = await captureBannerToCanvas(bannerEl, canvasW, canvasH, true);
    setVisible([bgLayerEl, headerEl, footerEl, rightColEl, titleBlockEl], true);

  } finally {
    // Restaura estilos de fundo do container mestre
    bannerEl.style.removeProperty('background');
    bannerEl.style.removeProperty('background-color');
    bannerEl.style.removeProperty('border-color');
    bannerEl.style.removeProperty('box-shadow');

    // Restaura propriedades de estilo de todos os nós animados do banner
    animatedNodes.forEach((node) => {
      node.style.removeProperty('opacity');
      node.style.removeProperty('visibility');
      node.style.removeProperty('transform');
    });
  }

  // 5. Extração dos recortes com padding de segurança para sombras e anti-aliasing perfeitos
  let cardCrop: HTMLCanvasElement;
  let cardDrawRect: ElementBox;
  let titleCrop: HTMLCanvasElement;
  let titleDrawRect: ElementBox;
  let priceCrop: HTMLCanvasElement;
  let priceDrawRect: ElementBox;

  try {
    cardCrop = extractCardCrop(fullCanvas, finalCardRect, cardRadius);
    cardDrawRect = finalCardRect;

    const padTitleX = Math.round(canvasW * 0.015);
    const padTitleY = Math.round(canvasH * 0.015);
    const titleExtract = extractTransparentCrop(titleCanvas, finalTitleRect, padTitleX, padTitleY);
    titleCrop = titleExtract.crop;
    titleDrawRect = titleExtract.drawRect;

    // Padding generoso para preservar 100% da sombra suave (drop-shadow) e bordas do quadrante de preço
    const padPriceX = Math.round(canvasW * 0.03);
    const padPriceY = Math.round(canvasH * 0.04);
    const priceExtract = extractTransparentCrop(priceCanvas, finalPriceRect, padPriceX, padPriceY);
    priceCrop = priceExtract.crop;
    priceDrawRect = priceExtract.drawRect;
  } catch (err) {
    console.warn('Erro na extração de camadas animadas:', err);
    cardCrop = extractCardCrop(fullCanvas, finalCardRect, 0);
    cardDrawRect = finalCardRect;
    titleCrop = titleCanvas;
    titleDrawRect = finalTitleRect;
    priceCrop = priceCanvas;
    priceDrawRect = finalPriceRect;
  }

  return {
    fullCanvas,
    bgCanvas,
    titleCrop,
    titleRect: titleDrawRect,
    cardCrop,
    cardRect: cardDrawRect,
    priceCrop,
    priceRect: priceDrawRect,
  };
}

/**
 * Curva cúbica suave de desaceleração (ease-out)
 */
function easeOutCubic(x: number): number {
  return 1 - Math.pow(1 - Math.max(0, Math.min(1, x)), 3);
}

/**
 * Curva elástica com leve pop/bounce para etiqueta de preço supermercadista
 */
function easeOutBack(x: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  const p = Math.max(0, Math.min(1, x)) - 1;
  return 1 + c3 * Math.pow(p, 3) + c1 * Math.pow(p, 2);
}

/**
 * Renderiza cada quadro do vídeo com animação sequenciada profissional dos 3 blocos:
 * Bloco 1: Nome Comercial & Selo (desliza da esquerda)
 * Bloco 2: Foto Packshot (zoom suave de estúdio)
 * Bloco 3: Preço Por, Preço De, Unidade e 2º Selo (impacto com leve bounce)
 */
function renderCanvasFrame(
  ctx: CanvasRenderingContext2D,
  slides: ProductSlideLayers[],
  elapsedMs: number,
  totalDurationSec: number,
  perProductSec: number,
  canvasWidth: number,
  canvasHeight: number
) {
  if (!slides || slides.length === 0) return;

  const totalDurationMs = totalDurationSec * 1000;
  const slideDurationMs = perProductSec * 1000;
  const clampedElapsed = Math.min(elapsedMs, totalDurationMs);

  const currentIdx = Math.min(
    slides.length - 1,
    Math.floor(clampedElapsed / slideDurationMs)
  );
  const currentSlide = slides[currentIdx];
  const timeInSlideMs = clampedElapsed - currentIdx * slideDurationMs;
  const slideT = timeInSlideMs / 1000;

  // Transição entre produtos (últimos 450ms do slide)
  const transitionDurationMs = 450;
  const transitionStartMs = slideDurationMs - transitionDurationMs;
  const isTransitioning = slides.length > 1 && timeInSlideMs >= transitionStartMs && currentIdx < slides.length - 1;
  const nextSlide = isTransitioning ? slides[currentIdx + 1] : null;
  const fadeP = isTransitioning ? (timeInSlideMs - transitionStartMs) / transitionDurationMs : 0;

  // 0. Limpa o canvas de saída
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // 1. Camada Base (papel de parede, cabeçalho e rodapé oficial 100% limpos, ZERO fantasmas)
  ctx.drawImage(currentSlide.bgCanvas, 0, 0, canvasWidth, canvasHeight);

  const hasAnimatedLayers = Boolean(
    currentSlide.cardCrop && currentSlide.cardRect &&
    currentSlide.titleCrop && currentSlide.titleRect &&
    currentSlide.priceCrop && currentSlide.priceRect
  );

  // 2. Animação Sequencial dos 3 Blocos de Informação no MP4
  if (hasAnimatedLayers) {
    // Bloco 2: Foto da Embalagem / Packshot Comercial (Entrada lisa da margem direita ao ponto focal de 0.00s a 0.50s)
    if (currentSlide.cardCrop && currentSlide.cardRect) {
      if (slideT < 0.50) {
        const p2 = Math.min(1, Math.max(0, slideT / 0.50));
        const ease2 = easeOutCubic(p2);
        const alpha2 = ease2;
        // Desliza suavemente da margem direita (offsetX positivo) para o ponto focal zero em fluxo contínuo
        const offsetX2 = (canvasWidth * 0.025) * (1 - ease2);
        const scale2 = 0.96 + 0.04 * ease2;
        const cx = currentSlide.cardRect.x + offsetX2 + currentSlide.cardRect.w / 2;
        const cy = currentSlide.cardRect.y + currentSlide.cardRect.h / 2;

        ctx.save();
        ctx.globalAlpha = alpha2;
        ctx.translate(cx, cy);
        ctx.scale(scale2, scale2);
        ctx.drawImage(
          currentSlide.cardCrop,
          -currentSlide.cardRect.w / 2,
          -currentSlide.cardRect.h / 2,
          currentSlide.cardRect.w,
          currentSlide.cardRect.h
        );
        ctx.restore();
      } else {
        ctx.drawImage(
          currentSlide.cardCrop,
          currentSlide.cardRect.x,
          currentSlide.cardRect.y,
          currentSlide.cardRect.w,
          currentSlide.cardRect.h
        );
      }
    }

    // Bloco 1: Nome Comercial do Produto & 1º Selo (Desliza da esquerda de 0.12s a 0.52s)
    if (currentSlide.titleCrop && currentSlide.titleRect && slideT >= 0.12) {
      if (slideT < 0.52) {
        const p1 = Math.min(1, Math.max(0, (slideT - 0.12) / 0.40));
        const ease1 = easeOutCubic(p1);
        const alpha1 = ease1;
        const offsetX1 = -(canvasWidth * 0.025) * (1 - ease1);

        ctx.save();
        ctx.globalAlpha = alpha1;
        ctx.drawImage(
          currentSlide.titleCrop,
          currentSlide.titleRect.x + offsetX1,
          currentSlide.titleRect.y,
          currentSlide.titleRect.w,
          currentSlide.titleRect.h
        );
        ctx.restore();
      } else {
        ctx.drawImage(
          currentSlide.titleCrop,
          currentSlide.titleRect.x,
          currentSlide.titleRect.y,
          currentSlide.titleRect.w,
          currentSlide.titleRect.h
        );
      }
    }

    // Bloco 3: Preço Por, Preço De, Unidade e 2º Selo (Queda e Pop com bounce de 0.24s a 0.68s)
    // Preserva animação contínua e suave em etapa ÚNICA, sem trancos e sem sobreposição em duas etapas
    if (currentSlide.priceCrop && currentSlide.priceRect && slideT >= 0.24) {
      if (slideT < 0.68) {
        const p3 = Math.min(1, Math.max(0, (slideT - 0.24) / 0.44));
        const alpha3 = easeOutCubic(p3);
        const offsetY3 = (canvasHeight * 0.02) * (1 - easeOutCubic(p3));
        const bounceScale = easeOutBack(p3);
        const scale3 = 0.88 + 0.12 * Math.min(1.08, bounceScale);
        const pcx = currentSlide.priceRect.x + currentSlide.priceRect.w / 2;
        const pcy = currentSlide.priceRect.y + currentSlide.priceRect.h / 2;

        ctx.save();
        ctx.globalAlpha = alpha3;
        ctx.translate(pcx, pcy + offsetY3);
        ctx.scale(scale3, scale3);
        ctx.drawImage(
          currentSlide.priceCrop,
          -currentSlide.priceRect.w / 2,
          -currentSlide.priceRect.h / 2,
          currentSlide.priceRect.w,
          currentSlide.priceRect.h
        );
        ctx.restore();
      } else {
        ctx.drawImage(
          currentSlide.priceCrop,
          currentSlide.priceRect.x,
          currentSlide.priceRect.y,
          currentSlide.priceRect.w,
          currentSlide.priceRect.h
        );
      }
    }
  } else {
    // 3. Estado Estável: Banner completo em resolução nativa 1:1, cópia exata do mini player
    ctx.drawImage(currentSlide.fullCanvas, 0, 0, canvasWidth, canvasHeight);
  }

  // 4. Transição suave entre produtos para vídeos de múltiplos itens (fade limpo para o fundo do próximo slide)
  if (isTransitioning && nextSlide) {
    ctx.save();
    ctx.globalAlpha = easeOutCubic(fadeP);
    ctx.drawImage(nextSlide.bgCanvas, 0, 0, canvasWidth, canvasHeight);
    ctx.restore();
  }
}

/**
 * WebCodecs + MP4 Muxer High-Speed Video Engine a 12 Mbps (qualidade máxima sem perda).
 * Encodes directly from Canvas frames to standard H.264 MP4.
 */
async function recordWithWebCodecs(
  slides: ProductSlideLayers[],
  canvasWidth: number,
  canvasHeight: number,
  totalDurationSec: number,
  perProductSec: number,
  filename: string,
  onProgress?: (progress: number) => void
): Promise<VideoExportResult> {
  const FPS = 30;
  const totalFrames = Math.round(totalDurationSec * FPS);
  const frameDurationUs = Math.round(1_000_000 / FPS);
  const frameDurationMs = 1000 / FPS;

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) {
    throw new Error('Não foi possível inicializar contexto 2D.');
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: {
      codec: 'avc',
      width: canvasWidth,
      height: canvasHeight,
      frameRate: FPS,
    },
    fastStart: 'in-memory',
  });

  // Test supported H.264 profiles for the canvas dimensions
  const candidateCodecs = ['avc1.640028', 'avc1.4d002a', 'avc1.420028', 'avc1.42001f'];
  let chosenCodec = 'avc1.640028';
  for (const c of candidateCodecs) {
    try {
      const check = await (window as any).VideoEncoder.isConfigSupported({
        codec: c,
        width: canvasWidth,
        height: canvasHeight,
        bitrate: 12_000_000,
        framerate: FPS,
      });
      if (check.supported) {
        chosenCodec = c;
        break;
      }
    } catch {}
  }

  let encoderError: any = null;
  const encoder = new (window as any).VideoEncoder({
    output: (chunk: any, meta: any) => muxer.addVideoChunk(chunk, meta),
    error: (e: any) => {
      console.error('WebCodecs VideoEncoder erro:', e);
      encoderError = e;
    },
  });

  encoder.configure({
    codec: chosenCodec,
    width: canvasWidth,
    height: canvasHeight,
    bitrate: 12_000_000, // 12 Mbps broadcast qualidade de estúdio
    framerate: FPS,
  });

  // Renderiza e codifica quadro a quadro com exatidão matemática
  for (let f = 0; f < totalFrames; f++) {
    if (encoderError) {
      throw encoderError;
    }

    const elapsedMs = f * frameDurationMs;
    renderCanvasFrame(ctx, slides, elapsedMs, totalDurationSec, perProductSec, canvasWidth, canvasHeight);

    const timestampUs = f * frameDurationUs;
    const videoFrame = new (window as any).VideoFrame(canvas, {
      timestamp: timestampUs,
      duration: frameDurationUs,
    });

    const isKey = f % 30 === 0;
    encoder.encode(videoFrame, { keyFrame: isKey });
    videoFrame.close();

    // Atualiza progresso sem travar a interface
    if (f % 4 === 0 || f === totalFrames - 1) {
      if (onProgress) {
        onProgress(Math.round(25 + (f / totalFrames) * 70));
      }
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  await encoder.flush();
  encoder.close();
  muxer.finalize();

  const buffer = muxer.target.buffer;
  if (!buffer || buffer.byteLength === 0) {
    throw new Error('Falha ao codificar vídeo MP4: buffer vazio retornado.');
  }

  const videoBlob = new Blob([buffer], { type: 'video/mp4' });
  const blobUrl = URL.createObjectURL(videoBlob);

  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  if (onProgress) onProgress(100);

  return {
    success: true,
    filename,
    blobUrl,
    sizeBytes: videoBlob.size,
  };
}

/**
 * Universal MediaRecorder com Anti-Throttling a 12 Mbps.
 * Dual redraw (rAF + setInterval fallback) ancorado no tempo real (performance.now()).
 */
async function recordWithMediaRecorder(
  slides: ProductSlideLayers[],
  canvasWidth: number,
  canvasHeight: number,
  totalDurationSec: number,
  perProductSec: number,
  filename: string,
  onProgress?: (progress: number) => void
): Promise<VideoExportResult> {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) {
        throw new Error('Não foi possível inicializar contexto 2D para gravação.');
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Desenha frame inicial
      renderCanvasFrame(ctx, slides, 0, totalDurationSec, perProductSec, canvasWidth, canvasHeight);

      const stream = canvas.captureStream(30);
      const mimeTypes = [
        'video/mp4;codecs=avc1.640028',
        'video/mp4;codecs=avc1.4d002a',
        'video/mp4',
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
      ];
      let chosenMime = 'video/webm';
      for (const m of mimeTypes) {
        if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) {
          chosenMime = m;
          break;
        }
      }

      const recorder = new MediaRecorder(stream, {
        mimeType: chosenMime,
        videoBitsPerSecond: 12000000, // 12 Mbps — qualidade sem perda
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onerror = (err) => {
        console.error('Erro no MediaRecorder:', err);
        reject(new Error('Erro durante a gravação de vídeo no navegador.'));
      };

      const startTime = performance.now();
      const TOTAL = totalDurationSec;
      let stopped = false;

      const drawFrame = (currentT: number) => {
        const elapsedMs = currentT * 1000;
        renderCanvasFrame(ctx, slides, elapsedMs, totalDurationSec, perProductSec, canvasWidth, canvasHeight);
        try {
          const track = stream.getVideoTracks()[0] as any;
          if (track && typeof track.requestFrame === 'function') {
            track.requestFrame();
          }
        } catch {}
      };

      // DUAS fontes de redraw (anti-throttling)
      const animate = () => {
        if (stopped) return;
        const elapsed = (performance.now() - startTime) / 1000;
        const t = Math.min(elapsed, TOTAL);
        drawFrame(t);
        if (onProgress) {
          onProgress(Math.round(25 + (t / TOTAL) * 70));
        }
        if (!stopped) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);

      // Fallback setInterval para garantir frames mesmo se rAF pausar em segundo plano
      const intervalFallback = setInterval(() => {
        if (stopped) {
          clearInterval(intervalFallback);
          return;
        }
        const elapsed = (performance.now() - startTime) / 1000;
        const t = Math.min(elapsed, TOTAL);
        drawFrame(t);
      }, 1000 / 30);

      // Stop ancorado no relógio de parede real
      setTimeout(() => {
        stopped = true;
        clearInterval(intervalFallback);
        drawFrame(TOTAL);
        if (onProgress) onProgress(98);

        try {
          if (recorder.state === 'recording') {
            recorder.requestData();
          }
        } catch {}

        setTimeout(() => {
          try {
            if (recorder.state === 'recording') {
              recorder.stop();
            }
          } catch (e) {
            reject(e);
          }
        }, 150);
      }, TOTAL * 1000 + 300);

      recorder.onstop = () => {
        if (chunks.length === 0) {
          reject(new Error('Erro: nenhum quadro de vídeo foi capturado pelo gravador.'));
          return;
        }

        const videoBlob = new Blob(chunks, { type: chosenMime });
        if (videoBlob.size === 0) {
          reject(new Error('Erro: o vídeo gerado possui 0 bytes.'));
          return;
        }

        let finalName = filename;
        if (chosenMime.includes('webm') && !finalName.endsWith('.webm')) {
          finalName = finalName.replace(/\.mp4$/i, '.webm');
        }

        const blobUrl = URL.createObjectURL(videoBlob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = finalName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        if (onProgress) onProgress(100);

        resolve({
          success: true,
          filename: finalName,
          blobUrl,
          sizeBytes: videoBlob.size,
        });
      };

      recorder.start(100);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Records layered slides to MP4 video.
 * Automatically chooses the best engine:
 * 1. WebCodecs + mp4-muxer (primary: instant hardware encoding, 100% MP4, 12 Mbps)
 * 2. MediaRecorder (fallback: safe codecs & anti-throttling timing)
 */
async function recordLayeredSlidesToVideo(
  slides: ProductSlideLayers[],
  canvasWidth: number,
  canvasHeight: number,
  totalDurationSec: number,
  perProductSec: number,
  filename: string,
  onProgress?: (progress: number) => void
): Promise<VideoExportResult> {
  if (!slides || slides.length === 0) {
    throw new Error('Nenhum slide capturado para gravação.');
  }

  try {
    if (typeof document !== 'undefined' && document.fonts) {
      await document.fonts.ready;
    }
  } catch {}

  const hasWebCodecs =
    typeof window !== 'undefined' &&
    typeof (window as any).VideoEncoder === 'function' &&
    typeof (window as any).VideoFrame === 'function';

  if (hasWebCodecs) {
    try {
      return await recordWithWebCodecs(
        slides,
        canvasWidth,
        canvasHeight,
        totalDurationSec,
        perProductSec,
        filename,
        onProgress
      );
    } catch (webCodecsErr) {
      console.warn('WebCodecs falhou, acionando fallback de MediaRecorder:', webCodecsErr);
    }
  }

  return await recordWithMediaRecorder(
    slides,
    canvasWidth,
    canvasHeight,
    totalDurationSec,
    perProductSec,
    filename,
    onProgress
  );
}

/**
 * Generates an animated MP4 video specifically for an INDIVIDUAL PRODUCT (Single Banner).
 * Duration: 5.0 seconds.
 * 100% fiel ao mini player com exclusão do centro na camada base (zero fantasmas) e renderização nativa de fontes.
 */
export async function gerarVideoAnimadoProdutoIndividual(
  campaign: BannerCampaign,
  _theme: ThemeColors,
  productIndex: number,
  slideDurationSec: number = 5.0,
  onProgress?: (progress: number) => void,
  onSelectProductIndex?: (index: number) => void
): Promise<VideoExportResult> {
  const originalIndex = campaign.activeProductIndex || 0;

  if (onProgress) onProgress(5);

  const prod = campaign.products[productIndex];

  // 1. Switch active product in DOM if needed and wait for layout to render
  if (onSelectProductIndex) {
    onSelectProductIndex(productIndex);
    await new Promise((r) => setTimeout(r, 650));
  } else {
    await new Promise((r) => setTimeout(r, 200));
  }

  // Pre-convert product image to safe Data URL so DOM has zero CORS issue
  if (prod?.imageUrl) {
    try {
      const safeData = await getSafeImageDataUrl(prod.imageUrl);
      if (safeData && safeData.startsWith('data:')) {
        const imgEl = document.getElementById('tv-anim-product-img') as HTMLImageElement;
        if (imgEl) {
          imgEl.src = safeData;
          if (!imgEl.complete) {
            await new Promise((r) => { imgEl.onload = r; imgEl.onerror = r; setTimeout(r, 500); });
          }
          if (typeof imgEl.decode === 'function') {
            try {
              await imgEl.decode();
            } catch {}
          }
        }
      }
    } catch {}
  }

  const bannerEl = document.getElementById('tv-banner-capture');
  if (!bannerEl) {
    if (onSelectProductIndex) onSelectProductIndex(originalIndex);
    throw new Error('Elemento do banner (#tv-banner-capture) não encontrado.');
  }

  // Calculate canvas dimensions based on aspect ratio
  let canvasWidth = 1920;
  let canvasHeight = 1080;
  if (campaign.format === '9:16') {
    canvasWidth = 1080;
    canvasHeight = 1920;
  } else if (campaign.format === '1:1') {
    canvasWidth = 1080;
    canvasHeight = 1080;
  } else if (campaign.format === '4:5') {
    canvasWidth = 1080;
    canvasHeight = 1350;
  }

  if (onProgress) onProgress(15);

  // 2. Capture individual element layers via single retina snapshot & layered crops
  const slideLayers = await captureProductSlideLayers(bannerEl, canvasWidth, canvasHeight, prod?.imageUrl);

  if (onProgress) onProgress(25);

  // Restore original product selection if different
  if (onSelectProductIndex && originalIndex !== productIndex) {
    onSelectProductIndex(originalIndex);
  }

  const filename = buildExportFilename({
    clientName: campaign.clientName,
    productTitle: prod?.title,
    campaignTitle: campaign.campaignTitle,
    format: campaign.format,
    index: productIndex,
    extension: 'mp4',
  });

  // 3. Record dynamic video with individual element motion graphics
  return recordLayeredSlidesToVideo(
    [slideLayers],
    canvasWidth,
    canvasHeight,
    slideDurationSec,
    slideDurationSec,
    filename,
    onProgress
  );
}

/**
 * Generates an animated MP4 video across all active products with commercial rotation and transitions.
 * Features full commercial duration with individual element motion on every slide.
 */
export async function gerarVideoAnimadoBanner(
  campaign: BannerCampaign,
  _theme: ThemeColors,
  slideDurationSec: number = 5.0,
  onProgress?: (progress: number) => void,
  onSelectProductIndex?: (index: number) => void
): Promise<VideoExportResult> {
  const bannerEl = document.getElementById('tv-banner-capture');
  if (!bannerEl) {
    throw new Error('Banner de TV (#tv-banner-capture) não encontrado no DOM.');
  }

  // Filter only active (non-hidden) products
  const allProducts = campaign.products && campaign.products.length > 0 ? campaign.products : [];
  const visibleIndices = allProducts
    .map((p, idx) => (!p.hidden ? idx : -1))
    .filter((idx) => idx !== -1);
  const targetIndices = visibleIndices.length > 0 ? visibleIndices : (allProducts.length > 0 ? [0] : [0]);
  const totalProducts = targetIndices.length;
  const originalIndex = campaign.activeProductIndex || 0;

  // Standard broadcast dimensions
  let canvasWidth = 1920;
  let canvasHeight = 1080;
  if (campaign.format === '9:16') {
    canvasWidth = 1080;
    canvasHeight = 1920;
  } else if (campaign.format === '1:1') {
    canvasWidth = 1080;
    canvasHeight = 1080;
  } else if (campaign.format === '4:5') {
    canvasWidth = 1080;
    canvasHeight = 1350;
  }

  // Capture layers for each visible product
  const slides: ProductSlideLayers[] = [];

  for (let i = 0; i < totalProducts; i++) {
    const prodIndex = targetIndices[i];
    const currentProd = allProducts[prodIndex];

    if (onProgress) {
      onProgress(Math.round(5 + (i / totalProducts) * 20));
    }

    if (onSelectProductIndex && totalProducts > 1) {
      onSelectProductIndex(prodIndex);
      await new Promise((r) => setTimeout(r, 650));
    } else {
      await new Promise((r) => setTimeout(r, 200));
    }

    // Pre-convert product image to safe Data URL
    if (currentProd?.imageUrl) {
      try {
        const safeData = await getSafeImageDataUrl(currentProd.imageUrl);
        if (safeData && safeData.startsWith('data:')) {
          const imgEl = document.getElementById('tv-anim-product-img') as HTMLImageElement;
          if (imgEl) {
            imgEl.src = safeData;
            if (!imgEl.complete) {
              await new Promise((r) => { imgEl.onload = r; imgEl.onerror = r; setTimeout(r, 500); });
            }
            if (typeof imgEl.decode === 'function') {
              try {
                await imgEl.decode();
              } catch {}
            }
          }
        }
      } catch {}
    }

    const currentEl = document.getElementById('tv-banner-capture') || bannerEl;
    const slide = await captureProductSlideLayers(currentEl, canvasWidth, canvasHeight, currentProd?.imageUrl);
    slides.push(slide);
  }

  // Restore active product index in editor
  if (onSelectProductIndex && totalProducts > 1) {
    onSelectProductIndex(originalIndex);
  }

  if (slides.length === 0) {
    throw new Error('Falha ao capturar quadros do banner.');
  }

  // Dynamic broadcast duration per product
  let perProductSec = 5.0;
  if (totalProducts === 1) {
    perProductSec = 6.0;
  } else if (totalProducts === 2) {
    perProductSec = 5.0;
  } else if (totalProducts === 3) {
    perProductSec = 4.5;
  } else {
    perProductSec = Math.max(4.0, slideDurationSec);
  }

  const totalDurationSec = totalProducts * perProductSec;

  const filename = buildExportFilename({
    clientName: campaign.clientName,
    campaignTitle: campaign.campaignTitle,
    format: campaign.format,
    extension: 'mp4',
  });

  // Record using layered motion graphics engine
  return recordLayeredSlidesToVideo(
    slides,
    canvasWidth,
    canvasHeight,
    totalDurationSec,
    perProductSec,
    filename,
    onProgress
  );
}
