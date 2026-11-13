// Refreshes the bundled front-line snapshot (src/data/frontline/ukr-ocha.json)
// from UN OCHA's republication of ISW/CTP's line of contact.
//
//   npx tsx scripts/refresh-frontline.ts            # fetch from the service
//   npx tsx scripts/refresh-frontline.ts file.json  # use a saved response
//
// The bundled copy is what the map shows when the live service cannot be
// reached. Run weekly by .github/workflows/refresh-frontline.yml, so that copy
// is never more than about a week behind the source.
//
// It refuses rather than guesses: a response that fails the same validation
// the live feed must pass, that carries no date, or whose date is older than
// the copy already bundled, changes nothing. Exit codes: 0 updated or nothing
// newer, 1 refused.
import { readFileSync, writeFileSync } from 'node:fs';
import { esriToGeoJson, queryUrl, validateGeometry, type GeoJsonFeature } from '../src/lib/arcgis';
import { FRONTLINE_SERVICE } from '../src/lib/frontline';

const OUT = 'src/data/frontline/ukr-ocha.json';
const TOLERANCE_DEG = 0.003;
const UKR_BBOX: [number, number, number, number] = [21.5, 43.8, 41.0, 53.0];

export interface Snapshot {
  type: 'FeatureCollection';
  metadata: Record<string, unknown> & { assessmentDate: string; retrieved: string };
  features: GeoJsonFeature[];
}

const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/**
 * Builds the new snapshot from a service response and the current snapshot,
 * or explains why not. Pure, so the tests can run it without the network.
 */
export function rebuild(body: unknown, current: Snapshot, today: string):
  { ok: true; snapshot: Snapshot } | { ok: false; reason: string; unchanged?: boolean } {
  const b = body as { features?: unknown[]; error?: { message: string } };
  if (b?.error) return { ok: false, reason: `service error: ${b.error.message}` };
  const first = (b?.features ?? [])[0] as { geometry?: { type?: string } } | undefined;
  const features = (typeof first?.geometry?.type === 'string' ? b.features : esriToGeoJson(b as never)) as GeoJsonFeature[];
  if (!features?.length) return { ok: false, reason: 'no features' };
  const check = validateGeometry(features, { bbox: UKR_BBOX, maxStepKm: 40 });
  if (!check.ok) return { ok: false, reason: `validation: ${check.errors[0]}` };
  const dates = features.map((f) => f.properties.date).filter((d): d is number => typeof d === 'number');
  if (dates.length !== features.length) return { ok: false, reason: 'a segment carries no date' };
  const latest = iso(Math.max(...dates));
  if (latest > today) return { ok: false, reason: `assessment dated in the future: ${latest}` };
  if (latest <= current.metadata.assessmentDate) {
    return { ok: false, unchanged: true, reason: `nothing newer than ${current.metadata.assessmentDate}` };
  }
  // The longest segment is the main line; the rest are the northern pieces.
  const len = (f: GeoJsonFeature) => (f.geometry.coordinates as number[][]).length;
  const mainId = features.reduce((a, f) => (len(f) > len(a) ? f : a)).id;
  const lons: number[] = [], lats: number[] = [];
  for (const f of features) for (const [x, y] of f.geometry.coordinates as number[][]) { lons.push(x); lats.push(y); }
  return {
    ok: true,
    snapshot: {
      type: 'FeatureCollection',
      metadata: {
        ...current.metadata,
        assessmentDate: latest,
        retrieved: today,
        toleranceDeg: { main: TOLERANCE_DEG, northern: TOLERANCE_DEG },
        toleranceMetresApprox: { main: 330, northern: 330 },
        featureCount: features.length,
        vertexCount: check.vertices,
        bbox: [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)],
      },
      features: features.map((f) => {
        const id = Number(f.properties.objectid ?? f.id);
        return {
          type: 'Feature',
          id,
          properties: {
            objectid: id,
            part: f.id === mainId ? 'main' : 'northern',
            date: iso(f.properties.date as number),
            toleranceDeg: TOLERANCE_DEG,
            vertices: len(f),
          },
          geometry: f.geometry,
        } as GeoJsonFeature;
      }),
    },
  };
}

async function main() {
  const [file] = process.argv.slice(2);
  const current = JSON.parse(readFileSync(OUT, 'utf8')) as Snapshot;
  const body = file
    ? JSON.parse(readFileSync(file, 'utf8'))
    : await fetch(queryUrl(FRONTLINE_SERVICE, { outFields: 'objectid,date', precision: 5, toleranceDeg: TOLERANCE_DEG })).then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    });
  const r = rebuild(body, current, iso(Date.now()));
  if (!r.ok) {
    console.log(r.reason);
    process.exit(r.unchanged ? 0 : 1);
  }
  writeFileSync(OUT, JSON.stringify(r.snapshot));
  console.log(`updated: assessed ${r.snapshot.metadata.assessmentDate}, ${r.snapshot.features.length} segments, ${r.snapshot.metadata.vertexCount} vertices`);
}

if (process.argv[1]?.endsWith('refresh-frontline.ts')) {
  main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
}
