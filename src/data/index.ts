import type { Iso, RelType, Route } from '../types';
import type { LatLng } from '../lib/geo';
import { CONFLICTS } from './conflicts';
import { ORGS, RELATIONS, SANCTIONS } from './alliances';
import { CHOKEPOINTS, ROUTES } from './trade';
import { ENERGY_SITES, PIPELINES } from './energy';
import { EVENTS } from './events';
import { LINKS, SCENARIOS } from './links';

export { CONFLICTS, ORGS, RELATIONS, SANCTIONS, CHOKEPOINTS, ROUTES, ENERGY_SITES, PIPELINES, EVENTS, LINKS, SCENARIOS };
export { SOURCES, SNAPSHOT_DATE } from './sources';
export { COUNTRY_CODES, DISPUTED, countryName, isKnownIso, loadWorld, type CountryFeature } from './countries';

const index = <T extends { id: string }>(arr: T[]): Record<string, T> => Object.fromEntries(arr.map((x) => [x.id, x]));

export const CONFLICT = index(CONFLICTS);
export const ORG = index(ORGS);
export const CHOKEPOINT = index(CHOKEPOINTS);
export const ALL_ROUTES: Route[] = [...ROUTES, ...PIPELINES];
export const ROUTE = index(ALL_ROUTES);
export const SITE = index(ENERGY_SITES);
export const SCENARIO = index(SCENARIOS);

/** Where arcs to a country start and end. Capitals for countries whose polygon centroid is misleading. */
export const ANCHOR: Record<Iso, LatLng> = {
  RUS: [55.75, 37.6], USA: [38.9, -77.0], CAN: [45.4, -75.7], CHN: [39.9, 116.4], AUS: [-35.3, 149.1], BRA: [-15.8, -47.9],
  IND: [28.6, 77.2], KAZ: [51.2, 71.4], BHR: [26.2, 50.58], SGP: [1.35, 103.82], MLT: [35.9, 14.5], QAT: [25.3, 51.2], KWT: [29.37, 47.98], IDN: [-6.2, 106.8], NOR: [59.9, 10.75], JPN: [35.7, 139.7], GBR: [51.5, -0.1], FRA: [48.85, 2.35],
};
/** Anchors for sanction imposers that are not countries. */
export const BODY_ANCHOR: Record<string, LatLng> = { EU: [50.85, 4.35], UN: [40.75, -73.97] };

export const EVENT_COLOR: Record<import('../types').EventType, string> = {
  escalation: '#FF4545', ceasefire: '#3BA7FF', alliance: '#4D8CFF', sanction: '#FF9B42', trade: '#00D9FF', political: '#B8C7DA',
};

export const REL_COLOR: Record<RelType, string> = {
  defense: '#4D8CFF', partnership: '#8FB8FF', military: '#FF7A7A', sanction: '#FF9B42', energy: '#FFD23F', trade: '#00D9FF',
  shipping: '#00D9FF', supply: '#2DD4BF', arms: '#FF4545', displacement: '#C084FC', diplomatic: '#B8C7DA', dispute: '#FF4545',
};
