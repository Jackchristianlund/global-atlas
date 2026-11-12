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
  /**
   * `live` is a vector style that works as shipped. `imagery` is built around
   * a satellite imagery provider (see `imageryProvider`), which works as
   * shipped on a non-commercial source and switches to a licensed commercial
   * one when the build supplies a key.
   */
  state: 'live' | 'imagery';
  /** Style document URL, for the live ones. */
  url?: string;
  provider: L;
  licence: L;
  /** Shown on the map, as the data licence requires. */
  attribution: string;
  /** What has to be supplied for commercial use, or for real relief. */
  needs?: L;
  /** Env var read at build time to switch the commercial provider on. */
  envKey?: string;
  /** Whether this style draws shaded relief from the terrain tiles. */
  relief?: number;
}

const OFM_ATTR = '© OpenStreetMap contributors · OpenFreeMap';
const OFM: L = ['OpenFreeMap, bygget på OpenStreetMap', 'OpenFreeMap, built on OpenStreetMap'];
const ODBL: L = [
  'OpenStreetMap-data under ODbL 1.0. Kommersiell bruk er tillatt så lenge kilden navngis.',
  'OpenStreetMap data under ODbL 1.0. Commercial use is permitted as long as the source is credited.',
];

import { GLYPHS_URL } from './glyphs';

/**
 * Shaded relief from Mapzen's Terrain Tiles on AWS Open Data.
 *
 * No key and no bill: the tiles are an open dataset assembled from public
 * elevation sources (SRTM, GMTED2010, ETOPO1 and others), served from S3, and
 * their documentation asks for attribution rather than a licence fee.
 */
export const DEM = {
  tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
  encoding: 'terrarium' as const,
  maxzoom: 12,
  attribution: 'Relieff: Mapzen Terrain Tiles / AWS Open Data (SRTM, GMTED2010, ETOPO1 m.fl.)',
};

export const MAP_STYLES: Record<MapStyleId, MapStyle> = {
  // The default for a regional view: muted enough that control polygons,
  // contact lines and incident markers stay the loudest thing on screen.
  conflict: {
    id: 'conflict', state: 'live',
    label: ['Konfliktkart', 'Conflict map'],
    url: 'https://tiles.openfreemap.org/styles/positron',
    provider: OFM, licence: ODBL, attribution: OFM_ATTR, relief: 0.22,
  },
  standard: {
    id: 'standard', state: 'live',
    label: ['Standardkart', 'Standard map'],
    url: 'https://tiles.openfreemap.org/styles/bright',
    provider: OFM, licence: ODBL, attribution: OFM_ATTR, relief: 0.18,
  },
  terrain: {
    id: 'terrain', state: 'live',
    label: ['Terreng', 'Terrain'],
    url: 'https://tiles.openfreemap.org/styles/liberty',
    provider: OFM, licence: ODBL, attribution: OFM_ATTR, relief: 0.55,
  },
  satellite: {
    id: 'satellite', state: 'imagery',
    label: ['Satellitt', 'Satellite'],
    provider: ['Se bildeleverandør', 'See imagery provider'],
    licence: [
      'Bildene kommer fra leverandøren som er satt opp for denne bygget. Uten nøkkel brukes Sentinel-2 cloudless 2016 fra EOX, som er gratis for ikke-kommersiell bruk.',
      'The imagery comes from the provider configured for this build. Without a key it is EOX’s Sentinel-2 cloudless 2016, which is free for non-commercial use.',
    ],
    attribution: '',
    needs: [
      'For kommersiell bruk: sett VITE_SATELLITE_PROVIDER (maptiler, esri, mapbox eller stadia) og VITE_SATELLITE_KEY med en lisensiert nøkkel.',
      'For commercial use: set VITE_SATELLITE_PROVIDER (maptiler, esri, mapbox or stadia) and VITE_SATELLITE_KEY with a licensed key.',
    ],
    envKey: 'VITE_SATELLITE_PROVIDER',
  },
  hybrid: {
    id: 'hybrid', state: 'imagery',
    label: ['Hybrid', 'Hybrid'],
    provider: ['Se bildeleverandør', 'See imagery provider'],
    licence: [
      'Satellittbilder med veier og navn fra OpenFreeMap over. Bildene har samme lisens som satellittstilen.',
      'Satellite imagery with roads and names from OpenFreeMap over it. The imagery carries the same licence as the satellite style.',
    ],
    attribution: OFM_ATTR,
    needs: [
      'Samme nøkkel som satellittstilen. Veiene og navnene kommer fra OpenFreeMap og er allerede på plass.',
      'The same key as the satellite style. Roads and names come from OpenFreeMap and are already in place.',
    ],
    envKey: 'VITE_SATELLITE_PROVIDER',
  },
};

