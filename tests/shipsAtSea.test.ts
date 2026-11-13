import { describe, expect, it } from 'vitest';
import { feature } from 'topojson-client';
import world from 'world-atlas/countries-10m.json';
import { ATTACKS } from '../src/data/attacks';

// A ring test that is plenty for points well away from the poles.
function inRing(pt: [number, number], ring: number[][]): boolean {
  let c = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

describe('attacks on ships', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const land = (feature(world as any, (world as any).objects.countries) as any).features as { geometry: { type: string; coordinates: number[][][][] | number[][][] } }[];
  const onLand = (lat: number, lng: number) => land.some((f) => {
    const polys = (f.geometry?.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry?.coordinates ?? []) as number[][][][];
    return polys.some((p) => inRing([lng, lat], p[0]) && !p.slice(1).some((h) => inRing([lng, lat], h)));
  });

  it('are all placed at sea, not on a coast they were measured from', () => {
    const ships = ATTACKS.filter((a) => a.id.startsWith('at-ship-'));
    expect(ships.length).toBeGreaterThan(20);
    const ashore = ships.filter((a) => onLand(a.at[0], a.at[1])).map((a) => `${a.id} ${a.at}`);
    expect(ashore).toEqual([]);
  });
});
