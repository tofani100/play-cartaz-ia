// Utility to capture canvas / DOM elements and record dynamic animated MP4/WebM video with individual element motion
import { BannerCampaign, ThemeColors } from '../tiposGeradorBanner';
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
      filter: (node) => {
        if (node instanceof HTMLElement && node.classList.contains('group-hover:opacity-100')) {
          return false;
        }
        return true;
      },
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

interface ElementBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface ProductSlideLayers {
  bgSnap: HTMLImageElement;
  titleSnap: HTMLImageElement | null;
  titleBox: ElementBox | null;
  cardSnap: HTMLImageElement | null;
  cardBox: ElementBox | null;
  priceSnap: HTMLImageElement | null;
  priceBox: ElementBox | null;
  stampSnap: HTMLImageElement | null;
  stampBox: ElementBox | null;
}

/**
 * Captures a crisp image of a DOM element using html-to-image
 */
async function captureDomElementImage(el: HTMLElement): Promise<HTMLImageElement> {
  const dataUrl = await toPng(el, {
    quality: 0.98,
    pixelRatio: 2, // 2x Retina crispness
    cacheBust: true,
    filter: (node) => {
      if (node instanceof HTMLElement) {
        if (node.classList.contains('group-hover:opacity-100')) return false;
        if (node.id && node.id.startsWith('btn-')) return false;
      }
      return true;
    },
  });

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = dataUrl;
  });
}

/**
 * Maps element bounding client rect directly into the target broadcast canvas coordinate system
 */
function getRelativeBox(el: HTMLElement, container: HTMLElement, canvasW: number, canvasH: number): ElementBox {
  const eRect = el.getBoundingClientRect();
  const cRect = container.getBoundingClientRect();

  const scaleX = canvasW / cRect.width;
  const scaleY = canvasH / cRect.height;

  return {
    x: (eRect.left - cRect.left) * scaleX,
    y: (eRect.top - cRect.top) * scaleY,
    w: eRect.width * scaleX,
    h: eRect.height * scaleY,
  };
}

/**
 * Captures the banner separated into individual element layers:
 * 1. Product Title & Promotional Badge block
 * 2. Supermarket Price Tag box
 * 3. Product Image Card
 * 4. Discount Stamp Badge ("OFERTAÇO -XX%")
 * 5. Clean Background Artboard (with client logo, full title, and green texture)
 */
async function captureProductSlideLayers(
  bannerEl: HTMLElement,
  canvasW: number,
  canvasH: number
): Promise<ProductSlideLayers> {
  const titleEl = document.getElementById('tv-anim-title-block');
  const priceEl = document.getElementById('tv-anim-price-block');
  const cardEl = document.getElementById('tv-anim-product-card');
  const stampEl = document.getElementById('tv-anim-stamp-badge');

  let titleSnap: HTMLImageElement | null = null;
  let titleBox: ElementBox | null = null;
  if (titleEl) {
    try {
      titleBox = getRelativeBox(titleEl, bannerEl, canvasW, canvasH);
      titleSnap = await captureDomElementImage(titleEl);
    } catch (e) {
      console.warn('Falha ao capturar title block isolado:', e);
    }
  }

  let priceSnap: HTMLImageElement | null = null;
  let priceBox: ElementBox | null = null;
  if (priceEl) {
    try {
      priceBox = getRelativeBox(priceEl, bannerEl, canvasW, canvasH);
      priceSnap = await captureDomElementImage(priceEl);
    } catch (e) {
      console.warn('Falha ao capturar price block isolado:', e);
    }
  }

  let cardSnap: HTMLImageElement | null = null;
  let cardBox: ElementBox | null = null;
  if (cardEl) {
    try {
      const isStampInside = stampEl && cardEl.contains(stampEl);
      if (isStampInside && stampEl) stampEl.style.opacity = '0';
      cardBox = getRelativeBox(cardEl, bannerEl, canvasW, canvasH);
      cardSnap = await captureDomElementImage(cardEl);
      if (isStampInside && stampEl) stampEl.style.opacity = '';
    } catch (e) {
      console.warn('Falha ao capturar card isolado:', e);
    }
  }

  let stampSnap: HTMLImageElement | null = null;
  let stampBox: ElementBox | null = null;
  if (stampEl) {
    try {
      stampBox = getRelativeBox(stampEl, bannerEl, canvasW, canvasH);
      stampSnap = await captureDomElementImage(stampEl);
    } catch (e) {
      console.warn('Falha ao capturar stamp isolado:', e);
    }
  }

  // Hide foreground elements temporarily to capture pure background and header
  if (titleEl) titleEl.style.opacity = '0';
  if (priceEl) priceEl.style.opacity = '0';
  if (cardEl) cardEl.style.opacity = '0';
  if (stampEl) stampEl.style.opacity = '0';

  let bgSnap: HTMLImageElement;
  try {
    bgSnap = await captureDomElementImage(bannerEl);
  } finally {
    // Restore DOM immediately
    if (titleEl) titleEl.style.opacity = '';
    if (priceEl) priceEl.style.opacity = '';
    if (cardEl) cardEl.style.opacity = '';
    if (stampEl) stampEl.style.opacity = '';
  }

  return {
    bgSnap,
    titleSnap,
    titleBox,
    cardSnap,
    cardBox,
    priceSnap,
    priceBox,
    stampSnap,
    stampBox,
  };
}

