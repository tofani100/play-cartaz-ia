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
  leftSnap: HTMLImageElement | null;
  leftBox: ElementBox | null;
  cardSnap: HTMLImageElement | null;
  cardBox: ElementBox | null;
}

/**
 * Captures a crisp image of a DOM element using html-to-image with dynamic Super-Sampling
 * Guarantees at least 1920px (or minTargetWidth) resolution so downsampling in 1080p canvas is razor-sharp.
 */
async function captureDomElementImage(el: HTMLElement, minTargetWidth: number = 1920): Promise<HTMLImageElement> {
  const rect = el.getBoundingClientRect();
  const calculatedRatio = rect.width > 0 ? (minTargetWidth / rect.width) : 2.5;
  const pixelRatio = Math.max(2.5, Math.min(4.0, calculatedRatio));

  const dataUrl = await toPng(el, {
    quality: 1.0,
    pixelRatio,
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
 * Captures the banner into clean broadcast layers with 100% fidelity to the base original:
 * 1. Left Column (Tag + Title + Regular Price + Orange Supermarket Price Box) - intact, never separated or lost
 * 2. Framed Product Card (5px White Border + Photo + Discount Stamp Badge) - intact, never missing stamp
 * 3. Clean Background Artboard (Header, Client Logo, Wallpaper Texture, and Single Clean Footer)
 */
async function captureProductSlideLayers(
  bannerEl: HTMLElement,
  canvasW: number,
  canvasH: number
): Promise<ProductSlideLayers> {
  const centerContentEl = document.getElementById('tv-banner-center-content');
  const leftColEl = document.getElementById('tv-anim-left-column');
  const cardEl = document.getElementById('tv-anim-product-card');

  let leftSnap: HTMLImageElement | null = null;
  let leftBox: ElementBox | null = null;
  if (leftColEl) {
    try {
      leftBox = getRelativeBox(leftColEl, bannerEl, canvasW, canvasH);
      leftSnap = await captureDomElementImage(leftColEl, canvasW);
    } catch (e) {
      console.warn('Falha ao capturar left column isolada:', e);
    }
  }

  let cardSnap: HTMLImageElement | null = null;
  let cardBox: ElementBox | null = null;
  if (cardEl) {
    try {
      // The discount stamp stays attached to the card so it is 100% visible and perfectly aligned!
      cardBox = getRelativeBox(cardEl, bannerEl, canvasW, canvasH);
      cardSnap = await captureDomElementImage(cardEl, canvasW);
    } catch (e) {
      console.warn('Falha ao capturar card isolado:', e);
    }
  }

  // Hide the center container so bgSnap captures clean background artboard with header & footer
  if (centerContentEl) {
    centerContentEl.style.display = 'none';
  }

  let bgSnap: HTMLImageElement;
  try {
    bgSnap = await captureDomElementImage(bannerEl, canvasW);
  } finally {
    // Restore DOM immediately
    if (centerContentEl) {
      centerContentEl.style.display = '';
    }
  }

  return {
    bgSnap,
    leftSnap,
    leftBox,
    cardSnap,
    cardBox,
  };
}

/**
 * Damped harmonic spring physics for commercial broadcast motion
 * Natural acceleration, overshoot, and decay
 */
function springDamped(p: number, freq: number = 1.8, decay: number = 4.2): number {
  if (p >= 1) return 1;
  if (p <= 0) return 0;
  return 1 - Math.exp(-decay * p) * Math.cos(freq * Math.PI * p);
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
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

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
        videoBitsPerSecond: 16000000, // 16 Mbps broadcast master quality Full HD
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

        // ==========================================
        // 1.5 COMMERCIAL STAGE SPOTLIGHT (Behind Product Card)
        // ==========================================
        if (currentSlide.cardBox) {
          const spotX = currentSlide.cardBox.x + currentSlide.cardBox.w / 2;
          const spotY = currentSlide.cardBox.y + currentSlide.cardBox.h / 2;
          const spotR = Math.max(currentSlide.cardBox.w, currentSlide.cardBox.h) * 0.95;
          ctx.save();
          ctx.globalCompositeOperation = 'screen';
          const spotGrad = ctx.createRadialGradient(spotX, spotY, 0, spotX, spotY, spotR);
          spotGrad.addColorStop(0, 'rgba(255, 255, 255, 0.22)');
          spotGrad.addColorStop(0.35, 'rgba(254, 240, 138, 0.12)');
          spotGrad.addColorStop(0.65, 'rgba(34, 197, 94, 0.05)');
          spotGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = spotGrad;
          ctx.fillRect(0, 0, canvasWidth, canvasHeight);
          ctx.restore();
        }

        // ==========================================
        // 2. ELEMENT: OFFER COLUMN (Tag + Title + Regular Price + Orange Supermarket Price Box)
        // Kinetic slide from left with damped spring bounce
        // ==========================================
        if (currentSlide.leftSnap && currentSlide.leftBox) {
          let lAlpha = slideExitAlpha;
          let lOffsetX = 0;
          let lScale = 1.0;

          if (slideT < 0.12) {
            lAlpha = 0;
          } else if (slideT < 0.60) {
            const p = (slideT - 0.12) / 0.48;
            const spring = springDamped(p, 1.6, 3.8);
            lAlpha = Math.min(1, p * 3) * slideExitAlpha;
            lOffsetX = -150 * (1 - spring);
            lScale = 0.90 + 0.10 * spring;
          }

          ctx.save();
          ctx.globalAlpha = Math.max(0, Math.min(1, lAlpha));
          const lCx = currentSlide.leftBox.x + lOffsetX + currentSlide.leftBox.w / 2;
          const lCy = currentSlide.leftBox.y + currentSlide.leftBox.h / 2;
          ctx.translate(lCx, lCy);
          ctx.scale(lScale, lScale);
          ctx.drawImage(
            currentSlide.leftSnap,
            -currentSlide.leftBox.w / 2,
            -currentSlide.leftBox.h / 2,
            currentSlide.leftBox.w,
            currentSlide.leftBox.h
          );
          ctx.restore();
        }

        // ==========================================
        // 3. ELEMENT: PRODUCT SHOWCASE CARD (White Border + Photo + Discount Stamp)
        // Swoop from right with momentum and gentle 3D hover
        // ==========================================
        let cFloatY = 0;
        if (currentSlide.cardSnap && currentSlide.cardBox) {
          let cAlpha = slideExitAlpha;
          let cOffsetX = 0;
          let cScale = 1.0;
          let cRot = 0;

          if (slideT < 0.06) {
            cAlpha = 0;
          } else if (slideT < 0.64) {
            const p = (slideT - 0.06) / 0.58;
            const spring = springDamped(p, 1.8, 4.0);
            cAlpha = Math.min(1, p * 4) * slideExitAlpha;
            cOffsetX = 180 * (1 - spring);
            cScale = 0.80 + 0.20 * spring;
            cRot = -0.04 * (1 - spring);
          } else {
            // Gentle living 3D levitation
            cFloatY = Math.sin((slideT - 0.64) * 2.2) * 6;
            cRot = Math.sin((slideT - 0.64) * 1.5) * 0.006;
          }

          ctx.save();
          ctx.globalAlpha = Math.max(0, Math.min(1, cAlpha));
          const cCx = currentSlide.cardBox.x + cOffsetX + currentSlide.cardBox.w / 2;
          const cCy = currentSlide.cardBox.y + cFloatY + currentSlide.cardBox.h / 2;
          ctx.translate(cCx, cCy);
          ctx.rotate(cRot);
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
        // 4. TRANSITION TO NEXT SLIDE (Broadcast Push / Flash)
        // ==========================================
        if (isTransitioning && nextSlide) {
          const fadeP = (timeInSlideMs - transitionStartMs) / transitionDurationMs;
          const easeP = easeOutCubic(fadeP);

          ctx.save();
          ctx.globalAlpha = fadeP;
          ctx.drawImage(nextSlide.bgSnap, 0, 0, canvasWidth, canvasHeight);

          if (nextSlide.leftSnap && nextSlide.leftBox) {
            const nextLeftOffsetX = (1 - easeP) * -160;
            ctx.drawImage(
              nextSlide.leftSnap,
              nextSlide.leftBox.x + nextLeftOffsetX,
              nextSlide.leftBox.y,
              nextSlide.leftBox.w,
              nextSlide.leftBox.h
            );
          }
          if (nextSlide.cardSnap && nextSlide.cardBox) {
            const nextCardOffsetX = (1 - easeP) * 200;
            ctx.drawImage(
              nextSlide.cardSnap,
              nextSlide.cardBox.x + nextCardOffsetX,
              nextSlide.cardBox.y,
              nextSlide.cardBox.w,
              nextSlide.cardBox.h
            );
          }
          ctx.restore();

          // Broadcast transition soft light wash
          const flash = Math.sin(fadeP * Math.PI);
          if (flash > 0.05) {
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            ctx.fillStyle = `rgba(255, 255, 255, ${flash * 0.28})`;
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            ctx.restore();
          }
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
