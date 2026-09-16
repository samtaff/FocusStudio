/**
 * Client-side heuristic Computer Vision detector for interface elements
 * (buttons, input fields, menu items, toggles, icons, cards).
 * Operates non-destructively in pure browser memory via ImageData.
 */

import { DetectedElement } from '../types';

export function detectInterfaceElements(
  img: HTMLImageElement,
  compositionScale: number
): Promise<DetectedElement[]> {
  return new Promise((resolve) => {
    // Run asynchronously so UI doesn't stutter
    setTimeout(() => {
      try {
        const origW = img.naturalWidth || img.width;
        const origH = img.naturalHeight || img.height;

        if (origW <= 0 || origH <= 0) {
          resolve([]);
          return;
        }

        // Downscale for fast edge analysis if image is huge
        const maxDim = 800;
        const scale = Math.min(1, maxDim / Math.max(origW, origH));
        const scanW = Math.round(origW * scale);
        const scanH = Math.round(origH * scale);

        const canvas = document.createElement('canvas');
        canvas.width = scanW;
        canvas.height = scanH;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve([]);
          return;
        }

        ctx.drawImage(img, 0, 0, scanW, scanH);
        const imgData = ctx.getImageData(0, 0, scanW, scanH);
        const data = imgData.data;

        // 1. Grayscale & Sobel Edge Detection
        const gray = new Uint8Array(scanW * scanH);
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          gray[i / 4] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        }

        // Horizontal line gradient energy profile
        const rowEdges = new Float32Array(scanH);
        const colEdges = new Float32Array(scanW);

        for (let y = 1; y < scanH - 1; y++) {
          let rowSum = 0;
          for (let x = 1; x < scanW - 1; x++) {
            const idx = y * scanW + x;
            const dy = Math.abs(gray[idx + scanW] - gray[idx - scanW]);
            const dx = Math.abs(gray[idx + 1] - gray[idx - 1]);
            const grad = dx + dy;
            if (grad > 28) {
              rowSum += grad;
              colEdges[x] += grad;
            }
          }
          rowEdges[y] = rowSum;
        }

        // Identify horizontal candidate segments (buttons, menu items, fields)
        // Group consecutive active rows
        const thresholdRow = (rowEdges.reduce((a, b) => a + b, 0) / scanH) * 0.7;
        interface Segment {
          yStart: number;
          yEnd: number;
          height: number;
        }
        const segments: Segment[] = [];
        let inSeg = false;
        let startY = 0;

        for (let y = 0; y < scanH; y++) {
          if (rowEdges[y] > thresholdRow) {
            if (!inSeg) {
              inSeg = true;
              startY = y;
            }
          } else {
            if (inSeg) {
              inSeg = false;
              const h = y - startY;
              if (h >= 12 * scale && h <= 120 * scale) {
                segments.push({ yStart: startY, yEnd: y, height: h });
              }
            }
          }
        }

        // Find horizontal bounds for each segment
        const candidates: DetectedElement[] = [];
        const toCompCoord = (valOnScan: number, isX: boolean) => {
          const valOnOrig = valOnScan / scale;
          return Math.round(valOnOrig * compositionScale);
        };

        segments.forEach((seg, idx) => {
          // Horizontal projection within this segment
          const colSumSeg = new Float32Array(scanW);
          for (let y = seg.yStart; y <= seg.yEnd; y++) {
            for (let x = 0; x < scanW; x++) {
              const gradX = Math.abs(gray[y * scanW + Math.min(scanW - 1, x + 1)] - gray[y * scanW + Math.max(0, x - 1)]);
              colSumSeg[x] += gradX;
            }
          }

          // Find horizontal boundaries
          let left = 0;
          let right = scanW - 1;
          // Trim whitespace/borders
          while (left < scanW && colSumSeg[left] < 20) left++;
          while (right > left && colSumSeg[right] < 20) right--;

          const width = right - left;
          if (width > 40 * scale) {
            const compX = toCompCoord(left, true);
            const compY = toCompCoord(seg.yStart, false);
            const compW = toCompCoord(width, true);
            const compH = toCompCoord(seg.height, false);

            // Determine element classification based on proportions
            let type: DetectedElement['type'] = 'button';
            let label = 'Élément d\'interface';

            const aspect = compW / (compH || 1);
            if (aspect > 3.5) {
              type = 'menu-item';
              label = 'Ligne de menu / Paramètre';
            } else if (aspect >= 1.5 && aspect <= 3.5 && compH <= 65) {
              type = 'button';
              label = 'Bouton d\'action';
            } else if (aspect > 2.0 && compH > 65) {
              type = 'card';
              label = 'Bloc / Carte de contenu';
            } else if (aspect >= 0.8 && aspect <= 1.4 && compW <= 70) {
              type = 'icon';
              label = 'Icône / Commutateur';
            } else {
              type = 'input';
              label = 'Champ / Zone de saisie';
            }

            candidates.push({
              id: `det-${idx}-${Date.now()}`,
              label,
              type,
              x: Math.max(0, compX),
              y: Math.max(0, compY),
              width: Math.max(50, compW),
              height: Math.max(28, compH),
              confidence: 0.85 - (idx * 0.02),
            });
          }
        });

        // Filter overlaps and keep top 8 most prominent
        const deduped: DetectedElement[] = [];
        for (const cand of candidates) {
          const overlaps = deduped.some((existing) => {
            const dy = Math.abs(existing.y - cand.y);
            return dy < 15;
          });
          if (!overlaps) {
            deduped.push(cand);
          }
          if (deduped.length >= 8) break;
        }

        resolve(deduped);
      } catch (err) {
        console.error('Auto detection error:', err);
        resolve([]);
      }
    }, 50);
  });
}
