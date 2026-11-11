import type { L } from '../types';

/**
 * Base-map styles.
 *
 * The base map is kept independent of the conflict data: nothing here supplies
 * a boundary, a front line or an incident. It supplies terrain, roads,
 * settlements and labels to read those against, and a sharper base map never
 * makes the assessments on top of it more precise than their sources are.
 *
 * Only styles whose terms permit commercial use are shipped switched on.
 * Satellite imagery and real terrain shading need a licensed provider, so they
 * are present as configured adapters that say exactly what is missing rather
 * than quietly borrowing somebody's tiles.
 */
export type MapStyleId = 'conflict' | 'standard' | 'terrain' | 'satellite' | 'hybrid';

export interface MapStyle {
  id: MapStyleId;
  label: L;
  /** `live` works as shipped; `needs_key` needs a provider and a key. */
  state: 'live' | 'needs_key';
  /** Style document URL, for the live ones. */
  url?: string;
  provider: L;
  licence: L;
  /** Shown on the map, as the data licence requires. */
  attribution: string;
  /** What has to be supplied before this style works. */
  needs?: L;
  /** Env var read at build time to switch the adapter on. */
  envKey?: string;
}

const OFM_ATTR = '© OpenStreetMap contributors · OpenFreeMap';
const OFM: L = ['OpenFreeMap, bygget på OpenStreetMap', 'OpenFreeMap, built on OpenStreetMap'];
const ODBL: L = [
  'OpenStreetMap-data under ODbL 1.0. Kommersiell bruk er tillatt så lenge kilden navngis.',
  'OpenStreetMap data under ODbL 1.0. Commercial use is permitted as long as the source is credited.',
];

import { GLYPHS_URL } from './glyphs';

export const MAP_STYLES: Record<MapStyleId, MapStyle> = {
  // The default for a regional view: muted enough that control polygons,
  // contact lines and incident markers stay the loudest thing on screen.
  conflict: {
    id: 'conflict', state: 'live',
    label: ['Konfliktkart', 'Conflict map'],
    url: 'https://tiles.openfreemap.org/styles/positron',
    provider: OFM, licence: ODBL, attribution: OFM_ATTR,
  },
  standard: {
    id: 'standard', state: 'live',
    label: ['Standardkart', 'Standard map'],
    url: 'https://tiles.openfreemap.org/styles/bright',
    provider: OFM, licence: ODBL, attribution: OFM_ATTR,
  },
  terrain: {
    id: 'terrain', state: 'live',
    label: ['Terreng', 'Terrain'],
    url: 'https://tiles.openfreemap.org/styles/liberty',
    provider: OFM, licence: ODBL, attribution: OFM_ATTR,
    needs: [
      'Viser landformer, vann og veier, men ikke høydeskygge. Ekte relieff krever en terrengflisleverandør med nøkkel.',
      'Shows landforms, water and roads, but no hillshading. Real relief needs a terrain tile provider with a key.',
    ],
  },
  satellite: {
    id: 'satellite', state: 'needs_key',
    label: ['Satellitt', 'Satellite'],
    provider: ['Ikke valgt', 'Not selected'],
    licence: [
      'Satellittbilder som kan brukes kommersielt må lisensieres. Gratisnivåene hos de fleste leverandørene tillater ikke annonse- eller abonnementsfinansiert bruk.',
      'Satellite imagery for commercial use has to be licensed. Most providers’ free tiers do not permit advertising- or subscription-funded use.',
    ],
    attribution: '',
    needs: [
      'En flis-URL og en nøkkel fra en leverandør hvis vilkår tillater kommersiell bruk. Sett VITE_SATELLITE_URL.',
      'A tile URL and a key from a provider whose terms permit commercial use. Set VITE_SATELLITE_URL.',
    ],
    envKey: 'VITE_SATELLITE_URL',
  },
  hybrid: {
    id: 'hybrid', state: 'needs_key',
    label: ['Hybrid', 'Hybrid'],
    provider: ['Ikke valgt', 'Not selected'],
    licence: [
      'Satellittbilder med navn og veier over. Krever samme lisens som satellittstilen.',
      'Satellite imagery with names and roads over it. Needs the same licence as the satellite style.',
    ],
    attribution: OFM_ATTR,
    needs: [
      'Samme flis-URL som satellittstilen. Navnelaget kommer fra OpenFreeMap og er allerede på plass.',
      'The same tile URL as the satellite style. The label layer comes from OpenFreeMap and is already in place.',
    ],
    envKey: 'VITE_SATELLITE_URL',
  },
};

export const STYLE_ORDER: MapStyleId[] = ['conflict', 'standard', 'terrain', 'satellite', 'hybrid'];

/** The imagery URL an adapter style needs, when the build supplies one. */
export const satelliteUrl = (): string | null =>
  (import.meta.env?.VITE_SATELLITE_URL as string | undefined)?.trim() || null;

/** Whether a style can actually be shown in this build. */
export function styleAvailable(id: MapStyleId): boolean {
  const s = MAP_STYLES[id];
  return s.state === 'live' || satelliteUrl() !== null;
}

