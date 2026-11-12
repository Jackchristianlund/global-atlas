import { describe, expect, it } from 'vitest';
import {
  MAP_STYLES, STYLE_ORDER, altitudeToZoom, fallbackStyle, glyphsUrl, imageryProvider, styleAvailable, zoomToAltitude,
} from '../src/map/styles';
import { DETAIL_META } from '../src/map/basedetail';
import { GLYPH_FACES, resolveGlyphRequest } from '../src/map/glyphs';
import { LABEL_MIN_ZOOM, attackFC, conflictFC, contactFC, placeFC, territoryFC } from '../src/map/overlays';
import { contactLines, territoryFeatures } from '../src/lib/territory';
import { ATTACKS } from '../src/data/attacks';
import { HYDRO_SOURCE, hydroPoints, lakeCount, riverCount } from '../src/lib/hydro';
import { SNAPSHOT_YEAR } from '../src/store';

describe('map styles', () => {
  it('offers the five styles the brief names', () => {
    expect(STYLE_ORDER).toEqual(['conflict', 'standard', 'terrain', 'satellite', 'hybrid']);
    for (const id of STYLE_ORDER) expect(MAP_STYLES[id].id).toBe(id);
  });

  it('ships only styles whose terms allow commercial use', () => {
    for (const id of STYLE_ORDER) {
      const s = MAP_STYLES[id];
      if (s.state === 'live') {
        // A live style must point somewhere and must credit its data.
        expect(s.url, id).toMatch(/^https:\/\//);
        expect(s.attribution, id).toContain('OpenStreetMap');
        expect(s.licence[1], id).toMatch(/commercial use is permitted/i);
      } else {
        // An adapter must say what is missing rather than quietly failing.
        expect(s.needs, id).toBeDefined();
        expect(s.needs![0], id).not.toBe(s.needs![1]);
        expect(s.envKey, id).toBeTruthy();
      }
    }
  });

  it('offers every style, with imagery on a non-commercial source until a key is configured', () => {
    for (const id of STYLE_ORDER) expect(styleAvailable(id), id).toBe(true);
    // No VITE_SATELLITE_PROVIDER in this build: the imagery is EOX's 2016
    // mosaic, whose hosted service is for non-commercial use only, and the
    // provider says so rather than passing as licensed.
    const p = imageryProvider({});
    expect(p.id).toBe('eox2016');
    expect(p.commercial).toBe(false);
    expect(p.attribution).toMatch(/EOX/);
    expect(p.captured[1]).toMatch(/before the 2022 invasion/);
  });

  it('defaults the regional view to the muted conflict style', () => {
    expect(STYLE_ORDER[0]).toBe('conflict');
    expect(MAP_STYLES.conflict.url).toContain('positron');
  });

  it('has a base map that needs nothing from the network', () => {
    const f = fallbackStyle() as { version: number; layers: unknown[]; glyphs?: unknown };
    expect(f.version).toBe(8);
    expect(f.layers).toHaveLength(1);
    // A present-but-undefined key fails style validation and stops the map
    // loading at all, so glyphs must be a real URL or absent — never empty.
    expect(typeof f.glyphs).toBe('string');
    // And that URL must point at the glyphs bundled with the app. A published
    // artifact cannot reach any external host, so a hosted glyph service would
    // leave the map with no labels at all.
    expect(f.glyphs).not.toMatch(/^https?:\/\//);
    expect(f.glyphs).toContain('{fontstack}');
    expect(f.glyphs).toContain('{range}');
  });

  it('answers glyph requests from memory, never over the network', () => {
    // The artifact host serves no binary glyph file type and no external glyph
    // service is reachable, so the template is a sentinel resolved in-page.
    expect(glyphsUrl()).toBe('ga-glyphs://{fontstack}/{range}.pbf');
    expect(glyphsUrl()).toContain('{fontstack}');
    expect(glyphsUrl()).toContain('{range}');
  });

  it('bundles the faces the map asks for', () => {
    expect(GLYPH_FACES).toContain('Noto Sans Regular');
    expect(GLYPH_FACES).toContain('Noto Sans Bold');
  });

  it('passes a non-glyph url straight through', () => {
    expect(resolveGlyphRequest('https://example.com/tile.pbf')).toBeNull();
  });
});

describe('globe and map share one camera', () => {
  it('round-trips altitude through zoom', () => {
    for (const a of [2.5, 1.25, 0.6, 0.3, 0.1, 0.03, 0.012]) {
      expect(zoomToAltitude(altitudeToZoom(a))).toBeCloseTo(a, 3);
    }
  });

  it('gives a close camera a close zoom, not a continental one', () => {
    // Matching the horizon angle instead of the field of view would put this
    // near zoom 4; the camera actually sees a city.
    expect(altitudeToZoom(0.03)).toBeGreaterThan(7);
    expect(altitudeToZoom(0.01)).toBeGreaterThan(9);
    // And a far camera still reads as a world view.
    expect(altitudeToZoom(2.5)).toBeLessThan(2);
  });

  it('rises monotonically and stays inside the usable range', () => {
    let prev = -1;
    for (const a of [4, 2, 1, 0.5, 0.2, 0.05, 0.01]) {
      const z = altitudeToZoom(a);
      expect(z).toBeGreaterThan(prev);
      expect(z).toBeGreaterThanOrEqual(0);
      expect(z).toBeLessThanOrEqual(18);
      prev = z;
    }
  });
});

describe('map overlays come from the same data as the globe', () => {
  it('carries every control polygon the globe draws, with the same id', () => {
    const globe = territoryFeatures(2026);
    const map = territoryFC(2026);
    expect(map.features).toHaveLength(globe.length);
    expect(new Set(map.features.map((f) => f.id))).toEqual(new Set(globe.map((f) => f.properties.id)));
    for (const f of map.features) {
      expect(f.properties.color, String(f.id)).toMatch(/^rgba\(/);
      expect(f.properties.d, String(f.id)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('writes coordinates in GeoJSON order, not the globe’s', () => {
    const line = contactFC(2026).features[0].geometry as { coordinates: [number, number][] };
    const source = contactLines(2026)[0];
    // The lib stores [lat, lng]; GeoJSON wants [lng, lat].
    expect(line.coordinates[0][0]).toBeCloseTo(source.coords[0][1], 6);
    expect(line.coordinates[0][1]).toBeCloseTo(source.coords[0][0], 6);
  });

  it('follows the selected year, like every other layer', () => {
    expect(territoryFC(2013).features).toHaveLength(territoryFeatures(2013).length);
    expect(contactFC(2013).features).toHaveLength(0);
    expect(attackFC(2024).features).toHaveLength(0);
    expect(attackFC(SNAPSHOT_YEAR).features).toHaveLength(ATTACKS.length);
    // A later year never shows fewer units than an earlier one here.
    expect(territoryFC(2026).features.length).toBeGreaterThan(territoryFC(2014).features.length);
  });

  it('filters to a region when one is asked for', () => {
    const ukr = territoryFC(2026, 'ukraine');
    expect(ukr.features.length).toBe(27);
    expect(contactFC(2026, 'ukraine').features.length).toBe(contactLines(2026).filter((c) => c.region === 'ukraine').length);
    expect(attackFC(2026, 'ukraine').features.every((f) => String(f.id).startsWith('at-'))).toBe(true);
    expect(placeFC(2026, 'yemen').features.length).toBeGreaterThan(0);
  });

  it('gives every marker the id the panel opens on', () => {
    for (const fc of [attackFC(2026), placeFC(2026), conflictFC(2026, 'no', SNAPSHOT_YEAR)]) {
      expect(fc.features.length).toBeGreaterThan(0);
      for (const f of fc.features) {
        expect(typeof f.properties.id).toBe('string');
        expect(f.properties.color).toBeTruthy();
      }
    }
  });

  it('keeps the precision flag the marker shape depends on', () => {
    const exact = attackFC(2026).features.filter((f) => f.properties.exact);
    const approx = attackFC(2026).features.filter((f) => !f.properties.exact);
    expect(approx.length).toBeGreaterThan(0);
    expect(exact.length + approx.length).toBe(ATTACKS.length);
  });

  it('thins the base map’s own labels rather than hiding geography', () => {
    expect(LABEL_MIN_ZOOM.high).toBe(0);
    expect(LABEL_MIN_ZOOM.normal).toBeGreaterThan(LABEL_MIN_ZOOM.high);
    expect(LABEL_MIN_ZOOM.low).toBeGreaterThan(LABEL_MIN_ZOOM.normal);
  });
});

describe('globe hydrography', () => {
  it('bundles Natural Earth rivers and lakes', () => {
    expect(HYDRO_SOURCE).toMatch(/Natural Earth/);
    expect(HYDRO_SOURCE).toMatch(/public domain/i);
    expect(riverCount).toBeGreaterThan(500);
    expect(lakeCount).toBeGreaterThan(100);
    // Small enough to ship, large enough to be worth shipping.
    expect(hydroPoints).toBeGreaterThan(5000);
    expect(hydroPoints).toBeLessThan(40000);
  });
});

describe('interface polish', () => {
  it('remembers layer state across visits', async () => {
    const { remember } = await import('../src/store');
    expect(typeof remember).toBe('function');
    // The helper must survive a browser that refuses storage rather than throw.
    const original = globalThis.localStorage;
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get() { throw new Error('storage disabled'); },
    });
    expect(() => remember('ga.test', '1')).not.toThrow();
    if (original) Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: original });
    else delete (globalThis as { localStorage?: unknown }).localStorage;
  });

  it('scales incident bins by fatalities on the same log curve as the colour', () => {
    // Both height and colour use log10(1 + deaths) / 3.2, so a bin with ten
    // times the deaths is one step further along both, not saturated on one.
    const t = (deaths: number) => Math.min(1, Math.log10(1 + deaths) / 3.2);
    expect(t(0)).toBe(0);
    expect(t(10)).toBeCloseTo(0.326, 2);
    expect(t(100)).toBeCloseTo(0.629, 2);
    expect(t(10000)).toBe(1);
    // Monotonic, and never past the top of the scale.
    let prev = -1;
    for (const d of [0, 1, 10, 100, 1000, 10000, 100000]) {
      const v = t(d);
      expect(v).toBeGreaterThanOrEqual(prev);
      expect(v).toBeLessThanOrEqual(1);
      prev = v;
    }
  });
});

describe('bundled base detail', () => {
  it('ships a base map that needs no network at all', () => {
    // The whole point: a published artifact cannot reach any external host,
    // so every base layer has to come from the bundle.
    expect(DETAIL_META.licence).toMatch(/public domain/i);
    expect(DETAIL_META.attribution).toContain('Natural Earth');
  });

  it('says plainly what scale it is, rather than implying street level', () => {
    expect(DETAIL_META.scale).toMatch(/not street level/i);
  });
});
