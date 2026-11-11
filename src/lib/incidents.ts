/**
 * The event-level UCDP GED layer.
 *
 * The file is written by `npm run ingest` into `public/data/` and fetched only
 * when the layer is switched on, because at full extent it is hundreds of
 * thousands of points — far too much to carry in the bundle for everyone. Until
 * an ingest has run the file is present but empty and says so, so the app has a
 * defined answer rather than a missing file to guess about.
 */
import { cellToLatLng, gridDisk, latLngToCell } from 'h3-js';
import type { LatLng } from './geo';

export interface IncidentMeta {
  id: string; name: string; providers: string[]; license: string; attribution: string;
  url: string; vintage: string; retrieved_at: string; record_count: number; sha256: string;
}

export interface RawFile {
  status: 'ingested' | 'not_ingested';
  meta: IncidentMeta | null;
  fields: string[];
  epoch: string;
  from_year: number | null;
  date_range: [string, string] | null;
  iso: string[];
  types: string[];
  count: number;
  events: number[][];
  reason?: string;
}

/**
 * Events held column-wise in typed arrays. At this volume one object per event
 * costs far more memory than the data itself, and every frame of the globe
 * walks the whole set.
 */
export interface Incidents {
  status: 'ingested' | 'not_ingested';
  meta: IncidentMeta | null;
  reason?: string;
  dateRange: [string, string] | null;
  n: number;
  lat: Float32Array;
  lng: Float32Array;
  /** Days since `epochMs`, ascending. */
  day: Int32Array;
  /** Best fatality estimate, or -1 where the source reports none. */
  best: Int32Array;
  iso: Int16Array;
  isoNames: string[];
  /** UCDP's type of violence, by index into `typeNames`. */
  type: Int8Array;
  typeNames: string[];
  epochMs: number;
}

export const EMPTY: Incidents = {
  status: 'not_ingested', meta: null, dateRange: null, n: 0,
  lat: new Float32Array(0), lng: new Float32Array(0), day: new Int32Array(0),
  best: new Int32Array(0), iso: new Int16Array(0), isoNames: [],
  type: new Int8Array(0), typeNames: [], epochMs: Date.parse('1989-01-01'),
};

export function unpack(raw: RawFile): Incidents {
  const n = raw.events.length;
  const out: Incidents = {
    status: raw.status, meta: raw.meta, reason: raw.reason,
    dateRange: raw.date_range, n,
    lat: new Float32Array(n), lng: new Float32Array(n), day: new Int32Array(n),
    best: new Int32Array(n), iso: new Int16Array(n), isoNames: raw.iso,
    type: new Int8Array(n), typeNames: raw.types ?? [],
    epochMs: Date.parse(raw.epoch),
  };
  for (let i = 0; i < n; i++) {
    const r = raw.events[i];
    out.lat[i] = r[0] / 100;
    out.lng[i] = r[1] / 100;
    out.day[i] = r[2];
    out.best[i] = r[3];
    out.type[i] = r[4];
    out.iso[i] = r[5];
  }
  return out;
}

let cache: Promise<Incidents> | null = null;

/** Fetches and unpacks once per session. A failed fetch is reported, never faked. */
export function loadIncidents(base = '/'): Promise<Incidents> {
  cache ??= fetch(`${base}data/ucdp_events.json`)
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
    .then((j: RawFile) => unpack(j))
    .catch((e: unknown) => ({
      ...EMPTY,
      reason: `Could not read the event file: ${e instanceof Error ? e.message : String(e)}`,
    }));
  return cache;
}

/** Test seam: drop the cached fetch. */
export function resetIncidents() { cache = null; }

/** Day number of the last instant of `year`, in the file's own epoch. */
const endOfYear = (inc: Incidents, year: number) =>
  Math.floor((Date.parse(`${year}-12-31T23:59:59Z`) - inc.epochMs) / 86400000);

/** First index with `day` greater than `d`. The array is sorted, so bisect. */
function upperBound(day: Int32Array, d: number): number {
  let lo = 0, hi = day.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (day[mid] <= d) lo = mid + 1; else hi = mid;
  }
  return lo;
}

/**
 * Events up to the end of `year`, as points for the globe's bin layer.
 * Cumulative rather than per-year: the timeline asks what the record held by
 * that date, and a single year of events on its own reads as a gap in the data
 * rather than as calm.
 */
export function pointsUpTo(inc: Incidents, year: number, limit = 220000): Point[] {
  const end = upperBound(inc.day, endOfYear(inc, year));
  // Under the cap, take everything. Over it, take the most recent events: the
  // alternative, thinning evenly, would quietly drop real incidents from
  // every period instead of stating a window.
  const start = Math.max(0, end - limit);
  const out: Point[] = new Array(end - start);
  for (let i = start; i < end; i++) {
    out[i - start] = { lat: inc.lat[i], lng: inc.lng[i], best: inc.best[i], day: inc.day[i], iso: inc.iso[i], type: inc.type[i] };
  }
  return out;
}

