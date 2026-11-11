/**
 * Writes the unit manifest the topology build reads back in: the list of units
 * to keep, their names, and the geometry of the few that have no admin-1
 * counterpart in Natural Earth and must be carried over. Only the build script
 * and the tests read this; the app reads the topology.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { feature } from 'topojson-client';
const topo = JSON.parse(readFileSync('src/data/admin1.topo.json', 'utf8'));
const fc = feature(topo, topo.objects.units);
const units = fc.features.map((f) => ({
  iso: f.properties.iso, code: f.properties.code, name: f.properties.name,
  geometry: f.geometry,
}));
writeFileSync('src/data/admin1.units.json', JSON.stringify(units));
console.log('units', units.length, (JSON.stringify(units).length / 1024).toFixed(0) + ' KB');
