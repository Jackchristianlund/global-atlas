/**
 * Control over time: what ISW/CTP assessed as Russian-controlled on a past
 * date, compared with what it assesses now.
 *
 * ISW's public archive has one clean, dated series for 2026: a snapshot of
 * assessed Russian control for every day of May 2026 (layer "May CoT", each
 * feature with its `pub_date`). The other archive layers carry edit
 * timestamps instead of assessment dates, or areas that do not match what
 * they are named for, so they are not used. Same publisher, same permission
 * (non-commercial) as the current layer — see docs/CONTROL.md.
 *
 * The comparison is geometry, both ways: ground assessed as controlled now
 * but not then, and ground assessed as controlled then but not now. It says
 * nothing about why: the second can be a Ukrainian advance or ISW revising an
 * earlier assessment, and the interface says so.
 */
import polygonClipping, { type MultiPolygon, type Polygon } from 'polygon-clipping';
import { queryUrl, type GeoJsonFeature } from './arcgis';
import { areaKm2 } from './control';
import { simplifyPath } from './simplify';

export const ISW_MAY_2026 = 'https://services5.arcgis.com/SaBe5HMtmnbqSWlu/ArcGIS/rest/services/May_CoT_view/FeatureServer/0';

export { ARCHIVE_DAYS } from './archiveDays';

/**
 * Both sides are generalised to the same tolerance before comparing, so the
 * difference is not dominated by the two copies being simplified differently.
 * The archive is served at 0.002° (~200 m); pieces smaller than this area
 * are generalisation noise and are dropped.
 */
export const COMPARE_TOLERANCE_DEG = 0.002;
export const MIN_PIECE_KM2 = 1;

export interface ControlChange {
  since: string;
  now: string;
  gained: MultiPolygon;
  lost: MultiPolygon;
  gainedKm2: number;
  lostKm2: number;
  /** [west, south, east, north] of everything that changed, or null. */
  bbox: [number, number, number, number] | null;
}

export type ChangeState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; change: ControlChange }
  | { status: 'unavailable'; reason: string };

/** The archive query for one day. */
export function dayQueryUrl(day: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new Error('bad date');
  return queryUrl(ISW_MAY_2026, {
    where: `pub_date >= timestamp '${day} 00:00:00' AND pub_date <= timestamp '${day} 23:59:59'`,
    outFields: 'uid,pub_date',
    precision: 4,
    toleranceDeg: COMPARE_TOLERANCE_DEG,
  });
}

/** GeoJSON (Multi)Polygons to the clipping library's MultiPolygon, simplified. */
function toMulti(features: GeoJsonFeature[], tolerance: number): MultiPolygon {
  const out: MultiPolygon = [];
  for (const f of features) {
    const g = f.geometry;
    const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
    for (const p of polys) {
      const rings = p.map((r) => simplifyPath(r as [number, number][], tolerance)).filter((r) => r.length >= 4);
      if (rings.length && rings[0].length >= 4) out.push(rings as Polygon);
    }
  }
  return out;
}

const mpArea = (mp: MultiPolygon) => areaKm2({ type: 'MultiPolygon', coordinates: mp as number[][][][] });

/** Keeps the pieces of a difference that are larger than generalisation noise. */
function significant(mp: MultiPolygon): MultiPolygon {
  return mp.filter((p) => areaKm2({ type: 'Polygon', coordinates: p as number[][][] }) >= MIN_PIECE_KM2);
}

function bboxOf(mps: MultiPolygon[]): [number, number, number, number] | null {
  let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity;
  for (const mp of mps) for (const p of mp) for (const [x, y] of p[0]) {
    if (x < w) w = x; if (x > e) e = x; if (y < s) s = y; if (y > n) n = y;
  }
  return Number.isFinite(w) ? [w, s, e, n] : null;
}

/**
 * Compares control on two dates. `now` is the current layer's controlled
 * polygons (kind 'control'); `then` the archive's polygons for `since`.
 */
export function compareControl(now: GeoJsonFeature[], then: GeoJsonFeature[], since: string, nowDate: string): ControlChange {
  const a = polygonClipping.union(toMulti(now, COMPARE_TOLERANCE_DEG));
  const b = polygonClipping.union(toMulti(then, COMPARE_TOLERANCE_DEG));
  const gained = significant(polygonClipping.difference(a, b));
  const lost = significant(polygonClipping.difference(b, a));
  return {
    since, now: nowDate, gained, lost,
    gainedKm2: Math.round(mpArea(gained)),
    lostKm2: Math.round(mpArea(lost)),
    bbox: bboxOf([gained, lost]),
  };
}

/** Plausible total for a day of the archive: the same order as today's. */
const MIN_KM2 = 50_000;
const MAX_KM2 = 200_000;

export async function loadArchiveDay(day: string, fetchImpl: typeof fetch = fetch): Promise<GeoJsonFeature[]> {
  const res = await fetchImpl(dayQueryUrl(day));
  if (!res.ok) throw new Error(`ISW archive HTTP ${res.status}`);
  const body = (await res.json()) as { features?: GeoJsonFeature[]; error?: { message: string } };
  if (body.error) throw new Error(body.error.message);
  const features = (body.features ?? []).filter((f) => f.geometry && (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon'));
  if (!features.length) throw new Error(`no archive snapshot for ${day}`);
  const total = features.reduce((t, f) => t + areaKm2(f.geometry), 0);
  if (total < MIN_KM2 || total > MAX_KM2) throw new Error(`implausible archive area ${Math.round(total)} km²`);
  return features;
}
