import heic2any from 'heic2any';

/**
 * Normalizes and sanitizes an incoming image file (especially iPhone screenshots).
 * - Converts HEIC / HEIF to standard PNG
 * - Normalizes Display P3 / HDR color profiles to crisp sRGB
 * - Returns a standard PNG Data URL
 */
export async function processImportedImageFile(file: File): Promise<{ dataUrl: string; name: string }> {
  const isHeic = 
    file.name.toLowerCase().endsWith('.heic') || 
    file.name.toLowerCase().endsWith('.heif') ||
    file.type.toLowerCase().includes('heic') ||
    file.type.toLowerCase().includes('heif');

  let processedBlob: Blob = file;

  if (isHeic) {
    try {
      const conversionResult = await heic2any({
        blob: file,
        toType: 'image/png',
        quality: 1.0,
      });
      processedBlob = Array.isArray(conversionResult) ? conversionResult[0] : conversionResult;
    } catch (err) {
      console.warn('heic2any conversion fallback:', err);
      // If conversion fails, proceed with the original file
    }
  }

  // Convert blob to Data URL
  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(processedBlob);
  });

  // Normalize image through an offscreen standard sRGB canvas to remove
  // any corrupt Apple Display P3 / HDR chunks that cause Safari/Canvas block artifacts
  try {
    const normalizedDataUrl = await normalizeImageColorSpace(rawDataUrl);
    return {
      dataUrl: normalizedDataUrl,
      name: file.name.replace(/\.(heic|heif)$/i, '.png'),
    };
  } catch {
    return {
      dataUrl: rawDataUrl,
      name: file.name,
    };
  }
}

/**
 * Renders the image to a clean sRGB offscreen canvas to sanitize pixel data
 * and avoid browser canvas decoding corruption (such as white/magenta macroblocks).
 */
function normalizeImageColorSpace(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        if (w <= 0 || h <= 0) {
          resolve(dataUrl);
          return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d', {
          willReadFrequently: false,
        });

        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, w, h);

        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
