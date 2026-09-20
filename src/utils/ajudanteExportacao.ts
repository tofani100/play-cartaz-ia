// Utility to capture canvas / DOM elements and record WebM video or download PNG
import { BannerCampaign, ThemeColors, ProductItem } from '../tiposGeradorBanner';

export async function downloadElementAsPng(elementId: string, filename: string = 'banner-playcomunique.png') {
  const el = document.getElementById(elementId);
  if (!el) {
    console.error(`Element #${elementId} not found`);
    return;
  }

  // Create an offscreen SVG/Canvas or clone to render crisp
  const rect = el.getBoundingClientRect();
  const canvas = document.createElement('canvas');
  const scale = 2; // 2x for Retina / HD crispness
  canvas.width = rect.width * scale;
  canvas.height = rect.height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  try {
    const clone = el.cloneNode(true) as HTMLElement;
    clone.style.transform = 'none';
    clone.style.margin = '0';

    const data = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${rect.width}" height="${rect.height}">
        <foreignObject width="100%" height="100%">
          <div xmlns="http://www.w3.org/1999/xhtml">
            ${new XMLSerializer().serializeToString(clone)}
          </div>
        </foreignObject>
      </svg>
    `;

    const img = new Image();
    const svgBlob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const dlUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = dlUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(dlUrl);
      }, 'image/png', 1.0);
    };

    img.onerror = () => {
      window.print();
    };

    img.src = url;
  } catch (err) {
    console.warn('Direct SVG capture fallback to print:', err);
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
 * Renders and records an animated banner video (WebM/MP4) using HTML5 Canvas + MediaRecorder
 * Produces an authentic video file that automatically downloads to the user's Downloads folder
 */
export async function gerarVideoAnimadoBanner(
  campaign: BannerCampaign,
  theme: ThemeColors,
  durationSeconds: number = 4.5,
  onProgress?: (progress: number) => void
): Promise<VideoExportResult> {
  return new Promise(async (resolve, reject) => {
    try {
      // Dimensions based on campaign format
      let width = 1280;
      let height = 720;
      if (campaign.format === '9:16') {
        width = 720;
        height = 1280;
      } else if (campaign.format === '1:1') {
        width = 1080;
        height = 1080;
      } else if (campaign.format === '4:5') {
        width = 864;
        height = 1080;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Não foi possível inicializar contexto 2D');
      }

      const product: ProductItem = campaign.products[campaign.activeProductIndex] || campaign.products[0] || {
        id: '1',
        title: 'Super Oferta Especial',
        category: 'Geral',
        unit: 'un',
        price: '19,90',
        imageUrl: '',
      };

      // Preload product image safely (with CORS anonymous and fallback)
      let loadedImg: HTMLImageElement | null = null;
      if (product.imageUrl) {
        try {
          loadedImg = await new Promise<HTMLImageElement | null>((res) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => res(img);
            img.onerror = () => res(null);
            img.src = product.imageUrl;
            // timeout if image takes too long
            setTimeout(() => res(null), 2500);
          });
        } catch {
          loadedImg = null;
        }
      }

      // Initialize MediaStream and MediaRecorder from canvas
      const stream = canvas.captureStream(30); // 30 FPS
      const mimeTypes = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
        'video/mp4'
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
        videoBitsPerSecond: 6000000, // 6 Mbps HD
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const durationMs = durationSeconds * 1000;
      const startTime = performance.now();
      let animFrameId: number;

      // Color accents
      const primaryColor = theme.primary || '#D91A1A';
      const secondaryColor = theme.secondary || '#FFD200';
      const accentColor = theme.accent || '#FFFFFF';

      // Render loop
      const drawFrame = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(1, elapsed / durationMs);

        if (onProgress) {
          onProgress(Math.round(progress * 100));
        }

        // 1. Background gradient
        const bgGrad = ctx.createLinearGradient(0, 0, width, height);
        bgGrad.addColorStop(0, '#0F0F12');
        bgGrad.addColorStop(0.5, '#1A141A');
        bgGrad.addColorStop(1, '#08080A');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // 2. Ambient glows
        const glowRadius = width * 0.45;
        const glowX = width * 0.75;
        const glowY = height * 0.35;
        const radialGlow = ctx.createRadialGradient(glowX, glowY, 10, glowX, glowY, glowRadius);
        radialGlow.addColorStop(0, primaryColor + '55');
        radialGlow.addColorStop(0.6, secondaryColor + '22');
        radialGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = radialGlow;
        ctx.fillRect(0, 0, width, height);

        // 3. Top Header: Store name & Clock
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(0, 0, width, height * 0.12);

        // Store Name Badge
        const storeBadgeWidth = Math.min(width * 0.45, 340);
        ctx.fillStyle = primaryColor;
        ctx.beginPath();
        ctx.roundRect(width * 0.04, height * 0.025, storeBadgeWidth, height * 0.07, 10);
        ctx.fill();

        ctx.fillStyle = accentColor;
        ctx.font = `bold ${Math.round(height * 0.038)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          (campaign.clientName || 'PLAY COMUNIQUE').toUpperCase(),
          width * 0.04 + storeBadgeWidth / 2,
          height * 0.06
        );

        // Campaign Title or Live Clock
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${Math.round(height * 0.032)}px sans-serif`;
        ctx.textAlign = 'right';
        ctx.fillText(
          (campaign.campaignTitle || 'OFERTAS DA SEMANA').toUpperCase(),
          width * 0.96,
          height * 0.06
        );
        ctx.restore();

        // 4. Product Centerpack with Ken Burns Zoom animation
        const zoomFactor = 1.0 + Math.sin(progress * Math.PI) * 0.08;
        const isVertical = height > width;

        const prodCenterX = isVertical ? width * 0.5 : width * 0.38;
        const prodCenterY = isVertical ? height * 0.42 : height * 0.52;
        const maxProdSize = (isVertical ? width * 0.65 : height * 0.58) * zoomFactor;

        ctx.save();
        ctx.translate(prodCenterX, prodCenterY);

        if (loadedImg) {
          // Circular glow backdrop for packshot
          const imgGlow = ctx.createRadialGradient(0, 0, maxProdSize * 0.2, 0, 0, maxProdSize * 0.75);
          imgGlow.addColorStop(0, 'rgba(255,255,255,0.18)');
          imgGlow.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = imgGlow;
          ctx.beginPath();
          ctx.arc(0, 0, maxProdSize * 0.75, 0, Math.PI * 2);
          ctx.fill();

          // Draw aspect-ratio preserved image
          const aspect = loadedImg.width / loadedImg.height;
          let drawW = maxProdSize;
          let drawH = maxProdSize;
          if (aspect > 1) {
            drawH = maxProdSize / aspect;
          } else {
            drawW = maxProdSize * aspect;
          }

          // Subtle shadow
          ctx.shadowColor = 'rgba(0,0,0,0.6)';
          ctx.shadowBlur = 24;
          ctx.drawImage(loadedImg, -drawW / 2, -drawH / 2, drawW, drawH);
        } else {
          // Clean vector placeholder if image wasn't loaded
          ctx.fillStyle = primaryColor + '33';
          ctx.beginPath();
          ctx.arc(0, 0, maxProdSize * 0.4, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#FFFFFF';
          ctx.font = `bold ${Math.round(height * 0.045)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('EMBALAGEM OFICIAL', 0, 0);
        }
        ctx.restore();

        // 5. Promotional Badge (e.g. "SUPER OFERTA")
        ctx.save();
        const badgeText = (product.badge || 'SUPER OFERTA').toUpperCase();
        const badgeX = isVertical ? width * 0.1 : width * 0.68;
        const badgeY = isVertical ? height * 0.65 : height * 0.22;
        ctx.fillStyle = '#FF3B30';
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, 200, 36, 8);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(badgeText, badgeX + 100, badgeY + 18);
        ctx.restore();

        // 6. Product Title & Brand
        ctx.save();
        const textX = isVertical ? width * 0.1 : width * 0.68;
        const textY = isVertical ? height * 0.72 : height * 0.32;

        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${Math.round(height * 0.045)}px sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        // Wrap text if needed
        const words = product.title.split(' ');
        let line = '';
        let currentY = textY;
        const maxTextWidth = isVertical ? width * 0.8 : width * 0.28;

        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxTextWidth && n > 0) {
            ctx.fillText(line, textX, currentY);
            line = words[n] + ' ';
            currentY += Math.round(height * 0.05);
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, textX, currentY);
        ctx.restore();

        // 7. Dynamic Pulsing Price Tag
        ctx.save();
        const pulseScale = 1.0 + Math.sin(currentTime / 180) * 0.035;
        const priceBoxX = isVertical ? width * 0.5 : width * 0.78;
        const priceBoxY = isVertical ? height * 0.82 : height * 0.62;

        ctx.translate(priceBoxX, priceBoxY);
        ctx.scale(pulseScale, pulseScale);

        // Price Pill Background
        const pWidth = isVertical ? width * 0.7 : width * 0.25;
        const pHeight = height * 0.16;
        ctx.fillStyle = secondaryColor;
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.roundRect(-pWidth / 2, -pHeight / 2, pWidth, pHeight, 18);
        ctx.fill();

        // "R$"
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#000000';
        ctx.font = `900 ${Math.round(pHeight * 0.28)}px sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('R$', -pWidth * 0.42, -pHeight * 0.35);

        // Main Price Integer
        const priceParts = (product.price || '0,00').split(',');
        const intPart = priceParts[0] || '0';
        const decPart = priceParts[1] || '00';

        ctx.font = `900 ${Math.round(pHeight * 0.68)}px sans-serif`;
        ctx.fillText(intPart, -pWidth * 0.22, -pHeight * 0.45);

        // Decimal Cents + Unit
        ctx.font = `900 ${Math.round(pHeight * 0.36)}px sans-serif`;
        ctx.fillText(`,${decPart}`, pWidth * 0.15, -pHeight * 0.38);

        ctx.font = `bold ${Math.round(pHeight * 0.2)}px sans-serif`;
        ctx.fillStyle = '#222222';
        ctx.fillText(product.unit ? `/${product.unit}` : '', pWidth * 0.15, -pHeight * 0.02);

        ctx.restore();

        // 8. Footer Ticker / Validity text
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, height * 0.93, width, height * 0.07);

        ctx.fillStyle = '#FFD200';
        ctx.font = `bold ${Math.round(height * 0.028)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const marqueeText = campaign.tickerText || `OFERTAS VÁLIDAS ATÉ ${campaign.validityText || 'DURAREM OS ESTOQUES'} • IMAGENS MERAMENTE ILUSTRATIVAS`;
        ctx.fillText(marqueeText.toUpperCase(), width / 2, height * 0.965);
        ctx.restore();

        if (elapsed < durationMs) {
          animFrameId = requestAnimationFrame(drawFrame);
        } else {
          recorder.stop();
        }
      };

      recorder.onstop = () => {
        const videoBlob = new Blob(chunks, { type: recorder.mimeType });
        const cleanTitle = (product.title || 'banner')
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]/g, '-')
          .slice(0, 25);
        const filename = `playcomunique-${campaign.format}-${cleanTitle}-${Date.now()}.webm`;

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
      recorder.start(100);
      animFrameId = requestAnimationFrame(drawFrame);
    } catch (err) {
      reject(err);
    }
  });
}

