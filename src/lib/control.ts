/**
 * Areas of control in Ukraine, from a publisher that labels the sides.
 *
 * The front line on its own cannot say which side holds what, and the atlas
 * does not infer it. This layer is the other half: polygons a named source
 * has labelled, drawn as the source drew them, with the source's own date.
 *
 * Two sources, in order of preference:
 *
 * 1. **ISW / AEI's Critical Threats Project** — the same analysts as the
 *    front line, published daily in ISW's web map "Assessed Control of
 *    Terrain in Ukraine". The geodata is ISW's intellectual property and may
 *    be used only with ISW's written consent; ISW has consented to
 *    non-commercial use (recorded in docs/CONTROL.md). The layer therefore
 *    switches itself off if the atlas ever earns money (`COMMERCIAL`), and can
 *    be switched off by the build with `VITE_ISW_CONTROL=off`.
 *    Four of ISW's layers are used: assessed Russian-controlled terrain
 *    (control), assessed Russian advances (advance, not control), infiltration
 *    areas (presence), and the territory held before 24 February 2022 (an
 *    outline inside the controlled area).
 * 2. **UN OCHA, HNRP 2026** — the planning units OCHA labels as occupied
 *    territory, drawn against the front line of 2 July 2025. Used only when
 *    ISW's layer cannot be used or reached.
 *
 * Fetched live from the reader's browser, validated before anything is drawn.
 * Nothing is bundled and nothing is interpolated.
 */
import { queryUrl, validateGeometry, webMercatorToLngLat, type GeoJsonFeature } from './arcgis';
import { simplifyPath } from './simplify';
import { COMMERCIAL } from './entitlement';

export const OCHA_OT_SERVICE = 'https://gis.unocha.org/server/rest/services/Hosted/ukr_hnrp_2026_uoa_poly/FeatureServer/2';
/** The front line the OCHA planning units were drawn against. */
export const OCHA_OT_LINE_DATE = '2025-07-02';

/** ISW's public web map "Assessed Control of Terrain in Ukraine". */
export const ISW_WEBMAP = '9f04944a2fe84edab9da31750c2b15eb';
export const iswWebmapUrl = (id = ISW_WEBMAP) => `https://www.arcgis.com/sharing/rest/content/items/${id}/data?f=json`;

/** Which of ISW's layers are drawn, and as what. Titles as ISW names them. */
export const ISW_LAYERS: Record<string, ControlKind> = {
  'Assessed Russian-Controlled Terrain': 'control',
  // Inside ISW's assessed control already; drawn as an outline only, so the
  // line of 2014–2022 occupation shows without painting the ground twice.
  'Russian-controlled Ukrainian Territory Before Feb 24, 2022': 'pre2022',
  'Assessed Russian Advances': 'advance',
  'Assessed Russian Infiltration Areas': 'infiltration',
};

/** Ukraine plus a margin. */
const UKR_BBOX: [number, number, number, number] = [21.5, 43.8, 41.5, 53.5];

export type ControlSourceId = 'isw' | 'ocha-hnrp';
/**
 * `control` is held; `advance` is inside the forward line but not controlled;
 * `infiltration` is presence only; `pre2022` is the area held before the
 * full-scale invasion, which `control` already includes.
 */
export type ControlKind = 'control' | 'advance' | 'infiltration' | 'pre2022';

export interface ControlLayer {
  source: ControlSourceId;
  /** The date the polygons describe, as the source states it. */
  asOf: string;
  /** Whether the polygons are current to within days, or an older snapshot. */
  current: boolean;
  /** Each feature carries `properties.kind`. */
  features: GeoJsonFeature[];
  vertices: number;
  /** Area assessed as controlled, km², to check against published figures. */
  areaKm2: number;
}

export type ControlState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; layer: ControlLayer }
  | { status: 'unavailable'; reason: string };

/** Whether ISW's layer may be used in this build. */
export function iswAllowed(env: Record<string, string | undefined> = (import.meta.env ?? {}) as never, commercial = COMMERCIAL): boolean {
  if (commercial) return false; // permission covers non-commercial use only
  return env.VITE_ISW_CONTROL?.trim().toLowerCase() !== 'off';
}

/** Only the units OCHA itself labels as occupied territory. */
export function isOchaOccupied(p: Record<string, unknown>): boolean {
  return String(p.adm1_en ?? '').trim() === 'OT' && /^UAOT_/.test(String(p.uoa_code ?? ''));
}

