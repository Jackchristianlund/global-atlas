/**
 * "Download image": the view as it is on screen, with the things a picture
 * of a war map must not lose on its way around the internet — what the
 * colours mean, where the data comes from, and the date it describes.
 *
 * The globe and the detailed map register a capture function here; the
 * button calls whichever is showing. Captures happen right after a render,
 * so the WebGL drawing buffer still holds the frame and the contexts do not
 * need `preserveDrawingBuffer` (which would cost every frame, not just this
 * one).
 */

export interface LegendItem { color: string; label: string; kind: 'box' | 'line' | 'dot' | 'dash' }

export interface SnapshotText {
  title: string;
  /** The date the view describes, and that it is not real time. */
  dated: string;
  legend: LegendItem[];
  /** One line each. */
  sources: string[];
  /** Where the picture came from. */
  credit: string;
}

/** Returns the current frame of the active view, with any HTML markers drawn in. */
type Capture = () => Promise<HTMLCanvasElement>;
const captures: Partial<Record<'globe' | 'map', Capture>> = {};

export function registerCapture(which: 'globe' | 'map', fn: Capture | null): void {
  if (fn) captures[which] = fn; else delete captures[which];
}
export function captureFor(which: 'globe' | 'map'): Capture | undefined {
  return captures[which];
}

/** Text wrapped to a width, for the sources block. */
export function wrap(ctx: Pick<CanvasRenderingContext2D, 'measureText'>, text: string, width: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (ctx.measureText(next).width > width && line) { lines.push(line); line = w; } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Lays the frame out with a title band above and a legend and sources band
 * below, so nothing is printed over the map itself.
 */
export function compose(frame: HTMLCanvasElement, text: SnapshotText): HTMLCanvasElement {
  const W = Math.max(frame.width, 900);
  const scale = W / frame.width;
  const mapH = Math.round(frame.height * scale);
  const pad = Math.round(22 * (W / 1600) + 10);
  const fs = (n: number) => `${Math.round(n * (W / 1600) + n * 0.35)}px`;
  const probe = document.createElement('canvas').getContext('2d')!;
  probe.font = `${fs(13)} system-ui, sans-serif`;
  const sourceLines = text.sources.flatMap((s) => wrap(probe, s, W - pad * 2));
  const lineH = parseInt(fs(13), 10) * 1.45;
  const legendRows = Math.ceil(text.legend.length / 3);
  const headH = parseInt(fs(22), 10) + parseInt(fs(13), 10) + pad * 2;
  const footH = pad * 2 + legendRows * lineH * 1.2 + sourceLines.length * lineH + lineH * 1.6;

  const c = document.createElement('canvas');
  c.width = W;
  c.height = Math.round(headH + mapH + footH);
  const g = c.getContext('2d')!;
  g.fillStyle = '#070B14';
  g.fillRect(0, 0, c.width, c.height);

  // Title band.
  g.fillStyle = '#EAF2FF';
  g.font = `600 ${fs(22)} system-ui, sans-serif`;
  g.textBaseline = 'top';
  g.fillText(text.title, pad, pad);
  g.fillStyle = '#FFD678';
  g.font = `${fs(13)} system-ui, sans-serif`;
  g.fillText(text.dated, pad, pad + parseInt(fs(22), 10) + 6);

  // The view.
  g.drawImage(frame, 0, headH, W, mapH);

  // Legend, three columns.
  let y = headH + mapH + pad;
  g.font = `${fs(13)} system-ui, sans-serif`;
  const colW = (W - pad * 2) / 3;
  text.legend.forEach((it, i) => {
    const x = pad + (i % 3) * colW;
    const yy = y + Math.floor(i / 3) * lineH * 1.2;
    const sw = parseInt(fs(13), 10);
    g.fillStyle = it.color;
    g.strokeStyle = it.color;
    if (it.kind === 'box') g.fillRect(x, yy + 2, sw * 1.4, sw * 0.9);
    else if (it.kind === 'dot') { g.beginPath(); g.arc(x + sw * 0.5, yy + sw * 0.55, sw * 0.42, 0, Math.PI * 2); g.fill(); }
    else {
      g.lineWidth = Math.max(2, sw * 0.22);
      g.setLineDash(it.kind === 'dash' ? [sw * 0.4, sw * 0.3] : []);
      g.beginPath(); g.moveTo(x, yy + sw * 0.55); g.lineTo(x + sw * 1.4, yy + sw * 0.55); g.stroke();
      g.setLineDash([]);
    }
    g.fillStyle = '#C9D6E8';
    g.fillText(it.label, x + sw * 1.9, yy);
  });
  y += legendRows * lineH * 1.2 + lineH * 0.4;

  // Sources.
  g.fillStyle = '#8D9AB0';
  for (const l of sourceLines) { g.fillText(l, pad, y); y += lineH; }
  g.fillStyle = '#00D9FF';
  g.fillText(text.credit, pad, y + lineH * 0.2);
  return c;
}

/** Hands a canvas to the browser as a PNG download. */
export async function download(c: HTMLCanvasElement, filename: string): Promise<void> {
  const blob = await new Promise<Blob | null>((r) => c.toBlob(r, 'image/png'));
  if (!blob) throw new Error('could not encode the image');
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/**
 * Draws the globe's HTML markers onto a copy of its frame: they are DOM
 * buttons floating over the canvas, so the canvas alone would lose every
 * conflict dot. `box` is where the live canvas sits on the page, which a
 * detached copy cannot report itself.
 */
export function withMarkers(frame: HTMLCanvasElement, box: DOMRect, root: HTMLElement): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = frame.width;
  c.height = frame.height;
  const g = c.getContext('2d')!;
  g.drawImage(frame, 0, 0);
  const sx = frame.width / box.width, sy = frame.height / box.height;
  for (const el of Array.from(root.querySelectorAll<HTMLElement>('.mk'))) {
    if (el.style.opacity === '0' || el.offsetParent === null) continue;
    const dot = el.querySelector('i') ?? el;
    const r = dot.getBoundingClientRect();
    if (r.width === 0) continue;
    const cx = (r.left + r.width / 2 - box.left) * sx, cy = (r.top + r.height / 2 - box.top) * sy;
    if (cx < 0 || cy < 0 || cx > c.width || cy > c.height) continue;
    const color = getComputedStyle(el).getPropertyValue('--c').trim() || '#FFFFFF';
    g.globalAlpha = Number(el.style.opacity || 1);
    g.beginPath();
    g.arc(cx, cy, Math.max(3, (r.width / 2) * sx), 0, Math.PI * 2);
    g.fillStyle = color;
    g.fill();
    g.lineWidth = 1.5 * sx;
    g.strokeStyle = 'rgba(7,11,20,.9)';
    g.stroke();
    g.globalAlpha = 1;
  }
  return c;
}
