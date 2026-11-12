// Builds src/data/yemen/districts.json from geoBoundaries' YEM ADM2 release.
//
//   node scripts/build-yem-districts.mjs <geoBoundaries-YEM-ADM2_simplified.geojson>
//
// Source: Central Statistical Organization (CSO) and OCHA Yemen, via
// geoBoundaries gbOpen (boundary year 2021, CC BY 3.0 IGO). The output is
// administrative reference only: district outlines as one shared-border mesh
// so neighbours agree on their common edge, and a label point per district.
// Nothing here says anything about who controls a district.
import fs from 'node:fs';
import { topology } from 'topojson-server';
import { presimplify, simplify, quantile } from 'topojson-simplify';
import { mesh, feature } from 'topojson-client';
import polylabelish from './lib-centroid.mjs';

const [src] = process.argv.slice(2);
const fc = JSON.parse(fs.readFileSync(src, 'utf8'));
let topo = topology({ d: fc }, 1e5);
topo = presimplify(topo);
topo = simplify(topo, quantile(topo, 0.35));
const lines = mesh(topo, topo.objects.d);
const round = (c) => [Math.round(c[0] * 1e3) / 1e3, Math.round(c[1] * 1e3) / 1e3];
const dedupe = (line) => line.map(round).filter((p, i, a) => i === 0 || p[0] !== a[i - 1][0] || p[1] !== a[i - 1][1]);
const outLines = lines.coordinates.map(dedupe).filter((l) => l.length > 1);
const feats = feature(topo, topo.objects.d).features;
const labels = feats.map((f) => ({ n: f.properties.shapeName, at: round(polylabelish(f.geometry)) }));
const out = {
  meta: {
    source: 'Central Statistical Organization (CSO), OCHA Yemen — via geoBoundaries gbOpen YEM-ADM2-15242507',
    licence: 'CC BY 3.0 IGO',
    attribution: 'Distrikter: CSO / OCHA Yemen (CC BY 3.0 IGO), via geoBoundaries',
    boundaryYear: 2021,
    units: feats.length,
    built: new Date().toISOString().slice(0, 10),
    note: 'Administrative reference only. Carries no control assessment.',
  },
  lines: outLines,
  labels,
};
fs.writeFileSync('src/data/yemen/districts.json', JSON.stringify(out));
console.log(feats.length, 'districts', outLines.length, 'lines', outLines.reduce((t, l) => t + l.length, 0), 'vertices', fs.statSync('src/data/yemen/districts.json').size, 'bytes');
