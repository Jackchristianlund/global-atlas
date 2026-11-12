import { describe, expect, it } from 'vitest';
import { ROUTES } from '../src/data/trade';
import { ROUTE_METHOD, detourPercent, isComputed, routeKm, routePassages, routePoints } from '../src/lib/routes';

describe('computed sea lanes', () => {
  it('covers every sea, oil and LNG route', () => {
    for (const r of ROUTES) {
      if (r.kind === 'rail') continue;
      expect(isComputed(r.id), `${r.id} has no computed geometry`).toBe(true);
    }
  });

  it('leaves land corridors as the sketches they are', () => {
    // A rail network is a different dataset. Drawing one by eye and calling it
    // computed would be worse than admitting the sketch.
    for (const r of ROUTES.filter((x) => x.kind === 'rail')) {
      expect(isComputed(r.id)).toBe(false);
      expect(routePoints(r)).toEqual(r.pts);
    }
  });

  it('states its method, and that it is not traffic', () => {
    expect(ROUTE_METHOD.network).toMatch(/Eurostat/);
    expect(ROUTE_METHOD.notTraffic).toMatch(/not observed traffic/i);
  });

  it('routes Asia to Europe through the canal when that is the route', () => {
    expect(routePassages('asia-eu-suez')).toContain('suez');
    expect(routePassages('asia-eu-suez')).toContain('babelmandeb');
  });

  it('keeps the Cape route out of the canal', () => {
    // The whole point of the alternative is that it does not use Suez.
    expect(routePassages('asia-eu-cape')).not.toContain('suez');
    expect(routePassages('gulf-eu-cape')).not.toContain('suez');
  });

  it('measures the Cape detour, which is why the chokepoint matters', () => {
    const d = detourPercent('asia-eu-suez', 'asia-eu-cape')!;
    // Published figures put the diversion at roughly a third further.
    expect(d).toBeGreaterThan(20);
    expect(d).toBeLessThan(55);
  });

  it('agrees with published port-to-port distances', () => {
    // Shanghai to Rotterdam via Suez is about 10,500 nautical miles, roughly
    // 19,400 km. A computed route that disagrees wildly is a broken network,
    // not a surprising finding.
    const km = routeKm('asia-eu-suez')!;
    expect(km).toBeGreaterThan(17000);
    expect(km).toBeLessThan(22000);
  });

  it('puts the Gulf closer to Europe through Suez than around Africa', () => {
    expect(routeKm('gulf-eu-suez')!).toBeLessThan(routeKm('gulf-eu-cape')!);
  });

  it('draws geometry that stays on the planet', () => {
    for (const r of ROUTES) {
      for (const [lat, lng] of routePoints(r)) {
        expect(Math.abs(lat)).toBeLessThanOrEqual(90);
        expect(Math.abs(lng)).toBeLessThanOrEqual(180);
      }
    }
  });

  it('gives a computed lane more vertices than the sketch it replaced', () => {
    // The sketches had a handful of waypoints; a network path has the shape.
    const sketch = ROUTES.find((r) => r.id === 'asia-eu-suez')!;
    expect(routePoints(sketch).length).toBeGreaterThan(sketch.pts.length);
  });

  it('reports no detour between routes it does not know', () => {
    expect(detourPercent('asia-eu-suez', 'rail-north')).toBeNull();
    expect(routeKm('rail-north')).toBeNull();
  });
});