const RAD = Math.PI / 180;
/** Signed area of a ring in km²; positive for clockwise (Esri's outer rings). */
function ringSigned(r: number[][]): number {
  let a = 0;
  for (let i = 0; i < r.length - 1; i++) {
    const [x1, y1] = r[i], [x2, y2] = r[i + 1];
    a += (x2 - x1) * RAD * (2 + Math.sin(y1 * RAD) + Math.sin(y2 * RAD));
  }
  return (a * 6371 * 6371) / 2;
}

/** Spherical area of a (Multi)Polygon, km². */
export function areaKm2(g: GeoJsonFeature['geometry']): number {
  if (g.type !== 'Polygon' && g.type !== 'MultiPolygon') return 0;
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
  return polys.reduce((t, p) => t + Math.abs(ringSigned(p[0])) - p.slice(1).reduce((s, h) => s + Math.abs(ringSigned(h)), 0), 0);
}

function inRing(pt: number[], ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/**
 * Esri polygon rings to GeoJSON. Esri puts every ring of a feature in one
 * list: outer rings run clockwise, holes counter-clockwise. GeoJSON wants
 * each outer ring followed by its own holes, so holes are assigned to the
 * outer ring that contains them. Rings are simplified to `tolerance` degrees
 * on the way, which the source's ~40,000 vertices need to draw smoothly.
 */
export function esriRingsToGeoJson(rings: number[][][], tolerance = 0): GeoJsonFeature['geometry'] | null {
  const metres = rings.some((r) => r.some((p) => Math.abs(p[0]) > 180 || Math.abs(p[1]) > 90));
  const clean = rings
    .map((r) => (metres ? r.map(webMercatorToLngLat) : r))
    .map((r) => (tolerance > 0 ? simplifyPath(r as [number, number][], tolerance) : r))
    .filter((r) => r.length >= 4);
  const outers: number[][][][] = [];
  const holes: number[][][] = [];
  for (const r of clean) (ringSigned(r) > 0 ? outers.push([r]) : holes.push(r));
  // A source that winds everything the other way round has no clockwise
  // rings at all; then every ring is an outer ring.
  if (!outers.length) return clean.length ? { type: 'MultiPolygon', coordinates: clean.map((r) => [r]) } : null;
  for (const h of holes) {
    const home = outers.find((o) => inRing(h[0], o[0]));
    if (home) home.push(h);
  }
  return outers.length === 1 ? { type: 'Polygon', coordinates: outers[0] } : { type: 'MultiPolygon', coordinates: outers };
}

interface WebMapLayer { title?: string; layers?: WebMapLayer[]; featureCollection?: { layers?: { featureSet?: { features?: { attributes?: Record<string, unknown>; geometry?: { rings?: number[][][] } }[] } }[] } }

/** ISW's web map to labelled GeoJSON features. */
export function iswFeatures(webmap: { operationalLayers?: WebMapLayer[] }, tolerance = 0.0008): { features: GeoJsonFeature[]; asOf: string | null } {
  const walk = (ls: WebMapLayer[]): WebMapLayer[] => ls.flatMap((l) => (l.layers ? walk(l.layers) : [l]));
  const features: GeoJsonFeature[] = [];
  let asOf: string | null = null;
  for (const l of walk(webmap.operationalLayers ?? [])) {
    const kind = l.title ? ISW_LAYERS[l.title] : undefined;
    if (!kind) continue;
    for (const fl of l.featureCollection?.layers ?? []) {
      for (const f of fl.featureSet?.features ?? []) {
        const g = f.geometry?.rings ? esriRingsToGeoJson(f.geometry.rings, tolerance) : null;
        if (!g) continue;
        const d = String(f.attributes?.pub_date ?? '');
        if (/^\d{4}-\d{2}-\d{2}$/.test(d) && (!asOf || d > asOf)) asOf = d;
        features.push({ type: 'Feature', properties: { kind, layer: l.title }, geometry: g });
      }
    }
  }
  return { features, asOf };
}

/**
 * Plausibility, beyond geometry: Russian-held territory in Ukraine has been a
 * five- or six-figure number of km² since 2014. A feed outside that range has
 * lost its filter or its projection.
 */
const MIN_KM2 = 20_000;
const MAX_KM2 = 200_000;

function check(features: GeoJsonFeature[]): { ok: true; vertices: number; area: number } | { ok: false; reason: string } {
  if (!features.length) return { ok: false, reason: 'no labelled polygons' };
  const v = validateGeometry(features, { bbox: UKR_BBOX, minVertices: 4 });
  if (!v.ok) return { ok: false, reason: `validation: ${v.errors[0]}` };
  const area = features.filter((f) => (f.properties.kind ?? 'control') === 'control').reduce((t, f) => t + areaKm2(f.geometry), 0);
  if (area < MIN_KM2 || area > MAX_KM2) return { ok: false, reason: `implausible area ${Math.round(area)} km²` };
  return { ok: true, vertices: v.vertices, area };
}

async function loadIsw(fetchImpl: typeof fetch): Promise<ControlLayer> {
  const res = await fetchImpl(iswWebmapUrl());
  if (!res.ok) throw new Error(`ISW HTTP ${res.status}`);
  const { features, asOf } = iswFeatures(await res.json());
  if (!asOf) throw new Error('ISW layer carries no publication date');
  const c = check(features);
  if (!c.ok) throw new Error(`ISW ${c.reason}`);
  return { source: 'isw', asOf, current: true, features, vertices: c.vertices, areaKm2: Math.round(c.area) };
}

async function loadOcha(fetchImpl: typeof fetch): Promise<ControlLayer> {
  const url = queryUrl(OCHA_OT_SERVICE, { where: "adm1_en='OT'", outFields: 'uoa_code,geozone,adm1_en', precision: 4, toleranceDeg: 0.004 });
  const res = await fetchImpl(url);
  if (!res.ok) throw new Error(`OCHA HTTP ${res.status}`);
  const body = (await res.json()) as { features?: GeoJsonFeature[]; error?: { message: string } };
  if (body.error) throw new Error(body.error.message);
  const features = (body.features ?? [])
    .filter((f) => f.geometry && (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon') && isOchaOccupied(f.properties))
    .map((f) => ({ ...f, properties: { ...f.properties, kind: 'control' } }));
  const c = check(features);
  if (!c.ok) throw new Error(c.reason);
  return { source: 'ocha-hnrp', asOf: OCHA_OT_LINE_DATE, current: false, features, vertices: c.vertices, areaKm2: Math.round(c.area) };
}

let cache: ControlLayer | null = null;
export function clearControlCache(): void { cache = null; }

export async function loadControl(fetchImpl: typeof fetch = fetch, env?: Record<string, string | undefined>, commercial = COMMERCIAL): Promise<ControlState> {
  if (cache) return { status: 'ready', layer: cache };
  const reasons: string[] = [];
  if (iswAllowed(env, commercial)) {
    try { cache = await loadIsw(fetchImpl); return { status: 'ready', layer: cache }; }
    catch (err) { reasons.push(err instanceof Error ? err.message : 'ISW unreachable'); }
  }
  try { cache = await loadOcha(fetchImpl); return { status: 'ready', layer: cache }; }
  catch (err) { reasons.push(err instanceof Error ? err.message : 'unreachable'); }
  return { status: 'unavailable', reason: reasons.join('; ') };
}

/**
 * A coarser copy for the globe. At globe distance a kilometre is a fraction
 * of a pixel, and three-globe triangulates every vertex into a raised slab,
 * so the map's ~80 m detail would cost frames for nothing. Rings that vanish
 * at this tolerance are dropped; holes stay with their ring.
 */
export function coarsen(features: GeoJsonFeature[], tolerance: number, kinds: ControlKind[] = ['control', 'advance']): GeoJsonFeature[] {
  // A thin sliver can simplify to a zero-area ring, or one wound the other
  // way. On a sphere a ring's winding decides which side is inside, so a
  // flipped ring is drawn as the rest of the world: it is dropped instead.
  const MIN_KM2 = 0.5;
  const ring = (r: number[][], outer: boolean): number[][] | null => {
    const s = simplifyPath(r as [number, number][], tolerance);
    if (new Set(s.slice(0, -1).map((p) => `${p[0]},${p[1]}`)).size < 3) return null;
    const before = ringSigned(r), after = ringSigned(s);
    if (Math.abs(after) < MIN_KM2 || Math.sign(after) !== Math.sign(before)) return null;
    if (outer && after <= 0) return null;
    return s;
  };
  const out: GeoJsonFeature[] = [];
  for (const f of features) {
    if (!kinds.includes(f.properties.kind as ControlKind)) continue;
    const g = f.geometry;
    const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
    const kept: number[][][][] = [];
    for (const p of polys) {
      const outer = ring(p[0], true);
      if (!outer) continue; // without its outer ring, the holes mean nothing
      kept.push([outer, ...p.slice(1).map((h) => ring(h, false)).filter((h): h is number[][] => !!h)]);
    }
    if (kept.length) out.push({ ...f, geometry: { type: 'MultiPolygon', coordinates: kept } });
  }
  return out;
}
