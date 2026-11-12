// Builds src/data/gazetteer.json, the city list the search box suggests from,
// out of the populated places already bundled in the detail pack (Natural
// Earth 1:10m, public domain). Rows are [name, lat, lng, iso2, population].
import fs from 'node:fs';
const pack = JSON.parse(fs.readFileSync('src/data/detail/pack.json', 'utf8'));
const rows = pack.places.features
  .map((f) => [f.properties.n, Math.round(f.geometry.coordinates[1] * 1e3) / 1e3, Math.round(f.geometry.coordinates[0] * 1e3) / 1e3, f.properties.iso ?? '', f.properties.pop ?? 0])
  .sort((a, b) => b[4] - a[4]);
fs.writeFileSync('src/data/gazetteer.json', JSON.stringify(rows));
console.log(rows.length, 'places', fs.statSync('src/data/gazetteer.json').size, 'bytes');