export const STYLE_ORDER: MapStyleId[] = ['conflict', 'standard', 'terrain', 'satellite', 'hybrid'];

// ── Satellite imagery ────────────────────────────────────────────────────

export type ImageryId = 'eox2016' | 'maptiler' | 'esri' | 'mapbox' | 'stadia' | 'custom';

export interface ImageryProvider {
  id: ImageryId;
  name: string;
  tiles: string[];
  /** Logical tile size. 512-pixel sources and @2x tiles stay sharp on high-DPI screens. */
  tileSize: number;
  maxzoom: number;
  attribution: string;
  /** Whether the terms of the service as configured permit commercial use. */
  commercial: boolean;
  /** When the pictures were taken, as far as the provider says. */
  captured: L;
  resolution: L;
}

/**
 * The imagery to use. Without configuration it is EOX's Sentinel-2 cloudless
 * mosaic for 2016, the one year EOX publishes under CC BY 4.0. Its hosted
 * tile service is free for non-commercial use only, which is what this
 * unmonetised build is; before any monetisation the build must name a
 * commercial provider, or self-host the CC BY tiles. `commercial` says which.
 *
 * Pictures from 2016–17 show the ground before the 2022 invasion. That is
 * stated wherever the imagery is shown: a satellite view on a war map is read
 * as current unless it says otherwise.
 */
export function imageryProvider(env: Record<string, string | undefined> = (import.meta.env ?? {}) as never): ImageryProvider {
  const key = env.VITE_SATELLITE_KEY?.trim();
  const id = (env.VITE_SATELLITE_PROVIDER?.trim().toLowerCase() ?? '') as ImageryId | '';
  const custom = env.VITE_SATELLITE_URL?.trim();
  const attrOverride = env.VITE_SATELLITE_ATTRIBUTION?.trim();
  const current: L = ['Varierer, oppgitt av leverandøren', 'Varies; stated by the provider'];
  const sub: L = ['Under 1 m i mange områder', 'Under 1 m in many areas'];
  let p: ImageryProvider | null = null;
  if (id === 'maptiler' && key) {
    p = { id, name: 'MapTiler Satellite', tiles: [`https://api.maptiler.com/tiles/satellite-v2/{z}/{x}/{y}.jpg?key=${encodeURIComponent(key)}`], tileSize: 512, maxzoom: 20,
      attribution: '© MapTiler © OpenStreetMap contributors', commercial: true, captured: current, resolution: sub };
  } else if (id === 'esri' && key) {
    p = { id, name: 'Esri World Imagery', tiles: [`https://ibasemaps-api.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}?token=${encodeURIComponent(key)}`], tileSize: 256, maxzoom: 19,
      attribution: 'Powered by Esri · Esri World Imagery and its data providers', commercial: true, captured: current, resolution: sub };
  } else if (id === 'mapbox' && key) {
    p = { id, name: 'Mapbox Satellite', tiles: [`https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}@2x.jpg90?access_token=${encodeURIComponent(key)}`], tileSize: 256, maxzoom: 19,
      attribution: '© Mapbox © Maxar', commercial: true, captured: current, resolution: sub };
  } else if (id === 'stadia' && key) {
    p = { id, name: 'Stadia Alidade Satellite', tiles: [`https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}@2x.jpg?api_key=${encodeURIComponent(key)}`], tileSize: 256, maxzoom: 20,
      attribution: '© Stadia Maps and its imagery providers', commercial: true, captured: current, resolution: sub };
  } else if (custom) {
    // Kept for builds configured the earlier way. Whoever supplies the URL
    // vouches for its licence; the attribution should come with it.
    p = { id: 'custom', name: 'Configured imagery', tiles: [custom], tileSize: 256, maxzoom: 19,
      attribution: 'Satellite imagery provider', commercial: true, captured: current, resolution: sub };
  }
  if (p) return attrOverride ? { ...p, attribution: attrOverride } : p;
  return {
    id: 'eox2016', name: 'Sentinel-2 cloudless 2016 (EOX)',
    tiles: ['https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/g/{z}/{y}/{x}.jpg'],
    tileSize: 256, maxzoom: 15,
    attribution: 'Sentinel-2 cloudless – s2maps.eu by EOX IT Services GmbH (Contains modified Copernicus Sentinel data 2016 & 2017)',
    commercial: false,
    captured: ['2016–2017 – før invasjonen i 2022', '2016–2017 – before the 2022 invasion'],
    resolution: ['10 m', '10 m'],
  };
}

