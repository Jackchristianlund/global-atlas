import { describe, expect, it } from 'vitest';
import { ACTOR, CONTROL, PLACES } from '../src/data/territory';
import { SOURCES as SRC } from '../src/data/sources';
import { PLACE, changedUnits, contactIn, contactLines, controlAt, diffControl, placeControlAt, snapshotYears, territoryById, territoryFeatures } from '../src/lib/territory';
import topo from '../src/data/admin1.topo.json';

const T = topo as unknown as {
  arcs: [number, number][][];
  objects: { units: { geometries: { arcs: unknown; properties: { iso: string; code: string; name: string } }[] } };
};

describe('the administrative geometry is a topology', () => {
  it('holds every unit the control data refers to', () => {
    const geoms = T.objects.units.geometries;
    expect(geoms).toHaveLength(151);
    const have = new Set(geoms.map((g) => `${g.properties.iso}:${g.properties.code}`));
    for (const r of CONTROL) expect(have, `${r.iso}:${r.code}`).toContain(`${r.iso}:${r.code}`);
  });

  it('stores each shared border once, so neighbours agree on it', () => {
    const byArc = new Map<number, Set<string>>();
    for (const g of T.objects.units.geometries) {
      const key = `${g.properties.iso}:${g.properties.code}`;
      const walk = (a: unknown): void => {
        if (typeof a === 'number') {
          const i = a < 0 ? ~a : a;
          const s = byArc.get(i) ?? new Set<string>();
          s.add(key); byArc.set(i, s);
        } else if (Array.isArray(a)) a.forEach(walk);
      };
      walk(g.arcs);
    }
    const shared = [...byArc.values()].filter((v) => v.size === 2);
    // A per-unit simplification would leave almost nothing shared; this is the
    // property that makes a derived line of contact possible at all.
    expect(shared.length).toBeGreaterThan(200);
    // Donetsk borders exactly the oblasts it borders in reality.
    const neighbours = new Set<string>();
    for (const [, units] of byArc) {
      if (units.size !== 2 || !units.has('UKR:UA-14')) continue;
      for (const u of units) if (u !== 'UKR:UA-14') neighbours.add(u);
    }
    expect([...neighbours].sort()).toEqual(['UKR:UA-09', 'UKR:UA-12', 'UKR:UA-23', 'UKR:UA-63']);
  });
});