/**
 * Standard cubic ease-out curve
 */
function easeOutCubic(x: number): number {
  return 1 - Math.pow(1 - x, 3);
}

/**
 * Elastic spring overshoot curve for commercial pop & bounce impacts
 */
function easeOutBack(x: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

/**
 * Helper to draw rounded rectangle in Canvas 2D
 */
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  if (typeof (ctx as any).roundRect === 'function') {
    (ctx as any).roundRect(x, y, w, h, r);
    return;
  }
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y + x, x + w, y, r);
  ctx.closePath();
}

/**
 * Draws a rotating 4-point diamond star sparkle with golden core
 */
function drawCommercialSparkle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  rotation: number,
  alpha: number
) {
  if (alpha <= 0.01 || size <= 0.5) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.globalAlpha = Math.min(1, Math.max(0, alpha));

  // 4-point diamond star
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.quadraticCurveTo(0, 0, size, 0);
  ctx.quadraticCurveTo(0, 0, 0, size);
  ctx.quadraticCurveTo(0, 0, -size, 0);
  ctx.quadraticCurveTo(0, 0, 0, -size);
  ctx.fill();

  // 4 subtle diagonal micro-rays
  const raySize = size * 0.45;
  ctx.rotate(Math.PI / 4);
  ctx.beginPath();
  ctx.moveTo(0, -raySize);
  ctx.quadraticCurveTo(0, 0, raySize, 0);
  ctx.quadraticCurveTo(0, 0, 0, raySize);
  ctx.quadraticCurveTo(0, 0, -raySize, 0);
  ctx.quadraticCurveTo(0, 0, 0, -raySize);
  ctx.fill();

  // Golden core
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.28, 0, Math.PI * 2);
  ctx.fillStyle = '#fef08a';
  ctx.fill();

  ctx.restore();
}

/**
 * True Layered Motion Graphics Video Recording Engine.
 * Animates each element INDEPENDENTLY with staggered keyframes:
 * 1. Product Title: slides in from the left (0.0s - 0.5s)
 * 2. Product Showcase Card: swoops in from the right with momentum and gentle 3D hover/float (0.12s - 0.70s)
 * 3. Supermarket Price Box: slams in with an elastic commercial spring bounce pop and pulses (0.35s - 0.85s)
 * 4. Discount Stamp: drops down from above like an official retail stamp and wobbles (0.55s - 0.90s)
 * 5. Marquee Ticker: continuous live scrolling at 160 px/sec across the bottom
 * 6. Metallic Light Flare / Sheen Sweep: sweeps across the card at 1.5s and 3.8s
 */
