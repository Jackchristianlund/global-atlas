import { describe, expect, it } from 'vitest';
import {
  esriToGeoJson,
  isWebMercator,
  queryUrl,
  stepKm,
  validateGeometry,
  webMercatorToLngLat,
} from '../src/lib/arcgis';
import {
  ageInDays,
  bundledFrontline,
  frontlineMeta,
  frontlinePaths,
  loadFrontline,
  FRONTLINE_SERVICE,
} from '../src/lib/frontline';

describe('web mercator conversion', () => {
  it('maps the service extent to the right corner of Ukraine', () => {
    // The service declares its extent in EPSG:3857. Converted, it has to land
    // on Ukraine — this is the check that catches a projection mix-up, which
    // produces numbers that are valid and geographically absurd.
    const [lon, lat] = webMercatorToLngLat([3508016.4195, 6651760.336]);
    expect(lon).toBeCloseTo(31.51, 1);
    expect(lat).toBeCloseTo(51.2, 1);
  });

  it('puts the origin at null island', () => {
    expect(webMercatorToLngLat([0, 0])).toEqual([0, 0]);
  });

  it('recognises both spellings of web mercator', () => {
    expect(isWebMercator(3857)).toBe(true);
    expect(isWebMercator(102100)).toBe(true);
    expect(isWebMercator(4326)).toBe(false);
  });
});

describe('esri to geojson', () => {
  it('converts a single path to a LineString and projects it', () => {
    const out = esriToGeoJson({
      spatialReference: { wkid: 102100, latestWkid: 3857 },
      features: [{ attributes: { objectid: 1 }, geometry: { paths: [[[3508016.4195, 6651760.336], [3600000, 6600000]]] } }],
    });
    expect(out).toHaveLength(1);
    expect(out[0].geometry.type).toBe('LineString');
    const c = out[0].geometry.coordinates as number[][];
    expect(c[0][0]).toBeCloseTo(31.51, 1);
    expect(out[0].properties.objectid).toBe(1);
  });

  it('converts several paths to a MultiLineString', () => {
    const out = esriToGeoJson({
      spatialReference: { wkid: 4326 },
      features: [{ geometry: { paths: [[[30, 50], [31, 50]], [[32, 49], [33, 49]]] } }],
    });
    expect(out[0].geometry.type).toBe('MultiLineString');
  });

  it('converts rings to a Polygon', () => {
    const out = esriToGeoJson({
      spatialReference: { wkid: 4326 },
      features: [{ geometry: { rings: [[[30, 50], [31, 50], [31, 51], [30, 50]]] } }],
    });
    expect(out[0].geometry.type).toBe('Polygon');
  });

  it('throws on an ArcGIS error payload instead of returning nothing', () => {
    expect(() => esriToGeoJson({ error: { code: 400, message: 'Invalid URL' } })).toThrow(/400/);
  });

  it('skips features that carry no geometry', () => {
    expect(esriToGeoJson({ features: [{ attributes: { objectid: 2 } }] })).toHaveLength(0);
  });
});

describe('geometry validation', () => {
  const line = (coords: number[][]) => [
    { type: 'Feature' as const, id: 1, properties: {}, geometry: { type: 'LineString' as const, coordinates: coords } },
  ];

  it('accepts a plausible line inside the expected area', () => {
    const r = validateGeometry(line([[36, 49], [36.1, 49.1]]), { bbox: [21.5, 43.8, 41, 53], maxStepKm: 40 });
    expect(r.ok).toBe(true);
    expect(r.vertices).toBe(2);
  });

  it('rejects unprojected metres, which is what a wrong outSR looks like', () => {
    const r = validateGeometry(line([[3508016, 6651760], [3600000, 6600000]]));
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatch(/not a lon\/lat pair/);
  });

  it('rejects geometry outside the expected area', () => {
    const r = validateGeometry(line([[2.35, 48.85], [2.4, 48.9]]), { bbox: [21.5, 43.8, 41, 53] });
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatch(/outside/);
  });

  it('rejects an implausible jump between consecutive vertices', () => {
    const r = validateGeometry(line([[31, 47], [38, 51]]), { maxStepKm: 40 });
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatch(/km jump/);
  });

  it('reports an empty feed rather than passing it', () => {
    expect(validateGeometry([]).ok).toBe(false);
  });

  it('measures distance in kilometres', () => {
    expect(stepKm([36, 49], [36, 50])).toBeCloseTo(110.6, 0);
  });
});

describe('query url', () => {
  it('asks for degrees and geojson', () => {
    const u = new URL(queryUrl(FRONTLINE_SERVICE, { toleranceDeg: 0.01, precision: 5 }));
    expect(u.searchParams.get('outSR')).toBe('4326');
    expect(u.searchParams.get('f')).toBe('geojson');
    expect(u.searchParams.get('maxAllowableOffset')).toBe('0.01');
    expect(u.searchParams.get('geometryPrecision')).toBe('5');
    expect(u.searchParams.get('returnGeometry')).toBe('true');
  });
});

