/**
 * Adapter for ArcGIS REST feature services.
 *
 * It exists so that frontline and control geometry can come from an
 * authorised publisher rather than being drawn by hand. It converts, it
 * validates, and it refuses — it never fills a gap. If a service is
 * unreachable or returns something that fails validation, the caller gets an
 * error and the map shows nothing, which is the honest outcome.
 */

export type GeoJsonLine = { type: 'LineString'; coordinates: number[][] };
export type GeoJsonMultiLine = { type: 'MultiLineString'; coordinates: number[][][] };
export type GeoJsonPolygon = { type: 'Polygon'; coordinates: number[][][] };
export type GeoJsonMultiPolygon = { type: 'MultiPolygon'; coordinates: number[][][][] };
export type GeoJsonGeometry = GeoJsonLine | GeoJsonMultiLine | GeoJsonPolygon | GeoJsonMultiPolygon;

export interface GeoJsonFeature {
  type: 'Feature';
  id?: number | string;
  properties: Record<string, unknown>;
  geometry: GeoJsonGeometry;
}

export interface GeoJsonFC {
  type: 'FeatureCollection';
  features: GeoJsonFeature[];
  metadata?: Record<string, unknown>;
}

/** An ArcGIS geometry as the REST API returns it with f=json. */
interface EsriGeometry {
  paths?: number[][][];
  rings?: number[][][];
}

interface EsriFeature {
  attributes?: Record<string, unknown>;
  geometry?: EsriGeometry;
}

export interface EsriQueryResponse {
  features?: EsriFeature[];
  spatialReference?: { wkid?: number; latestWkid?: number };
  error?: { code: number; message: string };
  exceededTransferLimit?: boolean;
}

const R = 6378137;

/**
 * EPSG:3857 (Web Mercator) to EPSG:4326. ArcGIS services commonly publish in
 * 3857; leaflet-style renderers and globe.gl both want degrees.
 */
export function webMercatorToLngLat([x, y]: number[]): number[] {
  const lon = (x / R) * (180 / Math.PI);
  const lat = (Math.atan(Math.sinh(y / R)) * 180) / Math.PI;
  return [round(lon), round(lat)];
}

function round(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}

/** True when a wkid denotes Web Mercator rather than plain degrees. */
export function isWebMercator(wkid?: number): boolean {
  return wkid === 3857 || wkid === 102100;
}

/**
 * Converts an ArcGIS query response into GeoJSON features. Esri calls
 * polyline parts "paths" and polygon parts "rings"; both are arrays of parts,
 * so a single-part geometry still arrives nested.
 */
export function esriToGeoJson(res: EsriQueryResponse): GeoJsonFeature[] {
  if (res.error) throw new Error(`ArcGIS error ${res.error.code}: ${res.error.message}`);
  const wkid = res.spatialReference?.latestWkid ?? res.spatialReference?.wkid;
  const project = isWebMercator(wkid) ? webMercatorToLngLat : (p: number[]) => [round(p[0]), round(p[1])];
  const out: GeoJsonFeature[] = [];

  for (const f of res.features ?? []) {
    const g = f.geometry;
    if (!g) continue;
    const props = { ...(f.attributes ?? {}) };
    if (g.paths?.length) {
      const parts = g.paths.map((part) => part.map(project));
      out.push({
        type: 'Feature',
        properties: props,
        geometry:
          parts.length === 1
            ? { type: 'LineString', coordinates: parts[0] }
            : { type: 'MultiLineString', coordinates: parts },
      });
    } else if (g.rings?.length) {
      const parts = g.rings.map((part) => part.map(project));
      out.push({
        type: 'Feature',
        properties: props,
        geometry: { type: 'Polygon', coordinates: parts },
      });
    }
  }
  return out;
}

export interface ValidateOptions {
  /** [minLon, minLat, maxLon, maxLat] the geometry must fall inside. */
  bbox?: [number, number, number, number];
  /** Largest believable gap between consecutive vertices, in kilometres. */
  maxStepKm?: number;
  minVertices?: number;
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  vertices: number;
}

function partsOf(g: GeoJsonGeometry): number[][][] {
  switch (g.type) {
    case 'LineString':
      return [g.coordinates];
    case 'MultiLineString':
      return g.coordinates;
    case 'Polygon':
      return g.coordinates;
    case 'MultiPolygon':
      return g.coordinates.flat();
  }
}

export function stepKm(a: number[], b: number[]): number {
  const dx = (b[0] - a[0]) * Math.cos((((a[1] + b[1]) / 2) * Math.PI) / 180) * 111.32;
  const dy = (b[1] - a[1]) * 110.57;
  return Math.hypot(dx, dy);
}

/**
 * Checks geometry a service handed us before it is allowed on the map. A
 * service that silently returns the wrong projection produces coordinates that
 * are numerically valid and geographically absurd, so the bbox check is the
 * one that actually catches real failures.
 */
export function validateGeometry(features: GeoJsonFeature[], opts: ValidateOptions = {}): ValidationResult {
  const errors: string[] = [];
  const { bbox, maxStepKm, minVertices = 2 } = opts;
  let vertices = 0;

  if (!features.length) errors.push('no features');

  features.forEach((f, i) => {
    const label = f.id ?? i;
    for (const part of partsOf(f.geometry)) {
      if (part.length < minVertices) errors.push(`feature ${label}: fewer than ${minVertices} vertices`);
      let prev: number[] | null = null;
      for (const p of part) {
        vertices++;
        if (!Number.isFinite(p[0]) || !Number.isFinite(p[1])) {
          errors.push(`feature ${label}: non-finite coordinate`);
          continue;
        }
        if (Math.abs(p[0]) > 180 || Math.abs(p[1]) > 90) {
          errors.push(`feature ${label}: ${p[0]},${p[1]} is not a lon/lat pair — wrong projection?`);
          continue;
        }
        if (bbox && (p[0] < bbox[0] || p[0] > bbox[2] || p[1] < bbox[1] || p[1] > bbox[3])) {
          errors.push(`feature ${label}: ${p[0]},${p[1]} outside the expected area`);
        }
        if (prev && maxStepKm) {
          const km = stepKm(prev, p);
          if (km > maxStepKm) errors.push(`feature ${label}: ${km.toFixed(1)} km jump`);
        }
        prev = p;
      }
    }
  });

  // One bad vertex is a bad feed, not a reason to print a hundred lines.
  return { ok: errors.length === 0, errors: errors.slice(0, 10), vertices };
}

/** Builds a query URL that asks a feature service for GeoJSON in degrees. */
export function queryUrl(
  service: string,
  opts: { where?: string; outFields?: string; toleranceDeg?: number; precision?: number } = {},
): string {
  const p = new URLSearchParams({
    where: opts.where ?? '1=1',
    outFields: opts.outFields ?? '*',
    returnGeometry: 'true',
    outSR: '4326',
    f: 'geojson',
  });
  if (opts.precision != null) p.set('geometryPrecision', String(opts.precision));
  if (opts.toleranceDeg != null) p.set('maxAllowableOffset', String(opts.toleranceDeg));
  return `${service}/query?${p.toString()}`;
}
