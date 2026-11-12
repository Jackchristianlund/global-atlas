/**
 * Route geometry, computed where it can be and drawn where it cannot.
 *
 * The sea, oil and LNG lanes are shortest paths over the 2025 Eurostat
 * maritime network, subject to the canal and strait constraints that define
 * each route. They follow navigable water instead of cutting across land, and
 * the distances they produce can be checked against published port-to-port
 * tables.
 *
 * What they are not is traffic. A computed voyage says where a ship could
 * reasonably sail, not how many do. Nothing in the app may present these as
 * observed volumes.
 *
 * Land corridors keep their hand-placed waypoints and keep saying so: a rail
 * network is a different dataset, and drawing one by eye and calling it
 * computed would be worse than admitting the sketch.
 */
import computed from '../data/routes.computed.json';
import type { Route } from '../types';

interface ComputedRoute {
  pts: [number, number][];
  km: number;
  passages: string[];
}

interface ComputedFile {
  meta: {
    method: string;
    network: string;
    networkLicence: string;
    computed: string;
    notTraffic: string;
  };
  routes: Record<string, ComputedRoute>;
}

const C = computed as unknown as ComputedFile;

export const ROUTE_METHOD = C.meta;

/** True when this route's geometry came from the network rather than by hand. */
export function isComputed(id: string): boolean {
  return id in C.routes;
}

/** The geometry to draw: computed where available, the drawn sketch otherwise. */
export function routePoints(r: Route): [number, number][] {
  return C.routes[r.id]?.pts ?? r.pts;
}

/** Great-circle length along the network path, in kilometres. */
export function routeKm(id: string): number | null {
  return C.routes[id]?.km ?? null;
}

/** The canals and straits the computed path actually passes through. */
export function routePassages(id: string): string[] {
  return C.routes[id]?.passages ?? [];
}

/**
 * How much longer one route is than another, as a percentage.
 *
 * This is the number that makes a chokepoint mean something: the Cape routing
 * is not merely "an alternative", it is a third again as far.
 */
export function detourPercent(fromId: string, toId: string): number | null {
  const a = routeKm(fromId);
  const b = routeKm(toId);
  if (a == null || b == null || a === 0) return null;
  return Math.round(((b - a) / a) * 100);
}
