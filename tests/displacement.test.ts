import { describe, expect, it } from 'vitest';
import { CONFLICT, COUNTRY_CODES, SOURCES } from '../src/data';
import { FLOWS, TOTALS } from '../src/data/displacement';
import { FLOW, corridorSum, countriesWithFlows, flowWeight, flowsAt, flowsFrom, flowsTo } from '../src/lib/displacement';
import { SNAPSHOT_YEAR } from '../src/store';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

describe('displacement corridors', () => {
  it('every corridor is sourced, dated, bilingual and crosses a real border', () => {
    for (const f of FLOWS) {
      expect(f.s.length, f.id).toBeGreaterThan(0);
      for (const s of f.s) expect(SOURCES[s], `${f.id} source ${s}`).toBeDefined();
      expect(f.d, f.id).toMatch(DATE);
      expect(COUNTRY_CODES, `${f.id} origin`).toContain(f.from);
      expect(COUNTRY_CODES, `${f.id} host`).toContain(f.to);
      // A corridor crosses a border: internal displacement is counted separately.
      expect(f.from, f.id).not.toBe(f.to);
      expect(f.people, f.id).toBeGreaterThan(0);
      // Both the basis and the prose must say something, in both languages.
      for (const [no, en] of [f.basis, f.note]) {
        expect(no.length, f.id).toBeGreaterThan(10);
        expect(en.length, f.id).toBeGreaterThan(10);
        expect(no, f.id).not.toBe(en);
      }
      if (f.conflict) expect(CONFLICT[f.conflict], `${f.id} -> ${f.conflict}`).toBeDefined();
    }
  });

  it('ids are unique and indexed', () => {
    expect(new Set(FLOWS.map((f) => f.id)).size).toBe(FLOWS.length);
    for (const f of FLOWS) expect(FLOW[f.id]).toBe(f);
  });

  it('no two corridors claim the same origin and host pair', () => {
    const pairs = FLOWS.map((f) => `${f.from}>${f.to}`);
    expect(new Set(pairs).size, pairs.join(' ')).toBe(pairs.length);
  });

  it('headline totals are sourced and bilingual, and keep internal displacement separate', () => {
    for (const x of TOTALS) {
      expect(x.s.length, x.id).toBeGreaterThan(0);
      for (const s of x.s) expect(SOURCES[s], `${x.id} source ${s}`).toBeDefined();
      expect(x.d, x.id).toMatch(DATE);
      for (const [no, en] of [x.label, x.value, x.basis]) {
        expect(no.length, x.id).toBeGreaterThan(3);
        expect(en.length, x.id).toBeGreaterThan(3);
      }
      for (const [no, en] of [x.label, x.basis]) expect(no, x.id).not.toBe(en);
    }
    // The 9.1m Sudanese IDPs are a total, never a corridor.
    const idp = TOTALS.find((x) => x.id === 'tt-sdn-idp');
    expect(idp).toBeDefined();
    expect(idp!.basis[1]).toMatch(/not .*drawn as a corridor/i);
  });

  it('corridors appear only from the year their figure refers to', () => {
    const sdnEgy = FLOW['fl-sdn-egy'];
    expect(sdnEgy.d.slice(0, 4)).toBe('2026');
    expect(flowsAt(2025).map((f) => f.id)).not.toContain('fl-sdn-egy');
    expect(flowsAt(2026).map((f) => f.id)).toContain('fl-sdn-egy');
    // Nothing in the set predates the earliest figure.
    const earliest = Math.min(...FLOWS.map((f) => Number(f.d.slice(0, 4))));
    expect(flowsAt(earliest - 1)).toHaveLength(0);
    expect(flowsAt(SNAPSHOT_YEAR).length).toBe(FLOWS.length);
  });

  it('corridors are listed largest first', () => {
    const n = flowsAt().map((f) => f.people);
    expect(n).toEqual([...n].sort((a, b) => b - a));
  });

  it('resolves corridors by origin and by host', () => {
    const out = flowsFrom('SDN');
    expect(out.length).toBeGreaterThanOrEqual(5);
    expect(out.every((f) => f.from === 'SDN')).toBe(true);
    expect(out.map((f) => f.to)).toContain('TCD');
    // Sudan is both an origin and a host, and the two directions never mix.
    const into = flowsTo('SDN');
    expect(into.map((f) => f.from)).toEqual(['SSD']);
    expect(out.map((f) => f.id)).not.toContain(into[0].id);
    expect(countriesWithFlows()).toContain('SDN');
    expect(countriesWithFlows()).toContain('BGD');
  });

  it('weight ranks corridors without claiming to measure them', () => {
    const small = FLOWS.reduce((m, f) => (f.people < m.people ? f : m), FLOWS[0]);
    const large = FLOWS.reduce((m, f) => (f.people > m.people ? f : m), FLOWS[0]);
    expect(flowWeight(small.people)).toBeLessThan(flowWeight(large.people));
    expect(flowWeight(large.people)).toBeCloseTo(1, 5);
    // Square-root scaling: a corridor a quarter the size is about half the weight above the floor.
    const q = flowWeight(large.people / 4) - 0.26;
    expect(q / (flowWeight(large.people) - 0.26)).toBeCloseTo(0.5, 2);
    // Every weight stays inside the drawable band.
    for (const f of FLOWS) {
      expect(flowWeight(f.people)).toBeGreaterThanOrEqual(0.26);
      expect(flowWeight(f.people)).toBeLessThanOrEqual(1);
    }
  });

  it('sums only the corridors it is given', () => {
    const { people, n } = corridorSum(flowsFrom('VEN'));
    expect(n).toBe(3);
    expect(people).toBe(2800000 + 761100 + 437600);
    expect(corridorSum([])).toEqual({ people: 0, n: 0 });
  });
});
