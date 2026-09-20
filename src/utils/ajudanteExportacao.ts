// Utility to capture canvas / DOM elements and record MP4/WebM video or download PNG
import { BannerCampaign, ThemeColors, ProductItem } from '../tiposGeradorBanner';
import { toPng } from 'html-to-image';

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
    const dataUrl = await toPng(el, {
      quality: 1.0,
      pixelRatio: 2, // 2x Retina / 4K crispness
      cacheBust: true,
    });

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

/**
 * Helper to preload an image with crossOrigin anonymous and timeout
 */
function preloadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!url) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      // Retry without crossOrigin if failed (e.g. data URLs or local assets)
      const fallbackImg = new Image();
      fallbackImg.onload = () => resolve(fallbackImg);
      fallbackImg.onerror = () => resolve(null);
      fallbackImg.src = url;
    };
    img.src = url;
    setTimeout(() => resolve(null), 4000);
  });
}

/**
 * Helper for drawing rounded rectangles
 */
function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number | [number, number, number, number]
) {
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  } else {
    const radius = typeof r === 'number' ? r : r[0];
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}

/**
 * Robust, distortion-free image renderer preserving natural aspect ratio (cover or contain)
 */
function drawImagePreservingAspect(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cardX: number,
  cardY: number,
  cardW: number,
  cardH: number,
  isContain: boolean,
  zoom: number = 1.0
) {
  const imgW = img.naturalWidth || img.width;
  const imgH = img.naturalHeight || img.height;
  if (!imgW || !imgH) return;

  const imgAspect = imgW / imgH;
  const cardAspect = cardW / cardH;

  if (isContain) {
    // Packshot Mode: fit inside card with safety margins, zero crop, zero distortion
    const pad = Math.round(cardH * 0.08);
    const fitW = cardW - pad * 2;
    const fitH = cardH - pad * 2;
    const fitAspect = fitW / fitH;

    let dW = fitW;
    let dH = fitH;
    if (imgAspect > fitAspect) {
      dH = fitW / imgAspect;
    } else {
      dW = fitH * imgAspect;
    }

    const dX = cardX + (cardW - dW) / 2;
    const dY = cardY + (cardH - dH) / 2;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
    ctx.shadowBlur = 25;
    ctx.shadowOffsetY = 15;
    ctx.drawImage(img, dX, dY, dW, dH);
    ctx.restore();
  } else {
    // Ambient Mode: object-cover cropping excess without ANY distortion, with subtle Ken Burns zoom
    let sX = 0;
    let sY = 0;
    let sW = imgW;
    let sH = imgH;

    if (imgAspect > cardAspect) {
      // Source image is wider than 4:3 target -> crop left and right
      sW = imgH * cardAspect;
      sX = (imgW - sW) / 2;
    } else {
      // Source image is taller than 4:3 target -> crop top and bottom
      sH = imgW / cardAspect;
      sY = (imgH - sH) / 2;
    }

    const destW = cardW * zoom;
    const destH = cardH * zoom;
    const destX = cardX - (destW - cardW) / 2;
    const destY = cardY - (destH - cardH) / 2;

    ctx.drawImage(img, sX, sY, sW, sH, destX, destY, destW, destH);
  }
}

/**
 * Renders and records an authentic, high-definition broadcast video (MP4 / WebM)
 * capturing 100% of the real visual identity:
 * - Deep green botanical textured background
 * - Official Belíssima logo
 * - Golden campaign title & validity
 * - Product title, promotional badge & regular price
 * - Official supermarket orange price tag with giant numbers
 * - 4:3 framed ambient photo card with rotating OFERTAÇO discount stamp
 * - Red INFORME badge & continuous animated marquee ticker
 * - Legal notice sub-footer
 * - Automatic transition across all products in the campaign
 */