/** The imagery URL a commercial provider was configured with, if any. */
export const satelliteUrl = (): string | null => {
  const p = imageryProvider();
  return p.id === 'eox2016' ? null : p.tiles[0];
};

/** Whether a style can actually be shown in this build. Every style can now. */
export function styleAvailable(id: MapStyleId): boolean {
  return !!MAP_STYLES[id];
}

/**
 * A style document for the imagery styles. Satellite is the imagery alone;
 * hybrid lays OpenFreeMap's roads, boundaries and names over it, taken from
 * a loaded OpenFreeMap style (`labels`) so the names are the same ones the
 * vector styles show.
 */
export function adapterStyle(id: MapStyleId, labels?: { sources?: Record<string, unknown>; layers?: { id: string; type: string; 'source-layer'?: string }[]; glyphs?: string; sprite?: unknown } | null): object | null {
  const p = imageryProvider();
  const sat = { type: 'raster' as const, tiles: p.tiles, tileSize: p.tileSize, maxzoom: p.maxzoom, attribution: p.attribution };
  const base = {
    version: 8 as const,
    glyphs: glyphsUrl(),
    sources: { sat } as Record<string, unknown>,
    layers: [
      { id: 'bg', type: 'background' as const, paint: { 'background-color': '#0A1018' } },
      { id: 'sat', type: 'raster' as const, source: 'sat', paint: { 'raster-fade-duration': 150 } },
    ] as object[],
  };
  if (id === 'satellite' || !labels?.layers) return base;
  // Hybrid: roads, rail, boundaries and every label from the vector style.
  const keep = labels.layers.filter((l) =>
    l.type === 'symbol' || (l.type === 'line' && /^(transportation|boundary)$/.test(l['source-layer'] ?? '')));
  return {
    ...base,
    glyphs: labels.glyphs ?? base.glyphs,
    ...(labels.sprite ? { sprite: labels.sprite } : {}),
    sources: { ...labels.sources, sat },
    layers: [...base.layers, ...keep.map((l) => tuneForImagery(l))],
  };
}

/** Labels and roads read over imagery only with a dark halo and lighter roads. */
function tuneForImagery<T extends { type: string; paint?: Record<string, unknown> }>(l: T): T {
  if (l.type === 'symbol') {
    return { ...l, paint: { ...l.paint, 'text-color': '#F2F6FB', 'text-halo-color': 'rgba(8,12,20,.85)', 'text-halo-width': 1.5 } };
  }
  return { ...l, paint: { ...l.paint, 'line-opacity': 0.55 } };
}

