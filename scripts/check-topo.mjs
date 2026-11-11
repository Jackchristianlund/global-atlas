import { feature } from 'topojson-client';
import { readFileSync } from 'node:fs';
const topo = JSON.parse(readFileSync('src/data/admin1.topo.json', 'utf8'));
const fc = feature(topo, topo.objects.units);
console.log('features', fc.features.length);
for (const code of ['SY-DI','UA-43','UA-14','YE-SA','GE-SO']) {
  const f = fc.features.find((x) => x.properties.code === code);
  let c = f.geometry.coordinates;
  while (Array.isArray(c[0])) c = c[0];
  const rings = f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates.length : 1;
  console.log(code.padEnd(6), f.properties.name.padEnd(22), f.geometry.type, 'polys', rings, '-> first point', c.map((n) => n.toFixed(2)).join(', '));
}
