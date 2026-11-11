/** Pure data transformations. No React, no DOM – covered by tests/selectors.test.ts. */
import type { Conflict, Iso, Org, Relation, Route, SanctionRegime, TimelineEvent } from '../types';
import { kmToNm, pathLengthKm, sailingDays, unwrapLongitudes } from './geo';

export const yearOf = (isoDate: string) => Number(isoDate.slice(0, 4));

/** A conflict is on the map in `year` from its start year to its end year, inclusive. */
export function conflictsAt(all: Conflict[], year: number): Conflict[] {
  return all.filter((c) => yearOf(c.start) <= year && (c.end === undefined || yearOf(c.end) >= year));
}

export type DisplayStatus = 'tier4' | 'tier3' | 'tier2' | 'tier1' | 'unrated' | 'ceasefire' | 'flashpoint' | 'historic';

/**
 * How a conflict is coloured for a given year.
 * Tiers and ceasefire status are only known for the snapshot year, so earlier years
 * show a neutral "historic" marker instead of projecting today's status backwards.
 */
export function displayStatus(c: Conflict, year: number, snapshotYear: number): DisplayStatus {
  if (c.status === 'flashpoint') return 'flashpoint';
  if (c.status === 'ended' || year < snapshotYear) return 'historic';
  if (c.status === 'ceasefire') return 'ceasefire';
  return c.tier === null ? 'unrated' : (`tier${c.tier}` as DisplayStatus);
}

export const STATUS_COLOR: Record<DisplayStatus, string> = {
  tier4: '#B3122E',
  tier3: '#FF4545',
  tier2: '#FF9B42',
  tier1: '#FFD23F',
  unrated: '#C9D3E0',
  ceasefire: '#3BA7FF',
  flashpoint: '#B07CFF',
  historic: '#8A99AD',
};

export function membersAt(org: Org, year: number): Iso[] {
  return org.members.filter((m) => m.from <= year && (m.to === undefined || year < m.to)).map((m) => m.iso);
}

export function orgsOf(orgs: Org[], code: Iso, year: number): Org[] {
  return orgs.filter((o) => membersAt(o, year).includes(code));
}

export function relationsOf(rels: Relation[], code: Iso, year: number): Relation[] {
  return rels.filter((r) => (r.a === code || r.b === code) && yearOf(r.since) <= year);
}

/** Does `code` take part in imposing a regime? 'EU' expands to the EU members of that year. */
export function imposes(reg: SanctionRegime, code: Iso, euMembers: Iso[]): boolean {
  return reg.by.includes(code) || (reg.by.includes('EU') && euMembers.includes(code));
}

export function sanctionsOf(regs: SanctionRegime[], code: Iso, year: number, euMembers: Iso[]) {
  const live = regs.filter((r) => yearOf(r.since) <= year);
  return {
    targetOf: live.filter((r) => r.target === code),
    imposing: live.filter((r) => imposes(r, code, euMembers)),
  };
}

export interface Comparison {
  sharedOrgs: Org[];
  onlyA: Org[];
  onlyB: Org[];
  treaties: Relation[];
  sanctions: SanctionRegime[];
  conflicts: Conflict[];
}

export function compareCountries(a: Iso, b: Iso, year: number, d: { orgs: Org[]; rels: Relation[]; regs: SanctionRegime[]; conflicts: Conflict[] }): Comparison {
  const oa = orgsOf(d.orgs, a, year);
  const ob = orgsOf(d.orgs, b, year);
  const eu = d.orgs.find((o) => o.id === 'eu');
  const euM = eu ? membersAt(eu, year) : [];
  return {
    sharedOrgs: oa.filter((o) => ob.includes(o)),
    onlyA: oa.filter((o) => !ob.includes(o)),
    onlyB: ob.filter((o) => !oa.includes(o)),
    treaties: d.rels.filter((r) => ((r.a === a && r.b === b) || (r.a === b && r.b === a)) && yearOf(r.since) <= year),
    sanctions: d.regs.filter((r) => yearOf(r.since) <= year && ((r.target === a && imposes(r, b, euM)) || (r.target === b && imposes(r, a, euM)))),
    conflicts: conflictsAt(d.conflicts, year).filter((c) => c.iso.includes(a) && c.iso.includes(b)),
  };
}

export function eventsInYear(events: TimelineEvent[], year: number): TimelineEvent[] {
  return events.filter((e) => yearOf(e.d) === year).sort((x, y) => x.d.localeCompare(y.d));
}

export function routeLengthNm(route: Route): number {
  return kmToNm(pathLengthKm(unwrapLongitudes(route.pts)));
}

export interface Detour {
  baseNm: number;
  altNm: number;
  extraNm: number;
  extraPct: number;
  baseDays: number;
  altDays: number;
  extraDays: number;
}

/** Extra distance and sailing time when traffic moves from `base` to `alt` at `knots`. */
export function detour(base: Route, alt: Route, knots: number): Detour {
  const baseNm = routeLengthNm(base);
  const altNm = routeLengthNm(alt);
  const baseDays = sailingDays(baseNm, knots);
  const altDays = sailingDays(altNm, knots);
  return { baseNm, altNm, extraNm: altNm - baseNm, extraPct: ((altNm - baseNm) / baseNm) * 100, baseDays, altDays, extraDays: altDays - baseDays };
}

export interface DatasetCounts {
  active: number;
  ceasefire: number;
  flashpoints: number;
  countries: number;
  byTier: Record<1 | 2 | 3 | 4, number>;
}

export function datasetCounts(all: Conflict[]): DatasetCounts {
  const active = all.filter((c) => c.status === 'active');
  const countries = new Set(active.flatMap((c) => c.iso));
  const byTier = { 1: 0, 2: 0, 3: 0, 4: 0 };
  for (const c of active) if (c.tier) byTier[c.tier]++;
  return {
    active: active.length,
    ceasefire: all.filter((c) => c.status === 'ceasefire').length,
    flashpoints: all.filter((c) => c.status === 'flashpoint').length,
    countries: countries.size,
    byTier,
  };
}

/** Case- and accent-insensitive "contains", including the Scandinavian letters æøå. */
export function matches(haystack: string, needle: string): boolean {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/æ/g, 'ae')
      .replace(/ø/g, 'o')
      .replace(/å/g, 'a')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '');
  return norm(haystack).includes(norm(needle.trim()));
}
