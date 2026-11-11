import { describe, expect, it } from 'vitest';
import { CONFLICT, CONFLICTS, ORG, ORGS, RELATIONS, ROUTE, SANCTIONS } from '../src/data';
import {
  compareCountries, conflictsAt, datasetCounts, detour, displayStatus, eventsInYear, matches, membersAt, routeLengthNm, sanctionsOf,
} from '../src/lib/selectors';
import { EVENTS } from '../src/data';

describe('conflictsAt', () => {
  it('includes a conflict between its start and end years', () => {
    const ids = (y: number) => conflictsAt(CONFLICTS, y).map((c) => c.id);
    expect(ids(2005)).toContain('afg01');
    expect(ids(2021)).toContain('afg01');
    expect(ids(2022)).not.toContain('afg01');
    expect(ids(2010)).not.toContain('sdn');
    expect(ids(2026)).toContain('sdn');
  });
});

describe('displayStatus', () => {
  it('shows historic for earlier years instead of projecting today backwards', () => {
    expect(displayStatus(CONFLICT.ukr, 2015, 2026)).toBe('historic');
    expect(displayStatus(CONFLICT.ukr, 2026, 2026)).toBe('tier4');
  });
  it('keeps flashpoints and ceasefires distinct', () => {
    expect(displayStatus(CONFLICT.taiwan, 2026, 2026)).toBe('flashpoint');
    expect(displayStatus(CONFLICT.gaza, 2026, 2026)).toBe('ceasefire');
    expect(displayStatus(CONFLICT.thakhm, 2026, 2026)).toBe('ceasefire');
  });
});

describe('membersAt', () => {
  it('handles joins and exits by year', () => {
    expect(membersAt(ORG.eu, 2015)).toContain('GBR');
    expect(membersAt(ORG.eu, 2021)).not.toContain('GBR');
    expect(membersAt(ORG.nato, 2022)).not.toContain('FIN');
    expect(membersAt(ORG.nato, 2024)).toContain('FIN');
    expect(membersAt(ORG.nato, 2026)).toContain('SWE');
  });
});

describe('sanctionsOf', () => {
  it('expands EU membership for imposers and respects start year', () => {
    const eu2026 = membersAt(ORG.eu, 2026);
    const nor = sanctionsOf(SANCTIONS, 'NOR', 2026, eu2026);
    expect(nor.imposing.map((r) => r.id)).toContain('s-rus'); // Norway listed directly
    const deu = sanctionsOf(SANCTIONS, 'DEU', 2026, eu2026);
    expect(deu.imposing.map((r) => r.id)).toContain('s-rus'); // via EU
    const rus2010 = sanctionsOf(SANCTIONS, 'RUS', 2010, membersAt(ORG.eu, 2010));
    expect(rus2010.targetOf).toHaveLength(0);
  });
});

describe('compareCountries', () => {
  const data = { orgs: ORGS, rels: RELATIONS, regs: SANCTIONS, conflicts: CONFLICTS };
  it('finds the US–Japan treaty and shared memberships', () => {
    const c = compareCountries('USA', 'JPN', 2026, data);
    expect(c.treaties.map((t) => t.id)).toContain('us-jp');
    expect(c.sharedOrgs.map((o) => o.id)).not.toContain('nato');
  });
  it('finds sanctions between the EU member Germany and Russia, and the shared conflict', () => {
    const c = compareCountries('DEU', 'RUS', 2026, data);
    expect(c.sanctions.map((s) => s.id)).toContain('s-rus');
    const u = compareCountries('UKR', 'RUS', 2026, data);
    expect(u.conflicts.map((x) => x.id)).toContain('ukr');
  });
});

describe('detour computation', () => {
  it('the Cape route is longer than Suez, and time scales with speed', () => {
    const d = detour(ROUTE['asia-eu-suez'], ROUTE['asia-eu-cape'], 14);
    expect(d.extraNm).toBeGreaterThan(1500);
    expect(d.extraPct).toBeGreaterThan(10);
    const faster = detour(ROUTE['asia-eu-suez'], ROUTE['asia-eu-cape'], 20);
    expect(faster.extraDays).toBeLessThan(d.extraDays);
    expect(faster.extraNm).toBeCloseTo(d.extraNm, 6);
  });
  it('route lengths are broadly plausible', () => {
    const suez = routeLengthNm(ROUTE['asia-eu-suez']);
    expect(suez).toBeGreaterThan(9000);
    expect(suez).toBeLessThan(13000);
    const cape = routeLengthNm(ROUTE['asia-eu-cape']);
    expect(cape).toBeGreaterThan(suez);
    expect(cape).toBeLessThan(17000);
  });
});

describe('datasetCounts / eventsInYear / matches', () => {
  it('counts statuses coherently', () => {
    const c = datasetCounts(CONFLICTS);
    expect(c.active + c.ceasefire + c.flashpoints).toBeLessThanOrEqual(CONFLICTS.length);
    expect(c.active).toBeGreaterThan(10);
    expect(c.byTier[4]).toBeGreaterThanOrEqual(8);
    expect(c.countries).toBeGreaterThan(30);
  });
  it('sorts events within a year', () => {
    const e = eventsInYear(EVENTS, 2026);
    expect(e.length).toBeGreaterThan(5);
    for (let i = 1; i < e.length; i++) expect(e[i].d >= e[i - 1].d).toBe(true);
  });
  it('matches ignores case and accents', () => {
    expect(matches('Bab el-Mandeb', 'mandeb')).toBe(true);
    expect(matches('Hormuzstredet', 'HORMUZ')).toBe(true);
    expect(matches('Søk', 'sok')).toBe(true);
    expect(matches('Ukraina', 'russland')).toBe(false);
  });
});
