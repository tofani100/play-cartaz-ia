/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Utilitário de compressão de imagens de alta velocidade no navegador.
 * Reduz fotos pesadas de celulares e câmeras (3MB a 12MB) para ~35KB-60KB em JPEG 0.82
 * com resolução comercial nítida de 1200px, ideal para transmissão em TV e encartes.
 */
export async function compressImageToDataUrl(
  input: File | Blob | string,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.82
): Promise<string> {
  if (!input) return '';

  // Se já for uma URL HTTP, HTTPS ou caminho estático, não precisa comprimir
  if (
    typeof input === 'string' &&
    (input.startsWith('http://') ||
      input.startsWith('https://') ||
      input.startsWith('/') ||
      input.startsWith('cloud-img:'))
  ) {
    return input;
  }

  // Se for string data URL pequena (< 30KB), pode manter
  if (typeof input === 'string' && input.startsWith('data:image') && input.length < 35000) {
    return input;
  }

  let sourceDataUrl = '';
  if (input instanceof File || input instanceof Blob) {
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

        try {
          const compressed = canvas.toDataURL('image/jpeg', quality);
          if (compressed && compressed.length > 50) {
            return resolve(compressed);
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
