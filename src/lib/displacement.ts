import { FLOWS, type Flow } from '../data/displacement';
import { SNAPSHOT_YEAR } from '../store';
import type { Iso } from '../types';

export const FLOW = Object.fromEntries(FLOWS.map((f) => [f.id, f])) as Record<string, Flow>;

const yr = (d: string) => Number(d.slice(0, 4));

/**
 * Corridors documented on or before the given year. A corridor is shown from the
 * year its figure refers to: earlier years have no figure for it, and carrying a
 * later count backwards would misstate the year the user is looking at.
 */
export function flowsAt(year = SNAPSHOT_YEAR): Flow[] {
  return FLOWS.filter((f) => yr(f.d) <= year).sort((a, b) => b.people - a.people);
}

/** Corridors leaving a country, largest first. */
export const flowsFrom = (iso: Iso, year = SNAPSHOT_YEAR): Flow[] => flowsAt(year).filter((f) => f.from === iso);

/** Corridors a country hosts, largest first. */
export const flowsTo = (iso: Iso, year = SNAPSHOT_YEAR): Flow[] => flowsAt(year).filter((f) => f.to === iso);

/** Every country that appears in the corridor set, as origin or as host. */
export function countriesWithFlows(year = SNAPSHOT_YEAR): Iso[] {
  const s = new Set<Iso>();
  for (const f of flowsAt(year)) { s.add(f.from); s.add(f.to); }
  return [...s];
}

/**
 * Line weight for a corridor, scaled by the square root of the count so that a
 * corridor twenty times larger is about four and a half times heavier rather
 * than twenty times, which would bury everything smaller. The scale is relative
 * to the largest corridor in the dataset, so it is a ranking, not a quantity:
 * figures are always read from the panel, never measured off the line.
 */
export function flowWeight(people: number): number {
  const max = FLOWS.reduce((m, f) => Math.max(m, f.people), 1);
  return 0.26 + 0.74 * Math.sqrt(Math.min(people, max) / max);
}

/**
 * Sum of a country's corridors, with the number of separate figures added.
 * Only corridors on a comparable basis are summed; where bases differ the
 * caller shows them separately instead.
 */
export function corridorSum(flows: Flow[]): { people: number; n: number } {
  return { people: flows.reduce((n, f) => n + f.people, 0), n: flows.length };
}