// ── Making the vector styles read better ───────────────────────────────

type Expr = unknown;

/** Multiplies the numbers a size expression produces, leaving its shape alone. */
export function scaleSize(v: Expr, k: number): Expr {
  if (typeof v === 'number') return Math.round(v * k * 10) / 10;
  if (Array.isArray(v) && v[0] === 'interpolate' && Array.isArray(v[2]) && v[2][0] === 'zoom') {
    return v.map((x, i) => (i >= 3 && i % 2 === 0 ? scaleSize(x, k) : x));
  }
  if (Array.isArray(v) && v[0] === 'step' && Array.isArray(v[1]) && v[1][0] === 'zoom') {
    return v.map((x, i) => (i === 2 || (i > 2 && i % 2 === 0) ? scaleSize(x, k) : x));
  }
  return v;
}

interface StyleDoc { layers?: { id: string; type: string; 'source-layer'?: string; layout?: Record<string, unknown>; paint?: Record<string, unknown> }[]; sources?: Record<string, unknown> }

/**
 * Small, deliberate changes to the OpenFreeMap styles so the base map reads
 * at a glance under the conflict layers: labels a step larger with a firmer
 * halo, and — on the muted conflict style, whose roads were close to the
 * colour of the land — roads a few shades darker. Nothing is added to the
 * map's content; this is presentation only.
 */
export function enhanceStyle<T extends object>(doc: T, id: MapStyleId): T {
  const d = doc as unknown as StyleDoc;
  if (!d.layers) return doc;
  const layers = d.layers.map((l) => {
    if (l.type === 'symbol' && l.layout?.['text-field'] !== undefined) {
      const layout = { ...l.layout, 'text-size': scaleSize(l.layout['text-size'] ?? 12, 1.1) };
      const halo = typeof l.paint?.['text-halo-width'] === 'number' ? (l.paint['text-halo-width'] as number) : 0;
      return { ...l, layout, paint: { ...l.paint, 'text-halo-width': Math.max(halo, 1.3) } };
    }
    if (id === 'conflict' && l.type === 'line' && l['source-layer'] === 'transportation') {
      const paint = { ...l.paint };
      if (/casing/.test(l.id)) paint['line-color'] = '#B4BCC8';
      else if (/subtle/.test(l.id)) paint['line-color'] = 'hsla(215,12%,68%,0.85)';
      else if (/minor/.test(l.id)) paint['line-color'] = 'hsl(215,8%,82%)';
      else if (/^railway(?!.*dashline)/.test(l.id)) paint['line-color'] = '#C3C7CE';
      return { ...l, paint };
    }
    return l;
  });
  return { ...doc, layers } as T;
}

/**
 * Adds shaded relief to a style, under its water, roads and labels so it
 * shapes the land without darkening anything drawn on it.
 */
export function withRelief<T extends object>(doc: T, exaggeration: number): T {
  const d = doc as unknown as StyleDoc;
  if (!d.layers || exaggeration <= 0) return doc;
  const at = d.layers.findIndex((l) => /^water/.test(l.id) || l['source-layer'] === 'water' || l['source-layer'] === 'transportation' || l.type === 'symbol');
  const relief = {
    id: 'ga-relief', type: 'hillshade', source: 'ga-dem',
    paint: {
      'hillshade-exaggeration': exaggeration,
      'hillshade-shadow-color': '#4B5466',
      'hillshade-highlight-color': '#FFFFFF',
      'hillshade-accent-color': '#6D7686',
    },
  };
  const layers = [...d.layers];
  layers.splice(at < 0 ? layers.length : at, 0, relief as never);
  return {
    ...doc,
    sources: { ...d.sources, 'ga-dem': { type: 'raster-dem', tiles: DEM.tiles, encoding: DEM.encoding, tileSize: 256, maxzoom: DEM.maxzoom, attribution: DEM.attribution } },
    layers,
  } as T;
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
