// Regression tests for the November 2026 polish and regional-explorer phase.
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { DRAWER_BREAKPOINT, altitudeForFraction, discFraction, globeOffset, panelInsets, restAltitude } from '../src/lib/framing';
import { decodeState, encodeState } from '../src/lib/urlState';
import { densify, diffFronts, distanceToLines, km, padBbox, type LatLng } from '../src/lib/frontDiff';
import { DEM, MAP_STYLES, adapterStyle, enhanceStyle, imageryProvider, scaleSize, withRelief } from '../src/map/styles';
import { contactFC, derivedContactHidden, territoryFC } from '../src/map/overlays';
import { contactIn } from '../src/lib/territory';
import { YEMEN_SITES, YEMEN_BBOX } from '../src/data/yemen/explorer';
import districts from '../src/data/yemen/districts.json';
import { PLACES } from '../src/data/territory';
import { SOURCES } from '../src/data/sources';
import { S } from '../src/i18n';
import { cardWidth } from '../src/components/Timeline';
import { UkraineExplorer, YemenExplorer } from '../src/components/RegionExplorer';
import { panelExpanded } from '../src/store';

describe('the globe fills the stage between the panels', () => {
  const desk = { leftFolded: false, rightFolded: false, expanded: false };

  it('inverts the disc-size formula exactly', () => {
    for (const f of [0.3, 0.6, 0.9, 1.2]) expect(discFraction(altitudeForFraction(f))).toBeCloseTo(f, 6);
  });

  it('reproduces the old resting size, so the comparison below is fair', () => {
    // The previous build rested at altitude 2.15 on every desktop.
    expect(discFraction(2.15)).toBeCloseTo(0.718, 2);
  });

  it('is 30–40% larger than before on a 1600×900 desktop, without clipping', () => {
    const [w, h] = [1600, 714];
    const alt = restAltitude(w, h, panelInsets(w, desk));
    const grow = discFraction(alt) / discFraction(2.15);
    expect(grow).toBeGreaterThanOrEqual(1.28);
    expect(grow).toBeLessThanOrEqual(1.4);
    expect(discFraction(alt)).toBeLessThan(1); // never taller than the stage
  });

  it('stays inside the free width when the stage is narrow and tall', () => {
    const [w, h] = [1180, 800];
    const ins = panelInsets(w, desk);
    const d = discFraction(restAltitude(w, h, ins)) * h;
    expect(d).toBeLessThanOrEqual(w - ins.left - ins.right);
  });

  it('uses the whole width on a phone, where the panels are drawers', () => {
    expect(panelInsets(390, desk)).toEqual({ left: 0, right: 0 });
    const d = discFraction(restAltitude(390, 568, { left: 0, right: 0 })) * 568;
    expect(d).toBeGreaterThan(340);
    expect(d).toBeLessThanOrEqual(390);
    expect(390).toBeLessThanOrEqual(DRAWER_BREAKPOINT);
  });

  it('centres the globe in the gap, and moves with a folded panel', () => {
    const open = globeOffset(panelInsets(1600, desk));
    expect(open[0]).toBeLessThan(0); // the right panel is wider, so the globe shifts left
    const folded = globeOffset(panelInsets(1600, { ...desk, leftFolded: true }));
    expect(folded[0]).toBeLessThan(open[0]); // more room on the left: further left still
  });

  it('widens the right panel for detail and keeps it compact for the overview', () => {
    const compact = panelInsets(1600, desk).right;
    const wide = panelInsets(1600, { ...desk, expanded: true }).right;
    expect(wide).toBeGreaterThan(compact);
    expect(panelExpanded({ sel: null, disputedId: null, incidentBin: null, trace: [] })).toBe(false);
    expect(panelExpanded({ sel: { kind: 'conflict', id: 'ukr' }, disputedId: null, incidentBin: null, trace: [] })).toBe(true);
  });
});

describe('shareable links', () => {
  const known = () => true;
  it('round-trips region, date, zoom, layers, style and comparison', () => {
    const st = {
      view: 'conflict' as const, mode: 'map' as const, center: [48.3, 36.2] as [number, number], zoom: 6.3, year: 2022,
      sel: { kind: 'conflict' as const, id: 'ukr' }, layers: ['territories', 'sourceline'] as never, style: 'terrain' as const,
      compare: { a: 3 as const, b: 'now' as const },
    };
    expect(decodeState(encodeState(st), known, [2000, 2026])).toEqual(st);
  });
  it('drops what it cannot use instead of breaking', () => {
    const d = decodeState('#v=nope&m=map&c=999,1&z=99&y=1850&s=conflict:zzz&l=territories.bogus&st=neon&fc=0-13', (s) => s.id !== 'zzz', [2000, 2026]);
    expect(d).toEqual({ mode: 'map', layers: ['territories'] });
  });
  it('keeps an empty layer list as "all off", not as "unspecified"', () => {
    expect(decodeState('l=', known, [2000, 2026]).layers).toEqual([]);
  });
});

