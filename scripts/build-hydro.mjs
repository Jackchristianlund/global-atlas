/**
 * Bundles Natural Earth rivers and lakes for the globe.
 *
 * Public domain, no tile server, no API key: the Earth gains real geographic
 * detail that works offline and costs nothing to serve. Rivers are kept as
 * line strings and lakes as rings, both simplified to the resolution the globe
 * actually shows.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const SRC = process.argv[2] ?? '/tmp/nehydro/ne3/geojson';
const OUT = process.argv[3] ?? 'src/data/hydro.json';

const round = (n) => Math.round(n * 100) / 100;

/** Drops points closer together than `eps` degrees; keeps ends. */
function thin(pts, eps) {
  if (pts.length < 3) return pts;
  const out = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const [x, y] = pts[i];
    const [px, py] = out[out.length - 1];
    if (Math.abs(x - px) + Math.abs(y - py) >= eps) out.push([x, y]);
  }
  out.push(pts[pts.length - 1]);
  return out;
}

const rivers = [];
const riverSrc = JSON.parse(readFileSync(`${SRC}/ne_50m_rivers_lake_centerlines_scale_rank.geojson`, 'utf8'));
for (const f of riverSrc.features) {
  // scalerank is Natural Earth's own prominence ranking; the small ones would
  // be noise at globe zoom and are left to the regional map.
  const rank = f.properties.scalerank ?? f.properties.strokeweig ?? 9;
  if (rank > 5) continue;
  const lines = f.geometry.type === 'MultiLineString' ? f.geometry.coordinates : [f.geometry.coordinates];
  for (const line of lines) {
    const pts = thin(line.map(([x, y]) => [round(x), round(y)]), 0.25);
    if (pts.length >= 2) rivers.push({ r: rank, c: pts });
  }
}

const lakes = [];
const lakeSrc = JSON.parse(readFileSync(`${SRC}/ne_50m_lakes.geojson`, 'utf8'));
for (const f of lakeSrc.features) {
  const polys = f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [f.geometry.coordinates];
  for (const poly of polys) {
    const ring = thin(poly[0].map(([x, y]) => [round(x), round(y)]), 0.12);
    // Rings that simplify below a triangle are gone, not drawn as spikes.
    if (ring.length < 5) continue;
    let area = 0;
    for (let i = 0; i < ring.length - 1; i++) area += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
    if (Math.abs(area) / 2 < 0.05) continue;
    lakes.push({ n: f.properties.name ?? null, c: ring });
  }
}

const out = { rivers, lakes, source: 'Natural Earth 1:50m (public domain)' };
writeFileSync(OUT, JSON.stringify(out));
console.log(`rivers ${rivers.length} (${rivers.reduce((n, r) => n + r.c.length, 0)} pts) | lakes ${lakes.length} | ${(JSON.stringify(out).length / 1024).toFixed(0)} KB`);
