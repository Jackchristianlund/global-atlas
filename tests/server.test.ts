import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { normalizeBatch, normalizeCountry } from '../server/src/normalize';
import { csvToObjects, num, parseCsv, validCoord, validISODate, validYear } from '../server/src/validate';
import { dedupeEvents, eventKey } from '../server/src/dedup';
import { SnapshotStore } from '../server/src/store';
import type { ConflictEvent, DatasetMeta } from '../server/src/types';

describe('country normalisation', () => {
  it('maps the messy spellings the sources actually use', () => {
    const cases: [string, string][] = [
      ['Norway', 'NOR'], ['Russia', 'RUS'], ['Russian Federation', 'RUS'],
      ['Democratic Republic of Congo', 'COD'], ['Congo', 'COG'], ["Cote d'Ivoire", 'CIV'],
      ['Korea, Rep.', 'KOR'], ["Korea, Dem. People's Rep.", 'PRK'], ['Syria', 'SYR'],
      ['Iran, Islamic Rep.', 'IRN'], ['Myanmar (Burma)', 'MMR'], ['Turkiye', 'TUR'],
      ['East Timor', 'TLS'], ['Kosovo', 'XKX'], ['United States', 'USA'], ['Egypt, Arab Rep.', 'EGY'],
    ];
    for (const [input, want] of cases) {
      const n = normalizeCountry(input);
      expect(`${input}→${n.iso3}`, input).toBe(`${input}→${want}`);
      expect(n.kind).toBe('country');
    }
  });
  it('classifies regions, world and historical entities instead of guessing', () => {
    expect(normalizeCountry('World').kind).toBe('world');
    expect(normalizeCountry('Middle East').kind).toBe('region');
    expect(normalizeCountry('USSR').kind).toBe('historical');
    expect(normalizeCountry('Yugoslavia').kind).toBe('historical');
    expect(normalizeCountry('Atlantis Province').kind).toBe('unknown');
  });
  it('normalizeBatch keeps unknowns visible and excludes non-countries', () => {
    const { mapped, unmapped } = normalizeBatch([
      { entity: 'Norway' }, { entity: 'World' }, { entity: 'Nowhereland' }, { entity: 'Russia' },
    ]);
    expect(mapped.map((m) => m.iso3)).toEqual(['NOR', 'RUS']);
    expect(unmapped).toEqual(['Nowhereland']);
  });
});

describe('validation', () => {
  it('rejects bad coordinates including the (0,0) null island artefact', () => {
    expect(validCoord(59.9, 10.7)).toBe(true);
    expect(validCoord(91, 10)).toBe(false);
    expect(validCoord(10, 181)).toBe(false);
    expect(validCoord(0, 0)).toBe(false);
    expect(validCoord(NaN, 5)).toBe(false);
  });
  it('validates years and dates', () => {
    expect(validYear(2024)).toBe(true);
    expect(validYear(1700)).toBe(false);
    expect(validISODate('2026-02-30')).toBe(false);
    expect(validISODate('2026-02-28')).toBe(true);
  });
  it('num rejects the junk cells sources emit', () => {
    expect(num('3.5')).toBe(3.5);
    for (const junk of ['', 'NA', '..', 'n/a?x', undefined]) expect(num(junk as string | undefined)).toBe(null);
  });
  it('parseCsv handles quotes, commas and CRLF', () => {
    const rows = parseCsv('a,b\r\n"x, y",2\n"he said ""hi""",3\n');
    expect(rows).toEqual([['a', 'b'], ['x, y', '2'], ['he said "hi"', '3']]);
    const objs = csvToObjects('Entity,Year\nNorway,2020\n');
    expect(objs).toEqual([{ Entity: 'Norway', Year: '2020' }]);
  });
});

describe('event dedup', () => {
  const ev = (over: Partial<ConflictEvent>): ConflictEvent => ({
    source: 'ucdp-ged', source_event_id: '', date: '2020-01-01', iso3: 'MLI', lat: 16.1, lng: -1.2,
    actors: ['A', 'B'], fatalities_best: 3, event_type: 'state-based', ...over,
  });
  it('is idempotent on source ids and stable hashes', () => {
    const a = ev({ source_event_id: '42' });
    const dup = ev({ source_event_id: '42', fatalities_best: 99 });
    const hashed1 = ev({ actors: ['B', 'A'] }); // same actors, different order
    const hashed2 = ev({});
    const other = ev({ date: '2020-01-02' });
    const { unique, duplicates } = dedupeEvents([a, dup, hashed1, hashed2, other]);
    expect(duplicates).toBe(2);
    expect(unique).toHaveLength(3);
  });
  it('never merges across sources', () => {
    const u = ev({ source_event_id: '7' });
    const acl = ev({ source: 'acled', source_event_id: '7' });
    expect(eventKey(u)).not.toBe(eventKey(acl));
    expect(dedupeEvents([u, acl]).unique).toHaveLength(2);
  });
});

describe('snapshot store', () => {
  const dir = mkdtempSync(join(tmpdir(), 'atlas-store-'));
  afterAll(() => rmSync(dir, { recursive: true, force: true }));
  const meta: DatasetMeta = {
    id: 'test-ds', name: 'Test', providers: ['t'], license: 'CC0', attribution: 't', url: 'https://example.org',
    cadence: 'never', vintage: 'now', access: 'open', status: 'integrated',
  };
  it('stores versions, skips identical content, tracks history and timestamps', async () => {
    const store = new SnapshotStore(dir);
    const e1 = store.envelope(meta, [{ a: 1 }]);
    expect(store.save(e1)).toBe('new');
    expect(store.save(store.envelope(meta, [{ a: 1 }]))).toBe('unchanged');
    await new Promise((r) => setTimeout(r, 5));
    expect(store.save(store.envelope(meta, [{ a: 2 }]))).toBe('new');
    expect(store.history('test-ds')).toHaveLength(2);
    const latest = store.latest<{ a: number }>('test-ds')!;
    expect(latest.records).toEqual([{ a: 2 }]);
    expect(Date.parse(latest.retrieved_at)).toBeGreaterThan(0);
    expect(latest.sha256).toHaveLength(64);
  });
});
