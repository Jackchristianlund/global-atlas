/**
 * Shareable links.
 *
 * The part of the view worth sending to someone — which view, where the
 * camera is, the year, what is selected, which layers are on, which map style
 * and which front-line comparison — lives in the URL hash, so a copied link
 * opens the same picture. Everything is validated on the way in: a hand-edited
 * or stale link drops what it cannot use rather than breaking the app.
 *
 * The hash, not the query string, because GitHub Pages serves one static
 * page and a hash never reaches the server.
 */
import type { LayerId, Selection, ViewId } from '../types';
import type { MapStyleId } from '../map/styles';
import type { HistoryMonth } from './frontlineHistory';

export interface UrlState {
  view?: ViewId;
  mode?: 'globe' | 'map';
  /** Camera centre, [lat, lng]. */
  center?: [number, number];
  /** Map zoom when mode is 'map', globe altitude when mode is 'globe'. */
  zoom?: number;
  year?: number;
  sel?: Selection;
  layers?: LayerId[];
  style?: MapStyleId;
  compare?: { a: HistoryMonth | 'now'; b: HistoryMonth | 'now' };
}

const VIEWS: ViewId[] = ['conflict', 'alliance', 'trade', 'energy', 'human', 'history', 'scenario'];
const STYLES: MapStyleId[] = ['conflict', 'standard', 'terrain', 'satellite', 'hybrid'];
export const LAYER_IDS: LayerId[] = ['conflicts', 'incidents', 'attacks', 'hydro', 'flashpoints', 'alliances', 'routes', 'chokepoints', 'energy', 'links', 'borders', 'sanctions', 'displacement', 'events', 'territories', 'fronts', 'sourceline'];
const SEL_KINDS = ['conflict', 'country', 'chokepoint', 'route', 'site', 'org', 'territory', 'actor', 'flow', 'attack', 'place'] as const;

const round = (n: number, d: number) => Math.round(n * 10 ** d) / 10 ** d;

/** The hash for a state, without the leading '#'. Keys are short and stable. */
export function encodeState(s: UrlState): string {
  const p = new URLSearchParams();
  if (s.view) p.set('v', s.view);
  if (s.mode) p.set('m', s.mode);
  if (s.center) p.set('c', `${round(s.center[0], 3)},${round(s.center[1], 3)}`);
  if (s.zoom != null) p.set('z', String(round(s.zoom, 2)));
  if (s.year != null) p.set('y', String(s.year));
  if (s.sel) p.set('s', `${s.sel.kind}:${s.sel.id}`);
  if (s.layers) p.set('l', s.layers.join('.'));
  if (s.style) p.set('st', s.style);
  if (s.compare) p.set('fc', `${s.compare.a}-${s.compare.b}`);
  return p.toString();
}

const month = (v: string): HistoryMonth | 'now' | null => {
  if (v === 'now') return 'now';
  const n = Number(v);
  return Number.isInteger(n) && n >= 1 && n <= 11 ? (n as HistoryMonth) : null;
};

/**
 * Reads a hash. `isKnown` decides whether a selection points at something
 * that exists; anything unknown is dropped.
 */
export function decodeState(hash: string, isKnown: (sel: NonNullable<Selection>) => boolean, years: [number, number]): UrlState {
  const p = new URLSearchParams(hash.replace(/^#/, ''));
  const out: UrlState = {};
  const v = p.get('v');
  if (v && (VIEWS as string[]).includes(v)) out.view = v as ViewId;
  const m = p.get('m');
  if (m === 'globe' || m === 'map') out.mode = m;
  const c = p.get('c')?.split(',').map(Number);
  if (c && c.length === 2 && c.every(Number.isFinite) && Math.abs(c[0]) <= 85 && Math.abs(c[1]) <= 540) out.center = [c[0], c[1]];
  const z = Number(p.get('z'));
  if (p.has('z') && Number.isFinite(z) && z >= 0 && z <= 22) out.zoom = z;
  const y = Number(p.get('y'));
  if (p.has('y') && Number.isInteger(y) && y >= years[0] && y <= years[1]) out.year = y;
  const s = p.get('s');
  if (s) {
    const i = s.indexOf(':');
    const kind = s.slice(0, i), id = s.slice(i + 1);
    if (i > 0 && id && (SEL_KINDS as readonly string[]).includes(kind)) {
      const sel = { kind, id } as NonNullable<Selection>;
      if (isKnown(sel)) out.sel = sel;
    }
  }
  const l = p.get('l');
  if (l !== null) out.layers = l.split('.').filter((x): x is LayerId => (LAYER_IDS as string[]).includes(x));
  const st = p.get('st');
  if (st && (STYLES as string[]).includes(st)) out.style = st as MapStyleId;
  const fc = p.get('fc')?.split('-');
  if (fc && fc.length === 2) {
    const a = month(fc[0]), b = month(fc[1]);
    if (a !== null && b !== null) out.compare = { a, b };
  }
  return out;
}