async function recordLayeredSlidesToVideo(
  campaign: BannerCampaign,
  slides: ProductSlideLayers[],
  canvasWidth: number,
  canvasHeight: number,
  totalDurationSec: number,
  perProductSec: number,
  filename: string,
  onProgress?: (progress: number) => void
): Promise<VideoExportResult> {
  return new Promise(async (resolve, reject) => {
    try {
      if (!slides || slides.length === 0) {
        throw new Error('Nenhum slide capturado para gravação.');
      }

      try {
        if (typeof document !== 'undefined' && document.fonts) {
          await document.fonts.ready;
        }
      } catch {}

      const canvas = document.createElement('canvas');
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) {
        throw new Error('Não foi possível inicializar contexto 2D para gravação de vídeo.');
      }

      // Draw initial background
      ctx.drawImage(slides[0].bgSnap, 0, 0, canvasWidth, canvasHeight);

      const stream = canvas.captureStream(30); // 30 FPS broadcast quality
      const mimeTypes = [
        'video/mp4;codecs=avc1.42E01E',
        'video/mp4;codecs=avc1.4d002a',
        'video/mp4;codecs=h264',
        'video/mp4',
        'video/webm;codecs=h264',
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
        videoBitsPerSecond: 8000000, // 8 Mbps high bitrate Full HD
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

      const FPS = 30;
      const frameDurationMs = 1000 / FPS;
      const totalFrames = Math.round(totalDurationSec * FPS);
      let currentFrame = 0;
      let isFinished = false;

      // Layout constants for live animated ticker
      const isVertical = canvasHeight > canvasWidth;
      const footerTotalH = Math.round(canvasHeight * (isVertical ? 0.055 : 0.068));
      const subFooterH = Math.round(canvasHeight * (isVertical ? 0.020 : 0.024));
      const tickerH = footerTotalH - subFooterH;
      const tickerTop = canvasHeight - footerTotalH;
      const subFooterTop = tickerTop + tickerH;
      const padX = Math.round(canvasWidth * (isVertical ? 0.035 : 0.025));
      const badgeH = Math.round(tickerH * 0.70);
      const badgeY = tickerTop + Math.round((tickerH - badgeH) / 2);
      const badgeW = Math.round(canvasWidth * (isVertical ? 0.18 : 0.084));

      const tickerText = (campaign.tickerText || '★★ OFERTAS IMBATÍVEIS EM TODAS AS LOJAS. ★ NOSSO APLICATIVO É BOM DEMAIS! ★★ OFERTAS VÁLIDAS PARA TODAS AS FILIAIS DA BELÍSSIMA CASA DI FRUTAS ★ COMPRE PELO WHATSAPP ★ ACEITAMOS TODOS OS CARTÕES E PIX ★').trim();
      const fullTickerLoop = tickerText + '    ★    ';

      const recordTimer = setInterval(() => {
        if (isFinished) return;

        currentFrame++;
        const elapsedMs = currentFrame * frameDurationMs;
        const progressRatio = Math.min(1, currentFrame / totalFrames);

        if (onProgress) {
          onProgress(Math.round(25 + progressRatio * 71));
        }

        // Determine current slide
        const currentIdx = Math.min(
          slides.length - 1,
          Math.floor(elapsedMs / (perProductSec * 1000))
        );
        const currentSlide = slides[currentIdx];

        // Slide timing
        const timeInSlideMs = elapsedMs % (perProductSec * 1000);
        const slideT = timeInSlideMs / 1000;
        const transitionDurationMs = 700;
        const transitionStartMs = perProductSec * 1000 - transitionDurationMs;
        const isTransitioning = slides.length > 1 && timeInSlideMs >= transitionStartMs;
        const nextIdx = (currentIdx + 1) % slides.length;
        const nextSlide = slides[nextIdx];

        // Global slide fade (if transitioning between products)
        let slideExitAlpha = 1.0;
        if (isTransitioning) {
          const fadeP = (timeInSlideMs - transitionStartMs) / transitionDurationMs;
          slideExitAlpha = 1.0 - fadeP;
        }

        // ==========================================
        // 1. DRAW BACKGROUND & HEADER LAYER
        // ==========================================
        ctx.fillStyle = '#06331e';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        ctx.save();
        ctx.globalAlpha = 1.0;
        ctx.drawImage(currentSlide.bgSnap, 0, 0, canvasWidth, canvasHeight);
        ctx.restore();

        // If elements are not separated, draw entire fallback cleanly
        if (!currentSlide.titleBox || !currentSlide.cardBox || !currentSlide.priceBox) {
          ctx.save();
          ctx.globalAlpha = 1.0;
          ctx.drawImage(currentSlide.bgSnap, 0, 0, canvasWidth, canvasHeight);
          ctx.restore();
        } else {
          // ==========================================
          // 2. ELEMENT: PRODUCT TITLE & BADGE (Slide from Left)
          // ==========================================
          if (currentSlide.titleSnap && currentSlide.titleBox) {
            let tAlpha = slideExitAlpha;
            let tOffsetX = 0;
            if (slideT < 0.50) {
              const p = slideT / 0.50;
              const ease = easeOutCubic(p);
              tAlpha = ease * slideExitAlpha;
              tOffsetX = -130 * (1 - ease);
            }
            ctx.save();
            ctx.globalAlpha = Math.max(0, Math.min(1, tAlpha));
            ctx.drawImage(
              currentSlide.titleSnap,
              currentSlide.titleBox.x + tOffsetX,
              currentSlide.titleBox.y,
              currentSlide.titleBox.w,
              currentSlide.titleBox.h
            );
            ctx.restore();
          }

          // ==========================================
          // 3. ELEMENT: PRODUCT SHOWCASE CARD (Swoop from Right + Hover)
          // ==========================================
          let cFloatY = 0;
          if (currentSlide.cardSnap && currentSlide.cardBox) {
            let cAlpha = slideExitAlpha;
            let cOffsetX = 0;
            let cScale = 1.0;

            if (slideT < 0.12) {
              cAlpha = 0;
            } else if (slideT < 0.68) {
              const p = (slideT - 0.12) / 0.56;
              const ease = easeOutCubic(p);
              cAlpha = ease * slideExitAlpha;
              cOffsetX = 170 * (1 - ease);
              cScale = 0.84 + 0.16 * easeOutBack(p);
            } else {
              // Gentle living 3D hover
              cFloatY = Math.sin((slideT - 0.68) * 2.2) * 8;
            }

            ctx.save();
            ctx.globalAlpha = Math.max(0, Math.min(1, cAlpha));
            const cCx = currentSlide.cardBox.x + cOffsetX + currentSlide.cardBox.w / 2;
            const cCy = currentSlide.cardBox.y + cFloatY + currentSlide.cardBox.h / 2;
            ctx.translate(cCx, cCy);
            ctx.scale(cScale, cScale);
            ctx.drawImage(
              currentSlide.cardSnap,
              -currentSlide.cardBox.w / 2,
              -currentSlide.cardBox.h / 2,
              currentSlide.cardBox.w,
              currentSlide.cardBox.h
            );
            ctx.restore();
          }

          // ==========================================
          // 4. ELEMENT: SUPERMARKET ORANGE PRICE BOX (Spring Bounce Pop + Heartbeat)
          // ==========================================
          if (currentSlide.priceSnap && currentSlide.priceBox) {
            let pAlpha = slideExitAlpha;
            let pScale = 1.0;

            if (slideT < 0.35) {
              pAlpha = 0;
            } else if (slideT < 0.85) {
              const p = (slideT - 0.35) / 0.50;
              pAlpha = Math.min(1, p * 3) * slideExitAlpha;
              pScale = Math.max(0, easeOutBack(p));
            } else {
              // Commercial heartbeat pulse at 2.2s and 4.2s
              const pulse1 = Math.max(0, 1 - Math.abs(slideT - 2.2) / 0.35);
              const pulse2 = Math.max(0, 1 - Math.abs(slideT - 4.2) / 0.35);
              const pulse = Math.max(pulse1, pulse2);
              pScale = 1.0 + Math.sin(pulse * Math.PI) * 0.08;
            }

            ctx.save();
            ctx.globalAlpha = Math.max(0, Math.min(1, pAlpha));
            const pCx = currentSlide.priceBox.x + currentSlide.priceBox.w / 2;
            const pCy = currentSlide.priceBox.y + currentSlide.priceBox.h / 2;
            ctx.translate(pCx, pCy);
            ctx.scale(pScale, pScale);
            ctx.drawImage(
              currentSlide.priceSnap,
              -currentSlide.priceBox.w / 2,
              -currentSlide.priceBox.h / 2,
              currentSlide.priceBox.w,
              currentSlide.priceBox.h
            );
            ctx.restore();
          }

          // ==========================================
          // 5. ELEMENT: DISCOUNT STAMP BADGE ("OFERTAÇO -XX%") (Drop Down Stamp + Wobble)
          // ==========================================
          if (currentSlide.stampSnap && currentSlide.stampBox) {
            let sAlpha = slideExitAlpha;
            let sOffsetY = 0;
            let sRot = 0;
            let sScale = 1.0;

            if (slideT < 0.58) {
              sAlpha = 0;
            } else if (slideT < 0.92) {
              const p = (slideT - 0.58) / 0.34;
              const ease = easeOutBack(p);
              sAlpha = Math.min(1, p * 3) * slideExitAlpha;
              sOffsetY = -90 * (1 - easeOutCubic(p));
              sRot = -0.45 * (1 - easeOutCubic(p)); // -25 deg to 0
              sScale = 1.4 - 0.4 * ease;
            } else {
              // Dynamic tilt oscillation
              sRot = Math.sin((slideT - 0.92) * 3.5) * 0.10;
            }

            ctx.save();
            ctx.globalAlpha = Math.max(0, Math.min(1, sAlpha));
            const sCx = currentSlide.stampBox.x + currentSlide.stampBox.w / 2;
            const sCy = currentSlide.stampBox.y + sOffsetY + currentSlide.stampBox.h / 2 + cFloatY;
            ctx.translate(sCx, sCy);
            ctx.rotate(sRot);
            ctx.scale(sScale, sScale);
            ctx.drawImage(
              currentSlide.stampSnap,
              -currentSlide.stampBox.w / 2,
              -currentSlide.stampBox.h / 2,
              currentSlide.stampBox.w,
              currentSlide.stampBox.h
            );
            ctx.restore();
          }
        }

        // ==========================================
        // 6. METALLIC LIGHT SHEEN SWEEP (Across the Card)
        // ==========================================
        const sheenCycle = 2.5;
        const sheenTime = slideT % sheenCycle;
        if (sheenTime >= 0.5 && sheenTime <= 1.5) {
          const sweepProgress = (sheenTime - 0.5) / 1.0;
          const sweepX = -400 + (canvasWidth + 800) * sweepProgress;

          ctx.save();
          ctx.globalCompositeOperation = 'screen';
          const sheenGrad = ctx.createLinearGradient(sweepX - 220, 0, sweepX + 220, canvasHeight);
          sheenGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
          sheenGrad.addColorStop(0.35, 'rgba(255, 255, 255, 0.03)');
          sheenGrad.addColorStop(0.48, 'rgba(255, 255, 255, 0.28)');
          sheenGrad.addColorStop(0.50, 'rgba(255, 255, 255, 0.58)');
          sheenGrad.addColorStop(0.52, 'rgba(255, 255, 255, 0.28)');
          sheenGrad.addColorStop(0.65, 'rgba(255, 255, 255, 0.03)');
          sheenGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = sheenGrad;
          ctx.fillRect(0, 0, canvasWidth, canvasHeight);
          ctx.restore();

          // Diamond sparkle glints
          if (sheenTime >= 0.8 && sheenTime <= 1.4) {
            const sparkleProgress = (sheenTime - 0.8) / 0.6;
            const sparkleAlpha = Math.sin(sparkleProgress * Math.PI);
            const sparkleSize = 30 * Math.sin(sparkleProgress * Math.PI);
            const sparkleRot = sparkleProgress * Math.PI * 0.75;

            const pX = Math.round(canvasWidth * (isVertical ? 0.45 : 0.35));
            const pY = Math.round(canvasHeight * (isVertical ? 0.70 : 0.78));
            drawCommercialSparkle(ctx, pX, pY, sparkleSize, sparkleRot, sparkleAlpha);

            const bX = Math.round(canvasWidth * (isVertical ? 0.82 : 0.88));
            const bY = Math.round(canvasHeight * (isVertical ? 0.30 : 0.25));
            drawCommercialSparkle(ctx, bX, bY, sparkleSize * 0.85, -sparkleRot, sparkleAlpha);
          }
        }

        // ==========================================
        // 7. TRANSITION TO NEXT SLIDE (Multi-Product Mode)
        // ==========================================
        if (isTransitioning && nextSlide) {
          const fadeP = (timeInSlideMs - transitionStartMs) / transitionDurationMs;
          ctx.save();
          ctx.globalAlpha = fadeP;
          ctx.drawImage(nextSlide.bgSnap, 0, 0, canvasWidth, canvasHeight);
          ctx.restore();
        }

        // ==========================================
        // 8. LIVE ANIMATED SCROLLING MARQUEE TICKER (Ultra-Crisp Vector)
        // ==========================================
        if (campaign.showMarqueeTicker !== false) {
          // A) Black Ticker Background Bar
          ctx.fillStyle = '#050505';
          ctx.fillRect(0, tickerTop, canvasWidth, tickerH);

          ctx.strokeStyle = '#262626';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, tickerTop);
          ctx.lineTo(canvasWidth, tickerTop);
          ctx.stroke();

          // B) Red "INFORME" Pill
          ctx.fillStyle = '#d90429';
          roundRect(ctx, padX, badgeY, badgeW, badgeH, 6);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          const badgeFontSize = Math.round(badgeH * 0.48);
          ctx.font = `900 ${badgeFontSize}px "Plus Jakarta Sans", sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('📢 INFORME', padX + badgeW / 2, badgeY + badgeH / 2);

          // C) Scrolling Marquee Window
          const marqueeLeft = padX + badgeW + Math.round(canvasWidth * 0.015);
          const marqueeRight = canvasWidth - padX;
          const marqueeWidth = marqueeRight - marqueeLeft;

          ctx.save();
          ctx.beginPath();
          ctx.rect(marqueeLeft, tickerTop, marqueeWidth, tickerH);
          ctx.clip();

          const textFontSize = Math.round(tickerH * 0.42);
          ctx.font = `900 ${textFontSize}px "Plus Jakarta Sans", sans-serif`;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          const oneLoopW = ctx.measureText(fullTickerLoop).width || 800;

          // Scroll continuously at 160 px/sec
          const scrollSpeed = 160;
          const scrollPos = ((elapsedMs / 1000) * scrollSpeed) % oneLoopW;
          const textY = tickerTop + tickerH / 2;

          ctx.fillStyle = '#f3f4f6';
          let drawX = marqueeLeft - scrollPos;
          while (drawX < marqueeRight + oneLoopW) {
            ctx.fillText(fullTickerLoop, drawX, textY);
            drawX += oneLoopW;
          }
          ctx.restore();

          // D) Sub-Footer Legal Notice
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, subFooterTop, canvasWidth, subFooterH);
          ctx.strokeStyle = '#1a1a1a';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, subFooterTop);
          ctx.lineTo(canvasWidth, subFooterTop);
          ctx.stroke();

          const subFontSize = Math.round(subFooterH * 0.46);
          ctx.font = `600 ${subFontSize}px "Plus Jakarta Sans", sans-serif`;
          ctx.textBaseline = 'middle';
          const subY = subFooterTop + subFooterH / 2;

          ctx.fillStyle = '#9ca3af';
          ctx.textAlign = 'left';
          const legal = campaign.legalNotice || 'Imagens meramente ilustrativas. Proibida a venda de bebidas alcoólicas a menores de 18 anos.';
          ctx.fillText(legal, padX, subY);

          ctx.fillStyle = '#d1d5db';
          ctx.textAlign = 'right';
          const brand = campaign.footerBrandText !== undefined && campaign.footerBrandText !== ''
            ? campaign.footerBrandText
            : 'Desenvolvido por: playcomunique.com.br';
          ctx.fillText(brand, canvasWidth - padX, subY);
        }

        // ==========================================
        // 9. CHECK COMPLETION
        // ==========================================
        if (currentFrame >= totalFrames) {
          isFinished = true;
          clearInterval(recordTimer);

          if (onProgress) {
            onProgress(98);
          }

          setTimeout(() => {
            try {
              if (recorder.state === 'recording') {
                recorder.requestData();
              }
            } catch (e) {
              console.warn('requestData warning:', e);
            }

            setTimeout(() => {
              try {
                if (recorder.state === 'recording') {
                  recorder.stop();
                }
              } catch (e) {
                console.warn('recorder.stop warning:', e);
              }
            }, 250);
          }, 200);
        }
      }, frameDurationMs);

      // Handler when recording completes
      recorder.onstop = () => {
        if (onProgress) {
          onProgress(100);
        }

        const videoBlob = new Blob(chunks, { type: chosenMime });
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

      // Start recording
      recorder.start(200);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Generates an animated MP4 video specifically for an INDIVIDUAL PRODUCT (Single Banner).
 * Duration: 6.0 seconds.
 * Features true independent element motion:
 * - Product Title slides from left
 * - Product Image swoops from right and hovers in 3D
 * - Supermarket Price Box slams in with an elastic spring bounce and pulses
 * - Discount Stamp slams down from above and wobbles
 * - Marquee Ticker scrolls live at the bottom
 * - Metallic Light Flare sweeps across the card
 */
export async function gerarVideoAnimadoProdutoIndividual(
  campaign: BannerCampaign,
  _theme: ThemeColors,
  productIndex: number,
  slideDurationSec: number = 6.0,
  onProgress?: (progress: number) => void,
  onSelectProductIndex?: (index: number) => void
): Promise<VideoExportResult> {
  const originalIndex = campaign.activeProductIndex || 0;

  if (onProgress) onProgress(5);

  // 1. Switch active product in DOM if needed and wait for layout to render
  if (onSelectProductIndex) {
    onSelectProductIndex(productIndex);
    await new Promise((r) => setTimeout(r, 400));
  } else {
    await new Promise((r) => setTimeout(r, 120));
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

  // 2. Capture individual element layers
  const slideLayers = await captureProductSlideLayers(bannerEl, canvasWidth, canvasHeight);

  if (onProgress) onProgress(25);

  // Restore original product selection if different
  if (onSelectProductIndex && originalIndex !== productIndex) {
    onSelectProductIndex(originalIndex);
  }

  const prod = campaign.products[productIndex];
  const cleanTitle = (prod?.title || `produto-${productIndex + 1}`)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .slice(0, 25);

  const filename = `banner-animado-${cleanTitle}-${Date.now()}.mp4`;

  // 3. Record dynamic video with individual element motion graphics
  return recordLayeredSlidesToVideo(
    campaign,
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
 * Features full commercial duration (15+ seconds) with individual element motion on every slide.
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
    if (onProgress) {
      onProgress(Math.round(5 + (i / totalProducts) * 20));
    }

    if (onSelectProductIndex && totalProducts > 1) {
      onSelectProductIndex(prodIndex);
      await new Promise((r) => setTimeout(r, 450));
    } else {
      await new Promise((r) => setTimeout(r, 100));
    }

    const currentEl = document.getElementById('tv-banner-capture') || bannerEl;
    const slide = await captureProductSlideLayers(currentEl, canvasWidth, canvasHeight);
    slides.push(slide);
  }

  // Restore active product index in editor
  if (onSelectProductIndex && totalProducts > 1) {
    onSelectProductIndex(originalIndex);
  }

  if (slides.length === 0) {
    throw new Error('Falha ao capturar quadros do banner.');
  }

  // Duration
  let perProductSec = 6.0;
  if (totalProducts === 1) {
    perProductSec = 15.0;
  } else if (totalProducts === 2) {
    perProductSec = 8.0;
  } else if (totalProducts === 3) {
    perProductSec = 6.0;
  } else {
    perProductSec = Math.max(5.0, slideDurationSec);
  }

  const totalDurationSec = totalProducts * perProductSec;

  const cleanTitle = (campaign.campaignTitle || 'ofertas')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .slice(0, 25);
  const filename = `playcomunique-tv-${campaign.format || '16x9'}-${cleanTitle}-${Date.now()}.mp4`;

  // Record using layered motion graphics engine
  return recordLayeredSlidesToVideo(
    campaign,
    slides,
    canvasWidth,
    canvasHeight,
    totalDurationSec,
    perProductSec,
    filename,
    onProgress
  );
}
