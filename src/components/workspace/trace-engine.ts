// Browser-side preview tracer: quantizes the image into color layers and
// connected shapes so every control visibly changes the result.
export type TraceMode = 'outline' | 'color';
export type Accuracy = 'low' | 'medium' | 'high';
export interface TraceOptions {
  mode: TraceMode; accuracy: Accuracy; fineTune: boolean;
  colorDetail: number; noise: number; colors: number; reduce: number;
  smoothness: number; removeBg: boolean;
}
export interface Shape { id: number; layer: number; size: number; touchesEdge: boolean }
export interface TraceResult {
  width: number; height: number; labels: Int32Array; shapeOf: Int32Array;
  palette: [number, number, number][]; shapes: Shape[]; background: number; log: string[];
}

export const ACCURACY_PRESETS: Record<Accuracy, { colorDetail: number; noise: number; colors: number; reduce: number }> = {
  low: { colorDetail: 3, noise: 14, colors: 6, reduce: 10 },
  medium: { colorDetail: 5, noise: 8, colors: 16, reduce: 6 },
  high: { colorDetail: 8, noise: 3, colors: 32, reduce: 2 },
};

export async function loadImageData(src: string, max = 320): Promise<ImageData> {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = src;
  await img.decode();
  const s = Math.min(1, max / Math.max(img.naturalWidth || max, img.naturalHeight || max));
  const w = Math.max(1, Math.round((img.naturalWidth || max) * s));
  const h = Math.max(1, Math.round((img.naturalHeight || max) * s));
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h);
}

function blur(d: Uint8ClampedArray, w: number, h: number, r: number) {
  if (r < 1) return d;
  const out = new Uint8ClampedArray(d.length);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let R = 0, G = 0, B = 0, n = 0;
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const xx = x + dx, yy = y + dy;
      if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
      const i = (yy * w + xx) * 4; R += d[i]; G += d[i + 1]; B += d[i + 2]; n++;
    }
    const o = (y * w + x) * 4; out[o] = R / n; out[o + 1] = G / n; out[o + 2] = B / n; out[o + 3] = 255;
  }
  return out;
}

