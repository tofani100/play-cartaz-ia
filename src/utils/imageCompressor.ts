/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Utilitário de compressão de imagens de alta velocidade no navegador.
 * Reduz fotos pesadas de celulares e câmeras (3MB a 12MB) para ~20KB-30KB em WebP/JPEG
 * com resolução comercial nítida de 800px, ideal para transmissão em TV e persistência segura no Firestore e LocalStorage.
 */
export async function compressImageToDataUrl(
  input: File | Blob | string,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.76
): Promise<string> {
  if (!input) return '';

  // Se já for uma URL HTTP, HTTPS ou caminho estático, não precisa comprimir
  if (
    typeof input === 'string' &&
    (input.startsWith('http://') ||
      input.startsWith('https://') ||
      input.startsWith('/'))
  ) {
    return input;
  }

  // Se for string data URL já compacta (< 30KB), pode manter diretamente
  if (typeof input === 'string' && input.startsWith('data:image') && input.length < 32000) {
    return input;
  }

  // SVG vetorial não deve ser rasterizado se for razoável (< 100KB)
  if (typeof input === 'string' && input.startsWith('data:image/svg+xml') && input.length < 100000) {
    return input;
  }

  let sourceDataUrl = '';
  if (input instanceof File || input instanceof Blob) {
    if (input.type === 'image/svg+xml' && input.size < 100000) {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string) || '');
        reader.onerror = () => resolve('');
        reader.readAsDataURL(input);
      });
    }

    sourceDataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string) || '');
      reader.onerror = reject;
      reader.readAsDataURL(input);
    });
  } else {
    sourceDataUrl = input;
  }

  if (!sourceDataUrl || !sourceDataUrl.startsWith('data:image')) {
    return sourceDataUrl;
  }

  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width <= 0 || height <= 0) {
          return resolve(sourceDataUrl);
        }

        // Redimensionamento proporcional para caber dentro de maxWidth x maxHeight
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(sourceDataUrl);
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // 1. Tenta WebP primeiro (preserva transparência de PNGs e comprime ~30% mais que JPEG)
        try {
          const webpData = canvas.toDataURL('image/webp', quality);
          if (webpData && webpData.startsWith('data:image/webp') && webpData.length > 50) {
            return resolve(webpData);
          }
        } catch (_) {}

        // 2. Tenta PNG se for pequeno (< 50KB) para manter transparência
        try {
          const pngData = canvas.toDataURL('image/png');
          if (pngData && pngData.startsWith('data:image/png') && pngData.length < 52000) {
            return resolve(pngData);
          }
        } catch (_) {}

        // 3. Fallback: JPEG com preenchimento branco de fundo (para evitar fundo preto em PNGs transparentes)
        try {
          const fallbackCanvas = document.createElement('canvas');
          fallbackCanvas.width = width;
          fallbackCanvas.height = height;
          const fctx = fallbackCanvas.getContext('2d');
          if (fctx) {
            fctx.fillStyle = '#ffffff';
            fctx.fillRect(0, 0, width, height);
            fctx.drawImage(img, 0, 0, width, height);
            const jpegData = fallbackCanvas.toDataURL('image/jpeg', quality);
            if (jpegData && jpegData.length > 50) {
              return resolve(jpegData);
            }
          }
        } catch (_) {}

        resolve(sourceDataUrl);
      };
      img.onerror = () => resolve(sourceDataUrl);
      img.src = sourceDataUrl;
    } catch {
      resolve(sourceDataUrl);
    }
  });
}