export interface Point { lat: number; lng: number; best: number; day: number; iso: number; type: number }

/** Date of a day number, as ISO. */
export const dayToISO = (inc: Incidents, day: number) =>
  new Date(inc.epochMs + day * 86400000).toISOString().slice(0, 10);

/**
 * Summary of one bin: how many events, how many deaths the source attributes to
 * them, over what span and in which countries. Events whose source reports no
 * estimate are counted separately rather than treated as zero deaths.
 */
export function binSummary(inc: Incidents, pts: Point[]) {
  let deaths = 0, unknown = 0, lo = Infinity, hi = -Infinity;
  const isos = new Map<string, number>();
  const types = new Map<string, number>();
  for (const p of pts) {
    if (p.best >= 0) deaths += p.best; else unknown++;
    if (p.day < lo) lo = p.day;
    if (p.day > hi) hi = p.day;
    const name = inc.isoNames[p.iso];
    if (name) isos.set(name, (isos.get(name) ?? 0) + 1);
    const ty = inc.typeNames[p.type];
    if (ty) types.set(ty, (types.get(ty) ?? 0) + 1);
  }
  return {
    events: pts.length,
    deaths,
    unknown,
    from: pts.length ? dayToISO(inc, lo) : null,
    to: pts.length ? dayToISO(inc, hi) : null,
    countries: [...isos.entries()].sort((a, b) => b[1] - a[1]),
    types: [...types.entries()].sort((a, b) => b[1] - a[1]),
  };
}

/**
 * Bin size for the current camera height. Coarse bins when the whole globe is
 * in view, finer ones as you come down, so the layer carries local detail
 * without turning the overview into noise.
 */
export function binResolution(altitude: number): number {
  if (altitude > 2.4) return 1;
  if (altitude > 1.4) return 2;
  if (altitude > 0.75) return 3;
  if (altitude > 0.4) return 4;
  return 5;
}

/** Centre of a bin, for the camera. */
export const binCentre = (pts: Point[]): LatLng =>
  [pts.reduce((s, p) => s + p.lat, 0) / pts.length, pts.reduce((s, p) => s + p.lng, 0) / pts.length];

/** What globe.gl hands back for one bin of the hex layer. */
export interface HexBin { points: Point[]; sumWeight: number; center: { lat: number; lng: number } }

/**
 * The same H3 binning the globe draws with, computed here so a click can be
 * resolved to a bin directly.
 *
 * globe.gl answers a click from the polygon layer before the hex layer, so a
 * click on a bin would otherwise select the country underneath it. Relying on
 * which object was last hovered is unreliable — the hover moves to the polygon
 * as the pointer settles. Binning the points ourselves at the same resolution
 * makes the lookup exact and independent of pointer state.
 */
export function binIndex(pts: Point[], resolution: number): Map<string, Point[]> {
  const m = new Map<string, Point[]>();
  for (const p of pts) {
    const cell = latLngToCell(p.lat, p.lng, resolution);
    const arr = m.get(cell);
    if (arr) arr.push(p); else m.set(cell, [p]);
  }
  return m;
}

/**
 * The bin under a clicked point, or null where the layer has nothing there.
 *
 * The click's coordinates come from the globe's surface while the bins are
 * drawn slightly above it, so at a glancing angle the two can differ by a
 * fraction of a cell. When the exact cell holds nothing, the immediate
 * neighbours are checked and the nearest drawn bin wins. Only bins that are
 * actually on screen are ever returned; nothing is invented to fill a gap.
 */
export function binAt(index: Map<string, Point[]>, lat: number, lng: number, resolution: number): HexBin | null {
  const cell = latLngToCell(lat, lng, resolution);
  const exact = index.get(cell);
  if (exact?.length) return bin(cell, exact);
  let best: string | null = null;
  let bestD = Infinity;
  for (const c of gridDisk(cell, 1)) {
    if (c === cell || !index.get(c)?.length) continue;
    const [a, b] = cellToLatLng(c);
    const d = (a - lat) ** 2 + ((b - lng) * Math.cos((lat * Math.PI) / 180)) ** 2;
    if (d < bestD) { bestD = d; best = c; }
  }
  return best ? bin(best, index.get(best)!) : null;
}

function bin(cell: string, points: Point[]): HexBin {
  const [lat, lng] = cellToLatLng(cell);
  return { points, sumWeight: points.length, center: { lat, lng } };
}
