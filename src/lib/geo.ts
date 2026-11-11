/** Pure geographic helpers. No DOM, no three.js – covered by tests/geo.test.ts. */

export type LatLng = [number, number];

const R_KM = 6371.0088;
const KM_PER_NM = 1.852;
const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

/** Great-circle distance in km. Longitudes may be unwrapped (e.g. 190 = -170). */
export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = rad(b[0] - a[0]);
  const dLng = rad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Length of a polyline along great-circle legs, in km. */
export function pathLengthKm(pts: LatLng[]): number {
  let km = 0;
  for (let i = 1; i < pts.length; i++) km += haversineKm(pts[i - 1], pts[i]);
  return km;
}

export const kmToNm = (km: number) => km / KM_PER_NM;

/** Sailing days for a distance in nautical miles at a constant speed in knots. */
export function sailingDays(nm: number, knots: number): number {
  if (knots <= 0) return Infinity;
  return nm / knots / 24;
}

/** Normalise a longitude into [-180, 180). */
export function wrapLng(lng: number): number {
  return ((((lng + 180) % 360) + 360) % 360) - 180;
}

/**
 * Make longitudes continuous so that no step jumps more than 180°.
 * A path from 170°E to 170°W becomes 170 → 190 instead of 170 → -170,
 * so renderers that interpolate lat/lng draw the short way across the antimeridian.
 */
export function unwrapLongitudes(pts: LatLng[]): LatLng[] {
  if (!pts.length) return [];
  const out: LatLng[] = [[pts[0][0], pts[0][1]]];
  for (let i = 1; i < pts.length; i++) {
    const prev = out[i - 1][1];
    let lng = pts[i][1];
    while (lng - prev > 180) lng -= 360;
    while (lng - prev < -180) lng += 360;
    out.push([pts[i][0], lng]);
  }
  return out;
}

/** n intermediate points on the great circle from a to b (excluding a, including b). */
export function greatCircle(a: LatLng, b: LatLng, n: number): LatLng[] {
  const [la1, lo1, la2, lo2] = [rad(a[0]), rad(a[1]), rad(b[0]), rad(b[1])];
  const d = haversineKm(a, b) / R_KM;
  if (d < 1e-9) return [b];
  const out: LatLng[] = [];
  for (let i = 1; i <= n; i++) {
    const f = i / n;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);
    const x = A * Math.cos(la1) * Math.cos(lo1) + B * Math.cos(la2) * Math.cos(lo2);
    const y = A * Math.cos(la1) * Math.sin(lo1) + B * Math.cos(la2) * Math.sin(lo2);
    const z = A * Math.sin(la1) + B * Math.sin(la2);
    out.push([deg(Math.atan2(z, Math.sqrt(x * x + y * y))), deg(Math.atan2(y, x))]);
  }
  return out;
}

/**
 * Turn sparse waypoints into a dense geodesic polyline with continuous longitudes.
 * maxStepKm bounds the leg length so the drawn line follows the great circle.
 */
export function densify(pts: LatLng[], maxStepKm = 250): LatLng[] {
  if (pts.length < 2) return pts.slice();
  const out: LatLng[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const n = Math.max(1, Math.ceil(haversineKm(pts[i - 1], pts[i]) / maxStepKm));
    out.push(...greatCircle(pts[i - 1], pts[i], n));
  }
  return unwrapLongitudes(out);
}

/** Area-weighted centroid of the largest ring of a GeoJSON Polygon/MultiPolygon. */
export function centroid(geometry: { type: string; coordinates: unknown }): LatLng {
  const polys: number[][][][] =
    geometry.type === 'Polygon'
      ? [geometry.coordinates as number[][][]]
      : geometry.type === 'MultiPolygon'
        ? (geometry.coordinates as number[][][][])
        : [];
  let best: LatLng = [0, 0];
  let bestArea = -1;
  for (const poly of polys) {
    const ring = unwrapLongitudes(poly[0].map(([lng, lat]) => [lat, lng] as LatLng));
    let a = 0;
    let cx = 0;
    let cy = 0;
    for (let i = 0; i < ring.length - 1; i++) {
      const [y0, x0] = ring[i];
      const [y1, x1] = ring[i + 1];
      const f = x0 * y1 - x1 * y0;
      a += f;
      cx += (x0 + x1) * f;
      cy += (y0 + y1) * f;
    }
    const area = Math.abs(a / 2);
    if (area > bestArea && a !== 0) {
      bestArea = area;
      best = [cy / (3 * a), wrapLng(cx / (3 * a))];
    }
  }
  return best;
}
