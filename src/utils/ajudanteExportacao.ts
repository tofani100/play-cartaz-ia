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
    setTimeout(() => resolve(null), 3500);
  });
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

      // 2. Preload Logo (Belíssima or client custom logo)
      const logoUrl = campaign.clientLogoUrl || '/logos/belissima-casa-di-frutas.png';
      const logoImg = await preloadImage(logoUrl);

      // 3. Products list & Preload all product images
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

      // 4. Calculate timing: 4.5s per product, minimum 6s
      const slideDurationSec = products.length === 1 ? 6.0 : 4.5;
      const totalDurationSec = products.length * slideDurationSec;
      const totalDurationMs = totalDurationSec * 1000;

      // 5. Setup MediaRecorder with best supported MP4 / WebM codec
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
        videoBitsPerSecond: 8000000, // 8 Mbps high-bitrate Full HD
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const startTime = performance.now();
      let animFrameId: number;

      // Helper for rounded rectangles (supported across all modern canvas engines)
      const drawRoundRect = (
        x: number,
        y: number,
        w: number,
        h: number,
        r: number | [number, number, number, number]
      ) => {
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
      };

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

        // Determine active product index and transition alpha
        const productIndex = Math.min(
          products.length - 1,
          Math.floor(elapsedMs / (slideDurationSec * 1000))
        );
        const currentProduct = products[productIndex];
        const currentProductImg = loadedProductImages[productIndex];

        // 1. BACKGROUND: Deep green gradient matching web
        const bgGrad = ctx.createLinearGradient(0, 0, width, height);
        bgGrad.addColorStop(0, '#06331e');
        bgGrad.addColorStop(0.5, '#083c24');
        bgGrad.addColorStop(1, '#042214');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // 2. WATERMARK TEXTURE: Subtle geometric concentric circles grid
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1;
        const circleSpacing = 130;
        for (let cx = 0; cx <= width + circleSpacing; cx += circleSpacing) {
          for (let cy = 0; cy <= height + circleSpacing; cy += circleSpacing) {
            ctx.beginPath();
            ctx.arc(cx, cy, 50, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(cx, cy, 38, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(cx, cy, 24, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(cx, cy, 12, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
        ctx.restore();

        // 3. LIGHTING VIGNETTE: Soft ambient glows
        ctx.save();
        const topGlow = ctx.createRadialGradient(width * 0.7, 0, 10, width * 0.7, 0, width * 0.45);
        topGlow.addColorStop(0, 'rgba(16, 185, 129, 0.12)');
        topGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = topGlow;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();

        // 4. TOP HEADER
        const headerH = height * 0.11;
        // Left: Logo Belíssima
        if (logoImg) {
          ctx.save();
          const targetH = headerH * 0.95;
          const logoAspect = logoImg.width / logoImg.height;
          const targetW = targetH * logoAspect;
          const logoX = width * 0.035;
          const logoY = height * 0.015;

          ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
          ctx.shadowBlur = 18;
          ctx.drawImage(logoImg, logoX, logoY, targetW, targetH);
          ctx.restore();
        } else {
          // Fallback logo text
          ctx.save();
          ctx.fillStyle = '#ffffff';
          ctx.font = `900 ${Math.round(height * 0.032)}px serif`;
          ctx.fillText(campaign.clientName || 'Belíssima Casa di Frutas', width * 0.035, height * 0.06);
          ctx.restore();
        }

        // Center: Campaign Title & Validity
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Campaign Title in bold amber
        ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 2;
        ctx.fillStyle = '#fbbf24';
        ctx.font = `900 ${Math.round(height * 0.040)}px 'Montserrat', sans-serif`;
        const centerTitle = (campaign.campaignTitle || 'FESTIVAL DE OFERTAS PLAY COMUNIQUE').toUpperCase();
        ctx.fillText(centerTitle, width * 0.52, height * 0.048);

        // Validity line with calendar icon
        ctx.shadowBlur = 4;
        ctx.fillStyle = '#f3f4f6';
        ctx.font = `600 ${Math.round(height * 0.019)}px sans-serif`;
        const validityText = `📅 ${campaign.validityText || 'Ofertas válidas de 10 a 22/09/2026 ou enquanto durarem os estoques'}`;
        ctx.fillText(validityText, width * 0.52, height * 0.088);
        ctx.restore();

        // 5. RIGHT COLUMN: 4:3 Showcase Photo Frame with thick white border & Rotating OFERTAÇO
        const cardW = width * 0.44;
        const cardH = cardW * 0.75; // 4:3 aspect ratio
        const cardX = width * 0.51;
        const cardY = height * 0.16;

        // Card Drop Shadow
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
        ctx.shadowBlur = 35;
        ctx.shadowOffsetY = 20;
        ctx.fillStyle = '#0a0a0a';
        drawRoundRect(cardX, cardY, cardW, cardH, 24);
        ctx.fill();
        ctx.restore();

        // Card Content (Product image with subtle Ken Burns zoom)
        ctx.save();
        drawRoundRect(cardX, cardY, cardW, cardH, 24);
        ctx.clip();

        if (currentProductImg) {
          const zoom = 1.0 + Math.sin(t * 0.9) * 0.025;
          const zW = cardW * zoom;
          const zH = cardH * zoom;
          const zX = cardX - (zW - cardW) / 2;
          const zY = cardY - (zH - cardH) / 2;
          ctx.drawImage(currentProductImg, zX, zY, zW, zH);
        } else {
          // Placeholder
          ctx.fillStyle = '#171717';
          ctx.fillRect(cardX, cardY, cardW, cardH);
          ctx.fillStyle = '#666666';
          ctx.font = 'bold 24px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('FOTO DO PRODUTO', cardX + cardW / 2, cardY + cardH / 2);
        }
        ctx.restore();

        // Crisp White Border (4.5px) matching web
        ctx.save();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4.5;
        drawRoundRect(cardX, cardY, cardW, cardH, 24);
        ctx.stroke();
        ctx.restore();

        // Rotating "OFERTAÇO -%" Circular Stamp in top-right corner
        const origPriceNum = currentProduct.originalPrice 
          ? parseFloat(currentProduct.originalPrice.replace('R$', '').replace(',', '.').trim()) 
          : 0;
        const currPriceNum = parseFloat((currentProduct.price || '0').replace('R$', '').replace(',', '.').trim());
        let discountPct = 0;
        if (origPriceNum > currPriceNum && origPriceNum > 0) {
          discountPct = Math.round(((origPriceNum - currPriceNum) / origPriceNum) * 100);
        }

        const stampR = 48;
        const stampCx = cardX + cardW - 12;
        const stampCy = cardY + 12;
        const stampAngle = Math.sin(t * 2) * 0.07; // subtle smooth oscillation

        ctx.save();
        ctx.translate(stampCx, stampCy);
        ctx.rotate(stampAngle);

        // Stamp gradient
        const stampGrad = ctx.createLinearGradient(-stampR, -stampR, stampR, stampR);
        stampGrad.addColorStop(0, '#ea580c');
        stampGrad.addColorStop(1, '#f97316');

        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 15;
        ctx.fillStyle = stampGrad;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(0, 0, stampR, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '900 13px sans-serif';
        ctx.fillText('OFERTAÇO', 0, -12);
        ctx.font = '900 24px sans-serif';
        ctx.fillText(discountPct > 0 ? `-${discountPct}%` : 'OFERTA', 0, 13);
        ctx.restore();

        // 6. LEFT COLUMN: Product Details & Supermarket Orange Price Tag
        const leftX = width * 0.045;
        const leftMaxW = width * 0.44;

        // Title com respiro ampliado do topo (exatamente como no v-38 aprovado)
        const titleTopY = height * 0.23;
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#ffffff';
        ctx.font = `900 ${Math.round(height * 0.048)}px 'Montserrat', sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        // Word wrap title to max 2 lines
        const words = (currentProduct.title || 'Produto de Oferta').split(' ');
        let line1 = '';
        let line2 = '';
        for (const w of words) {
          const testLine = (line1 ? line1 + ' ' : '') + w;
          if (ctx.measureText(testLine).width < leftMaxW && !line2) {
            line1 = testLine;
          } else {
            line2 = (line2 ? line2 + ' ' : '') + w;
          }
        }
        ctx.fillText(line1, leftX, titleTopY);
        if (line2) {
          ctx.fillText(line2, leftX, titleTopY + height * 0.056);
        }
        ctx.restore();

        // Promotional Badge (e.g. "PREÇO BAIXO" / "OFERTA DO DIA")
        const badgeY = titleTopY + (line2 ? height * 0.125 : height * 0.075);
        ctx.save();
        const badgeText = (currentProduct.badge || 'OFERTA DO DIA').toUpperCase();
        ctx.font = `800 15px sans-serif`;
        const badgeTextW = ctx.measureText(badgeText).width;
        const bW = badgeTextW + 30;
        const bH = 34;

        ctx.fillStyle = '#3e684d';
        ctx.strokeStyle = '#528d69';
        ctx.lineWidth = 1.5;
        drawRoundRect(leftX, badgeY, bW, bH, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#cbf4d8';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(badgeText, leftX + bW / 2, badgeY + bH / 2);
        ctx.restore();

        // Fixed alignment of the price box with the bottom of the photo card!
        const cardBottomY = cardY + cardH;
        const priceBoxH = 145;
        const priceBoxW = 295;
        const priceBoxY = cardBottomY - priceBoxH; // Base aligned with base of image card!

        // Regular Price ("De: R$ 10,99") positioned just above the orange box
        if (currentProduct.originalPrice) {
          ctx.save();
          ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
          ctx.shadowBlur = 6;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.font = '700 20px sans-serif';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'bottom';
          ctx.fillText(`De: R$ ${currentProduct.originalPrice.replace('R$', '').trim()}`, leftX, priceBoxY - 8);
          ctx.restore();
        }

        // Orange Supermarket Price Box
        ctx.save();
        const pGrad = ctx.createLinearGradient(leftX, priceBoxY, leftX, priceBoxY + priceBoxH);
        pGrad.addColorStop(0, '#f97316');
        pGrad.addColorStop(0.5, '#ea580c');
        pGrad.addColorStop(1, '#c2410c');

        ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
        ctx.shadowBlur = 28;
        ctx.shadowOffsetY = 16;
        ctx.fillStyle = pGrad;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 2.5;
        drawRoundRect(leftX, priceBoxY, priceBoxW, priceBoxH, 18);
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
        ctx.font = '900 13px sans-serif';
        ctx.fillText('POR', leftX + 18, priceBoxY + 34);
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 19px sans-serif';
        ctx.fillText('R$', leftX + 18, priceBoxY + 56);

        // Giant Integer Price (Montserrat 900)
        ctx.font = '900 100px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(intPrice, leftX + 62, priceBoxY + priceBoxH - 24);

        // Cents and Unit
        const intWidth = ctx.measureText(intPrice).width;
        const rightPartX = leftX + 68 + intWidth;
        ctx.font = '900 38px sans-serif';
        ctx.fillText(`,${centsPrice}`, rightPartX, priceBoxY + 58);

        ctx.font = '900 16px sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.fillText(unit.toUpperCase(), rightPartX + 2, priceBoxY + 84);
        ctx.restore();

        // 7. BOTTOM FOOTER: Two-tier Ticker & Legal Bar
        const tickerTierH = height * 0.065;
        const legalTierH = height * 0.035;
        const footerTotalH = tickerTierH + legalTierH;
        const footerTopY = height - footerTotalH;

        // Footer background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
        ctx.fillRect(0, footerTopY, width, footerTotalH);

        // Top divider
        ctx.fillStyle = '#262626';
        ctx.fillRect(0, footerTopY, width, 1.5);

        // Red INFORME button
        const infBtnW = 120;
        const infBtnH = tickerTierH * 0.65;
        const infBtnX = width * 0.035;
        const infBtnY = footerTopY + (tickerTierH - infBtnH) / 2;

        ctx.fillStyle = '#d90429';
        drawRoundRect(infBtnX, infBtnY, infBtnW, infBtnH, 6);
        ctx.fill();

        // Pulsing speaker icon
        const pulse = 1.0 + Math.sin(t * 6) * 0.12;
        ctx.save();
        ctx.translate(infBtnX + 18, infBtnY + infBtnH / 2);
        ctx.scale(pulse, pulse);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(-6, -4);
        ctx.lineTo(-2, -4);
        ctx.lineTo(3, -8);
        ctx.lineTo(3, 8);
        ctx.lineTo(-2, 4);
        ctx.lineTo(-6, 4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 13px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('INFORME', infBtnX + 34, infBtnY + infBtnH / 2);

        // Moving Marquee Text with Yellow Stars
        ctx.save();
        const marqueeClipX = infBtnX + infBtnW + 18;
        const marqueeClipW = width - marqueeClipX - 20;
        ctx.beginPath();
        ctx.rect(marqueeClipX, footerTopY, marqueeClipW, tickerTierH);
        ctx.clip();

        ctx.font = '900 16px sans-serif';
        const fullMarqueeString = `${tickerText}   •   ${tickerText}`;
        const marqueeTextMetrics = ctx.measureText(fullMarqueeString);
        const marqueeSpeedPx = 95; // pixels per second
        const textLoopWidth = marqueeTextMetrics.width / 2;
        const marqueeShift = (t * marqueeSpeedPx) % textLoopWidth;

        ctx.fillStyle = '#f5f5f5';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(fullMarqueeString, marqueeClipX - marqueeShift, footerTopY + tickerTierH / 2);
        ctx.restore();

        // Sub-Footer Legal Notice Bar
        const subFooterY = footerTopY + tickerTierH;
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, subFooterY, width, legalTierH);

        ctx.fillStyle = '#171717';
        ctx.fillRect(0, subFooterY, width, 1);

        ctx.fillStyle = '#a3a3a3';
        ctx.font = '500 12px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          campaign.legalNotice || 'Imagens meramente ilustrativas. Proibida a venda de bebidas alcoólicas a menores de 18 anos.',
          width * 0.035,
          subFooterY + legalTierH / 2
        );

        ctx.fillStyle = '#d4d4d4';
        ctx.font = '700 12px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(
          campaign.footerBrandText || 'Desenvolvido por: playcomunique.com.br',
          width * 0.965,
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
        const ext = isMp4 ? 'mp4' : 'mp4'; // Saved as .mp4 for universal TV & WhatsApp compatibility
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