describe('the bundled snapshot', () => {
  const set = bundledFrontline();

  it('is the ISW assessment republished by OCHA, dated and attributed', () => {
    expect(set.meta.source).toMatch(/Institute for the Study of War/);
    expect(set.meta.publisher).toBe('UN OCHA');
    expect(set.meta.assessmentDate).toBe('2026-11-04');
    expect(set.meta.retrieved).toBe('2026-11-11');
    expect(set.meta.serviceUrl).toContain('gis.unocha.org');
  });

  it('never claims to be real time', () => {
    expect(set.meta.realtime).toBe(false);
  });

  it('does not pretend to know which side of the line is whose', () => {
    // The service carries only a date and a source. Inventing an actor per
    // segment would be exactly the fabrication this layer exists to avoid.
    expect(set.meta.actorClassification).toBe('unlabelled_by_source');
    for (const f of set.features) expect(f.properties).not.toHaveProperty('actor');
  });

  it('states that commercial rights are unresolved', () => {
    expect(set.meta.licence).toBe('unverified');
    expect(set.meta.licenceNote).toMatch(/[Cc]ommercial/);
  });

  it('records that the geometry was generalized, and by how much', () => {
    expect(set.meta.precision).toBe('generalized');
    expect(set.meta.toleranceMetresApprox.main).toBeGreaterThan(0);
  });

  it('holds the eight segments the service returned', () => {
    expect(set.features).toHaveLength(8);
    expect(set.meta.featureCount).toBe(8);
  });

  it('passes the same validation a live feed has to pass', () => {
    const r = validateGeometry(set.features, { bbox: [21.5, 43.8, 41, 53], maxStepKm: 40 });
    expect(r.errors).toEqual([]);
    expect(r.vertices).toBe(set.meta.vertexCount);
  });

  it('runs from the Black Sea coast to north of Kharkiv', () => {
    const main = set.features.find((f) => f.id === 395)!;
    const c = main.geometry.coordinates as number[][];
    expect(c[0]).toEqual([31.513, 46.5802]);
    expect(c[c.length - 1]).toEqual([36.1776, 50.402]);
  });

  it('flattens to paths that keep each segment date', () => {
    const paths = frontlinePaths(set);
    expect(paths).toHaveLength(8);
    for (const p of paths) expect(p.date).toBe('2026-11-04');
  });

  it('exposes its metadata without being loaded', () => {
    expect(frontlineMeta().id).toBe('ukr-ocha-isw');
  });
});

describe('loading', () => {
  const ok = (body: unknown) =>
    (async () => ({ ok: true, status: 200, json: async () => body })) as unknown as typeof fetch;

  it('uses the live service when it answers with valid geometry', async () => {
    const r = await loadFrontline(undefined, ok({
      type: 'FeatureCollection',
      features: [{
        type: 'Feature', id: 1,
        properties: { objectid: 1, date: Date.parse('2026-11-09T00:00:00Z') },
        geometry: { type: 'LineString', coordinates: [[36, 49], [36.1, 49.1]] },
      }],
    }));
    expect(r.set.tier).toBe('live');
    expect(r.set.meta.assessmentDate).toBe('2026-11-09');
    expect(r.set.meta.precision).toBe('service');
    expect(r.note).toBeUndefined();
  });

  it('falls back to the bundle when the service is unreachable, and says so', async () => {
    const dead = (async () => { throw new Error('network'); }) as unknown as typeof fetch;
    const r = await loadFrontline(undefined, dead);
    expect(r.set.tier).toBe('bundled');
    expect(r.note).toBe('network');
  });

  it('falls back on an HTTP error rather than rendering an error page', async () => {
    const bad = (async () => ({ ok: false, status: 503, json: async () => ({}) })) as unknown as typeof fetch;
    const r = await loadFrontline(undefined, bad);
    expect(r.set.tier).toBe('bundled');
    expect(r.note).toMatch(/503/);
  });

  it('refuses live geometry that fails validation instead of drawing it', async () => {
    // A service that quietly answers in metres would otherwise put the front
    // line somewhere in the Gulf of Guinea.
    const r = await loadFrontline(undefined, ok({
      type: 'FeatureCollection',
      features: [{
        type: 'Feature', properties: {},
        geometry: { type: 'LineString', coordinates: [[3508016, 6651760], [3600000, 6600000]] },
      }],
    }));
    expect(r.set.tier).toBe('bundled');
    expect(r.note).toMatch(/validation/);
  });

  it('converts an f=json answer when the service ignores f=geojson', async () => {
    const r = await loadFrontline(undefined, ok({
      spatialReference: { wkid: 102100, latestWkid: 3857 },
      features: [{ attributes: { objectid: 9 }, geometry: { paths: [[[3508016.4195, 5900000], [3520000, 5910000]]] } }],
    }));
    expect(r.set.tier).toBe('live');
    expect(r.set.features[0].geometry.type).toBe('LineString');
  });
});

describe('staleness', () => {
  it('counts days between the assessment and the day being read', () => {
    expect(ageInDays('2026-11-04', '2026-11-11')).toBe(7);
  });
  it('returns NaN rather than a wrong number for an unparseable date', () => {
    expect(Number.isNaN(ageInDays('not a date', '2026-11-11'))).toBe(true);
  });
});
