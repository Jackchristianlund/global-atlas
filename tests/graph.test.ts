import { describe, expect, it } from 'vitest';
import { SOURCES } from '../src/data';
import { activeIn, buildGraph, edgesOf, graphStats, otherEnd } from '../src/lib/graph';
import { ENERGY, PRIO_COUNTS, PRIO_DEATHS, REGISTRY, SIPRI, UCDP_DEATHS, at, latest } from '../src/data/live';

describe('relationship graph', () => {
  it('every edge carries evidence, derivation, at least one resolvable source and a classification', () => {
    const g = buildGraph();
    expect(g.length).toBeGreaterThan(400);
    for (const e of g) {
      expect(e.evidence[0].length, e.id).toBeGreaterThan(0);
      expect(e.derivation[0].length, e.id).toBeGreaterThan(0);
      expect(e.s.length, e.id).toBeGreaterThan(0);
      for (const s of e.s) expect(SOURCES[s], `${e.id} source ${s}`).toBeDefined();
      expect(['observed', 'assessed', 'potential']).toContain(e.kind);
      expect(['high', 'medium', 'low']).toContain(e.confidence);
    }
  });
  it('membership validity follows the dated register (GBR left the EU in 2020)', () => {
    const gbrEu = buildGraph().find((e) => e.type === 'membership' && e.a.id === 'eu' && e.b.id === 'GBR')!;
    expect(gbrEu.from).toBe('1973');
    expect(gbrEu.to).toBe('2020');
    expect(activeIn(gbrEu, 2015)).toBe(true);
    expect(activeIn(gbrEu, 2020)).toBe(false);
    const norNato = edgesOf({ kind: 'country', id: 'NOR' }, 2026).filter((e) => e.type === 'membership' && e.a.id === 'nato');
    expect(norNato).toHaveLength(1);
    expect(edgesOf({ kind: 'country', id: 'NOR' }, 1948).some((e) => e.a.id === 'nato')).toBe(false);
  });
  it('sanctions edges link imposers (including EU/UN as bodies) to targets', () => {
    const toRus = edgesOf({ kind: 'country', id: 'RUS' }, 2026).filter((e) => e.type === 'sanction');
    expect(toRus.length).toBeGreaterThanOrEqual(8);
    expect(toRus.some((e) => e.a.kind === 'org' && e.a.id === 'eu')).toBe(true);
    expect(edgesOf({ kind: 'country', id: 'RUS' }, 2010).filter((e) => e.type === 'sanction')).toHaveLength(0);
  });
  it('conflict party edges respect start/end years', () => {
    const afg2005 = edgesOf({ kind: 'conflict', id: 'afg01' }, 2005);
    expect(afg2005.length).toBeGreaterThan(0);
    expect(edgesOf({ kind: 'conflict', id: 'afg01' }, 2024)).toHaveLength(0);
    const e = afg2005[0];
    expect(otherEnd(e, { kind: 'conflict', id: 'afg01' }).kind).toBe('country');
  });
  it('covers the expected edge families', () => {
    const { byType } = graphStats();
    for (const k of ['membership', 'party', 'sanction', 'exposure', 'passes', 'located', 'defense']) {
      expect(byType[k], k).toBeGreaterThan(0);
    }
  });
});

describe('integrated external datasets', () => {
  it('live files carry full provenance meta', () => {
    for (const f of [ENERGY, SIPRI, UCDP_DEATHS, PRIO_DEATHS, PRIO_COUNTS]) {
      expect(f.meta.attribution.length).toBeGreaterThan(5);
      expect(f.meta.license.toLowerCase()).toContain('cc by');
      expect(Date.parse(f.meta.retrieved_at)).toBeGreaterThan(0);
      expect(f.meta.url.startsWith('https://')).toBe(true);
      expect(Object.keys(f.series).length).toBeGreaterThan(4);
    }
  });
  it('spot-checks known values against the published sources', () => {
    // SIPRI via OWID: Norway 2020 military expenditure 1.94% of GDP
    expect(at(SIPRI, 'NOR', 'milex_share_gdp', 2020)).toBeCloseTo(1.94, 2);
    // OWID energy: Norway produced ~998.8 TWh of oil in 2024
    const nor = at(ENERGY, 'NOR', 'oil_prod_twh', 2024);
    expect(nor).toBeGreaterThan(900);
    expect(nor).toBeLessThan(1100);
    // UCDP GED 19.1 ends in 2018 and excludes Syria (stated by the source)
    expect(latest(UCDP_DEATHS, 'AFG', 'deaths')!.year).toBeLessThanOrEqual(2018);
    expect(UCDP_DEATHS.series.SYR).toBeUndefined();
    expect(UCDP_DEATHS.meta.vintage).toMatch(/Syria/);
    // PRIO/UCDP regional file: world total exists for 2020
    expect(at(PRIO_DEATHS, 'World', 'all', 2020)).toBeGreaterThan(40000);
  });
  it('registry reports honest statuses', () => {
    const integrated = REGISTRY.filter((r) => r.status === 'integrated');
    expect(integrated.length).toBe(5);
    for (const r of integrated) expect(r.retrieved_at).not.toBeNull();
    const blocked = REGISTRY.filter((r) => r.status === 'connector_ready');
    expect(blocked.length).toBeGreaterThanOrEqual(5);
    for (const r of blocked) expect((r.blocked_reason ?? '').length).toBeGreaterThan(10);
  });
});
