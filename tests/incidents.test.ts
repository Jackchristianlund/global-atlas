import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { SnapshotStore } from '../server/src/store';
import { ucdpGed } from '../server/src/connectors/apis';
import { NO_EVENTS, UCDP_GED_DATASET_ID, packEvents, publishEvents } from '../server/src/publish';
import type { ConflictEvent, DatasetMeta } from '../server/src/types';
import { binResolution, binSummary, dayToISO, pointsUpTo, unpack } from '../src/lib/incidents';

const dir = mkdtempSync(join(tmpdir(), 'ga-inc-'));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

const META: DatasetMeta = {
  id: 'ucdp-ged', name: 'UCDP Georeferenced Event Dataset', providers: ['UCDP'],
  license: 'CC BY 4.0', attribution: 'UCDP GED', url: 'https://ucdpapi.pcr.uu.se/',
  cadence: 'Annual, with monthly candidate releases', vintage: 'test', access: 'Open', status: 'integrated',
};

const ev = (o: Partial<ConflictEvent> & { date: string; lat: number; lng: number }): ConflictEvent => ({
  source: 'ucdp-ged', source_event_id: `${o.date}-${o.lat}-${o.lng}`, iso3: 'SDN',
  actors: [], fatalities_best: 1, event_type: 'state-based', ...o,
});

const RECORDS: ConflictEvent[] = [
  ev({ date: '2024-03-04', lat: 15.5007, lng: 32.5599, fatalities_best: 12 }),
  ev({ date: '2024-05-18', lat: 15.52, lng: 32.57, fatalities_best: null }),
  ev({ date: '2023-06-01', lat: 13.63, lng: 25.35, fatalities_best: 40, event_type: 'one-sided' }),
  ev({ date: '2022-02-24', lat: 50.45, lng: 30.5234, iso3: 'UKR', fatalities_best: 7 }),
  ev({ date: '1988-12-31', lat: 34.5, lng: 69.2, iso3: 'AFG', fatalities_best: 3 }),
  { source: 'acled', source_event_id: 'A1', date: '2025-01-01', iso3: 'SDN', lat: 15.6, lng: 32.6, actors: [], fatalities_best: 9, event_type: 'Battles' },
];

function packed() {
  const store = new SnapshotStore(join(dir, 'store'));
  const env = store.envelope(META, RECORDS);
  store.save(env);
  return { store, file: packEvents(env, 1989) };
}

describe('publishing UCDP events for the browser', () => {
  it('never writes ACLED events, whose licence forbids redistributing raw rows', () => {
    const { file } = packed();
    // Four UCDP events survive the 1989 floor; the ACLED row is not among them.
    expect(file.count).toBe(4);
    expect(file.iso).not.toContain('XXX');
    const acledDay = Math.round((Date.parse('2025-01-01') - Date.parse('1989-01-01')) / 86400000);
    expect(file.events.some((r) => r[2] === acledDay)).toBe(false);
  });

  it('drops events before the dataset floor and sorts the rest by date', () => {
    const { file } = packed();
    expect(file.date_range).toEqual(['2022-02-24', '2024-05-18']);
    const days = file.events.map((r) => r[2]);
    expect(days).toEqual([...days].sort((a, b) => a - b));
  });

  it('round-trips coordinates, dates and fatalities through the packed form', () => {
    const { file } = packed();
    const inc = unpack(file);
    expect(inc.n).toBe(4);
    const i = inc.best.indexOf(12);
    expect(inc.lat[i]).toBeCloseTo(15.5, 2);
    expect(inc.lng[i]).toBeCloseTo(32.56, 2);
    expect(dayToISO(inc, inc.day[i])).toBe('2024-03-04');
    expect(inc.isoNames[inc.iso[i]]).toBe('SDN');
    // A missing estimate stays missing: it is never read as zero deaths.
    expect([...inc.best]).toContain(-1);
  });

  it('writes a file that says so when no ingest has run', () => {
    const empty = new SnapshotStore(join(dir, 'empty'));
    const r = publishEvents(empty, join(dir, 'pub'));
    expect(r).toEqual({ count: 0, ingested: false });
    const f = JSON.parse(readFileSync(join(dir, 'pub', 'ucdp_events.json'), 'utf8'));
    expect(f.status).toBe('not_ingested');
    expect(f.events).toEqual([]);
    expect(f.reason).toMatch(/npm run ingest/);
    expect(NO_EVENTS.count).toBe(0);
  });

  it('publishes from the id the GED connector actually snapshots under', () => {
    // A mismatch between these two would leave the layer empty after a
    // successful ingest, with nothing in the output to say why.
    const store = new SnapshotStore(join(dir, 'idcheck'));
    expect(ucdpGed(store).meta.id).toBe(UCDP_GED_DATASET_ID);
  });

  it('allows a full pull rather than the first slice of the dataset', () => {
    const store = new SnapshotStore(join(dir, 'idcheck'));
    // GED 25.1 holds a few hundred thousand events at 1000 per page.
    const { meta } = ucdpGed(store);
    expect(meta.url).toContain('gedevents');
    expect(ucdpGed(store, '25.1', 1000, 800)).toBeDefined();
  });

  it('keeps UCDP\u2019s types of violence as the source labels them', () => {
    const { file } = packed();
    expect(file.types).toContain('state-based');
    const inc = unpack(file);
    const sum = binSummary(inc, pointsUpTo(inc, 2026));
    expect(sum.types).toEqual([['state-based', 3], ['one-sided', 1]]);
  });

  it('carries the provenance the UI shows next to the layer', () => {
    const { file } = packed();
    expect(file.meta.attribution).toBe('UCDP GED');
    expect(file.meta.license).toBe('CC BY 4.0');
    expect(file.meta.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(file.meta.record_count).toBe(RECORDS.length);
  });
});

describe('reading the events on the globe', () => {
  it('is cumulative: the timeline asks what the record held by that date', () => {
    const inc = unpack(packed().file);
    expect(pointsUpTo(inc, 2021)).toHaveLength(0);
    expect(pointsUpTo(inc, 2022)).toHaveLength(1);
    expect(pointsUpTo(inc, 2023)).toHaveLength(2);
    expect(pointsUpTo(inc, 2026)).toHaveLength(4);
  });

  it('states a window rather than thinning when over the cap', () => {
    const inc = unpack(packed().file);
    const pts = pointsUpTo(inc, 2026, 2);
    expect(pts).toHaveLength(2);
    // The most recent two, in order: nothing is sampled out of the middle.
    expect(pts.map((p) => dayToISO(inc, p.day))).toEqual(['2024-03-04', '2024-05-18']);
  });

  it('summarises a bin without treating unknown estimates as zero', () => {
    const inc = unpack(packed().file);
    const sum = binSummary(inc, pointsUpTo(inc, 2026));
    expect(sum.events).toBe(4);
    expect(sum.deaths).toBe(12 + 40 + 7);
    expect(sum.unknown).toBe(1);
    expect(sum.from).toBe('2022-02-24');
    expect(sum.to).toBe('2024-05-18');
    expect(sum.countries).toEqual([['SDN', 3], ['UKR', 1]]);
    const none = binSummary(inc, []);
    expect(none).toMatchObject({ events: 0, deaths: 0, from: null, to: null });
  });

  it('bins coarsely from far away and finely up close', () => {
    const steps = [4, 2, 1, 0.6, 0.3].map(binResolution);
    expect(steps).toEqual([1, 2, 3, 4, 5]);
    // Monotonic: coming closer never makes the bins coarser.
    for (let i = 1; i < steps.length; i++) expect(steps[i]).toBeGreaterThan(steps[i - 1]);
  });
});
