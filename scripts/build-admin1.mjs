/**
 * Rebuilds the administrative geometry as a topology.
 *
 * The previous build simplified each unit on its own, which pulled shared
 * borders apart: two neighbours no longer agreed on the line between them, so
 * the map had hairline gaps and a line of contact could not be derived from the
 * geometry at all. A topology stores each border once as an arc that both
 * neighbours reference, so simplification moves both sides together and the
 * boundary between differently-held units is an object in the data.
 *
 * Source: Natural Earth 1:10m admin-1 states and provinces (public domain).
 * Abkhazia and South Ossetia are not admin-1 units and are carried over from
 * Natural Earth's disputed-areas layer via the previous build.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { topology } from 'topojson-server';
import { filter, filterWeight, presimplify, quantile, simplify } from 'topojson-simplify';

const NE = process.argv[2] ?? '/home/claude/ne/geojson/ne_10m_admin_1_states_provinces.geojson';
const OUT = process.argv[3] ?? 'src/data/admin1.topo.json';
const KEEP = Number(process.argv[4] ?? 0.06); // share of vertices to keep

const previous = JSON.parse(readFileSync('src/data/admin1.units.json', 'utf8'));
const want = new Map(previous.map((u) => [`${u.iso}:${u.code}`, u]));

const raw = JSON.parse(readFileSync(NE, 'utf8'));
const features = [];
const seen = new Set();
for (const f of raw.features) {
  const p = f.properties;
  // Natural Earth files Crimea and Sevastopol under Russia; this dataset shows
  // military control separately from sovereignty and keeps them Ukrainian, so
  // the unit is matched on its ISO 3166-2 code when the country code differs.
  let key = `${p.adm0_a3}:${p.iso_3166_2}`;
  if (!want.has(key)) {
    const alt = [...want.keys()].find((k) => k.endsWith(`:${p.iso_3166_2}`));
    if (alt) key = alt;
  }
  if (!want.has(key) || seen.has(key)) continue;
  seen.add(key);
  const u = want.get(key);
  features.push({ type: 'Feature', properties: { iso: u.iso, code: u.code, name: u.name }, geometry: f.geometry });
}
// Units with no admin-1 counterpart keep the geometry from the previous build.
for (const [key, u] of want) {
  if (seen.has(key)) continue;
  features.push({ type: 'Feature', properties: { iso: u.iso, code: u.code, name: u.name }, geometry: u.geometry });
  console.log(`carried over: ${key}`);
}

// 1e4 quantisation is about 11 m at the equator: far finer than the
// assessments this geometry carries, and much smaller on the wire.
const topo = topology({ units: { type: 'FeatureCollection', features } }, 1e4);
// `quantile(topology, p)` is the weight threshold that keeps p of the points.
const pre = presimplify(topo);
const min = quantile(pre, KEEP);
// Drop rings whose remaining detail falls below the threshold, so simplified
// slivers disappear rather than collapsing into spikes.
const out = simplify(filter(pre, filterWeight(pre, min)), min);

// A unit dropped entirely by the ring filter is a real place that would vanish
// from the map, so it is restored from the previous build at its own detail
// rather than being left out. Its border is not topological, which the data
// records so the line-of-contact derivation can skip it.
const kept = new Set(out.objects.units.geometries.map((g) => `${g.properties.iso}:${g.properties.code}`));
for (const [key, u] of want) {
  if (kept.has(key)) continue;
  const base = out.arcs.length;
  // presimplify and simplify dequantise the topology, so its arcs are plain
  // degrees and the restored ring is written the same way.
  const rings = [];
  for (const poly of u.geometry.coordinates) {
    const r = [];
    for (const ring of poly) { out.arcs.push(ring.map(([x, y]) => [x, y])); r.push([out.arcs.length - 1]); }
    rings.push(r);
  }
  out.objects.units.geometries.push({
    type: 'MultiPolygon', arcs: rings,
    properties: { iso: u.iso, code: u.code, name: u.name, standalone: true },
  });
  console.log(`restored at own detail: ${key} (arcs ${base}→${out.arcs.length})`);
}

// Four decimals is about 11 m: finer than any assessment this geometry carries.
const round = (n) => Math.round(n * 1e4) / 1e4;
out.arcs = out.arcs.map((arc) => arc.map(([x, y]) => [round(x), round(y)]));
writeFileSync(OUT, JSON.stringify(out));
const arcs = out.arcs.length;
const pts = out.arcs.reduce((n, a) => n + a.length, 0);
console.log(`units ${features.length} | arcs ${arcs} | points ${pts} | ${(JSON.stringify(out).length / 1024).toFixed(0)} KB`);
