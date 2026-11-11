import { describe, expect, it } from 'vitest';
import { conflictBbox, zoomForBbox } from '../src/lib/territory';

describe('framing a conflict', () => {
  it('builds Ukraine’s extent from the units that carry control records', () => {
    const b = conflictBbox(['UKR'], 'ukraine')!;
    expect(b).not.toBeNull();
    expect(b[0]).toBeGreaterThan(21); expect(b[0]).toBeLessThan(25);
    expect(b[2]).toBeGreaterThan(38); expect(b[2]).toBeLessThan(41);
    expect(b[1]).toBeGreaterThan(44); expect(b[3]).toBeLessThan(53);
  });

  it('returns null for a country with no units rather than guessing', () => {
    expect(conflictBbox(['ZZZ'])).toBeNull();
  });

  it('picks a zoom that fits the narrower axis', () => {
    const z = zoomForBbox([22, 44, 40, 52.4], 1000, 700);
    expect(z).toBeGreaterThan(3.5);
    expect(z).toBeLessThan(7);
  });

  it('never returns a zoom outside the map’s range', () => {
    expect(zoomForBbox([-179, -85, 179, 85], 1000, 700)).toBeGreaterThanOrEqual(2);
    expect(zoomForBbox([36.0, 49.0, 36.01, 49.01], 1000, 700)).toBeLessThanOrEqual(12);
  });
});
