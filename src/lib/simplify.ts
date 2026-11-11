/**
 * Douglas-Peucker, for display only.
 *
 * A line drawn on the globe is stroked in angular degrees, so at globe
 * distance the stroke is tens of kilometres wide while the source vertices sit
 * about a kilometre apart. Each segment then renders as its own short, wide
 * quad and the line comes out as a string of beads rather than a stroke. The
 * cure is to thin the vertices to the width actually being drawn.
 *
 * This never touches stored data. The geometry on file, the geometry the
 * regional map draws and the geometry the exports carry are all unchanged;
 * only the globe's own copy is thinned, and only as far as its own line width
 * already blurs.
 */
export type Pt = [number, number] | [number, number, number];

function segDistSq(p: Pt, a: Pt, b: Pt): number {
  let x = a[0];
  let y = a[1];
  let dx = b[0] - x;
  let dy = b[1] - y;
  if (dx !== 0 || dy !== 0) {
    const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);
    if (t > 1) { x = b[0]; y = b[1]; }
    else if (t > 0) { x += dx * t; y += dy * t; }
  }
  dx = p[0] - x;
  dy = p[1] - y;
  return dx * dx + dy * dy;
}

/**
 * Keeps the first and last vertex and every vertex further than `tolerance`
 * from the line between its kept neighbours. Iterative, so a long path cannot
 * overflow the stack.
 */
export function simplifyPath<T extends Pt>(pts: readonly T[], tolerance: number): T[] {
  if (pts.length < 3 || tolerance <= 0) return pts.slice();
  const t2 = tolerance * tolerance;
  const keep = new Uint8Array(pts.length);
  keep[0] = 1;
  keep[pts.length - 1] = 1;
  const stack: [number, number][] = [[0, pts.length - 1]];

  while (stack.length) {
    const [i, j] = stack.pop()!;
    let worst = 0;
    let idx = -1;
    for (let k = i + 1; k < j; k++) {
      const d = segDistSq(pts[k], pts[i], pts[j]);
      if (d > worst) { worst = d; idx = k; }
    }
    if (worst > t2 && idx > 0) {
      keep[idx] = 1;
      stack.push([i, idx], [idx, j]);
    }
  }

  const out: T[] = [];
  for (let i = 0; i < pts.length; i++) if (keep[i]) out.push(pts[i]);
  // A simplified line still needs two distinct ends to be a line at all.
  return out.length >= 2 ? out : pts.slice();
}

/**
 * The smallest deviation worth keeping, in degrees, for a camera at `altitude`
 * looking at a viewport `viewportH` pixels tall.
 *
 * Tied to pixels rather than to the stroke width: a detour the reader cannot
 * see is weight the renderer carries for nothing, and a tolerance derived from
 * a wide stroke flattens the shape the line exists to show.
 */
export function toleranceForView(altitude: number, viewportH: number, px = 1.1): number {
  const radiansPerPx = (2 * Math.tan((25 * Math.PI) / 180)) / Math.max(viewportH, 1);
  const theta = px * radiansPerPx * (1 + Math.max(altitude, 0.02));
  return Math.max((theta * 180) / Math.PI, 0.0004);
}
