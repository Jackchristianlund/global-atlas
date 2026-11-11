/**
 * Relationship tracing: follow one documented connection at a time.
 * A trace is a path of link ids. The next steps from a link are the links whose
 * origin is the current link's destination — nothing else, so every hop in the
 * chain is itself a documented, sourced connection.
 */
import { LINKS } from '../data';
import type { ImpactLink } from '../types';

export const LINK: Record<string, ImpactLink> = Object.fromEntries(LINKS.map((l) => [l.id, l]));

type End = ImpactLink['from'];
const endKey = (e: End) => e.iso ?? `${e.at[0]},${e.at[1]}`;

/** Links that depart from where `id` arrives (excluding the reverse of itself). */
export function onwardLinks(id: string): ImpactLink[] {
  const l = LINK[id];
  if (!l) return [];
  const from = endKey(l.from);
  const to = endKey(l.to);
  return LINKS.filter((x) => x.id !== id && endKey(x.from) === to && endKey(x.to) !== from);
}

export function traceLinks(ids: string[]): ImpactLink[] {
  return ids.map((i) => LINK[i]).filter((l): l is ImpactLink => Boolean(l));
}

/** The first hops available from a conflict: its own documented links. */
export function rootLinks(conflictId: string): ImpactLink[] {
  return LINKS.filter((l) => l.conflict === conflictId);
}
