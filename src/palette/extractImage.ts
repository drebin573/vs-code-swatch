import type { Palette } from './types';

/**
 * Median-cut quantization over raw RGBA data. Pure so it can be unit tested;
 * the canvas glue lives in `extractFromImageFile`.
 */
export function quantize(data: Uint8ClampedArray, k = 12): string[] {
  type Px = [number, number, number];
  const pixels: Px[] = [];
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue; // skip transparent
    pixels.push([data[i], data[i + 1], data[i + 2]]);
  }
  if (pixels.length === 0) return [];

  type Box = { pixels: Px[] };
  const boxes: Box[] = [{ pixels }];
  const uniform: Box[] = [];

  const widestChannel = (box: Box): number => {
    const mins = [255, 255, 255];
    const maxs = [0, 0, 0];
    for (const p of box.pixels) {
      for (let c = 0; c < 3; c++) {
        if (p[c] < mins[c]) mins[c] = p[c];
        if (p[c] > maxs[c]) maxs[c] = p[c];
      }
    }
    const ranges = maxs.map((m, c) => m - mins[c]);
    return ranges.indexOf(Math.max(...ranges));
  };

  while (boxes.length > 0 && boxes.length + uniform.length < k) {
    // Split the box with the most pixels along its widest channel, at the
    // channel mean — unlike a count-median split this cleanly separates
    // bimodal clusters (e.g. a two-color image).
    boxes.sort((a, b) => b.pixels.length - a.pixels.length);
    const box = boxes[0];
    const ch = widestChannel(box);
    const mean = box.pixels.reduce((sum, p) => sum + p[ch], 0) / box.pixels.length;
    const lo = box.pixels.filter((p) => p[ch] <= mean);
    const hi = box.pixels.filter((p) => p[ch] > mean);
    if (lo.length === 0 || hi.length === 0) {
      // Single-color box; set it aside so others can still split.
      uniform.push(box);
      boxes.shift();
      continue;
    }
    boxes.splice(0, 1, { pixels: lo }, { pixels: hi });
  }

  return [...boxes, ...uniform]
    .filter((b) => b.pixels.length > 0)
    .sort((a, b) => b.pixels.length - a.pixels.length)
    .map((b) => {
      const n = b.pixels.length;
      const avg = b.pixels
        .reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1], acc[2] + p[2]], [0, 0, 0])
        .map((v) => Math.round(v / n));
      return `#${avg.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
    });
}

const SAMPLE_SIZE = 96;
const MAX_PALETTE_SIZE = 64;

/** Counts distinct opaque colors, stopping early once `cap` is reached. */
function countDistinctColors(data: Uint8ClampedArray, cap: number): number {
  const seen = new Set<number>();
  for (let i = 0; i < data.length && seen.size < cap; i += 4) {
    if (data[i + 3] < 128) continue;
    seen.add((data[i] << 16) | (data[i + 1] << 8) | data[i + 2]);
  }
  return seen.size;
}

/**
 * If `k` isn't given, size the palette to the image's own color count (capped)
 * instead of a fixed default — flat swatch/reference images can have far more
 * than a dozen distinct colors and shouldn't be quantized down needlessly.
 */
export async function extractFromImageFile(file: File, k?: number): Promise<Palette> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, SAMPLE_SIZE / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  const data = ctx.getImageData(0, 0, w, h).data;
  const count = k ?? Math.min(MAX_PALETTE_SIZE, countDistinctColors(data, MAX_PALETTE_SIZE));
  const hexes = quantize(data, count);
  return { name: file.name.replace(/\.\w+$/, ''), colors: hexes.map((hex) => ({ hex })) };
}
