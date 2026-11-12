import { describe, expect, it } from 'vitest';
import { CHOKEPOINT, CONFLICT, SOURCES } from '../src/data';
import { ACTOR, ACTORS, CONTROL, CONTROL_HISTORY, FRONTS, NO_TERRITORY, PLACES, REGION, REGIONS } from '../src/data/territory';
import { actorHoldings, actorsOfRegion, controlAt, effectiveFrom, regionSummary, regionsWithData, statusLabel, territoriesOfRegion, territoryFeatures, unitFill, unitHistory } from '../src/lib/territory';
import admin1 from '../src/data/admin1.units.json';
import { SNAPSHOT_YEAR as SNAPSHOT_YEAR_T } from '../src/store';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

describe('territorial control data', () => {
  it('every actor, region and place is sourced, bilingual and internally consistent', () => {
    for (const a of ACTORS) {
      expect(a.s.length, a.id).toBeGreaterThan(0);
      for (const s of a.s) expect(SOURCES[s], `${a.id} source ${s}`).toBeDefined();
      expect(a.color).toMatch(/^#[0-9A-F]{6}$/i);
      // Proper nouns may read the same in both languages; the prose must not.
      for (const [no, en] of [a.name, a.about, a.objectives, a.supporters, a.assets]) {
        expect(no.length, a.id).toBeGreaterThan(3);
        expect(en.length, a.id).toBeGreaterThan(3);
      }
      for (const [no, en] of [a.about, a.objectives, a.supporters, a.assets]) expect(no, a.id).not.toBe(en);
      for (const o of a.opponents) expect(ACTOR[o], `${a.id} opponent ${o}`).toBeDefined();
      expect(REGION[a.region], `${a.id} region`).toBeDefined();
    }
    for (const r of REGIONS) {
      expect(CONFLICT[r.conflict], `${r.id} -> ${r.conflict}`).toBeDefined();
      expect(r.verified).toMatch(DATE);
      for (const s of r.s) expect(SOURCES[s]).toBeDefined();
    }
    for (const p of PLACES) {
      expect(REGION[p.region], p.id).toBeDefined();
      if (p.actor) expect(ACTOR[p.actor], p.id).toBeDefined();
      expect(p.d).toMatch(DATE);
      for (const s of p.s) expect(SOURCES[s], `${p.id} source ${s}`).toBeDefined();
      expect(Math.abs(p.at[0])).toBeLessThanOrEqual(90);
      expect(Math.abs(p.at[1])).toBeLessThanOrEqual(180);
    }
    for (const f of FRONTS) {
      expect(REGION[f.region], f.id).toBeDefined();
      for (const b of f.between) expect(ACTOR[b], `${f.id} actor ${b}`).toBeDefined();
      expect(f.d).toMatch(DATE);
      for (const s of f.s) expect(SOURCES[s]).toBeDefined();
    }
    for (const n of NO_TERRITORY) expect(CONFLICT[n.conflict], n.conflict).toBeDefined();
  });

  it('every control record names a real actor, a real unit, a date and a source', () => {
    const units = new Set((admin1 as { iso: string; code: string }[]).map((u) => `${u.iso}:${u.code}`));
    for (const r of [...CONTROL, ...CONTROL_HISTORY]) {
      expect(ACTOR[r.actor], `${r.code} actor ${r.actor}`).toBeDefined();
      if (r.with) expect(ACTOR[r.with], `${r.code} with ${r.with}`).toBeDefined();
      expect(units.has(`${r.iso}:${r.code}`), `${r.iso}:${r.code} missing from admin1`).toBe(true);
      expect(r.d).toMatch(DATE);
      expect(r.s.length, r.code).toBeGreaterThan(0);
      for (const s of r.s) expect(SOURCES[s], `${r.code} source ${s}`).toBeDefined();
      expect(r.note[0]).not.toBe(r.note[1]);
      if (r.status === 'contested') expect(r.with, `${r.code} contested needs a second actor`).toBeDefined();
    }
    // one current record per unit, and no two assessments share an effective date
    const keys = CONTROL.map((r) => `${r.iso}:${r.code}`);
    expect(new Set(keys).size).toBe(keys.length);
    const stamped = [...CONTROL, ...CONTROL_HISTORY].map((r) => `${r.iso}:${r.code}@${effectiveFrom(r)}`);
    expect(new Set(stamped).size).toBe(stamped.length);
    // history never starts after the current assessment it precedes
    for (const h of CONTROL_HISTORY) {
      const now = CONTROL.find((r) => r.iso === h.iso && r.code === h.code);
      if (now) expect(effectiveFrom(h) <= effectiveFrom(now), `${h.code} ${effectiveFrom(h)}`).toBe(true);
    }
  });

  it('nothing is dated after the snapshot and no control is asserted without evidence', () => {
    for (const r of [...CONTROL, ...CONTROL_HISTORY]) expect(r.d <= '2026-11-09', `${r.code} ${r.d}`).toBe(true);
    // Units drawn === units with a sourced record; never more.
    expect(territoryFeatures(2026).length).toBe(CONTROL.length);
    const drawn = new Set(territoryFeatures(2026).map((f) => `${f.properties.iso}:${f.properties.code}`));
    for (const r of CONTROL) expect(drawn.has(`${r.iso}:${r.code}`)).toBe(true);
  });

  it('regions carry the control picture the sources describe', () => {
    // Yemen: the Houthis hold the north and the coast, the government the east.
    const ye = regionSummary('yemen');
    expect(ye.units).toBe(21);
    const houthi = ye.byActor.get('ye-houthi')!;
    expect(houthi.control).toBeGreaterThanOrEqual(8);
    expect(ye.byActor.get('ye-plc')!.control).toBeGreaterThanOrEqual(5);
    // Ukraine: Crimea plus the four partly occupied oblasts are on the Russian side.
    const ua = regionSummary('ukraine');
    expect(ua.units).toBe(27);
    const rus = ua.byActor.get('ua-rus')!;
    expect(rus.control).toBe(2);        // Crimea and Sevastopol
    expect(rus.partial).toBe(4);        // Luhansk, Donetsk, Zaporizhzhia, Kherson
    // Sudan: the RSF holds Darfur, the army the centre and east, Kordofan is contested.
    const sd = regionSummary('sudan');
    expect(sd.byActor.get('sd-rsf')!.control).toBe(5);
    expect(sd.byActor.get('sd-saf')!.contested).toBe(3);
    // DR Congo: both Kivus contested, nothing else.
    expect(regionSummary('drc').byActor.get('cd-m23')!.contested).toBe(2);
  });

  it('control moves through time exactly as the sources describe', () => {
    // Crimea: Ukrainian until 2014, occupied from March 2014 onwards.
    expect(controlAt('UKR', 'UA-43', 2013)).toBeNull();
    expect(controlAt('UKR', 'UA-43', 2014)!.actor).toBe('ua-rus');
    expect(controlAt('UKR', 'UA-43', 2026)!.actor).toBe('ua-rus');
    // Kherson: 95% Russian in mid-2022, roughly halved after the November counteroffensive.
    expect(controlAt('UKR', 'UA-65', 2021)!.actor).toBe('ua-gov');
    expect(controlAt('UKR', 'UA-65', 2022)!.share![1]).toBe('about 50–55%');
    expect(controlAt('UKR', 'UA-48', 2022)!.status).toBe('control'); // Mykolaiv liberated by year end
    // Yemen: Aden passes government → STC → government inside five weeks.
    expect(controlAt('YEM', 'YE-AD', 2015)!.actor).toBe('ye-plc');
    expect(controlAt('YEM', 'YE-AD', 2025)!.actor).toBe('ye-stc');
    expect(controlAt('YEM', 'YE-AD', 2026)!.actor).toBe('ye-plc');
    // Sudan: Khartoum RSF → army; El Fasher army → RSF.
    expect(controlAt('SDN', 'SD-KH', 2023)!.actor).toBe('sd-rsf');
    expect(controlAt('SDN', 'SD-KH', 2025)!.actor).toBe('sd-saf');
    expect(controlAt('SDN', 'SD-DN', 2024)!.actor).toBe('sd-saf');
    expect(controlAt('SDN', 'SD-DN', 2025)!.actor).toBe('sd-rsf');
    // Syria: the north-east passes from the SDF to the transitional government in January 2026.
    expect(controlAt('SYR', 'SY-DY', 2025)!.actor).toBe('sy-sdf');
    expect(controlAt('SYR', 'SY-DY', 2026)!.actor).toBe('sy-gov');
    // DR Congo: South Kivu only becomes contested once Bukavu falls.
    expect(controlAt('COD', 'CD-SK', 2024)!.actor).toBe('cd-gov');
    expect(controlAt('COD', 'CD-SK', 2025)!.status).toBe('contested');
    // Nothing is drawn before the first sourced assessment for a region.
    // The West Bank is the only arrangement the dataset documents back that far.
    expect(regionsWithData(2010)).toEqual(['palestine', 'caucasus', 'chechnya']);
    expect(regionsWithData(2013)).not.toContain('ukraine');
    expect(regionsWithData(2014)).toContain('ukraine');
    expect(regionsWithData(2014)).not.toContain('sudan');
    expect(regionsWithData(2023)).toContain('sudan');
    expect(regionsWithData(2026).sort()).toEqual(['caucasus', 'chechnya', 'drc', 'libya', 'palestine', 'sudan', 'syria', 'ukraine', 'yemen']);
    // A unit with several assessments exposes them in order.
    const hist = unitHistory('YEM', 'YE-AD');
    expect(hist.length).toBe(3);
    expect(hist.map((h) => effectiveFrom(h))).toEqual([...hist.map((h) => effectiveFrom(h))].sort());
  });

  it('actor holdings and region lookups line up', () => {
    const h = actorHoldings('ye-houthi');
    expect(h.full.length + h.partial.length).toBeGreaterThanOrEqual(9);
    expect(h.places.map((p) => p.name)).toContain('Sanaa');
    expect(actorsOfRegion('yemen').map((a) => a.id).sort()).toEqual(['ye-houthi', 'ye-plc', 'ye-stc']);
    expect(territoriesOfRegion('libya', 2026).length).toBe(22);
    // every region's conflict is reachable, and chokepoints link back to conflicts
    for (const r of REGIONS) expect(territoriesOfRegion(r.id, 2026).length).toBeGreaterThan(0);
    expect(CHOKEPOINT.bab.conflicts).toContain('yem');
  });

  it('fill colour tracks status and never colours an unknown actor', () => {
    const ctrl = CONTROL.find((r) => r.status === 'control')!;
    const cont = CONTROL.find((r) => r.status === 'contested')!;
    expect(unitFill(ctrl)).toMatch(/^rgba\(/);
    const alpha = (s: string) => Number(s.slice(s.lastIndexOf(',') + 1, -1));
    expect(alpha(unitFill(ctrl))).toBeGreaterThan(alpha(unitFill(cont)));
    expect(unitFill({ ...ctrl, actor: 'nope' })).toContain('140,160,185');
    expect(statusLabel.contested[0]).toBe('Omstridt');
  });

  /**
   * Natural Earth's admin-1 layer for Sudan predates the creation of West
   * Kordofan in 2013, so Babanusa, El Fula and the Heglig oilfield — the main
   * front of the war — sat inside the polygon labelled South Kordofan, and the
   * state the control data assigned them to was the wrong one. Sudan now comes
   * from geoBoundaries instead. This checks the towns land where they belong,
   * because a wrong boundary is invisible until something is placed on it.
   */
  it('puts Sudan\u2019s Kordofan towns in the state they are actually in', () => {
    type Geom = { type: string; coordinates: number[][][] | number[][][][] };
    const units = admin1 as { iso: string; code: string; name: string; geometry: Geom }[];
    const sdn = units.filter((u) => u.iso === 'SDN');
    expect(sdn).toHaveLength(18);
    expect(sdn.map((u) => u.code)).toContain('SD-GK');

    const rings = (g: Geom) => (g.type === 'Polygon' ? [g.coordinates] : g.coordinates) as number[][][][];
    const inside = (pt: [number, number], g: Geom) => {
      let hit = false;
      for (const poly of rings(g)) {
        for (let ri = 0; ri < poly.length; ri++) {
          const r = poly[ri];
          let c = false;
          for (let i = 0; i < r.length - 1; i++) {
            const [x0, y0] = r[i], [x1, y1] = r[i + 1];
            if ((y0 > pt[1]) !== (y1 > pt[1]) && pt[0] < x0 + ((pt[1] - y0) / (y1 - y0)) * (x1 - x0)) c = !c;
          }
          if (ri === 0) { if (c) hit = true; } else if (c) hit = false;
        }
      }
      return hit;
    };
    const where = (pt: [number, number]) => sdn.filter((u) => inside(pt, u.geometry)).map((u) => u.code);

    expect(where([27.80, 11.32])).toEqual(['SD-GK']); // Babanusa
    expect(where([28.35, 11.73])).toEqual(['SD-GK']); // El Fula, the state capital
    expect(where([29.40, 9.93])).toEqual(['SD-GK']);  // Heglig oilfield
    expect(where([29.72, 11.01])).toEqual(['SD-KS']); // Kadugli, South Kordofan
    expect(where([30.22, 13.18])).toEqual(['SD-KN']); // El Obeid, North Kordofan
  });

  it('the geometry is real administrative geography, not drawn by hand', () => {
    const units = admin1 as { iso: string; code: string; name: string; geometry: { type: string; coordinates: number[][][][] } }[];
    expect(units.length).toBe(152);
    expect(new Set(units.map((u) => `${u.iso}:${u.code}`)).size).toBe(units.length);
    for (const u of units) {
      // topojson emits Polygon for a single-ring unit and MultiPolygon otherwise.
      expect(['Polygon', 'MultiPolygon'], `${u.iso}:${u.code}`).toContain(u.geometry.type);
      expect(u.geometry.coordinates.length).toBeGreaterThan(0);
      const polys = (u.geometry.type === 'Polygon'
        ? [u.geometry.coordinates]
        : u.geometry.coordinates) as unknown as number[][][][];
      for (const poly of polys) {
        const ring = poly[0] as unknown as [number, number][];
        expect(ring.length).toBeGreaterThanOrEqual(4);
        expect(ring[0]).toEqual(ring[ring.length - 1]);
        for (const [lng, lat] of ring) {
          expect(Math.abs(lat)).toBeLessThanOrEqual(90);
          expect(Math.abs(lng)).toBeLessThanOrEqual(180);
        }
      }
    }
    // Crimea is carried under Ukraine, where it is internationally recognised.
    expect(units.some((u) => u.iso === 'UKR' && u.code === 'UA-43')).toBe(true);
    expect(REGION.ukraine.legalNote?.[1]).toMatch(/internationally recognised/);
  });
});

describe('the assessment date follows the year on the timeline', () => {
  it('reports the latest record actually drawn, not the present-day date', () => {
    const now = regionSummary('ukraine', SNAPSHOT_YEAR_T);
    const then = regionSummary('ukraine', 2022);
    expect(then.asOf.slice(0, 4)).toBe('2022');
    expect(now.asOf > then.asOf).toBe(true);
    // A year with no sourced control for the region reports no date at all.
    expect(regionSummary('ukraine', 2010).asOf).toBe('');
  });
});


describe('the Caucasus is categorised on its own terms', () => {
  it('never draws Abkhazia or South Ossetia the way it draws occupied Ukraine', () => {
    const ge = CONTROL.filter((r) => r.iso === 'GEO');
    expect(ge.map((r) => r.code).sort()).toEqual(['GE-AB', 'GE-SO']);
    for (const r of ge) {
      // Not 'control': that is the category used along an active front.
      expect(r.status, r.code).toBe('defacto');
      expect(r.with, r.code).toBe('ru-mil');
      expect(r.since, r.code).toBe('2008-08-26');
    }
    // The region states the legal position explicitly and separates it from Ukraine.
    const reg = REGIONS.find((x) => x.id === 'caucasus')!;
    expect(reg.legalNote).toBeDefined();
    expect(reg.legalNote![1]).toMatch(/internationally recognised as parts of Georgia/i);
    expect(reg.legalNote![1]).toMatch(/differently from Russian-occupied Ukrainian territory/i);
    // Ukraine's own records stay in their own categories.
    for (const r of CONTROL.filter((x) => x.iso === 'UKR')) expect(r.status, r.code).not.toBe('defacto');
  });

  it('treats Chechnya as a republic of Russia, not as occupied territory', () => {
    const che = CONTROL.filter((r) => r.iso === 'RUS' && r.code === 'RU-CE');
    expect(che).toHaveLength(1);
    expect(che[0].status).toBe('federal');
    expect(che[0].actor).toBe('ru-fed');
    // No opposing actor: there is no current contest over control.
    expect(che[0].with).toBeUndefined();
    expect(ACTOR['ru-fed'].opponents).toEqual([]);
    const reg = REGIONS.find((x) => x.id === 'chechnya')!;
    expect(reg.legalNote![1]).toMatch(/part of Russia both legally and in fact/i);
  });

  it('fills the two new categories more faintly than active control', () => {
    const f = (status: 'control' | 'defacto' | 'federal') =>
      Number(unitFill({ ...CONTROL[0], actor: 'ru-mil', status }).split(',')[3].replace(')', ''));
    expect(f('defacto')).toBeLessThan(f('control'));
    expect(f('federal')).toBeLessThan(f('defacto'));
  });
});
