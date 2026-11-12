/**
 * Where two dated front lines differ.
 *
 * Both lines are the source's own geometry. Nothing here draws a line: it
 * measures how far each vertex of one assessment lies from the other, and
 * keeps the stretches that moved by more than the data can resolve. Those
 * stretches are what the map frames when two snapshots are compared.
 *
 * What it does not do, deliberately: say who gained or lost ground. The
 * source does not label which side of the line is whose, so a shift in the
 * line is reported as a shift, and its direction is left to the reader and to
 * the published assessments.
 */

/** [lat, lng] */
export type LatLng = [number, number];

export interface ChangedStretch {
  /** The stretch of the later line that moved, as [lat, lng]. */
  path: LatLng[];
  /** Largest distance from the other line along this stretch, in km. */
  maxKm: number;
  /** Length of the stretch, in km. */
  lengthKm: number;
  /** Which assessment the stretch belongs to. */
  of: 'a' | 'b';
  /** [west, south, east, north] */
  bbox: [number, number, number, number];
}

export interface FrontDiff {
  stretches: ChangedStretch[];
  /** Everything that moved, for framing: [west, south, east, north], or null if nothing did. */
  bbox: [number, number, number, number] | null;
  maxShiftKm: number;
  /** Total length of the later line that sits more than the threshold away from the earlier one. */
  changedKm: number;
  thresholdKm: number;
}

const R = 6371;
const RAD = Math.PI / 180;

/** Great-circle distance in km. */
export function km(a: LatLng, b: LatLng): number {
  const dLat = (b[0] - a[0]) * RAD;
  const dLng = (b[1] - a[1]) * RAD;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * RAD) * Math.cos(b[0] * RAD) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Distance from a point to a segment, in km, on a local equirectangular
 * projection. Over the few hundred kilometres of a front the error is well
 * under the data's own generalisation.
 */
function pointSegKm(p: LatLng, a: LatLng, b: LatLng): number {
  const k = Math.cos(p[0] * RAD);
  const ax = (a[1] - p[1]) * k, ay = a[0] - p[0];
  const bx = (b[1] - p[1]) * k, by = b[0] - p[0];
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 > 0 ? -(ax * dx + ay * dy) / len2 : 0;
  t = Math.max(0, Math.min(1, t));
  const x = ax + t * dx, y = ay + t * dy;
  return Math.sqrt(x * x + y * y) * RAD * R;
}

/** Shortest distance from a point to any segment of a set of lines, in km. */
export function distanceToLines(p: LatLng, lines: LatLng[][]): number {
  let best = Infinity;
  for (const line of lines) {
    if (line.length === 1) { best = Math.min(best, km(p, line[0])); continue; }
    for (let i = 1; i < line.length; i++) {
      const d = pointSegKm(p, line[i - 1], line[i]);
      if (d < best) best = d;
    }
  }
  return best;
}

function bboxOf(path: LatLng[]): [number, number, number, number] {
  let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity;
  for (const [lat, lng] of path) {
    if (lng < w) w = lng; if (lng > e) e = lng;
    if (lat < s) s = lat; if (lat > n) n = lat;
  }
  return [w, s, e, n];
}

function union(a: [number, number, number, number] | null, b: [number, number, number, number]): [number, number, number, number] {
  return a ? [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])] : b;
}

function lengthKm(path: LatLng[]): number {
  let t = 0;
  for (let i = 1; i < path.length; i++) t += km(path[i - 1], path[i]);
  return t;
}

/**
 * Densifies a line so that a vertex is never further apart than `stepKm`: a
 * long straight stretch with no vertices in the middle would otherwise hide
 * a shift that happens between its ends.
 */
export function densify(line: LatLng[], stepKm: number): LatLng[] {
  if (line.length < 2) return line;
  const out: LatLng[] = [line[0]];
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1], b = line[i];
    const n = Math.min(200, Math.ceil(km(a, b) / stepKm));
    for (let j = 1; j <= n; j++) out.push([a[0] + ((b[0] - a[0]) * j) / n, a[1] + ((b[1] - a[1]) * j) / n]);
  }
  return out;
}

/** The runs of `from` that lie further than the threshold from `to`. */
function movedRuns(from: LatLng[][], to: LatLng[][], thresholdKm: number, of: 'a' | 'b'): ChangedStretch[] {
  const out: ChangedStretch[] = [];
  for (const raw of from) {
    const line = densify(raw, Math.max(0.5, thresholdKm / 2));
    let run: LatLng[] = [];
    let max = 0;
    const flush = () => {
      // A run of one vertex is a spike in the generalisation, not a stretch.
      if (run.length >= 2) out.push({ path: run, maxKm: max, lengthKm: lengthKm(run), of, bbox: bboxOf(run) });
      run = []; max = 0;
    };
    for (const p of line) {
      const d = distanceToLines(p, to);
      if (d > thresholdKm) { run.push(p); if (d > max) max = d; }
      else flush();
    }
    flush();
  }
  return out;
}

/**
 * Compares two dated front lines.
 *
 * `thresholdKm` should be at least twice the coarser generalisation of the
 * two inputs: closer than that, two copies of the same line can differ only
 * because the service simplified them differently.
 */
export function diffFronts(a: LatLng[][], b: LatLng[][], thresholdKm = 3): FrontDiff {
  const stretches = [...movedRuns(b, a, thresholdKm, 'b'), ...movedRuns(a, b, thresholdKm, 'a')]
    .sort((x, y) => y.maxKm - x.maxKm);
  let bbox: FrontDiff['bbox'] = null;
  for (const s of stretches) bbox = union(bbox, s.bbox);
  return {
    stretches,
    bbox,
    maxShiftKm: stretches.reduce((m, s) => Math.max(m, s.maxKm), 0),
    changedKm: stretches.filter((s) => s.of === 'b').reduce((t, s) => t + s.lengthKm, 0),
    thresholdKm,
  };
}

/** Pads a bbox by a fraction of its size, with a floor in degrees, for framing. */
export function padBbox(b: [number, number, number, number], frac = 0.25, minDeg = 0.25): [number, number, number, number] {
  const w = Math.max(b[2] - b[0], minDeg), h = Math.max(b[3] - b[1], minDeg);
  const cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2;
  const hw = (w * (1 + frac)) / 2, hh = (h * (1 + frac)) / 2;
  return [cx - hw, cy - hh, cx + hw, cy + hh];
}
