/**
 * Builds the bundled base-map detail pack.
 *
 * A published artifact cannot reach any external host, so no tile server will
 * ever serve this map. The detail therefore has to travel with the app. This
 * clips Natural Earth 10m (public domain) to the regions the atlas actually
 * covers, keeps only the fields the map draws, and rounds coordinates to what
 * the zoom range can resolve.
 *
 * What this is NOT: street-level data. Natural Earth 10m is highway and
 * settlement scale. It makes the regional map read as a map rather than a void;
 * it does not make it Google Maps.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const SRC = '/tmp/ne-detail/ne/geojson';

/** [minLon, minLat, maxLon, maxLat] around each covered conflict. */
const REGIONS = {
  ukraine:   [21.0, 43.0, 41.5, 53.5],
  caucasus:  [38.0, 40.0, 50.5, 48.0],
  yemen:     [41.0, 11.5, 55.0, 19.5],
  syria:     [34.5, 31.5, 43.0, 38.5],
  sudan:     [21.0,  8.0, 39.5, 23.5],
  libya:     [ 9.0, 19.0, 26.0, 34.0],
  drc:       [11.5, -14.0, 32.5,  6.0],
  palestine: [33.8, 29.2, 36.2, 33.5],
};

const bboxes = Object.values(REGIONS);
const inAny = (lon, lat) => bboxes.some((b) => lon >= b[0] && lon <= b[2] && lat >= b[1] && lat <= b[3]);
const r5 = (n) => Math.round(n * 1e3) / 1e3;

/**
 * Douglas-Peucker. The regional map tops out around z11, where a degree is a
 * few hundred pixels: vertices closer together than the tolerance below cannot
 * be told apart on screen, so carrying them is pure weight.
 */
function simplify(pts, tol) {
  if (pts.length < 3) return pts;
  const sq = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
  const segDist = (p, a, b) => {
    let [x, y] = a;
    let dx = b[0] - x, dy = b[1] - y;
    if (dx || dy) {
      const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);
      if (t > 1) [x, y] = b;
      else if (t > 0) { x += dx * t; y += dy * t; }
    }
    return sq(p, [x, y]);
  };
  const t2 = tol * tol;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [i, j] = stack.pop();
    let max = 0, idx = -1;
    for (let k = i + 1; k < j; k++) {
      const d = segDist(pts[k], pts[i], pts[j]);
      if (d > max) { max = d; idx = k; }
    }
    if (max > t2 && idx > 0) { keep[idx] = 1; stack.push([i, idx], [idx, j]); }
  }
  const out = pts.filter((_, i) => keep[i]);
  // Drop vertices that rounding collapsed onto their neighbour.
  return out.filter((p, i) => i === 0 || p[0] !== out[i - 1][0] || p[1] !== out[i - 1][1]);
}

function clipLine(coords) {
  // Keep a line if any vertex falls in a covered region; a road that only
  // clips a corner still orients the reader at the edge of the view.
  if (!coords.some(([lon, lat]) => inAny(lon, lat))) return null;
  const out = simplify(coords.map(([lon, lat]) => [r5(lon), r5(lat)]), 0.004);
  return out.length >= 2 ? out : null;
}

function load(name) {
  return JSON.parse(readFileSync(`${SRC}/${name}.geojson`, 'utf8'));
}

// ── Roads: trunk network only. Natural Earth's lower scaleranks are the
// through-routes; the higher ones add noise without adding orientation.
const ROAD_KEEP = new Set(['Major Highway', 'Secondary Highway', 'Road']);
const roads = [];
for (const f of load('ne_10m_roads').features) {
  const p = f.properties;
  if (!ROAD_KEEP.has(p.type)) continue;
  if (p.scalerank > 8) continue;
  const g = f.geometry;
  if (g.type !== 'LineString') continue;
  const c = clipLine(g.coordinates);
  if (!c) continue;
  roads.push({
    type: 'Feature',
    properties: { k: p.type === 'Major Highway' ? 1 : p.type === 'Secondary Highway' ? 2 : 3, n: p.label || null },
    geometry: { type: 'LineString', coordinates: c },
  });
}