describe('comparing two dated front lines', () => {
  const line: LatLng[] = Array.from({ length: 41 }, (_, i) => [47 + i * 0.05, 36] as LatLng); // ~220 km north–south

  it('measures distance to a line in kilometres', () => {
    expect(distanceToLines([47.5, 36.1], [line])).toBeCloseTo(km([47.5, 36], [47.5, 36.1]), 1);
  });

  it('reports nothing when the two assessments coincide', () => {
    const d = diffFronts([line], [line], 3);
    expect(d.stretches).toHaveLength(0);
    expect(d.bbox).toBeNull();
  });

  it('ignores differences below the threshold the data can resolve', () => {
    const jitter = line.map(([a, b]) => [a, b + 0.02] as LatLng); // ~1.5 km
    expect(diffFronts([line], [jitter], 3).stretches).toHaveLength(0);
  });

  it('finds the stretch that moved and frames it, and only it', () => {
    const moved = line.map(([a, b], i) => [a, i >= 10 && i <= 20 ? b + 0.15 : b] as LatLng); // ~11 km east between 47.5 and 48.0 N
    const d = diffFronts([line], [moved], 3);
    expect(d.stretches.length).toBeGreaterThan(0);
    expect(d.maxShiftKm).toBeGreaterThan(9);
    expect(d.maxShiftKm).toBeLessThan(13);
    const [, s, , n] = d.bbox!;
    expect(s).toBeGreaterThan(47.35);
    expect(n).toBeLessThan(48.1);
  });

  it('densifies long segments so a shift between two vertices is not missed', () => {
    const two: LatLng[] = [[47, 36], [49, 36]];
    expect(densify(two, 1).length).toBeGreaterThan(200);
  });

  it('pads a frame and never collapses it to a point', () => {
    const b = padBbox([36, 48, 36, 48], 0.2, 0.3);
    expect(b[2] - b[0]).toBeGreaterThanOrEqual(0.3);
  });
});

describe('map styles and imagery', () => {
  it('scales label sizes inside zoom expressions without breaking them', () => {
    expect(scaleSize(10, 1.1)).toBe(11);
    expect(scaleSize(['interpolate', ['linear'], ['zoom'], 5, 10, 11, 20], 1.1)).toEqual(['interpolate', ['linear'], ['zoom'], 5, 11, 11, 22]);
    expect(scaleSize(['get', 'size'], 2)).toEqual(['get', 'size']);
  });

  it('enhances labels and darkens roads only on the muted conflict style', () => {
    const doc = { layers: [
      { id: 'label_city', type: 'symbol', layout: { 'text-field': '{name}', 'text-size': 12 }, paint: { 'text-halo-width': 1 } },
      { id: 'highway_major_casing', type: 'line', 'source-layer': 'transportation', paint: { 'line-color': '#ddd' } },
    ] };
    const c = enhanceStyle(doc, 'conflict') as unknown as { layers: { layout: Record<string, number>; paint: Record<string, unknown> }[] };
    expect(c.layers[0].layout['text-size']).toBeCloseTo(13.2, 5);
    expect(c.layers[0].paint['text-halo-width']).toBeGreaterThanOrEqual(1.3);
    expect(c.layers[1].paint['line-color']).not.toBe('#ddd');
    const t = enhanceStyle(doc, 'terrain') as unknown as { layers: { paint: Record<string, unknown> }[] };
    expect(t.layers[1].paint['line-color']).toBe('#ddd');
  });

  it('adds relief from the open terrain tiles under water, roads and labels', () => {
    const doc = { sources: {}, layers: [{ id: 'landcover', type: 'fill' }, { id: 'water', type: 'fill' }, { id: 'label', type: 'symbol' }] };
    const r = withRelief(doc, 0.4) as { sources: Record<string, { tiles: string[] }>; layers: { id: string }[] };
    expect(r.layers.map((l) => l.id)).toEqual(['landcover', 'ga-relief', 'water', 'label']);
    expect(r.sources['ga-dem'].tiles).toEqual(DEM.tiles);
    expect(MAP_STYLES.terrain.relief!).toBeGreaterThan(MAP_STYLES.conflict.relief!);
  });

  it('switches to a licensed commercial provider when the build names one', () => {
    for (const id of ['maptiler', 'esri', 'mapbox', 'stadia']) {
      const p = imageryProvider({ VITE_SATELLITE_PROVIDER: id, VITE_SATELLITE_KEY: 'k e y' });
      expect(p.id).toBe(id);
      expect(p.commercial).toBe(true);
      expect(p.tiles[0]).toContain('k%20e%20y');
      expect(p.attribution.length).toBeGreaterThan(5);
    }
    // A provider without a key is not configured: fall back, honestly.
    expect(imageryProvider({ VITE_SATELLITE_PROVIDER: 'maptiler' }).id).toBe('eox2016');
  });

  it('builds hybrid from the vector style’s roads and names over imagery', () => {
    const labels = { sources: { openmaptiles: {} }, glyphs: 'https://x/{fontstack}/{range}.pbf', layers: [
      { id: 'water', type: 'fill', 'source-layer': 'water' },
      { id: 'road', type: 'line', 'source-layer': 'transportation' },
      { id: 'city', type: 'symbol', 'source-layer': 'place' },
    ] };
    const h = adapterStyle('hybrid', labels) as { layers: { id: string }[]; sources: Record<string, unknown> };
    expect(h.layers.map((l) => l.id)).toEqual(['bg', 'sat', 'road', 'city']);
    expect(Object.keys(h.sources)).toContain('sat');
    const s = adapterStyle('satellite') as { layers: { id: string }[] };
    expect(s.layers.map((l) => l.id)).toEqual(['bg', 'sat']);
  });
});