/**
 * A style document for the adapter styles, built around the configured
 * imagery. Returns null when nothing is configured, so the caller can say so
 * instead of showing an empty map.
 */
export function adapterStyle(id: MapStyleId): object | null {
  const url = satelliteUrl();
  if (!url) return null;
  const raster = {
    version: 8 as const,
    sources: {
      sat: { type: 'raster' as const, tiles: [url], tileSize: 256, attribution: 'Satellite imagery provider' },
    },
    layers: [{ id: 'sat', type: 'raster' as const, source: 'sat' }],
  };
  if (id === 'satellite') return raster;
  // Hybrid puts OpenFreeMap's names and roads over the imagery.
  return { ...raster, glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf' };
}

/**
 * Converting between the globe camera and the map camera, so switching views
 * keeps the same ground in the middle of the screen at roughly the same scale.
 *
 * The naive version matches the horizon angle, acos(1/(1+a)), but that is only
 * right when the whole visible disc fits in frame. Close in, the camera's field
 * of view is what limits the view, and the horizon is far outside it — matching
 * the horizon there would hand the map a continental zoom when the globe is
 * showing a city. So this solves where the edge-of-frame ray actually meets the
 * sphere, and falls back to the horizon only when that ray misses it.
 */

/** globe.gl's camera: 50° vertical field of view. */
const HALF_FOV = (25 * Math.PI) / 180;

/** Half of the ground angle visible from altitude `a`, in radians. */
function visibleHalfAngle(altitude: number): number {
  const d = 1 + Math.max(altitude, 1e-4); // camera distance, in globe radii
  const sinBeta = d * Math.sin(HALF_FOV);
  // The edge ray misses the sphere: the horizon is the limit.
  if (sinBeta >= 1) return Math.acos(1 / d);
  // Law of sines in the centre-camera-hit triangle, taking the near hit.
  const beta = Math.PI - Math.asin(sinBeta);
  return Math.PI - HALF_FOV - beta;
}

export function altitudeToZoom(altitude: number): number {
  const spanDeg = (2 * visibleHalfAngle(altitude) * 180) / Math.PI;
  const z = Math.log2(360 / Math.max(spanDeg, 1e-6));
  return Math.min(18, Math.max(0, z));
}

export function zoomToAltitude(zoom: number): number {
  const target = (Math.PI / 180) * (180 / 2 ** Math.min(18, Math.max(0, zoom)));
  // visibleHalfAngle rises monotonically with altitude, so bisect it.
  let lo = 1e-4, hi = 8;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (visibleHalfAngle(mid) < target) lo = mid; else hi = mid;
  }
  return Math.min(8, Math.max(0.01, (lo + hi) / 2));
}


/**
 * A base map that needs nothing from the network.
 *
 * The conflict layers are the point of this view, and they must draw whether
 * or not a tile provider answers. So the map starts on this and swaps to the
 * real style once it has actually loaded: no blank grey square, no overlay
 * waiting on someone else's server, and the whole view still works offline.
 */
/**
 * The glyph template. It is a sentinel scheme answered from memory, not a real
 * URL: see src/map/glyphs.ts for why nothing can be fetched here.
 */
export function glyphsUrl(): string {
  return GLYPHS_URL;
}

export function fallbackStyle(): object {
  // `glyphs` must either be a real URL or absent: present-but-undefined fails
  // style validation, and a rejected style means the map never finishes
  // loading and draws nothing. It is a real URL now, pointing at glyphs that
  // ship with the app, so labels work with no network at all.
  return {
    version: 8 as const,
    glyphs: glyphsUrl(),
    sources: {},
    layers: [{ id: 'bg', type: 'background' as const, paint: { 'background-color': '#0A1018' } }],
  };
}

/**
 * Fetches a style document, so a provider that cannot be reached is a reported
 * condition rather than a map that silently never finishes loading.
 */
export async function loadStyle(url: string, timeoutMs = 8000): Promise<object | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return null;
    return (await res.json()) as object;
  } catch {
    return null;
  }
}


/**
 * Whether this browser can run the detailed map at all.
 *
 * MapLibre needs WebGL2. The globe only needs WebGL1, so a browser can render
 * the globe perfectly and still be unable to open this view — which is worth
 * saying plainly rather than showing a blank pane that never loads.
 */
let webgl2: boolean | null = null;

/**
 * Whether this browser can run MapLibre at all.
 *
 * Probed once and remembered. The probe has to create a canvas and ask it for
 * a context, and a browser allows only a handful of live WebGL contexts before
 * it starts killing the oldest to make room. Probing on every call therefore
 * does not just waste work: it takes the globe's own context away and blanks
 * it. The probe context is handed back immediately for the same reason.
 *
 * This is a property of the browser, not of the app's state, so caching it
 * costs nothing in correctness.
 */
export function webgl2Available(): boolean {
  if (webgl2 !== null) return webgl2;
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2');
    webgl2 = !!gl;
    // Release it at once rather than waiting for the canvas to be collected.
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return webgl2;
  } catch {
    webgl2 = false;
    return false;
  }
}

/** Test seam: forget the cached answer. */
export function resetWebgl2Probe(): void {
  webgl2 = null;
}
