import { describe, expect, it } from 'vitest';
import {
  ALL_ROUTES, CHOKEPOINT, CHOKEPOINTS, CONFLICT, CONFLICTS, ENERGY_SITES, EVENTS, LINKS, ORGS, RELATIONS, ROUTE, SANCTIONS, SCENARIOS, SNAPSHOT_DATE, SOURCES, isKnownIso, loadWorld,
} from '../src/data';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const srcOk = (ids: string[], where: string) => {
  expect(ids.length, `${where} has at least one source`).toBeGreaterThan(0);
  for (const id of ids) expect(SOURCES[id], `${where} references missing source "${id}"`).toBeDefined();
};

describe('dataset integrity', () => {
  it('ids are unique within and across collections', () => {
    const all = [
      ...CONFLICTS.map((x) => `c:${x.id}`),
      ...ORGS.map((x) => `o:${x.id}`),
      ...CHOKEPOINTS.map((x) => `k:${x.id}`),
      ...ALL_ROUTES.map((x) => `r:${x.id}`),
      ...ENERGY_SITES.map((x) => `e:${x.id}`),
      ...LINKS.map((x) => `l:${x.id}`),
      ...SANCTIONS.map((x) => `s:${x.id}`),
      ...RELATIONS.map((x) => `b:${x.id}`),
      ...SCENARIOS.map((x) => `sc:${x.id}`),
    ];
    expect(new Set(all).size).toBe(all.length);
  });

  it('every source reference resolves and every date parses', () => {
    for (const c of CONFLICTS) {
      srcOk(c.s, c.id);
      expect(c.start).toMatch(DATE);
      expect(c.verified).toMatch(DATE);
      for (const cl of c.claims) { srcOk(cl.s, `${c.id} claim`); expect(cl.d).toMatch(DATE); }
      for (const f of c.figs) { srcOk(f.s.length ? f.s : ['ucdp'], `${c.id} figure`); expect(f.d).toMatch(DATE); }
    }
    for (const e of EVENTS) { srcOk(e.s, `event ${e.t[1]}`); expect(e.d).toMatch(DATE); }
    for (const l of LINKS) { srcOk(l.s, l.id); expect(l.d).toMatch(DATE); }
    for (const k of CHOKEPOINTS) { srcOk(k.s, k.id); for (const st of k.status) srcOk(st.s, `${k.id} status`); for (const ex of k.exposed) srcOk(ex.s, `${k.id} exposed`); }
    for (const o of ORGS) srcOk(o.s, o.id);
    for (const r of RELATIONS) srcOk(r.s, r.id);
    for (const g of SANCTIONS) srcOk(g.s, g.id);
    for (const s of Object.values(SOURCES)) {
      expect(s.url).toMatch(/^https:\/\//);
      expect(s.date).toMatch(DATE);
    }
  });

  it('nothing is dated after the snapshot date', () => {
    const dates = [
      ...CONFLICTS.flatMap((c) => [c.verified, ...c.claims.map((x) => x.d), ...c.figs.map((x) => x.d)]),
      ...EVENTS.map((e) => e.d),
      ...LINKS.map((l) => l.d),
    ];
    for (const d of dates) expect(d <= SNAPSHOT_DATE, `${d} <= ${SNAPSHOT_DATE}`).toBe(true);
  });

  it('all country codes are known ISO alpha-3 codes', () => {
    const codes = new Set<string>([
      ...CONFLICTS.flatMap((c) => c.iso),
      ...ORGS.flatMap((o) => o.members.map((m) => m.iso)),
      ...RELATIONS.flatMap((r) => [r.a, r.b]),
      ...SANCTIONS.map((s) => s.target),
      ...ENERGY_SITES.map((e) => e.iso),
      ...CHOKEPOINTS.flatMap((k) => k.exposed.map((e) => e.iso)),
      ...LINKS.flatMap((l) => [l.from.iso, l.to.iso].filter((x): x is string => !!x)),
    ]);
    for (const c of codes) expect(isKnownIso(c), `unknown ISO code ${c}`).toBe(true);
  });

  it('cross-references resolve: via, conflicts, scenario detours, link conflicts', () => {
    for (const r of ALL_ROUTES) for (const v of r.via) expect(CHOKEPOINT[v], `${r.id} via ${v}`).toBeDefined();
    for (const k of CHOKEPOINTS) for (const c of k.conflicts) expect(CONFLICT[c], `${k.id} -> ${c}`).toBeDefined();
    for (const l of LINKS) expect(CONFLICT[l.conflict], `${l.id} -> ${l.conflict}`).toBeDefined();
    for (const e of EVENTS) if (e.conflict) expect(CONFLICT[e.conflict], `event -> ${e.conflict}`).toBeDefined();
    for (const sc of SCENARIOS) {
      if (sc.chokepoint) expect(CHOKEPOINT[sc.chokepoint]).toBeDefined();
      for (const d of sc.detours) {
        expect(ROUTE[d.base], `${sc.id} base ${d.base}`).toBeDefined();
        expect(ROUTE[d.alt], `${sc.id} alt ${d.alt}`).toBeDefined();
      }
    }
  });

  it('membership counts match reality in 2026: NATO 32, EU 27, AES 3, GCC 6', () => {
    const at = (id: string) => {
      const o = ORGS.find((x) => x.id === id)!;
      return o.members.filter((m) => m.from <= 2026 && (m.to === undefined || m.to > 2026)).length;
    };
    expect(at('nato')).toBe(32);
    expect(at('eu')).toBe(27);
    expect(at('aes')).toBe(3);
    expect(at('gcc')).toBe(6);
    expect(at('asean')).toBe(11);
    expect(at('au')).toBe(55);
    expect(at('csto')).toBe(6);
  });

  it('coordinates are within bounds', () => {
    const pts = [
      ...CONFLICTS.map((c) => c.at),
      ...CHOKEPOINTS.map((k) => k.at),
      ...ENERGY_SITES.map((e) => e.at),
      ...ALL_ROUTES.flatMap((r) => r.pts),
    ];
    for (const [lat, lng] of pts) {
      expect(Math.abs(lat)).toBeLessThanOrEqual(90);
      expect(Math.abs(lng)).toBeLessThanOrEqual(200); // route longitudes may be unwrapped slightly past 180
    }
  });

  it('the world base map loads with ISO codes attached', async () => {
    const w = await loadWorld();
    expect(w.length).toBeGreaterThan(150);
    for (const f of w) expect(f.properties.iso).toHaveLength(3);
    const norway = w.find((f) => f.properties.iso === 'NOR')!;
    expect(norway.properties.centroid[0]).toBeGreaterThan(55);
  });
});