describe('no administrative border is drawn as a front line', () => {
  it('never derives a contact line for Yemen', () => {
    expect(contactIn('yemen', 2026).length).toBeGreaterThan(0); // the data still exists…
    const hidden = contactFC(2026, 'yemen', (r) => derivedContactHidden(r, 2026, true, 2026));
    expect(hidden.features).toHaveLength(0); // …but it is not drawn.
    expect(derivedContactHidden('yemen', 2014, false, 2026)).toBe(true);
  });

  it('gives way to the sourced line in Ukraine for the year it covers', () => {
    expect(derivedContactHidden('ukraine', 2026, true, 2026)).toBe(true);
    expect(derivedContactHidden('ukraine', 2026, false, 2026)).toBe(false);
    expect(derivedContactHidden('ukraine', 2022, true, 2026)).toBe(false);
    expect(derivedContactHidden('syria', 2026, true, 2026)).toBe(false);
  });

  it('carries each unit’s region, so a selected conflict can be outlined', () => {
    const f = territoryFC(2026).features.find((x) => String(x.properties.id).startsWith('YEM'));
    expect(f?.properties.region).toBe('yemen');
  });
});

describe('Yemen reference geography', () => {
  it('ships the districts as administrative reference with their licence', () => {
    const d = districts as unknown as { meta: { licence: string; units: number; note: string }; lines: number[][][]; labels: unknown[] };
    expect(d.meta.licence).toBe('CC BY 3.0 IGO');
    expect(d.meta.units).toBeGreaterThan(300);
    expect(d.meta.note).toMatch(/no control assessment/i);
    expect(d.labels).toHaveLength(d.meta.units);
    for (const l of d.lines) for (const [lng, lat] of l) {
      expect(lng).toBeGreaterThan(41); expect(lng).toBeLessThan(55);
      expect(lat).toBeGreaterThan(11); expect(lat).toBeLessThan(19.5);
    }
  });

  it('places every port and city inside Yemen, with a known source', () => {
    const [w, s, e, n] = YEMEN_BBOX;
    for (const x of YEMEN_SITES) {
      expect(x.at[1], x.name).toBeGreaterThan(w); expect(x.at[1], x.name).toBeLessThan(e);
      expect(x.at[0], x.name).toBeGreaterThan(s); expect(x.at[0], x.name).toBeLessThan(n);
      for (const id of x.s) expect(SOURCES[id], `${x.name}: ${id}`).toBeDefined();
      if (x.place) expect(PLACES.some((p) => p.id === x.place), x.place).toBe(true);
    }
    expect(YEMEN_SITES.filter((x) => x.kind === 'port').length).toBeGreaterThanOrEqual(5);
  });
});

describe('interface pieces', () => {
  it('gives long timeline titles a wider card, within limits', () => {
    expect(cardWidth('Kort')).toBe(220);
    const long = cardWidth('USA og Israel angriper Iran. Hormuzstredet blir i praksis stengt for skipstrafikk');
    expect(long).toBeGreaterThan(220);
    expect(long).toBeLessThanOrEqual(320);
  });

  it('labels every new string in both languages', () => {
    for (const k of Object.keys(S).filter((k) => /^(rx_|ry_|cmpf_|qn_|sr_|sh_|img_|tl_)/.test(k))) {
      const [no, en] = (S as Record<string, [string, string]>)[k];
      expect(no, k).toBeTruthy(); expect(en, k).toBeTruthy();
    }
  });

  it('renders both regional explorers with their sources and limits stated', () => {
    // Server rendering reads the store's initial state, which is Norwegian.
    const ukr = renderToString(<UkraineExplorer />);
    expect(ukr).toContain('Vurdert frontlinje');
    expect(ukr).toContain('gis.unocha.org');
    expect(ukr).toContain('utleder aldri');
    const yem = renderToString(<YemenExplorer />);
    expect(yem).toContain('Ingen frontlinje for Jemen');
    expect(yem).toContain('Bab el-Mandeb');
    expect(yem).toContain('Ras Isa');
    expect(yem).toContain('geoboundaries');
  });
});