export function trace(src: ImageData, o: TraceOptions): TraceResult {
  const { width: w, height: h } = src;
  const preset = ACCURACY_PRESETS[o.accuracy];
  const colorDetail = o.fineTune ? o.colorDetail : preset.colorDetail;
  const noise = o.fineTune ? o.noise : preset.noise;
  const colors = o.fineTune ? o.colors : preset.colors;
  const reduce = o.fineTune ? o.reduce : preset.reduce;
  const log: string[] = [`size ${w}x${h}`, `mode=${o.mode} accuracy=${o.accuracy} fineTune=${o.fineTune}`];
  const d = blur(src.data, w, h, Math.round(o.smoothness * 2));
  const n = w * h;
  const bgMask = new Uint8Array(n);
  if (o.removeBg) {
    const corners = [0, w - 1, (h - 1) * w, n - 1].map((p) => [d[p * 4], d[p * 4 + 1], d[p * 4 + 2]]);
    const bg = corners.reduce((a, c) => a.map((v, i) => v + c[i] / 4), [0, 0, 0]);
    for (let p = 0; p < n; p++) {
      const dist = Math.hypot(d[p * 4] - bg[0], d[p * 4 + 1] - bg[1], d[p * 4 + 2] - bg[2]);
      if (dist < 42) bgMask[p] = 1;
    }
    log.push(`background removed rgb(${bg.map(Math.round).join(',')})`);
  }
  const labels = new Int32Array(n);
  let palette: [number, number, number][] = [];
  if (o.mode === 'outline') {
    const levels = Math.max(2, colorDetail);
    for (let i = 0; i < levels; i++) { const v = Math.round((255 * i) / (levels - 1)); palette.push([v, v, v]); }
    for (let p = 0; p < n; p++) {
      const g = 0.299 * d[p * 4] + 0.587 * d[p * 4 + 1] + 0.114 * d[p * 4 + 2];
      labels[p] = bgMask[p] ? levels - 1 : Math.min(levels - 1, Math.round((g / 255) * (levels - 1)));
    }
  } else {
    const k = Math.max(2, colors);
    const sample: number[] = [];
    for (let p = 0; p < n; p += 7) if (!bgMask[p]) sample.push(p);
    palette = Array.from({ length: k }, (_, i) => {
      const p = sample[Math.floor((i / k) * sample.length)] ?? 0;
      return [d[p * 4], d[p * 4 + 1], d[p * 4 + 2]] as [number, number, number];
    });
    for (let it = 0; it < 6; it++) {
      const acc = palette.map(() => [0, 0, 0, 0]);
      for (const p of sample) {
        let best = 0, bd = Infinity;
        for (let c = 0; c < k; c++) {
          const e = (d[p * 4] - palette[c][0]) ** 2 + (d[p * 4 + 1] - palette[c][1]) ** 2 + (d[p * 4 + 2] - palette[c][2]) ** 2;
          if (e < bd) { bd = e; best = c; }
        }
        acc[best][0] += d[p * 4]; acc[best][1] += d[p * 4 + 1]; acc[best][2] += d[p * 4 + 2]; acc[best][3]++;
      }
      palette = palette.map((c, i) => (acc[i][3] ? [acc[i][0] / acc[i][3], acc[i][1] / acc[i][3], acc[i][2] / acc[i][3]] : c) as [number, number, number]);
    }
    palette.push([255, 255, 255]);
    for (let p = 0; p < n; p++) {
      if (bgMask[p]) { labels[p] = k; continue; }
      let best = 0, bd = Infinity;
      for (let c = 0; c < k; c++) {
        const e = (d[p * 4] - palette[c][0]) ** 2 + (d[p * 4 + 1] - palette[c][1]) ** 2 + (d[p * 4 + 2] - palette[c][2]) ** 2;
        if (e < bd) { bd = e; best = c; }
      }
      labels[p] = best;
    }
  }
  const background = palette.length - 1;
  const minSize = Math.max(1, (o.mode === 'outline' ? noise : reduce) ** 2 / 2);
  const shapeOf = new Int32Array(n).fill(-1);
  const stack: number[] = [];
  const comp = (minArea: number) => {
    shapeOf.fill(-1);
    const shapes: Shape[] = [];
    for (let s = 0; s < n; s++) {
      if (shapeOf[s] !== -1) continue;
      const id = shapes.length, lab = labels[s];
      const members: number[] = [];
      stack.push(s); shapeOf[s] = id; let edge = false;
      while (stack.length) {
        const p = stack.pop()!; members.push(p);
        const x = p % w, y = (p / w) | 0;
        if (x === 0 || y === 0 || x === w - 1 || y === h - 1) edge = true;
        const nb = [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1];
        for (const q of nb) if (q >= 0 && shapeOf[q] === -1 && labels[q] === lab) { shapeOf[q] = id; stack.push(q); }
      }
      shapes.push({ id, layer: lab, size: members.length, touchesEdge: edge });
      if (members.length < minArea) {
        const p = members[0]; const x = p % w;
        const nl = x > 0 ? labels[p - 1] : p >= w ? labels[p - w] : lab;
        if (nl !== lab) for (const m of members) labels[m] = nl;
      }
    }
    return shapes;
  };
  comp(minSize);
  const shapes = comp(0).filter((s) => s.layer !== background);
  log.push(`palette ${palette.length - 1} layers, noise ≥ ${Math.round(minSize)}px²`, `${shapes.length} shapes traced`);
  return { width: w, height: h, labels, shapeOf, palette, shapes, background, log };
}

export function render(canvas: HTMLCanvasElement, r: TraceResult, mode: TraceMode, marked: Set<number>, scale = 2) {
  const { width: w, height: h } = r;
  canvas.width = w * scale; canvas.height = h * scale;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(w * scale, h * scale);
  for (let y = 0; y < h * scale; y++) for (let x = 0; x < w * scale; x++) {
    const p = ((y / scale) | 0) * w + ((x / scale) | 0);
    const sid = r.shapeOf[p];
    const xr = (x / scale) | 0, yr = (y / scale) | 0;
    const edge = (xr < w - 1 && r.shapeOf[p + 1] !== sid) || (yr < h - 1 && r.shapeOf[p + w] !== sid);
    let c: number[];
    const isMarked = marked.has(sid);
    if (mode === 'outline') c = edge ? [30, 34, 48] : [255, 255, 255];
    else c = edge ? [40, 40, 40] : r.palette[r.labels[p]];
    if (isMarked) c = (x + y) % 6 < 2 ? [232, 80, 60] : [255, 225, 218];
    const o = (y * w * scale + x) * 4;
    img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; img.data[o + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}

export function parseStudioUrl(url: string) {
  const m = url.match(/documents\/([a-z0-9]+)\/(?:w|v|m)\/([a-z0-9]+)\/e\/([a-z0-9]+)/i);
  return m ? { documentId: m[1], workspaceId: m[2], elementId: m[3] } : null;
}
