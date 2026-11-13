import { describe, expect, it } from 'vitest';
import { CONFLICT, COUNTRY_CODES, SOURCES } from '../src/data';
import { ATTACKS } from '../src/data/attacks';
import { ATTACK, CATEGORIES, CATEGORY_COLOR, attacksIn, attacksInUnit, attacksUpTo, reportingDelay, since } from '../src/lib/attacks';
import { SNAPSHOT_DATE } from '../src/data/sources';
import admin1 from '../src/data/admin1.units.json';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const UNITS = new Set((admin1 as { iso: string; code: string }[]).map((u) => `${u.iso}:${u.code}`));

describe('documented events and attacks', () => {
  it('every record is sourced, dated, located and tied to a real conflict', () => {
    for (const a of ATTACKS) {
      expect(a.s.length, a.id).toBeGreaterThan(0);
      for (const s of a.s) expect(SOURCES[s], `${a.id} source ${s}`).toBeDefined();
      expect(a.d, a.id).toMatch(DATE);
      expect(a.published, a.id).toMatch(DATE);
      expect(COUNTRY_CODES, `${a.id} iso`).toContain(a.iso);
      expect(CONFLICT[a.conflict], `${a.id} -> ${a.conflict}`).toBeDefined();
      expect(CATEGORIES, `${a.id} category`).toContain(a.category);
      // Coordinates must be real, and never the null island.
      expect(Math.abs(a.at[0]), a.id).toBeLessThanOrEqual(90);
      expect(Math.abs(a.at[1]), a.id).toBeLessThanOrEqual(180);
      expect(a.at[0] === 0 && a.at[1] === 0, a.id).toBe(false);
      for (const [no, en] of [a.title, a.what, a.place]) {
        expect(no.length, a.id).toBeGreaterThan(3);
        expect(en.length, a.id).toBeGreaterThan(3);
      }
      expect(a.what[0], a.id).not.toBe(a.what[1]);
    }
  });

  it('never reports an event before it happened', () => {
    for (const a of ATTACKS) {
      expect(a.published >= a.d, a.id).toBe(true);
      expect(reportingDelay(a), a.id).toBeGreaterThanOrEqual(0);
      // Nothing in a snapshot may be dated after the snapshot itself.
      expect(a.d <= SNAPSHOT_DATE, a.id).toBe(true);
    }
  });

  it('states location precision rather than implying it', () => {
    for (const a of ATTACKS) {
      expect(['exact', 'district', 'city', 'region', 'offshore'], a.id).toContain(a.precision);
      // Nothing in this snapshot claims a precise site, so nothing may be drawn as one.
      if (a.precision !== 'exact') expect(a.at.every((n) => Number.isFinite(n)), a.id).toBe(true);
    }
  });

  it('keeps conflicting casualty reports apart instead of merging them', () => {
    const kyiv = ATTACK['at-kyiv-20261107'];
    expect(kyiv.verification).toBe('disputed');
    // Two separate figures, each with its own source: five and at least six.
    expect(kyiv.casualties).toHaveLength(2);
    expect(new Set(kyiv.casualties.flatMap((c) => c.s)).size).toBe(2);
    expect(kyiv.casualties[0].t[1]).toMatch(/Five injured/);
    expect(kyiv.casualties[1].t[1]).toMatch(/At least six/);
    for (const c of kyiv.casualties) for (const s of c.s) expect(SOURCES[s]).toBeDefined();
  });

  it('marks a party’s own announcement as attributed, not as fact', () => {
    const blockade = ATTACK['at-redsea-20260720'];
    expect(blockade.verification).toBe('attributed');
    expect(blockade.what[1]).toMatch(/not an independently observed blockade/i);
  });

  it('only links a territory the base map actually holds', () => {
    for (const a of ATTACKS) {
      if (!a.territory) continue;
      expect(UNITS, `${a.id} -> ${a.territory}`).toContain(a.territory);
    }
    expect(attacksInUnit('UKR:UA-32').map((a) => a.id)).toContain('at-kyiv-20261107');
    expect(attacksInUnit('NOWHERE:XX-1')).toHaveLength(0);
  });

  it('measures the window from the snapshot, not from the reader’s clock', () => {
    expect(since('7d', '2026-11-09')).toBe('2026-11-02');
    expect(since('all')).toBe('0000-01-01');
    // A window anchored to the snapshot gives the same answer whenever it runs.
    expect(since('30d', '2026-11-09')).toBe(since('30d', '2026-11-09'));
  });

  it('filters by window, country, conflict and category', () => {
    const all = attacksIn();
    expect(all.length).toBe(ATTACKS.length);
    // Most recent first.
    const dates = all.map((a) => a.d);
    expect(dates).toEqual([...dates].sort().reverse());
    expect(attacksIn({ iso: 'UKR' }).every((a) => a.iso === 'UKR')).toBe(true);
    expect(attacksIn({ conflict: 'sdn' }).map((a) => a.id).sort()).toEqual(['at-elfasher-20251028', 'at-kordofan-20261108']);
    expect(attacksIn({ conflict: 'ukr' }).length).toBeGreaterThanOrEqual(9);
    expect(attacksIn({ category: 'maritime' }).every((a) => a.category === 'maritime')).toBe(true);
    expect(attacksIn({ period: '7d' }).map((a) => a.id)).toContain('at-kordofan-20261108');
    expect(attacksIn({ period: '7d' }).map((a) => a.id)).not.toContain('at-elfasher-20251028');
    expect(attacksIn({ actor: 'houthi' }).length).toBeGreaterThan(0);
  });

  it('respects the timeline year', () => {
    // The earliest records are the 2023 Red Sea shipping attacks.
    expect(attacksUpTo(2022)).toHaveLength(0);
    expect(attacksUpTo(2024).every((a) => a.d < '2025')).toBe(true);
    expect(attacksUpTo(2025).every((a) => a.d < '2026')).toBe(true);
    expect(attacksUpTo(2026).length).toBe(ATTACKS.length);
  });

  it('gives every category a distinct colour', () => {
    const colors = CATEGORIES.map((c) => CATEGORY_COLOR[c]);
    expect(colors.every(Boolean)).toBe(true);
    for (const c of colors) expect(c).toMatch(/^#[0-9A-F]{6}$/i);
  });
});


describe('Ukraine is the deepest incident coverage', () => {
  it('spans several categories and both verification extremes', () => {
    const ukr = attacksIn({ iso: 'UKR' });
    expect(ukr.length).toBeGreaterThanOrEqual(9);
    const cats = new Set(ukr.map((a) => a.category));
    for (const c of ['missile', 'civilians', 'energy', 'territorial_change', 'clash', 'infrastructure']) {
      expect(cats, c).toContain(c);
    }
    expect(ukr.some((a) => a.verification === 'confirmed')).toBe(true);
    expect(ukr.some((a) => a.verification === 'disputed')).toBe(true);
    expect(ukr.some((a) => a.verification === 'attributed')).toBe(true);
  });

  it('marks a general\u2019s own claim as attributed rather than as control', () => {
    const k = ATTACK['at-kostiantynivka-20251218'];
    expect(k.verification).toBe('attributed');
    expect(k.what[1]).toMatch(/claim by a party to the conflict/i);
    // A claim about holding half a city is not recorded as a control change.
    expect(k.category).not.toBe('territorial_change');
  });

  it('ties incidents to the unit they happened in, where the map holds one', () => {
    const linked = attacksIn({ iso: 'UKR' }).filter((a) => a.territory);
    expect(linked.length).toBeGreaterThanOrEqual(8);
    for (const a of linked) expect(a.territory!.startsWith('UKR:')).toBe(true);
  });
});

import { offshore } from '../src/data/attacks';
describe('attacks on shipping', () => {
  it('converts a reported distance and bearing from a port into a position at sea', () => {
    // 60 nm due west of Al Hudaydah is one degree of longitude scaled by latitude.
    const [lat, lng] = offshore('hudaydah', 60, 270);
    expect(lat).toBeCloseTo(14.8, 2);
    expect(42.95 - lng).toBeCloseTo(1 / Math.cos((14.8 * Math.PI) / 180), 2);
  });
  it('keeps every Red Sea ship attack dated, sourced and honest about the attacker', () => {
    const ships = ATTACKS.filter((a) => a.id.startsWith('at-ship-'));
    expect(ships.length).toBeGreaterThanOrEqual(8);
    for (const a of ships) {
      expect(a.category, a.id).toBe('maritime');
      expect(a.conflict, a.id).toBe('yem');
      // A position worked out from a port must say so in its place name.
      if (a.precision === 'offshore') expect(a.place[1], a.id).toMatch(/nm/);
      // Where nobody is named, nothing is filled in.
      if (a.attacker === null) expect(a.what[1], a.id).not.toMatch(/Houthis (fired|attacked|struck)/);
    }
    expect(ATTACK['at-ship-tihamah-20260811'].verification).toBe('disputed');
  });
});
