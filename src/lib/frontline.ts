/**
 * The sourced front line.
 *
 * Two tiers, in this order:
 *   1. Live — queried from OCHA's feature service in the reader's browser, at
 *      the service's own precision.
 *   2. Bundled — the same ISW/CTP assessment, retrieved 11 Nov 2026 and
 *      generalized server-side, so the layer is never empty and never guessed.
 *
 * There is no third tier. If both are unavailable the layer reports that and
 * draws nothing.
 */
import snapshot from '../data/frontline/ukr-ocha.json';
import {
  esriToGeoJson,
  queryUrl,
  validateGeometry,
  type GeoJsonFC,
  type GeoJsonFeature,
} from './arcgis';

export const FRONTLINE_SERVICE =
  'https://gis.unocha.org/server/rest/services/Hosted/UKR_Front_Line/FeatureServer/0';

/** Ukraine plus a margin, used to reject a feed in the wrong projection. */
const UKR_BBOX: [number, number, number, number] = [21.5, 43.8, 41.0, 53.0];

export interface FrontlineMeta {
  id: string;
  kind: string;
  country: string;
  source: string;
  publisher: string;
  attribution: string;
  serviceUrl: string;
  assessmentDate: string;
  retrieved: string;
  precision: string;
  confidence: string;
  coverage: string;
  realtime: boolean;
  licence: string;
  licenceNote: string;
  actorClassification: string;
  featureCount: number;
  vertexCount: number;
  toleranceMetresApprox: Record<string, number>;
}

export interface FrontlineSet {
  features: GeoJsonFeature[];
  meta: FrontlineMeta;
  /** Where this particular set came from, for the caption under the map. */
  tier: 'live' | 'bundled';
}

const SNAP = snapshot as unknown as GeoJsonFC & { metadata: FrontlineMeta };

export function bundledFrontline(): FrontlineSet {
  return { features: SNAP.features, meta: SNAP.metadata, tier: 'bundled' };
}

export function frontlineMeta(): FrontlineMeta {
  return SNAP.metadata;
}

/** Every vertex, flattened, for renderers that want plain paths. */
export function frontlinePaths(set: FrontlineSet): { id: string; coords: number[][]; date: string }[] {
  const out: { id: string; coords: number[][]; date: string }[] = [];
  for (const f of set.features) {
    const date = String(f.properties.date ?? set.meta.assessmentDate);
    const id = String(f.id ?? f.properties.objectid ?? out.length);
    if (f.geometry.type === 'LineString') {
      out.push({ id, coords: f.geometry.coordinates, date });
    } else if (f.geometry.type === 'MultiLineString') {
      f.geometry.coordinates.forEach((part, i) => out.push({ id: `${id}-${i}`, coords: part, date }));
    }
  }
  return out;
}

export interface FetchResult {
  set: FrontlineSet;
  /** Why the live tier was not used, when it was not. */
  note?: string;
}

/**
 * Tries the live service, falls back to the bundle. The fallback is announced,
 * never silent: a reader looking at a week-old line is entitled to know that
 * is what they are looking at.
 */
export async function loadFrontline(
  signal?: AbortSignal,
  fetchImpl: typeof fetch = fetch,
): Promise<FetchResult> {
  const url = queryUrl(FRONTLINE_SERVICE, {
    outFields: 'objectid,date,source',
    precision: 5,
    toleranceDeg: 0.001,
  });

  try {
    const res = await fetchImpl(url, { signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = (await res.json()) as GeoJsonFC & { error?: { message: string } };
    if (body.error) throw new Error(body.error.message);

    // A geojson response is already degrees; an f=json one is not. Both shapes
    // have a `features` array, so the test has to be what is inside it: GeoJSON
    // geometry carries a `type`, Esri geometry carries `paths` or `rings`.
    const first = (body.features ?? [])[0] as { geometry?: { type?: string } } | undefined;
    const isGeoJson = typeof first?.geometry?.type === 'string';
    const features = isGeoJson ? (body.features as GeoJsonFeature[]) : esriToGeoJson(body as never);

    const check = validateGeometry(features, { bbox: UKR_BBOX, maxStepKm: 40 });
    if (!check.ok) throw new Error(`validation: ${check.errors[0]}`);

    const dates = features
      .map((f) => f.properties.date)
      .filter((d): d is number => typeof d === 'number');
    const latest = dates.length ? new Date(Math.max(...dates)).toISOString().slice(0, 10) : undefined;

    return {
      set: {
        features,
        tier: 'live',
        meta: {
          ...SNAP.metadata,
          assessmentDate: latest ?? SNAP.metadata.assessmentDate,
          retrieved: new Date().toISOString().slice(0, 10),
          precision: 'service',
          featureCount: features.length,
          vertexCount: check.vertices,
        },
      },
    };
  } catch (err) {
    if (signal?.aborted) throw err;
    return {
      set: bundledFrontline(),
      note: err instanceof Error ? err.message : 'unreachable',
    };
  }
}

/** How stale the assessment is, measured from a given day. */
export function ageInDays(assessmentDate: string, from: string): number {
  const a = Date.parse(`${assessmentDate}T00:00:00Z`);
  const b = Date.parse(`${from}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return Number.NaN;
  return Math.round((b - a) / 86400000);
}
