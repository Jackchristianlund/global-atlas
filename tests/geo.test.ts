import { describe, expect, it } from 'vitest';
import { centroid, densify, greatCircle, haversineKm, kmToNm, pathLengthKm, sailingDays, unwrapLongitudes, wrapLng, type LatLng } from '../src/lib/geo';

const OSLO: LatLng = [59.913, 10.752];
const LONDON: LatLng = [51.507, -0.128];

describe('haversineKm', () => {
  it('matches the known Oslo–London distance within 1%', () => {
    const d = haversineKm(OSLO, LONDON);
    expect(d).toBeGreaterThan(1140);
    expect(d).toBeLessThan(1170);
  });
  it('is zero for identical points and symmetric', () => {
    expect(haversineKm(OSLO, OSLO)).toBe(0);
    expect(haversineKm(OSLO, LONDON)).toBeCloseTo(haversineKm(LONDON, OSLO), 9);
  });
  it('handles unwrapped longitudes (190 == -170)', () => {
    expect(haversineKm([10, 190], [10, -170])).toBeLessThan(0.001);
  });
});

describe('wrapLng / unwrapLongitudes', () => {
  it('wraps into [-180, 180)', () => {
    expect(wrapLng(190)).toBe(-170);
    expect(wrapLng(-200)).toBe(160);
    expect(wrapLng(0)).toBe(0);
    expect(wrapLng(180)).toBe(-180);
  });
  it('makes an antimeridian crossing continuous', () => {
    const out = unwrapLongitudes([[40, 170], [42, -175], [44, -160]]);
    for (let i = 1; i < out.length; i++) expect(Math.abs(out[i][1] - out[i - 1][1])).toBeLessThanOrEqual(180);
    expect(out[1][1]).toBe(185);
  });
});

describe('greatCircle / densify', () => {
  it('keeps segment sums equal to the direct distance', () => {
    const pts = [OSLO, ...greatCircle(OSLO, LONDON, 32)];
    expect(pathLengthKm(pts)).toBeCloseTo(haversineKm(OSLO, LONDON), 1);
  });
  it('densify bounds leg length and keeps longitudes continuous across the Pacific', () => {
    const d = densify([[35, 140], [40, -120]], 200);
    for (let i = 1; i < d.length; i++) {
      expect(haversineKm(d[i - 1], d[i])).toBeLessThanOrEqual(201);
      expect(Math.abs(d[i][1] - d[i - 1][1])).toBeLessThanOrEqual(180);
    }
  });
});

describe('units', () => {
  it('converts km to nautical miles', () => {
    expect(kmToNm(1.852)).toBeCloseTo(1, 9);
  });
  it('computes sailing days', () => {
    expect(sailingDays(336, 14)).toBeCloseTo(1, 9);
    expect(sailingDays(100, 0)).toBe(Infinity);
  });
});

describe('centroid', () => {
  it('finds the centre of a square polygon', () => {
    const sq = { type: 'Polygon', coordinates: [[[10, 10], [20, 10], [20, 20], [10, 20], [10, 10]]] };
    const [lat, lng] = centroid(sq);
    expect(lat).toBeCloseTo(15, 6);
    expect(lng).toBeCloseTo(15, 6);
  });
  it('uses the largest ring of a MultiPolygon', () => {
    const mp = {
      type: 'MultiPolygon',
      coordinates: [
        [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
        [[[40, 40], [60, 40], [60, 60], [40, 60], [40, 40]]],
      ],
    };
    const [lat, lng] = centroid(mp);
    expect(lat).toBeCloseTo(50, 6);
    expect(lng).toBeCloseTo(50, 6);
  });
});
