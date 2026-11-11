// Builds the bundled OCHA/ISW frontline snapshot from the arrays retrieved
// from the UKR_Front_Line FeatureServer on 2026-11-11.
//
// Provenance of these coordinates: they are the service's OWN generalized
// output (server-side maxAllowableOffset), not a redrawing. Nothing here is
// interpolated, smoothed or invented. The tolerance is recorded below so the
// map can state it.
import { readFileSync, writeFileSync } from 'node:fs';

const main = JSON.parse(readFileSync('src/data/frontline/raw-395.json', 'utf8'));
const short = JSON.parse(readFileSync('src/data/frontline/raw-short.json', 'utf8'));

const SEGMENTS = [
  { id: 395, coords: main, tolerance: 0.012, part: 'main' },
  ...short.map((f) => ({ id: f.id, coords: f.c, tolerance: 0.003, part: 'northern' })),
];

// --- validation -----------------------------------------------------------
const UKR = { minLon: 22.0, maxLon: 40.3, minLat: 44.3, maxLat: 52.4 };
const errors = [];
let pairs = 0;

for (const s of SEGMENTS) {
  if (s.coords.length < 2) errors.push(`segment ${s.id}: fewer than 2 vertices`);
  let prev = null;
  for (const [lon, lat] of s.coords) {
    pairs++;
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) errors.push(`segment ${s.id}: non-finite coordinate`);
    if (lon < UKR.minLon || lon > UKR.maxLon || lat < UKR.minLat || lat > UKR.maxLat)
      errors.push(`segment ${s.id}: ${lon},${lat} outside Ukraine's bounding box`);
    if (prev) {
      // No vertex may jump further than a generalization tolerance can explain.
      const dx = (lon - prev[0]) * Math.cos((lat * Math.PI) / 180) * 111.32;
      const dy = (lat - prev[1]) * 110.57;
      const km = Math.hypot(dx, dy);
      if (km > 25) errors.push(`segment ${s.id}: ${km.toFixed(1)} km jump at ${lon},${lat}`);
    }
    prev = [lon, lat];
  }
}
if (errors.length) {
  console.error('VALIDATION FAILED');
  for (const e of errors.slice(0, 20)) console.error(' -', e);
  process.exit(1);
}

const lons = SEGMENTS.flatMap((s) => s.coords.map((c) => c[0]));
const lats = SEGMENTS.flatMap((s) => s.coords.map((c) => c[1]));

const fc = {
  type: 'FeatureCollection',
  metadata: {
    id: 'ukr-ocha-isw',
    layer: 'Front Line',
    // What the geometry is, in the source's own terms. ISW assesses a line of
    // contact; it does not label which side of each segment is whose, so this
    // file must not either.
    kind: 'contact_line',
    actorClassification: 'unlabelled_by_source',
    country: 'UKR',
    source: 'Institute for the Study of War and American Enterprise Institutes Critical Threats Project',
    publisher: 'UN OCHA',
    attribution:
      'OCHA, Institute for the Study of War and American Enterprise Institute’s Critical Threats Project',
    serviceUrl:
      'https://gis.unocha.org/server/rest/services/Hosted/UKR_Front_Line/FeatureServer/0',
    assessmentDate: '2026-11-04',
    retrieved: '2026-11-11',
    sourceCrs: 'EPSG:3857',
    crs: 'EPSG:4326',
    precision: 'generalized',
    // Server-side Douglas-Peucker, in degrees, as requested of the service.
    toleranceDeg: { main: 0.012, northern: 0.003 },
    toleranceMetresApprox: { main: 1300, northern: 330 },
    confidence: 'source_assessment',
    coverage: 'Assessed line of contact across Ukraine; no coverage of Crimea’s 2014 line.',
    realtime: false,
    licence: 'unverified',
    licenceNote:
      'OCHA republishes ISW/CTP assessments. Attribution to OCHA, ISW and CTP is required. Commercial redistribution rights are NOT established — resolve with ISW/CTP before any paid tier ships.',
    featureCount: SEGMENTS.length,
    vertexCount: pairs,
    bbox: [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)],
  },
  features: SEGMENTS.map((s) => ({
    type: 'Feature',
    id: s.id,
    properties: {
      objectid: s.id,
      part: s.part,
      date: '2026-11-04',
      toleranceDeg: s.tolerance,
      vertices: s.coords.length,
    },
    geometry: { type: 'LineString', coordinates: s.coords },
  })),
};

writeFileSync('src/data/frontline/ukr-ocha.json', JSON.stringify(fc));
console.log(
  `ok: ${fc.features.length} features, ${pairs} vertices, bbox ${fc.metadata.bbox.map((n) => n.toFixed(2)).join(', ')}`,
);
