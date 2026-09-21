// Utility to capture canvas / DOM elements and record dynamic animated MP4/WebM video or download PNG
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

/**
 * Captures a 100% faithful high-resolution image of a DOM element using html-to-image
 * Does not force canvasWidth/Height so html-to-image preserves exact layout proportions
 */
async function captureDomElementImage(el: HTMLElement): Promise<HTMLImageElement> {
  const dataUrl = await toPng(el, {
    quality: 0.98,
    pixelRatio: 2, // 2x Retina crispness
    cacheBust: true,
    filter: (node) => {
      // Exclude hover edit bars/buttons so the video is 100% clean broadcast art
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
 * High-End Broadcast Motion Graphics Recording Engine.
 * Takes 100% faithful DOM snapshots and animates them with:
 * 1. Punchy Commercial Intro Zoom (scale 1.07 -> 1.00 with ease-out cubic)
 * 2. Metallic Light Flare / Sheen Sweep across the banner and price tag every 2.4s
 * 3. Dynamic Live Scrolling Marquee Ticker at the bottom at 30 FPS
 * 4. Diamond Sparkle Glints rotating over the price tag and discount badges
 * 5. Continuous Broadcast Living Breathing Camera Float
 * 6. Smooth Commercial Transitions with wipes/crossfades between products
 */
async function recordSnapshotsToVideo(
  campaign: BannerCampaign,
  snapshots: HTMLImageElement[],
  canvasWidth: number,
  canvasHeight: number,
  totalDurationSec: number,
  perProductSec: number,
  filename: string,
  onProgress?: (progress: number) => void
): Promise<VideoExportResult> {
  return new Promise(async (resolve, reject) => {
    try {
      if (!snapshots || snapshots.length === 0) {
        throw new Error('Nenhum quadro capturado para gravação do vídeo.');
      }

      // Ensure fonts are ready
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

      // Draw initial frame
      ctx.drawImage(snapshots[0], 0, 0, canvasWidth, canvasHeight);

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
        const t = elapsedMs / 1000;

        if (onProgress) {
          // Progress smoothly advances from 25% to 96%
          onProgress(Math.round(25 + progressRatio * 71));
        }

        // Active snapshot
        const currentIdx = Math.min(
          snapshots.length - 1,
          Math.floor(elapsedMs / (perProductSec * 1000))
        );
        const currentSnap = snapshots[currentIdx];

        // Slide timing
        const timeInSlideMs = elapsedMs % (perProductSec * 1000);
        const slideT = timeInSlideMs / 1000;
        const transitionDurationMs = 700;
        const transitionStartMs = perProductSec * 1000 - transitionDurationMs;
        const isTransitioning = snapshots.length > 1 && timeInSlideMs >= transitionStartMs;
        const nextIdx = (currentIdx + 1) % snapshots.length;
        const nextSnap = snapshots[nextIdx];

        // 1. DYNAMIC ENTRANCE REVEAL + COMMERCIAL LIVING CAMERA MOTION
        let scale = 1.0;
        let alpha = 1.0;
        if (slideT < 0.8) {
          const p = slideT / 0.8;
          const ease = 1 - Math.pow(1 - p, 3); // ease-out cubic
          scale = 1.065 - 0.065 * ease; // Starts 6.5% larger with punchy snap in
          alpha = 0.5 + 0.5 * ease;
        } else {
          // Subtle commercial living breathing camera float (1.0% wave)
          scale = 1.0 + Math.sin(slideT * 1.6) * 0.010;
        }

        const zW = canvasWidth * scale;
        const zH = canvasHeight * scale;
        const zX = (canvasWidth - zW) / 2;
        const zY = (canvasHeight - zH) / 2;

        // Clear canvas
        ctx.fillStyle = '#06331e';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Draw active 100% faithful product snapshot with animated scale
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.drawImage(currentSnap, zX, zY, zW, zH);

        // Smooth crossfade to next product if transitioning
        if (isTransitioning && nextSnap) {
          const fadeProgress = (timeInSlideMs - transitionStartMs) / transitionDurationMs;
          const nextScale = 1.05 - 0.05 * fadeProgress;
          const nW = canvasWidth * nextScale;
          const nH = canvasHeight * nextScale;
          const nX = (canvasWidth - nW) / 2;
          const nY = (canvasHeight - nH) / 2;

          ctx.globalAlpha = Math.min(1, Math.max(0, fadeProgress));
          ctx.drawImage(nextSnap, nX, nY, nW, nH);
        }
        ctx.restore();

        // 2. METALLIC LIGHT FLARE / SHEEN SWEEP (Brilho Comercial em 45 Graus)
        const sheenCycle = 2.5;
        const sheenTime = slideT % sheenCycle;
        if (sheenTime >= 0.5 && sheenTime <= 1.5) {
          const sweepProgress = (sheenTime - 0.5) / 1.0; // 0 to 1
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
        }

        // 3. DIAMOND SPARKLE GLINTS (Brilho Cintilante sobre o Preço e o Selo de Oferta)
        if (sheenTime >= 0.8 && sheenTime <= 1.4) {
          const sparkleProgress = (sheenTime - 0.8) / 0.6;
          const sparkleAlpha = Math.sin(sparkleProgress * Math.PI);
          const sparkleSize = 30 * Math.sin(sparkleProgress * Math.PI);
          const sparkleRot = sparkleProgress * Math.PI * 0.75;

          // Glint on price box
          const pX = Math.round(canvasWidth * (isVertical ? 0.45 : 0.35));
          const pY = Math.round(canvasHeight * (isVertical ? 0.70 : 0.78));
          drawCommercialSparkle(ctx, pX, pY, sparkleSize, sparkleRot, sparkleAlpha);

          // Glint on promotional discount badge
          const bX = Math.round(canvasWidth * (isVertical ? 0.82 : 0.88));
          const bY = Math.round(canvasHeight * (isVertical ? 0.30 : 0.25));
          drawCommercialSparkle(ctx, bX, bY, sparkleSize * 0.85, -sparkleRot, sparkleAlpha);
        }

        // 4. LIVE ANIMATED SCROLLING MARQUEE TICKER (Letreiro Dinâmico em Tempo Real)
        if (campaign.showMarqueeTicker !== false) {
          // A) Black Ticker Background Bar
          ctx.fillStyle = '#050505';
          ctx.fillRect(0, tickerTop, canvasWidth, tickerH);

          // Top hairline separator
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

          // Legal text
          ctx.fillStyle = '#9ca3af';
          ctx.textAlign = 'left';
          const legal = campaign.legalNotice || 'Imagens meramente ilustrativas. Proibida a venda de bebidas alcoólicas a menores de 18 anos.';
          ctx.fillText(legal, padX, subY);

          // Brand signature
          ctx.fillStyle = '#d1d5db';
          ctx.textAlign = 'right';
          const brand = campaign.footerBrandText !== undefined && campaign.footerBrandText !== ''
            ? campaign.footerBrandText
            : 'Desenvolvido por: playcomunique.com.br';
          ctx.fillText(brand, canvasWidth - padX, subY);
        }

        // Check completion
        if (currentFrame >= totalFrames) {
          isFinished = true;
          clearInterval(recordTimer);

          if (onProgress) {
            onProgress(98);
          }

          // Safe buffer drain before stopping
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
 * Duration: 6.0 seconds (optimal for WhatsApp Status, Instagram Reels/Stories, and TV promos).
 * Includes punchy commercial zoom intro, metallic light sheen, diamond sparkles, and live scrolling marquee.
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
    await new Promise((r) => setTimeout(r, 380));
  } else {
    await new Promise((r) => setTimeout(r, 100));
  }

  const bannerEl = document.getElementById('tv-banner-capture');
  if (!bannerEl) {
    if (onSelectProductIndex) onSelectProductIndex(originalIndex);
    throw new Error('Elemento do banner (#tv-banner-capture) não encontrado.');
  }

  if (onProgress) onProgress(15);

  // 2. Capture snapshot of this single product banner
  const snap = await captureDomElementImage(bannerEl);

  if (onProgress) onProgress(25);

  // Restore original product selection if different
  if (onSelectProductIndex && originalIndex !== productIndex) {
    onSelectProductIndex(originalIndex);
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

  const prod = campaign.products[productIndex];
  const cleanTitle = (prod?.title || `produto-${productIndex + 1}`)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .slice(0, 25);

  const filename = `banner-animado-${cleanTitle}-${Date.now()}.mp4`;

  // 3. Record dynamic video of this single banner with broadcast motion graphics
  return recordSnapshotsToVideo(
    campaign,
    [snap],
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
 * Features a full TV commercial duration (15+ seconds) so the video is complete and does not cut short.
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

  // Filter only active (non-hidden) products for the commercial video rotation
  const allProducts = campaign.products && campaign.products.length > 0 ? campaign.products : [];
  const visibleIndices = allProducts
    .map((p, idx) => (!p.hidden ? idx : -1))
    .filter((idx) => idx !== -1);
  const targetIndices = visibleIndices.length > 0 ? visibleIndices : (allProducts.length > 0 ? [0] : [0]);
  const totalProducts = targetIndices.length;
  const originalIndex = campaign.activeProductIndex || 0;

  // 1. STANDARD BROADCAST DIMENSIONS (strictly even numbers to ensure 100% video encoder compatibility)
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

  // 2. CAPTURE DOM SNAPSHOTS: 100% exact copy of each visible product in the campaign
  const snapshots: HTMLImageElement[] = [];

  for (let i = 0; i < totalProducts; i++) {
    const prodIndex = targetIndices[i];
    if (onProgress) {
      onProgress(Math.round(5 + (i / totalProducts) * 20));
    }

    // If multi-product, switch index and wait for React & animations to settle
    if (onSelectProductIndex && totalProducts > 1) {
      onSelectProductIndex(prodIndex);
      await new Promise((r) => setTimeout(r, 450));
    } else {
      await new Promise((r) => setTimeout(r, 80));
    }

    const currentEl = document.getElementById('tv-banner-capture') || bannerEl;
    const img = await captureDomElementImage(currentEl);
    snapshots.push(img);
  }

  // Restore active product index in editor
  if (onSelectProductIndex && totalProducts > 1) {
    onSelectProductIndex(originalIndex);
  }

  if (snapshots.length === 0) {
    throw new Error('Falha ao capturar quadros do banner.');
  }

  // 3. BROADCAST DURATION: Minimum 15.0 seconds complete TV commercial loop
  let perProductSec = 6.0;
  if (totalProducts === 1) {
    perProductSec = 15.0; // 15 seconds full TV ad
  } else if (totalProducts === 2) {
    perProductSec = 8.0; // 16s total
  } else if (totalProducts === 3) {
    perProductSec = 6.0; // 18s total
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

  // 4. Record using unified broadcast motion graphics engine
  return recordSnapshotsToVideo(
    campaign,
    snapshots,
    canvasWidth,
    canvasHeight,
    totalDurationSec,
    perProductSec,
    filename,
    onProgress
  );
}