const rail = [];
for (const f of load('ne_10m_railroads').features) {
  const g = f.geometry;
  if (g.type !== 'LineString') continue;
  const c = clipLine(g.coordinates);
  if (!c) continue;
  rail.push({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: c } });
}

// ── Urban footprints: the single biggest gain in "this looks like a map".
const urban = [];
for (const f of load('ne_10m_urban_areas').features) {
  const g = f.geometry;
  const rings = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
  const kept = rings
    .map((poly) => poly.map((ring) => simplify(ring.map(([lon, lat]) => [r5(lon), r5(lat)]), 0.004)).filter((ring) => ring.length >= 4))
    .filter((poly) => poly.length)
    .filter((poly) => poly[0].some(([lon, lat]) => inAny(lon, lat)));
  if (!kept.length) continue;
  urban.push({ type: 'Feature', properties: {}, geometry: { type: 'MultiPolygon', coordinates: kept } });
}

// ── Settlements, with population so the map can size and rank labels.
const places = [];
for (const f of load('ne_10m_populated_places').features) {
  const p = f.properties;
  const [lon, lat] = f.geometry.coordinates;
  if (!inAny(lon, lat)) continue;
  places.push({
    type: 'Feature',
    properties: {
      n: p.NAME, pop: p.POP_MAX ?? 0, rank: p.SCALERANK ?? 10,
      cap: p.ADM0CAP ? 1 : p.FEATURECLA === 'Admin-1 capital' ? 2 : 0,
      iso: p.ISO_A2 ?? null,
    },
    geometry: { type: 'Point', coordinates: [r5(lon), r5(lat)] },
  });
}

// ── Settlements. Natural Earth only carries the big places, which leaves a
// regional map nearly nameless. This adds the small ones, which is most of
// what a reader actually looks for at close zoom. No population field, so
// label priority falls to Natural Earth's ranked places first and MapLibre's
// own collision handling after that.
const towns = [];
{
  const db = JSON.parse(readFileSync('/tmp/cities/json/countries+states+cities.json', 'utf8'));
  const major = new Set(places.map((p) => p.properties.n.toLowerCase()));
  for (const country of db) {
    for (const st of country.states ?? []) {
      for (const city of st.cities ?? []) {
        const lon = Number(city.longitude);
        const lat = Number(city.latitude);
        if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;
        if (!inAny(lon, lat)) continue;
        // Skip the ones Natural Earth already carries with a population, so a
        // city is not labelled twice.
        if (major.has(String(city.name).toLowerCase())) continue;
        towns.push({
          type: 'Feature',
          properties: { n: city.name },
          geometry: { type: 'Point', coordinates: [r5(lon), r5(lat)] },
        });
      }
    }
  }
}

mkdirSync('src/data/detail', { recursive: true });
const pack = {
  meta: {
    source: 'Natural Earth 10m; settlements from the Countries States Cities database',
    licence: 'Natural Earth: public domain. Settlements: ODbL.',
    attribution: 'Natural Earth \u00b7 CSC (ODbL)',
    built: new Date().toISOString().slice(0, 10),
    scale: '1:10m — highway and settlement scale, not street level',
    regions: REGIONS,
  },
  roads: { type: 'FeatureCollection', features: roads },
  rail: { type: 'FeatureCollection', features: rail },
  urban: { type: 'FeatureCollection', features: urban },
  places: { type: 'FeatureCollection', features: places },
  towns: { type: 'FeatureCollection', features: towns },
};
const json = JSON.stringify(pack);
writeFileSync('src/data/detail/pack.json', json);
console.log(
  `roads ${roads.length}  rail ${rail.length}  urban ${urban.length}  places ${places.length}  towns ${towns.length}  ` +
  `→ ${(json.length / 1024).toFixed(0)} KB`,
);