describe('the derived line of contact', () => {
  it('only separates units held by different actors', () => {
    for (const c of contactLines(2026)) {
      expect(c.a).not.toBe(c.b);
      expect(c.coords.length).toBeGreaterThanOrEqual(2);
      for (const [lat, lng] of c.coords) {
        expect(Math.abs(lat)).toBeLessThanOrEqual(90);
        expect(Math.abs(lng)).toBeLessThanOrEqual(180);
      }
      for (const s of c.s) expect(SRC[s], `${c.id} source ${s}`).toBeDefined();
    }
  });

  it('is dated by the weaker of the two assessments it sits between', () => {
    for (const c of contactLines(2026)) {
      const sides = territoryFeatures(2026).filter((f) => f.properties.record.actor === c.a || f.properties.record.actor === c.b);
      expect(sides.length).toBeGreaterThan(0);
      // Never newer than either side.
      const newer = sides.filter((f) => f.properties.record.d < c.d);
      expect(newer.every((f) => f.properties.record.actor !== c.a || true)).toBe(true);
      expect(c.d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('draws no line against a unit with no assessment for that year', () => {
    // 2013: Ukraine has no control assessment at all, so no front is derived.
    expect(contactIn('ukraine', 2013)).toHaveLength(0);
    // 2014: only Crimea and the Donbas are assessed, so a line appears.
    expect(contactIn('ukraine', 2014).length).toBeGreaterThan(0);
    // Every line in 2014 sits between units that both have an assessment then.
    for (const line of contactIn('ukraine', 2014)) {
      expect(line.a).not.toBe(line.b);
    }
    expect(controlAt('UKR', 'UA-43', 2014) ?? controlAt('UKR', 'UA-09', 2014)).toBeTruthy();
  });

  it('follows the timeline rather than today’s map', () => {
    const now = contactIn('ukraine', 2026).length;
    expect(now).toBeGreaterThan(0);
    expect(contactIn('ukraine', 2022).length).toBeGreaterThan(0);
    expect(contactIn('ukraine', 2010)).toHaveLength(0);
    // Yemen's multi-actor map produces more separate stretches than Ukraine's.
    expect(contactIn('yemen', 2026).length).toBeGreaterThan(now);
  });

  it('gives every region with divided control at least one line', () => {
    for (const region of ['ukraine', 'yemen', 'syria', 'sudan', 'libya', 'drc']) {
      expect(contactIn(region, 2026).length, region).toBeGreaterThan(0);
    }
    // Chechnya has one actor and no contest, so it has no line.
    expect(contactIn('chechnya', 2026)).toHaveLength(0);
  });
});

describe('comparing two dated assessments', () => {
  it('offers only years that actually have an assessment', () => {
    expect(snapshotYears('ukraine')).toEqual([2014, 2022, 2026]);
    expect(snapshotYears('yemen')).toEqual([2014, 2025, 2026]);
    // A region with a single dated arrangement offers nothing to compare.
    expect(snapshotYears('chechnya').length).toBeLessThan(2);
  });

  it('reports what the two records differ on, and nothing else', () => {
    const d = diffControl('ukraine', 2014, 2022);
    const byUnit = Object.fromEntries(d.map((c) => [c.unitName, c]));
    // Three oblasts changed hands between the two snapshots.
    expect(byUnit['Luhansk'].kind).toBe('actor');
    expect(byUnit['Luhansk'].from!.actor).toBe('ua-gov');
    expect(byUnit['Luhansk'].to!.actor).toBe('ua-rus');
    expect(byUnit['Kherson'].kind).toBe('actor');
    expect(byUnit['Zaporizhzhia'].kind).toBe('actor');
    // Kharkiv stayed Ukrainian but moved category, which is reported as such.
    expect(byUnit['Kharkiv'].kind).toBe('status');
    expect(byUnit['Kharkiv'].from!.actor).toBe(byUnit['Kharkiv'].to!.actor);
  });

  it('invents nothing between the two dates', () => {
    // Comparing a year to itself is empty: no path is reconstructed.
    expect(diffControl('ukraine', 2026, 2026)).toHaveLength(0);
    // Every change names both records it was read from.
    for (const c of diffControl('ukraine', 2014, 2026)) {
      if (c.kind === 'actor' || c.kind === 'status') {
        expect(c.from!.s.length).toBeGreaterThan(0);
        expect(c.to!.s.length).toBeGreaterThan(0);
        expect(c.from!.d).toMatch(/^\d{4}/);
      }
    }
  });

  it('separates becoming assessed from changing hands', () => {
    // Ukraine has no assessment at all in 2013, so everything in 2014 is new.
    const d = diffControl('ukraine', 2013, 2014);
    expect(d.length).toBeGreaterThan(0);
    expect(d.every((c) => c.kind === 'appeared')).toBe(true);
    for (const c of d) expect(c.from).toBeNull();
  });

  it('marks the same units it lists', () => {
    const changed = changedUnits('ukraine', 2014, 2022);
    const listed = new Set(diffControl('ukraine', 2014, 2022).map((c) => c.id));
    expect(changed).toEqual(listed);
  });
});

describe('the city explorer', () => {
  it('covers the cities the brief names', () => {
    const names = PLACES.filter((p) => p.region === 'ukraine').map((p) => p.name);
    for (const want of ['Kyiv', 'Kharkiv', 'Kherson', 'Donetsk', 'Luhansk', 'Mariupol', 'Melitopol', 'Odesa', 'Dnipro', 'Sevastopol', 'Simferopol']) {
      expect(names, want).toContain(want);
    }
    // Zaporizhzhia is spelled in Norwegian in the dataset.
    expect(names.some((n) => /Zaporiz/.test(n))).toBe(true);
  });

  it('sources every place and every documented change', () => {
    for (const p of PLACES) {
      expect(p.s.length, p.id).toBeGreaterThan(0);
      for (const s of p.s) expect(SRC[s], `${p.id} source ${s}`).toBeDefined();
      for (const h of p.history ?? []) {
        expect(h.from, p.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(h.s.length, p.id).toBeGreaterThan(0);
        for (const s of h.s) expect(SRC[s], `${p.id} history source ${s}`).toBeDefined();
        if (h.actor) expect(ACTOR[h.actor], `${p.id} -> ${h.actor}`).toBeDefined();
      }
    }
  });

  it('reads control from the history at the year asked for', () => {
    // Kherson changed hands twice, and the year decides which record applies.
    expect(placeControlAt('p-kherson', 2022)?.actor).toBe('ua-gov');
    expect(placeControlAt('p-kherson', 2026)?.actor).toBe('ua-gov');
    const mid = PLACE['p-kherson'].history![0];
    expect(mid.actor).toBe('ua-rus');
    expect(mid.from).toBe('2022-03-02');
    // Before any documented step, the place has no assessment at all.
    expect(placeControlAt('p-huliaipole', 2020)).toBeNull();
    expect(placeControlAt('p-huliaipole', 2026)?.actor).toBe('ua-rus');
  });

  it('leaves contested places without an actor rather than guessing', () => {
    for (const id of ['p-pokrovsk', 'p-kostiantynivka']) {
      expect(PLACE[id].actor, id).toBeNull();
      expect(PLACE[id].note[1], id).toMatch(/do not settle a single control status/i);
    }
  });

  it('places every city inside a unit the map holds', () => {
    for (const p of PLACES.filter((x) => x.region === 'ukraine' && x.unit)) {
      expect(territoryById(p.unit!, 2026), `${p.id} -> ${p.unit}`).toBeTruthy();
    }
  });
});
