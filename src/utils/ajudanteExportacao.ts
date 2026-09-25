// Utility to capture canvas / DOM elements and record dynamic animated MP4/WebM video with individual element motion
// Arquitetura de 7 Pilares de Alta Fidelidade (Base44.com) com Captura Única em Retina e Recorte por Camadas
import { BannerCampaign, ThemeColors } from '../tiposGeradorBanner';
import { toPng } from 'html-to-image';
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import html2canvas from 'html2canvas';

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
      cacheBust: false,
      filter: (node) => {
        if (node instanceof HTMLElement && (node.classList.contains('group-hover:opacity-100') || node.id === 'tv-card-toolbar')) {
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
 * Once an image is a Data URL, html2canvas and Canvas NEVER fail to render it.
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
 * Pilar 1 do Base44: Captura única do banner completo em escala 2x (retina).
 * Essa é a fonte de verdade absoluta — o que você vê no MP4 é exatamente o que o browser renderizou.
 */
async function captureFullBannerCanvas(el: HTMLElement, targetW: number, targetH: number): Promise<HTMLCanvasElement> {
  const rect = el.getBoundingClientRect();
  const scale = Math.max(2, targetW / (rect.width || 1));

  try {
    const canvas = await html2canvas(el, {
      scale,
      useCORS: true,
      allowTaint: false,
      backgroundColor: null,
      logging: false,
      width: el.offsetWidth,
      height: el.offsetHeight,
      ignoreElements: (node) => {
        if (node instanceof HTMLElement) {
          if (node.id === 'tv-card-toolbar' || node.classList.contains('group-hover:opacity-100')) {
            return true;
          }
          if (node.id && node.id.startsWith('btn-')) {
            return true;
          }
        }
        return false;
      },
    });

    if (canvas && canvas.width > 100 && canvas.height > 100) {
      return canvas;
    }
  } catch (err) {
    console.warn('html2canvas falhou na captura do banner, acionando fallback toPng:', err);
  }

  // Fallback de alta fidelidade com toPng (html-to-image)
  const dataUrl = await toPng(el, {
    quality: 1.0,
    pixelRatio: scale,
    cacheBust: false,
    filter: (node) => {
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
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.crossOrigin = 'anonymous';
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });

  const outCanvas = document.createElement('canvas');
  outCanvas.width = img.naturalWidth || targetW;
  outCanvas.height = img.naturalHeight || targetH;
  const outCtx = outCanvas.getContext('2d')!;
  outCtx.drawImage(img, 0, 0, outCanvas.width, outCanvas.height);
  return outCanvas;
}

/**
 * Pilar 2 do Base44: Recorte por camadas (layered crops) em resolução real.
 * A regra de ouro: cada crop é sempre recortado e desenhado em sua largura/altura real, nunca esticado.
 */
function cropFromCanvas(
  fullCanvas: HTMLCanvasElement,
  bannerEl: HTMLElement,
  element: HTMLElement,
  targetCanvasW: number,
  targetCanvasH: number
): { crop: HTMLCanvasElement; rect: ElementBox } | null {
  const bannerRect = bannerEl.getBoundingClientRect();
  const elRect = element.getBoundingClientRect();

  if (bannerRect.width <= 0 || bannerRect.height <= 0 || elRect.width <= 0 || elRect.height <= 0) {
    return null;
  }

  // Frações relativas (0.0 a 1.0) dentro do container do banner
  const rx = (elRect.left - bannerRect.left) / bannerRect.width;
  const ry = (elRect.top - bannerRect.top) / bannerRect.height;
  const rw = elRect.width / bannerRect.width;
  const rh = elRect.height / bannerRect.height;

  // Coordenadas em pixels na fonte de verdade (fullCanvas)
  const sx = Math.max(0, Math.round(rx * fullCanvas.width));
  const sy = Math.max(0, Math.round(ry * fullCanvas.height));
  const sw = Math.min(fullCanvas.width - sx, Math.round(rw * fullCanvas.width));
  const sh = Math.min(fullCanvas.height - sy, Math.round(rh * fullCanvas.height));

  if (sw <= 0 || sh <= 0) return null;

  // Caixa de destino no canvas final de saída (ex: 1920x1080)
  const destRect: ElementBox = {
    x: rx * targetCanvasW,
    y: ry * targetCanvasH,
    w: rw * targetCanvasW,
    h: rh * targetCanvasH,
  };

  const crop = document.createElement('canvas');
  crop.width = sw;
  crop.height = sh;
  const cropCtx = crop.getContext('2d');
  if (!cropCtx) return null;
  cropCtx.imageSmoothingEnabled = true;
  cropCtx.imageSmoothingQuality = 'high';

  cropCtx.drawImage(
    fullCanvas,
    sx,
    sy,
    sw,
    sh,
    0,
    0,
    crop.width,
    crop.height
  );

  return { crop, rect: destRect };
}

/**
 * Pilar 3 do Base44: Camada base limpa + crops dos elementos animados.
 * Garante que nada corte, nada deforme e que a segunda tag/selo e preço estejam 100% íntegros.
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

  const centerContentEl = document.getElementById('tv-banner-center-content');
  const titleBlockEl = document.getElementById('tv-anim-title-block');
  const priceBlockEl = document.getElementById('tv-anim-price-block');
  const cardEl = document.getElementById('tv-anim-product-card');

  // Garante opacidade 1 e visibilidade normal em todos os elementos
  [titleBlockEl, priceBlockEl, cardEl, centerContentEl].forEach((el) => {
    if (el) {
      el.style.opacity = '1';
      el.style.visibility = 'visible';
    }
  });

  await new Promise((r) => setTimeout(r, 60));

  // 1. Captura ÚNICA do banner completo (fonte da verdade)
  const fullCanvas = await captureFullBannerCanvas(bannerEl, canvasW, canvasH);

  // 2. Captura da camada base sem elementos centrais (fundo wallpaper, cabeçalho e rodapé limpos)
  let bgCanvas: HTMLCanvasElement;
  if (centerContentEl) {
    centerContentEl.style.setProperty('visibility', 'hidden', 'important');
    try {
      bgCanvas = await captureFullBannerCanvas(bannerEl, canvasW, canvasH);
    } finally {
      centerContentEl.style.removeProperty('visibility');
    }
  } else {
    bgCanvas = fullCanvas;
  }

  // 3. Recorte por camadas em resolução real direta (Pilar 2)
  let titleCrop: HTMLCanvasElement | null = null;
  let titleRect: ElementBox | null = null;
  if (titleBlockEl) {
    const res = cropFromCanvas(fullCanvas, bannerEl, titleBlockEl, canvasW, canvasH);
    if (res) {
      titleCrop = res.crop;
      titleRect = res.rect;
    }
  }

  let cardCrop: HTMLCanvasElement | null = null;
  let cardRect: ElementBox | null = null;
  if (cardEl) {
    const res = cropFromCanvas(fullCanvas, bannerEl, cardEl, canvasW, canvasH);
    if (res) {
      cardCrop = res.crop;
      cardRect = res.rect;
    }
  }

  let priceCrop: HTMLCanvasElement | null = null;
  let priceRect: ElementBox | null = null;
  if (priceBlockEl) {
    const res = cropFromCanvas(fullCanvas, bannerEl, priceBlockEl, canvasW, canvasH);
    if (res) {
      priceCrop = res.crop;
      priceRect = res.rect;
    }
  }

  return {
    fullCanvas,
    bgCanvas,
    titleCrop,
    titleRect,
    cardCrop,
    cardRect,
    priceCrop,
    priceRect,
  };
}

/**
 * Standard cubic ease-out curve
 */
function easeOutCubic(x: number): number {
  return 1 - Math.pow(1 - Math.max(0, Math.min(1, x)), 3);
}

/**
 * Desenha um crop em seu retângulo real de destino com suporte a translate, scale e alpha
 */
function drawCrop(
  ctx: CanvasRenderingContext2D,
  cropCanvas: HTMLCanvasElement,
  destRect: ElementBox,
  params: { dx?: number; dy?: number; scale?: number; alpha?: number } = {}
) {
  const { dx = 0, dy = 0, scale = 1, alpha = 1 } = params;
  if (alpha <= 0 || destRect.w <= 0 || destRect.h <= 0) return;

  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  const cx = destRect.x + destRect.w / 2 + dx;
  const cy = destRect.y + destRect.h / 2 + dy;
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.drawImage(cropCanvas, -destRect.w / 2, -destRect.h / 2, destRect.w, destRect.h);
  ctx.restore();
}

/**
 * Pilar 6 do Base44: Timeline com easing, frame a frame.
 * Renderiza cada quadro com fidelidade total à posição, fonte e proporção do mini player.
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
  const slideExitAlpha = 1.0 - fadeP;

  // 0. Limpa o canvas de saída
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // 1. Camada Base (papel de parede, cabeçalho e rodapé oficial íntegros)
  ctx.drawImage(currentSlide.bgCanvas, 0, 0, canvasWidth, canvasHeight);

  // 2. Timeline de animação (0.0s - 0.40s: entrada suave)
  let titleAlpha = slideExitAlpha;
  let titleDx = 0;
  let cardAlpha = slideExitAlpha;
  let cardScale = 1.0;
  let priceAlpha = slideExitAlpha;
  let priceScale = 1.0;

  if (slideT < 0.40) {
    const p = Math.min(1, slideT / 0.40);
    const ease = easeOutCubic(p);
    titleAlpha = p * slideExitAlpha;
    titleDx = -40 * (1 - ease);
    cardAlpha = p * slideExitAlpha;
    cardScale = 0.94 + 0.06 * ease;
    priceAlpha = p * slideExitAlpha;
    priceScale = 0.94 + 0.06 * ease;
  }

  // Pulso comercial de heartbeat no bloco de preço a cada 2.0s
  let pulseScale = 1.0;
  const beatPhase = (slideT + 0.2) % 2.0;
  if (beatPhase < 0.26) {
    pulseScale = 1.0 + Math.sin((beatPhase / 0.26) * Math.PI) * 0.035;
  }

  // Flutuação sutil de levitação no card de produto
  const cFloatY = Math.sin(slideT * 2.0) * 3;

  // 3. Desenha Crop do Título (com 1º selo na mesma linha, exatamente como no mini player)
  if (currentSlide.titleCrop && currentSlide.titleRect) {
    drawCrop(ctx, currentSlide.titleCrop, currentSlide.titleRect, {
      dx: titleDx,
      alpha: titleAlpha,
    });
  }

  // 4. Desenha Crop do Card de Produto
  if (currentSlide.cardCrop && currentSlide.cardRect) {
    drawCrop(ctx, currentSlide.cardCrop, currentSlide.cardRect, {
      dy: cFloatY,
      scale: cardScale,
      alpha: cardAlpha,
    });
  }

  // 5. Desenha Crop do Bloco de Preço (Preço "De:", Card de Preço "POR R$" e 2º Selo Promocional 100% visíveis!)
  if (currentSlide.priceCrop && currentSlide.priceRect) {
    drawCrop(ctx, currentSlide.priceCrop, currentSlide.priceRect, {
      scale: priceScale * pulseScale,
      alpha: priceAlpha,
    });
  }

  // 6. Transição suave para o próximo slide
  if (isTransitioning && nextSlide) {
    ctx.save();
    ctx.globalAlpha = easeOutCubic(fadeP);
    ctx.drawImage(nextSlide.fullCanvas, 0, 0, canvasWidth, canvasHeight);
    ctx.restore();
  }
}

/**
 * Pilar 4 e 5: WebCodecs + MP4 Muxer High-Speed Video Engine a 12 Mbps (qualidade máxima sem perda).
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
    bitrate: 12_000_000, // 12 Mbps broadcast qualidade de estúdio (Pilar 5)
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
 * Pilar 5 e 7: Universal MediaRecorder com Anti-Throttling a 12 Mbps (Base44).
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
        videoBitsPerSecond: 12000000, // 12 Mbps — qualidade sem perda (Pilar 5)
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

      // DUAS fontes de redraw (Pilar 7 do Base44 — anti-throttling)
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

      // Stop ancorado no relógio de parede real (Pilar 7)
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
 * 100% fiel ao mini player com a arquitetura de 7 pilares do Base44.
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
    await new Promise((r) => setTimeout(r, 450));
  } else {
    await new Promise((r) => setTimeout(r, 150));
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
            await new Promise((r) => { imgEl.onload = r; imgEl.onerror = r; setTimeout(r, 400); });
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

  const cleanTitle = (prod?.title || `produto-${productIndex + 1}`)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30);

  const filename = `banner-animado-${cleanTitle}-${Date.now()}.mp4`;

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
      await new Promise((r) => setTimeout(r, 450));
    } else {
      await new Promise((r) => setTimeout(r, 150));
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
              await new Promise((r) => { imgEl.onload = r; imgEl.onerror = r; setTimeout(r, 400); });
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

  const cleanTitle = (campaign.campaignTitle || 'ofertas')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30);
  const filename = `playcomunique-tv-${campaign.format || '16x9'}-${cleanTitle}-${Date.now()}.mp4`;

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
