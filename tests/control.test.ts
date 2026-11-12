// The labelled areas of control in Ukraine: only labelled polygons, validated
// before anything is drawn, and never inferred from the front line.
import { beforeEach, describe, expect, it } from 'vitest';
import { OCHA_OT_LINE_DATE, OCHA_OT_SERVICE, areaKm2, clearControlCache, isOchaOccupied, iswControlUrl, loadControl } from '../src/lib/control';

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
    const st = await loadControl(f, {});
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
    const st = await loadControl(respond({ features: [feat(OT, metres)] }), {});
    expect(st.status).toBe('unavailable');
  });

  it('refuses an implausible area rather than drawing it', async () => {
    const tiny = await loadControl(respond({ features: [feat(OT, square(0.05))] }), {});
    expect(tiny.status).toBe('unavailable');
    clearControlCache();
    const huge = await loadControl(respond({ features: [feat(OT, square(8, 24, 44.5))] }), {});
    expect(huge.status).toBe('unavailable');
  });

  it('reports an unreachable source instead of approximating', async () => {
    const down = (async () => { throw new TypeError('Failed to fetch'); }) as unknown as typeof fetch;
    const st = await loadControl(down, {});
    expect(st).toEqual({ status: 'unavailable', reason: 'Failed to fetch' });
  });

  it('uses ISW only when the build has been given its layer, and then as current', async () => {
    expect(iswControlUrl({})).toBeNull();
    expect(iswControlUrl({ VITE_ISW_CONTROL_URL: 'not a url' })).toBeNull();
    const url = 'https://services5.arcgis.com/x/ArcGIS/rest/services/Control/FeatureServer/3';
    expect(iswControlUrl({ VITE_ISW_CONTROL_URL: url })).toBe(url);
    let asked = '';
    const f = (async (u: string) => { asked = u; return new Response(JSON.stringify({ features: [feat({ Name: 'x' })] })); }) as unknown as typeof fetch;
    const st = await loadControl(f, { VITE_ISW_CONTROL_URL: url });
    expect(asked.startsWith(url)).toBe(true);
    expect(st.status === 'ready' && st.layer.source).toBe('isw');
    expect(st.status === 'ready' && st.layer.current).toBe(true);
  });
});
