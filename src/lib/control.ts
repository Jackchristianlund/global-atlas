/**
 * Areas of control in Ukraine, from a publisher that labels the sides.
 *
 * The front line on its own cannot say which side holds what, and the atlas
 * does not infer it. This layer is the other half: polygons a named source
 * has labelled as occupied, drawn as the source drew them, with the date the
 * source's line is from.
 *
 * Two sources, in order of preference:
 *
 * 1. **ISW / CTP, "Assessed Russian-controlled Ukrainian Territory"** — the
 *    same analysts as the front line, current to the day. ISW publishes the
 *    layer on a public ArcGIS service, but no licence for reuse is stated, so
 *    it stays switched off until ISW grants permission. The build switches it
 *    on with `VITE_ISW_CONTROL_URL` (a FeatureServer layer URL). See
 *    docs/CONTROL.md.
 * 2. **UN OCHA, Humanitarian Needs and Response Plan 2026** — the planning
 *    units OCHA labels as occupied territory ("OT"), drawn against the front
 *    line of 2 July 2025. Published by the same UN office that republishes the
 *    front line. Older than the line on the map, and shown as such: the strip
 *    between the two is change since that date, which the source does not
 *    label, so it is left uncoloured.
 *
 * Fetched live from the reader's browser, like the front line, and validated
 * before anything is drawn. Nothing is bundled and nothing is interpolated:
 * a source that cannot be reached is reported, not approximated.
 */
import { queryUrl, validateGeometry, type GeoJsonFeature } from './arcgis';

export const OCHA_OT_SERVICE = 'https://gis.unocha.org/server/rest/services/Hosted/ukr_hnrp_2026_uoa_poly/FeatureServer/2';

/** The front line the OCHA planning units were drawn against. */
export const OCHA_OT_LINE_DATE = '2025-07-02';

/** Ukraine plus a margin. */
const UKR_BBOX: [number, number, number, number] = [21.5, 43.8, 41.0, 53.0];

export type ControlSourceId = 'isw' | 'ocha-hnrp';

export interface ControlLayer {
  source: ControlSourceId;
  /** The date the polygons describe, as the source states it. */
  asOf: string;
  /** Whether the polygons are current to within days, or an older snapshot. */
  current: boolean;
  features: GeoJsonFeature[];
  vertices: number;
  /** Area of the polygons, km², for the reader to check against published figures. */
  areaKm2: number;
}

export type ControlState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; layer: ControlLayer }
  | { status: 'unavailable'; reason: string };

/** The ISW layer URL the build was given, if ISW has granted permission. */
export function iswControlUrl(env: Record<string, string | undefined> = (import.meta.env ?? {}) as never): string | null {
  const u = env.VITE_ISW_CONTROL_URL?.trim();
  return u && /^https:\/\/[^\s]+\/FeatureServer\/\d+$/.test(u) ? u : null;
}

/**
 * Only the units OCHA itself labels as occupied territory. The OCHA layer
 * also carries an unlabelled unit; it is left out rather than guessed at.
 */
export function isOchaOccupied(p: Record<string, unknown>): boolean {
  return String(p.adm1_en ?? '').trim() === 'OT' && /^UAOT_/.test(String(p.uoa_code ?? ''));
}

const RAD = Math.PI / 180;
function ringKm2(r: number[][]): number {
  let a = 0;
  for (let i = 0; i < r.length - 1; i++) {
    const [x1, y1] = r[i], [x2, y2] = r[i + 1];
    a += (x2 - x1) * RAD * (2 + Math.sin(y1 * RAD) + Math.sin(y2 * RAD));
  }
  return Math.abs((a * 6371 * 6371) / 2);
}

/** Spherical area of a (Multi)Polygon, km². */
export function areaKm2(g: GeoJsonFeature['geometry']): number {
  if (g.type !== 'Polygon' && g.type !== 'MultiPolygon') return 0;
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
  return polys.reduce((t, p) => t + ringKm2(p[0]) - p.slice(1).reduce((s, h) => s + ringKm2(h), 0), 0);
}

/**
 * Plausibility, beyond geometry: occupied territory in Ukraine has been a
 * five- or six-figure number of km² since 2022. A feed that answers with
 * a few km² or with more than Ukraine has lost its filter or its projection.
 */
const MIN_KM2 = 20_000;
const MAX_KM2 = 200_000;

let cache: ControlLayer | null = null;
export function clearControlCache(): void { cache = null; }

export async function loadControl(fetchImpl: typeof fetch = fetch, env?: Record<string, string | undefined>): Promise<ControlState> {
  if (cache) return { status: 'ready', layer: cache };
  const isw = iswControlUrl(env);
  const source: ControlSourceId = isw ? 'isw' : 'ocha-hnrp';
  const url = isw
    ? queryUrl(isw, { outFields: '*', precision: 4, toleranceDeg: 0.002 })
    : queryUrl(OCHA_OT_SERVICE, { where: "adm1_en='OT'", outFields: 'uoa_code,geozone,adm1_en', precision: 4, toleranceDeg: 0.004 });
  try {
    const res = await fetchImpl(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = (await res.json()) as { features?: GeoJsonFeature[]; error?: { message: string } };
    if (body.error) throw new Error(body.error.message);
    let features = (body.features ?? []).filter((f) => f.geometry && (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon'));
    if (!isw) features = features.filter((f) => isOchaOccupied(f.properties));
    if (!features.length) throw new Error('no labelled polygons');
    const check = validateGeometry(features, { bbox: UKR_BBOX, minVertices: 4 });
    if (!check.ok) throw new Error(`validation: ${check.errors[0]}`);
    const area = features.reduce((t, f) => t + areaKm2(f.geometry), 0);
    if (area < MIN_KM2 || area > MAX_KM2) throw new Error(`implausible area ${Math.round(area)} km²`);
    // ISW's layer is dated by its own edit date; without one, the retrieval day.
    const asOf = isw ? new Date().toISOString().slice(0, 10) : OCHA_OT_LINE_DATE;
    cache = { source, asOf, current: !!isw, features, vertices: check.vertices, areaKm2: Math.round(area) };
    return { status: 'ready', layer: cache };
  } catch (err) {
    return { status: 'unavailable', reason: err instanceof Error ? err.message : 'unreachable' };
  }
}