export async function gerarVideoAnimadoBanner(
  campaign: BannerCampaign,
  _theme: ThemeColors,
  _durationSeconds: number = 4.5,
  onProgress?: (progress: number) => void
): Promise<VideoExportResult> {
  return new Promise(async (resolve, reject) => {
    try {
      // 1. Output resolution: standard 1080p Full HD
      let width = 1920;
      let height = 1080;
      if (campaign.format === '9:16') {
        width = 1080;
        height = 1920;
      } else if (campaign.format === '1:1') {
        width = 1080;
        height = 1080;
      } else if (campaign.format === '4:5') {
        width = 1080;
        height = 1350;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) {
        throw new Error('Não foi possível inicializar contexto 2D para gravação de vídeo.');
      }

      // 2. Ensure Google Fonts are active and ready in memory
      if (typeof document !== 'undefined' && document.fonts) {
        try {
          await document.fonts.ready;
          await Promise.allSettled([
            document.fonts.load('900 54px "Plus Jakarta Sans"'),
            document.fonts.load('900 135px "Plus Jakarta Sans"'),
            document.fonts.load('800 48px "Plus Jakarta Sans"'),
            document.fonts.load('900 54px "Montserrat"'),
            document.fonts.load('900 135px "Montserrat"'),
          ]);
        } catch (e) {
          console.warn('Aviso de carregamento de fontes:', e);
        }
      }

      const FONT_BLACK = '"Plus Jakarta Sans", "Montserrat", "Segoe UI", -apple-system, sans-serif';
      const FONT_BOLD = '"Plus Jakarta Sans", "Montserrat", "Segoe UI", -apple-system, sans-serif';

      // 3. Preload Logo (Belíssima or client custom logo)
      const logoUrl = campaign.clientLogoUrl || '/logos/belissima-casa-di-frutas.png';
      const logoImg = await preloadImage(logoUrl);

      // 4. Products list & Preload all product images
      const products: ProductItem[] = campaign.products && campaign.products.length > 0 
        ? campaign.products 
        : [{
            id: '1',
            title: 'Refrigerante Coca-Cola Garrafa 2L',
            category: 'Bebidas',
            unit: '2L',
            price: '8,99',
            originalPrice: '10,99',
            badge: 'OFERTA DO DIA',
            imageUrl: '',
          }];

      const loadedProductImages: (HTMLImageElement | null)[] = [];
      for (const prod of products) {
        const pImg = prod.imageUrl ? await preloadImage(prod.imageUrl) : null;
        loadedProductImages.push(pImg);
      }

      // 5. Calculate timing: 5.0s per product, minimum 6s total
      const slideDurationSec = products.length === 1 ? 6.0 : 5.0;
      const totalDurationSec = products.length * slideDurationSec;
      const totalDurationMs = totalDurationSec * 1000;

      // 6. Setup MediaRecorder with best supported MP4 / WebM codec
      const stream = canvas.captureStream(30); // 30 FPS broadcast quality
      const mimeTypes = [
        'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
        'video/mp4',
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
      ];
      let chosenMime = 'video/webm';
      let isMp4 = false;
      for (const m of mimeTypes) {
        if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) {
          chosenMime = m;
          if (m.includes('mp4')) isMp4 = true;
          break;
        }
      }

      const recorder = new MediaRecorder(stream, {
        mimeType: chosenMime,
        videoBitsPerSecond: 10000000, // 10 Mbps crisp broadcast bitrate
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const startTime = performance.now();
      let animFrameId: number;

      // Ticker text
      const tickerText = (campaign.tickerText || '★★ OFERTAS IMBATÍVEIS EM TODAS AS LOJAS. ★ NOSSO APLICATIVO É BOM DEMAIS! ★★ OFERTAS VÁLIDAS PARA TODAS AS FILIAIS DA BELÍSSIMA CASA DI FRUTAS ★ COMPRE PELO WHATSAPP ★ ACEITAMOS TODOS OS CARTÕES E PIX ★').toUpperCase();

      // Main frame rendering loop
      const drawFrame = (currentTime: number) => {
        const elapsedMs = currentTime - startTime;
        const progress = Math.min(1, elapsedMs / totalDurationMs);
        const t = elapsedMs / 1000; // in seconds

        if (onProgress) {
          onProgress(Math.round(progress * 100));
        }

        // Determine active product index
        const productIndex = Math.min(
          products.length - 1,
          Math.floor(elapsedMs / (slideDurationSec * 1000))
        );
        const currentProduct = products[productIndex];
        const currentProductImg = loadedProductImages[productIndex];

        // 1. BACKGROUND: Deep green gradient matching web banner
        const bgGrad = ctx.createLinearGradient(0, 0, width, height);
        bgGrad.addColorStop(0, '#06331e');
        bgGrad.addColorStop(0.5, '#083c24');
        bgGrad.addColorStop(1, '#042214');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // 2. WATERMARK TEXTURE: Subtle geometric concentric circles
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1;
        const circleSpacing = 140;
        for (let cx = 0; cx <= width + circleSpacing; cx += circleSpacing) {
          for (let cy = 0; cy <= height + circleSpacing; cy += circleSpacing) {
            ctx.beginPath();
            ctx.arc(cx, cy, 54, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(cx, cy, 38, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(cx, cy, 22, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
        ctx.restore();

        // 3. AMBIENT GLOW: Warm top lighting
        ctx.save();
        const topGlow = ctx.createRadialGradient(width * 0.65, 0, 20, width * 0.65, 0, width * 0.5);
        topGlow.addColorStop(0, 'rgba(16, 185, 129, 0.14)');
        topGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = topGlow;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();

        // 4. TOP HEADER (Height = 135px)
        const headerH = 135;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
        ctx.fillRect(0, 0, width, headerH);
        ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
        ctx.fillRect(0, headerH - 1.5, width, 1.5);

        // Header Left: Official Belíssima Logo
        if (logoImg) {
          ctx.save();
          const targetH = 92;
          const logoAspect = logoImg.width / logoImg.height;
          const targetW = targetH * logoAspect;
          const logoX = 54;
          const logoY = (headerH - targetH) / 2;

          ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
          ctx.shadowBlur = 20;
          ctx.drawImage(logoImg, logoX, logoY, targetW, targetH);
          ctx.restore();
        } else {
          ctx.save();
          ctx.fillStyle = '#ffffff';
          ctx.font = `900 36px ${FONT_BLACK}`;
          ctx.fillText(campaign.clientName || 'Belíssima Casa di Frutas', 54, 75);
          ctx.restore();
        }

        // Header Center: Campaign Title & Validity
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Campaign Title in Amber-400
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 2;
        ctx.fillStyle = '#fbbf24';
        ctx.font = `900 42px ${FONT_BLACK}`;
        if ('letterSpacing' in ctx) {
          (ctx as any).letterSpacing = '-0.5px';
        }
        const centerTitle = (campaign.campaignTitle || 'FESTIVAL DE OFERTAS PLAY COMUNIQUE').toUpperCase();
        ctx.fillText(centerTitle, width * 0.52, 54);

        // Validity period line
        ctx.shadowBlur = 6;
        ctx.fillStyle = '#f3f4f6';
        ctx.font = `700 22px ${FONT_BOLD}`;
        if ('letterSpacing' in ctx) {
          (ctx as any).letterSpacing = '0px';
        }
        const validityText = `📅 ${campaign.validityText || 'Ofertas válidas de 10 a 22/09/2026 ou enquanto durarem os estoques'}`;
        ctx.fillText(validityText, width * 0.52, 98);
        ctx.restore();

        // 5. RIGHT COLUMN: 4:3 PHOTO FRAME (Strictly proportional, crisp white border)
        const cardH = 710;
        const cardW = Math.round(cardH * (4 / 3)); // 947px (standard 4:3)
        const cardX = width - 64 - cardW; // 909px
        const cardY = 175; // Centered vertically in available area (135px to 970px)
        const cardBottomY = cardY + cardH; // 885px

        // Card Drop Shadow
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
        ctx.shadowBlur = 45;
        ctx.shadowOffsetY = 24;
        ctx.fillStyle = '#0a0a0a';
        drawRoundRect(ctx, cardX, cardY, cardW, cardH, 26);
        ctx.fill();
        ctx.restore();

        // Card Interior (Product image drawn with 100% PROPORTIONAL ASPECT RATIO!)
        ctx.save();
        drawRoundRect(ctx, cardX, cardY, cardW, cardH, 26);
        ctx.clip();

        const isContain = currentProduct.imageDisplayMode === 'contain';

        if (isContain) {
          // Packshot Mode: elegant soft studio gradient background
          const cardBgGrad = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardH);
          cardBgGrad.addColorStop(0, '#f8fafc');
          cardBgGrad.addColorStop(0.5, '#ffffff');
          cardBgGrad.addColorStop(1, '#e2e8f0');
          ctx.fillStyle = cardBgGrad;
          ctx.fillRect(cardX, cardY, cardW, cardH);
        } else {
          // Ambient Mode: dark background
          ctx.fillStyle = '#0a0a0a';
          ctx.fillRect(cardX, cardY, cardW, cardH);
        }

        if (currentProductImg) {
          const zoom = isContain ? 1.0 : 1.0 + Math.sin(t * 0.8) * 0.025;
          // CRITICAL: Draw image preserving 100% of natural proportions without distortion!
          drawImagePreservingAspect(
            ctx,
            currentProductImg,
            cardX,
            cardY,
            cardW,
            cardH,
            isContain,
            zoom
          );

          if (!isContain) {
            // Soft vignette for ambient mode
            const innerVignette = ctx.createRadialGradient(
              cardX + cardW / 2, cardY + cardH / 2, cardW * 0.35,
              cardX + cardW / 2, cardY + cardH / 2, cardW * 0.7
            );
            innerVignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
            innerVignette.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
            ctx.fillStyle = innerVignette;
            ctx.fillRect(cardX, cardY, cardW, cardH);
          }
        } else {
          // Placeholder
          ctx.fillStyle = '#171717';
          ctx.fillRect(cardX, cardY, cardW, cardH);
          ctx.fillStyle = '#9ca3af';
          ctx.font = `bold 28px ${FONT_BOLD}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('FOTO DO PRODUTO', cardX + cardW / 2, cardY + cardH / 2);
        }
        ctx.restore();

        // 5px Crisp Solid White Border matching web
        ctx.save();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 5;
        drawRoundRect(ctx, cardX, cardY, cardW, cardH, 26);
        ctx.stroke();
        ctx.restore();

        // Rotating OFERTAÇO Stamp in top-right corner of card
        const origPriceNum = currentProduct.originalPrice 
          ? parseFloat(currentProduct.originalPrice.replace('R$', '').replace(',', '.').trim()) 
          : 0;
        const currPriceNum = parseFloat((currentProduct.price || '0').replace('R$', '').replace(',', '.').trim());
        let discountPct = 0;
        if (origPriceNum > currPriceNum && origPriceNum > 0) {
          discountPct = Math.round(((origPriceNum - currPriceNum) / origPriceNum) * 100);
        }

        const stampR = 56;
        const stampCx = cardX + cardW - 16;
        const stampCy = cardY + 16;
        const stampAngle = Math.sin(t * 2) * 0.08;

        ctx.save();
        ctx.translate(stampCx, stampCy);
        ctx.rotate(stampAngle);

        const stampGrad = ctx.createLinearGradient(-stampR, -stampR, stampR, stampR);
        stampGrad.addColorStop(0, '#ea580c');
        stampGrad.addColorStop(1, '#f97316');

        ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetY = 8;
        ctx.fillStyle = stampGrad;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, stampR, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `900 15px ${FONT_BLACK}`;
        ctx.fillText('OFERTAÇO', 0, -14);
        ctx.font = `900 30px ${FONT_BLACK}`;
        ctx.fillText(discountPct > 0 ? `-${discountPct}%` : 'OFERTA', 0, 14);
        ctx.restore();

        // 6. LEFT COLUMN: Product Details & Supermarket Orange Price Tag
        // Aligned vertically with the top and base of the card! Zero dead space!
        const leftX = 64;
        const maxLeftW = cardX - leftX - 40; // ~800px width

        // Product Title: Impactful, large, crisp typography
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 14;
        ctx.shadowOffsetY = 3;
        ctx.fillStyle = '#ffffff';
        ctx.font = `900 52px ${FONT_BLACK}`;
        if ('letterSpacing' in ctx) {
          (ctx as any).letterSpacing = '-1.5px';
        }
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        // Word wrap title across up to 3 lines
        const words = (currentProduct.title || 'Produto de Oferta').split(' ');
        const lines: string[] = [];
        let currentLine = '';
        for (const w of words) {
          const test = currentLine ? `${currentLine} ${w}` : w;
          if (ctx.measureText(test).width <= maxLeftW) {
            currentLine = test;
          } else {
            if (currentLine) lines.push(currentLine);
            currentLine = w;
            if (lines.length >= 2) break; // Limit to 3 lines max
          }
        }
        if (currentLine) lines.push(currentLine);

        const titleLineH = 60;
        const titleTopY = cardY + 10;
        lines.forEach((line, idx) => {
          ctx.fillText(line, leftX, titleTopY + idx * titleLineH);
        });
        const titleEndY = titleTopY + lines.length * titleLineH;
        ctx.restore();

        // Promotional Badge ("OFERTA DO DIA") placed right under title with tight, natural margin
        const badgeY = titleEndY + 20;
        ctx.save();
        const badgeText = (currentProduct.badge || 'OFERTA DO DIA').toUpperCase();
        ctx.font = `800 20px ${FONT_BOLD}`;
        const badgeTextW = ctx.measureText(badgeText).width;
        const bW = badgeTextW + 36;
        const bH = 44;

        ctx.fillStyle = '#2d5a3f';
        ctx.strokeStyle = '#528d69';
        ctx.lineWidth = 2;
        drawRoundRect(ctx, leftX, badgeY, bW, bH, 10);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#cbf4d8';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(badgeText, leftX + bW / 2, badgeY + bH / 2);
        ctx.restore();

        // Brand / Category Tag if present, harmoniously filling the middle space
        if (currentProduct.brand || currentProduct.category) {
          ctx.save();
          const subtitleY = badgeY + bH + 16;
          const subText = [currentProduct.category, currentProduct.brand].filter(Boolean).join(' • ');
          ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
          ctx.font = `700 22px ${FONT_BOLD}`;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          ctx.fillText(subText, leftX, subtitleY);
          ctx.restore();
        }

        // PRICE BOX & REGULAR PRICE: Base-aligned with bottom of photo card!
        const priceBoxH = 175; // Generous supermarket height
        const priceBoxW = 460; // Generous width commanding the left side!
        const priceBoxY = cardBottomY - priceBoxH; // Exactly at 710px

        // Regular Price ("De: R$ 10,99") positioned just above the orange box
        if (currentProduct.originalPrice) {
          ctx.save();
          ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
          ctx.shadowBlur = 8;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.font = `700 26px ${FONT_BOLD}`;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'bottom';
          ctx.fillText(`De: R$ ${currentProduct.originalPrice.replace('R$', '').trim()}`, leftX, priceBoxY - 12);
          ctx.restore();
        }

        // Giant Supermarket Orange Price Box
        ctx.save();
        const pGrad = ctx.createLinearGradient(leftX, priceBoxY, leftX, priceBoxY + priceBoxH);
        pGrad.addColorStop(0, '#f97316');
        pGrad.addColorStop(0.5, '#ea580c');
        pGrad.addColorStop(1, '#c2410c');

        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 35;
        ctx.shadowOffsetY = 18;
        ctx.fillStyle = pGrad;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 3;
        drawRoundRect(ctx, leftX, priceBoxY, priceBoxW, priceBoxH, 22);
        ctx.fill();
        ctx.stroke();

        // Price parts
        const priceClean = (currentProduct.price || '8,99').replace('R$', '').trim();
        const priceParts = priceClean.split(/[,.]/);
        const intPrice = priceParts[0] || '8';
        const centsPrice = priceParts[1] ? priceParts[1].padEnd(2, '0').slice(0, 2) : '99';
        const unit = currentProduct.unit || '2L';

        // "POR R$"
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = `900 18px ${FONT_BLACK}`;
        if ('letterSpacing' in ctx) {
          (ctx as any).letterSpacing = '1px';
        }
        ctx.fillText('POR', leftX + 22, priceBoxY + 48);

        ctx.fillStyle = '#ffffff';
        ctx.font = `900 28px ${FONT_BLACK}`;
        ctx.fillText('R$', leftX + 22, priceBoxY + 80);

        // Giant Integer Price Number
        ctx.font = `900 135px ${FONT_BLACK}`;
        if ('letterSpacing' in ctx) {
          (ctx as any).letterSpacing = '-4px'; // Tight authentic supermarket font!
        }
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(intPrice, leftX + 86, priceBoxY + priceBoxH - 28);

        // Cents and Unit column
        const intWidth = ctx.measureText(intPrice).width;
        const rightPartX = leftX + 90 + intWidth;

        ctx.font = `900 50px ${FONT_BLACK}`;
        if ('letterSpacing' in ctx) {
          (ctx as any).letterSpacing = '-1px';
        }
        ctx.fillText(`,${centsPrice}`, rightPartX, priceBoxY + 70);

        ctx.font = `900 22px ${FONT_BLACK}`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        if ('letterSpacing' in ctx) {
          (ctx as any).letterSpacing = '1px';
        }
        ctx.fillText(unit.toUpperCase(), rightPartX + 2, priceBoxY + 106);
        ctx.restore();

        // 7. BOTTOM FOOTER: Two-tier Ticker & Legal Bar (Height = 110px)
        const tickerTierH = 72;
        const legalTierH = 38;
        const footerTotalH = tickerTierH + legalTierH;
        const footerTopY = height - footerTotalH;

        // Footer background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
        ctx.fillRect(0, footerTopY, width, footerTotalH);

        // Divider
        ctx.fillStyle = '#262626';
        ctx.fillRect(0, footerTopY, width, 2);

        // Red INFORME button
        const infBtnW = 165;
        const infBtnH = 50;
        const infBtnX = 54;
        const infBtnY = footerTopY + (tickerTierH - infBtnH) / 2;

        ctx.fillStyle = '#d90429';
        drawRoundRect(ctx, infBtnX, infBtnY, infBtnW, infBtnH, 10);
        ctx.fill();

        // Pulsing speaker icon
        const pulse = 1.0 + Math.sin(t * 6) * 0.14;
        ctx.save();
        ctx.translate(infBtnX + 24, infBtnY + infBtnH / 2);
        ctx.scale(pulse, pulse);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(-7, -5);
        ctx.lineTo(-2, -5);
        ctx.lineTo(4, -10);
        ctx.lineTo(4, 10);
        ctx.lineTo(-2, 5);
        ctx.lineTo(-7, 5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = '#ffffff';
        ctx.font = `900 22px ${FONT_BLACK}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('INFORME', infBtnX + 44, infBtnY + infBtnH / 2);

        // Moving Marquee Text with Yellow Stars
        ctx.save();
        const marqueeClipX = infBtnX + infBtnW + 24;
        const marqueeClipW = width - marqueeClipX - 24;
        ctx.beginPath();
        ctx.rect(marqueeClipX, footerTopY, marqueeClipW, tickerTierH);
        ctx.clip();

        ctx.font = `800 26px ${FONT_BOLD}`;
        const fullMarqueeString = `${tickerText}   ★   ${tickerText}`;
        const marqueeTextMetrics = ctx.measureText(fullMarqueeString);
        const marqueeSpeedPx = 110; // Smooth readable speed
        const textLoopWidth = marqueeTextMetrics.width / 2;
        const marqueeShift = (t * marqueeSpeedPx) % textLoopWidth;

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(fullMarqueeString, marqueeClipX - marqueeShift, footerTopY + tickerTierH / 2);
        ctx.restore();

        // Sub-Footer Legal Notice Bar
        const subFooterY = footerTopY + tickerTierH;
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, subFooterY, width, legalTierH);

        ctx.fillStyle = '#262626';
        ctx.fillRect(0, subFooterY, width, 1);

        ctx.fillStyle = '#a3a3a3';
        ctx.font = `600 15px ${FONT_BOLD}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          campaign.legalNotice || 'Imagens meramente ilustrativas. Proibida a venda de bebidas alcoólicas a menores de 18 anos.',
          54,
          subFooterY + legalTierH / 2
        );

        ctx.fillStyle = '#d4d4d4';
        ctx.font = `700 15px ${FONT_BOLD}`;
        ctx.textAlign = 'right';
        ctx.fillText(
          campaign.footerBrandText || 'Desenvolvido por: playcomunique.com.br',
          width - 54,
          subFooterY + legalTierH / 2
        );

        // Next frame or finish
        if (elapsedMs < totalDurationMs) {
          animFrameId = requestAnimationFrame(drawFrame);
        } else {
          recorder.stop();
        }
      };

      // Handler when recording completes
      recorder.onstop = () => {
        const videoBlob = new Blob(chunks, { type: chosenMime });
        const ext = isMp4 ? 'mp4' : 'mp4'; // Always .mp4 for universal compatibility
        const cleanTitle = (campaign.campaignTitle || 'ofertas')
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]/g, '-')
          .slice(0, 25);
        const filename = `playcomunique-tv-${campaign.format || '16x9'}-${cleanTitle}-${Date.now()}.${ext}`;

        const blobUrl = URL.createObjectURL(videoBlob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        resolve({
          success: true,
          filename,
          blobUrl,
          sizeBytes: videoBlob.size,
        });
      };

      // Start recording at 30 FPS
      recorder.start(100);
      animFrameId = requestAnimationFrame(drawFrame);
    } catch (err) {
      reject(err);
    }
  });
}
