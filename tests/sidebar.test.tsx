// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { S } from '../src/i18n';

/**
 * The layer list is grouped rather than flat. These guard the grouping itself:
 * every layer must appear exactly once, and every group must have a label in
 * both languages — a group heading that falls back to its key is worse than no
 * grouping at all.
 */
const GROUPS: { id: string; layers: string[] }[] = [
  { id: 'g_control', layers: ['territories', 'sourceline', 'fronts'] },
  { id: 'g_events', layers: ['conflicts', 'flashpoints', 'attacks', 'incidents', 'events'] },
  { id: 'g_trade', layers: ['routes', 'chokepoints', 'energy', 'sanctions'] },
  { id: 'g_people', layers: ['displacement', 'alliances', 'links'] },
  { id: 'g_base', layers: ['borders', 'hydro'] },
];

describe('the grouped layer list', () => {
  it('places every layer in exactly one group', () => {
    const all = GROUPS.flatMap((g) => g.layers);
    expect(new Set(all).size).toBe(all.length);
  });

  it('covers every layer the app knows about', () => {
    const labelled = Object.keys(S).filter((k) => k.startsWith('l_')).map((k) => k.slice(2));
    const grouped = new Set(GROUPS.flatMap((g) => g.layers));
    for (const l of labelled) expect(grouped.has(l), `layer ${l} is in no group`).toBe(true);
  });

  it('gives every group a label in both languages', () => {
    for (const g of GROUPS) {
      const entry = (S as Record<string, [string, string]>)[g.id];
      expect(entry, `${g.id} has no label`).toBeTruthy();
      expect(entry[0].length).toBeGreaterThan(2);
      expect(entry[1].length).toBeGreaterThan(2);
      expect(entry[0]).not.toBe(entry[1]);
    }
  });

  it('labels every layer in both languages too', () => {
    for (const l of GROUPS.flatMap((g) => g.layers)) {
      const entry = (S as Record<string, [string, string]>)[`l_${l}`];
      expect(entry, `l_${l} has no label`).toBeTruthy();
      expect(entry[0].length).toBeGreaterThan(1);
      expect(entry[1].length).toBeGreaterThan(1);
    }
  });
});
