// The labelled areas of control in Ukraine: only labelled polygons, validated
// before anything is drawn, and never inferred from the front line.
import { beforeEach, describe, expect, it } from 'vitest';
import { ISW_WEBMAP, OCHA_OT_LINE_DATE, OCHA_OT_SERVICE, areaKm2, clearControlCache, esriRingsToGeoJson, isOchaOccupied, iswAllowed, iswFeatures, loadControl } from '../src/lib/control';

/** A square of `deg` degrees at Donetsk, as GeoJSON. */
const square = (deg: number, lng = 37.5, lat = 48) => ({
  type: 'Polygon' as const,
  coordinates: [[[lng, lat], [lng + deg, lat], [lng + deg, lat + deg], [lng, lat + deg], [lng, lat]]],
});
const feat = (props: Record<string, unknown>, g = square(2)) => ({ type: 'Feature' as const, properties: props, geometry: g });
const respond = (body: unknown, status = 200) => (async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;
const OT = { adm1_en: 'OT', uoa_code: 'UAOT_O20A', geozone: 'OT 0-20 km' };

describe('labelled areas of control', () => {
  beforeEach(() => clearControlCache());

  it('keeps only the units OCHA labels as occupied', () => {
    expect(isOchaOccupied(OT)).toBe(true);
    expect(isOchaOccupied({ adm1_en: ' ', uoa_code: ' ' })).toBe(false); // the unlabelled unit
    expect(isOchaOccupied({ adm1_en: 'Donetska', uoa_code: 'UA14_020' })).toBe(false);
  });

  it('measures area on the sphere', () => {
    // 2°×2° at 48°N is about 222 km × 149 km.
    expect(areaKm2(square(2))).toBeGreaterThan(31_000);
    expect(areaKm2(square(2))).toBeLessThan(35_000);
  });

  it('draws OCHA’s labelled polygons, dated to the line they were drawn against', async () => {
    let asked = '';
    const f = (async (u: string) => { asked = u; return new Response(JSON.stringify({ features: [feat(OT), feat({ adm1_en: ' ', uoa_code: ' ' }, square(2, 33, 45))] })); }) as unknown as typeof fetch;
    const st = await loadControl(f, { VITE_ISW_CONTROL: 'off' });
    expect(asked.startsWith(OCHA_OT_SERVICE)).toBe(true);
    expect(st.status).toBe('ready');
    if (st.status !== 'ready') return;
    expect(st.layer.source).toBe('ocha-hnrp');
    expect(st.layer.asOf).toBe(OCHA_OT_LINE_DATE);
    expect(st.layer.current).toBe(false);
    expect(st.layer.features).toHaveLength(1); // the unlabelled unit is not drawn
  });

  it('refuses a feed in the wrong projection', async () => {
    const metres = { type: 'Polygon' as const, coordinates: [[[4174000, 6100000], [4400000, 6100000], [4400000, 6300000], [4174000, 6100000]]] };
    const st = await loadControl(respond({ features: [feat(OT, metres)] }), { VITE_ISW_CONTROL: 'off' });
    expect(st.status).toBe('unavailable');
  });

  it('refuses an implausible area rather than drawing it', async () => {
    const tiny = await loadControl(respond({ features: [feat(OT, square(0.05))] }), { VITE_ISW_CONTROL: 'off' });
    expect(tiny.status).toBe('unavailable');
    clearControlCache();
    const huge = await loadControl(respond({ features: [feat(OT, square(8, 24, 44.5))] }), { VITE_ISW_CONTROL: 'off' });
    expect(huge.status).toBe('unavailable');
  });

  it('reports an unreachable source instead of approximating', async () => {
    const down = (async () => { throw new TypeError('Failed to fetch'); }) as unknown as typeof fetch;
    const st = await loadControl(down, {});
    expect(st.status).toBe('unavailable');
    if (st.status === 'unavailable') expect(st.reason).toMatch(/Failed to fetch/);
  });

  it('uses ISW’s layer only for non-commercial use, and can be switched off', () => {
    expect(iswAllowed({}, false)).toBe(true);
    expect(iswAllowed({ VITE_ISW_CONTROL: 'off' }, false)).toBe(false);
    expect(iswAllowed({}, true)).toBe(false); // the permission does not cover commercial use
  });

  /** ISW's web map, cut down: one controlled area with a hole, one advance, one layer that is not used. */
  const ring = (x: number, y: number, d: number, cw: boolean) => {
    const r = [[x, y], [x, y + d], [x + d, y + d], [x + d, y], [x, y]];
    return cw ? r : r.slice().reverse();
  };
  const webmap = { operationalLayers: [
    { title: 'Group', layers: [
      { title: 'Assessed Russian-Controlled Terrain', featureCollection: { layers: [{ featureSet: { features: [
        { attributes: { pub_date: '2026-11-12' }, geometry: { rings: [ring(35, 46.5, 3, true), ring(36, 47, 0.5, false)] } },
      ] } }] } },
      { title: 'Assessed Russian Advances', featureCollection: { layers: [{ featureSet: { features: [
        { attributes: { pub_date: '2026-11-11' }, geometry: { rings: [ring(34.5, 48, 0.3, true)] } },
      ] } }] } },
      { title: 'Claimed Russian Territory', featureCollection: { layers: [{ featureSet: { features: [
        { attributes: { pub_date: '2026-11-12' }, geometry: { rings: [ring(33, 48, 0.3, true)] } },
      ] } }] } },
    ] },
  ] };

  it('reads ISW’s web map: labelled kinds, holes kept with their ring, claims left out', () => {
    const { features, asOf } = iswFeatures(webmap, 0);
    expect(asOf).toBe('2026-11-12');
    expect(features.map((f) => f.properties.kind)).toEqual(['control', 'advance']);
    const g = features[0].geometry;
    expect(g.type).toBe('Polygon');
    expect(g.type === 'Polygon' && g.coordinates).toHaveLength(2); // outer ring plus its hole
  });

  it('converts Web Mercator rings and treats a ring with no orientation cue as outer', () => {
    const merc = esriRingsToGeoJson([[[4174000, 6100000], [4174000, 6300000], [4400000, 6300000], [4400000, 6100000], [4174000, 6100000]]]);
    expect(merc?.type).toBe('Polygon');
    const first = merc?.type === 'Polygon' ? merc.coordinates[0][0] : [0, 0];
    expect(first[0]).toBeCloseTo(37.5, 1);
    const ccwOnly = esriRingsToGeoJson([ring(35, 46.5, 1, false)]);
    expect(ccwOnly?.type).toBe('MultiPolygon');
  });

  it('prefers ISW, current and dated, and falls back to OCHA when ISW fails', async () => {
    let asked: string[] = [];
    const ok = (async (u: string) => { asked.push(u); return new Response(JSON.stringify(webmap)); }) as unknown as typeof fetch;
    const st = await loadControl(ok, {}, false);
    expect(asked[0]).toContain(ISW_WEBMAP);
    expect(st.status === 'ready' && st.layer.source).toBe('isw');
    expect(st.status === 'ready' && st.layer.current).toBe(true);
    expect(st.status === 'ready' && st.layer.asOf).toBe('2026-11-12');
    clearControlCache();
    asked = [];
    const iswDown = (async (u: string) => {
      asked.push(u);
      if (u.includes('arcgis.com')) return new Response('nope', { status: 503 });
      return new Response(JSON.stringify({ features: [feat(OT)] }));
    }) as unknown as typeof fetch;
    const fb = await loadControl(iswDown, {}, false);
    expect(fb.status === 'ready' && fb.layer.source).toBe('ocha-hnrp');
    expect(asked).toHaveLength(2);
  });
});

describe('naming a changed stretch', () => {
  it('uses the nearest city, and names nothing when none is close', async () => {
    const { nearestPlace } = await import('../src/components/RegionExplorer');
    const stretch = (lat: number, lng: number) => ({ path: [[lat, lng], [lat + 0.01, lng]] as [number, number][], maxKm: 5, lengthKm: 1, of: 'b' as const, bbox: [lng, lat, lng, lat + 0.01] as [number, number, number, number] });
    // Kupiansk is about 100 km from Kharkiv: named for Kupiansk once the city list is in.
    expect(nearestPlace(stretch(49.71, 37.61), [['Kupyansk', 49.71, 37.62]])?.name).toBe('Kupyansk');
    // In the middle of nowhere: no name, rather than a misleading one.
    expect(nearestPlace(stretch(45.0, 25.0), [])).toBeNull();
  });
});

describe('coarsening for the globe', () => {
  it('drops rings that collapse or flip, which a globe would draw as the rest of the world', async () => {
    const { coarsen } = await import('../src/lib/control');
    const big = [[35, 46], [35, 49], [38, 49], [38, 46], [35, 46]]; // clockwise, kept
    // A sliver a few metres wide: simplifies to a line.
    const sliver = [[36, 47], [36.00001, 47.5], [36.00002, 47], [36.000015, 46.99], [36, 47]];
    const f = (rings: number[][][]) => ({ type: 'Feature' as const, properties: { kind: 'advance' }, geometry: { type: 'Polygon' as const, coordinates: rings } });
    const out = coarsen([f([big]), f([sliver])], 0.01);
    expect(out).toHaveLength(1);
    const g = out[0].geometry;
    expect(g.type === 'MultiPolygon' && g.coordinates[0][0].length).toBeGreaterThanOrEqual(4);
  });
});
