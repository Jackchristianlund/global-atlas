import { create } from 'zustand';
import { bundledFrontline, frontlinePaths, loadFrontline as loadFrontlineData, type FrontlineSet } from './lib/frontline';
import { diffFronts, type FrontDiff, type LatLng as DiffLatLng } from './lib/frontDiff';
import { conflictBbox, zoomForBbox } from './lib/territory';
import { cachedMonth, loadMonth, monthDate, type HistoryMonth, type MonthState } from './lib/frontlineHistory';
import type { ConflictType, Iso, Lang, LayerId, Selection, ViewId } from './types';
import type { Tier } from './lib/entitlement';
import type { MapStyleId } from './map/styles';
import type { LabelDensity } from './map/overlays';

/** Where the map is looking, shared between the globe and the 2D map. */
export interface MapView { lat: number; lng: number; zoom: number }

/** Reads a remembered choice, tolerating a browser that refuses storage. */
function remembered<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const v = localStorage.getItem(key) as T | null;
    return v && allowed.includes(v) ? v : fallback;
  } catch { return fallback; }
}


/**
 * Layer state survives a reload.
 *
 * Someone who turns off six layers to read one thing should not have to do it
 * again every visit. Stored as plain JSON under one key, and any failure to
 * read or write it is ignored: a browser that refuses storage should cost the
 * reader their layout, not the app.
 */
const LAYER_KEY = 'ga.layers';

function rememberedLayers<T extends object>(fallback: T): T {
  try {
    const raw = localStorage.getItem(LAYER_KEY);
    if (!raw) return fallback;
    const saved = JSON.parse(raw) as Partial<Record<string, unknown>>;
    const out = { ...fallback } as Record<string, unknown>;
    // Only keys the current build knows about: a layer removed since the last
    // visit must not come back as a stray entry.
    for (const k of Object.keys(fallback)) if (k in saved) out[k] = saved[k];
    return out as T;
  } catch { return fallback; }
}

function saveLayers(layers: unknown, opacity: unknown): void {
  try { localStorage.setItem(LAYER_KEY, JSON.stringify({ layers, opacity })); } catch { /* storage refused */ }
}

export function remember(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch { /* storage refused; the choice just does not persist */ }
}

/** A clicked cluster of UCDP events: what it holds, and where it sits. */
export interface IncidentBin {
  at: [number, number];
  events: number;
  deaths: number;
  /** Events whose source reports no fatality estimate: counted, never read as zero. */
  unknown: number;
  from: string | null;
  to: string | null;
  countries: [string, number][];
  /** UCDP's type of violence, as the source labels it. */
  types: [string, number][];
}

export interface IncidentState {
  status: 'ingested' | 'not_ingested';
  n: number;
  busy: boolean;
  reason?: string;
}
import { SNAPSHOT_DATE } from './data/sources';

export const SNAPSHOT_YEAR = Number(SNAPSHOT_DATE.slice(0, 4));
export const FIRST_YEAR = 2000;

export type StatusFilter = 'tier4' | 'tier3' | 'tier2' | 'tier1' | 'ceasefire' | 'flashpoint';
export type ModalId = 'method' | 'network' | 'data' | 'pricing' | 'advertise' | null;

const OFF = { sanctions: false, displacement: false, events: false } as const;
const TERR = { territories: true, fronts: true } as const;
const PRESETS: Record<ViewId, Partial<Record<LayerId, boolean>>> = {
  conflict: { ...OFF, ...TERR, conflicts: true, flashpoints: true, alliances: false, routes: false, chokepoints: false, energy: false, links: true },
  alliance: { ...OFF, territories: false, fronts: false, conflicts: false, flashpoints: false, alliances: true, routes: false, chokepoints: false, energy: false, links: false },
  trade: { ...OFF, territories: false, fronts: false, conflicts: false, flashpoints: false, alliances: false, routes: true, chokepoints: true, energy: false, links: true, sanctions: true },
  energy: { ...OFF, territories: false, fronts: false, conflicts: false, flashpoints: false, alliances: false, routes: true, chokepoints: true, energy: true, links: true },
  human: { ...OFF, ...TERR, conflicts: true, flashpoints: false, alliances: false, routes: false, chokepoints: false, energy: false, links: true, displacement: true },
  history: { ...OFF, ...TERR, conflicts: true, flashpoints: true, alliances: false, routes: false, chokepoints: false, energy: false, links: false, events: true },
  scenario: { ...OFF, territories: false, fronts: false, conflicts: false, flashpoints: false, alliances: false, routes: true, chokepoints: true, energy: false, links: false },
};

interface State {
  lang: Lang;
  view: ViewId;
  layers: Record<LayerId, boolean>;
  layerOpacity: Record<LayerId, number>;
  trace: string[];
  legendOpen: boolean;
  sel: Selection;
  disputedId: string | null;
  /** The incident bin the user clicked, summarised. Parallel to `sel`, like `disputedId`. */
  incidentBin: IncidentBin | null;
  frontline: { set: FrontlineSet; note?: string; loading: boolean };
  /** Which month of the published series is on screen; null is the current line. */
  frontMonth: HistoryMonth | null;
  frontMonthState: MonthState;
  setFrontMonth: (m: HistoryMonth | null) => void;
  /** Two dated assessments of the front, compared. Null when not comparing. */
  frontCompare: { a: CompareKey; b: CompareKey } | null;
  frontCompareState: CompareState;
  setFrontCompare: (pair: { a: CompareKey; b: CompareKey } | null, opts?: { frame?: boolean }) => void;
  /** The globe camera came from a shared link and should be applied as-is once the globe is ready. */
  linkedView: boolean;
  /**
   * A request to frame an area, from anywhere in the interface: the map fits
   * it, the globe flies to it. `n` changes on every request so asking for the
   * same area twice still moves the camera back to it.
   */
  frame: { bbox: [number, number, number, number]; n: number } | null;
  frameArea: (bbox: [number, number, number, number]) => void;
  loadFrontline: () => Promise<void>;
  openDetail: (isos: readonly string[], at: [number, number], region?: string) => void;
  /** What the on-demand incident file reported, for the layer's own status line. */
  incidentState: IncidentState;
  /** Which tier the interface is previewing. Not a purchase: see lib/entitlement. */
  tier: Tier;
  /** The other date in a territorial comparison, or null when not comparing. */
  compareYear: number | null;
  /** What is in the search box, and which markers it matches. */
  /** Whether the intensity breakdown is expanded; remembered across visits. */
  tierOpen: boolean;
  searchQuery: string;
  /** Keys of the form `kind:id`, matching the globe's own marker keys. */
  searchHits: Set<string>;
  /** Which view is on screen: the 3D globe or the detailed 2D map. */
  mapMode: 'globe' | 'map';
  mapStyle: MapStyleId;
  labelDensity: LabelDensity;
  mapView: MapView;
  /** Where the globe camera is, so the map can open on the same ground. */
  globeView: { lat: number; lng: number; altitude: number };
  compare: Iso | null;
  picking: boolean;
  year: number;
  playing: boolean;
  orgId: string | null;
  statusOn: Record<StatusFilter, boolean>;
  typeFilter: ConflictType | 'all';
  scenarioId: string;
  knots: number;
  modal: ModalId;
  leftOpen: boolean;
  rightOpen: boolean;
  /** Desktop: a panel folded away to give the map the room. Remembered. */
  leftCollapsed: boolean;
  rightCollapsed: boolean;
  eventsCollapsed: boolean;
  setCollapsed: (which: 'left' | 'right' | 'events', collapsed: boolean) => void;
  lowPower: boolean;
  setLang: (l: Lang) => void;
  setView: (v: ViewId) => void;
  toggleLayer: (l: LayerId) => void;
  setOpacity: (l: LayerId, v: number) => void;
  pushTrace: (linkId: string) => void;
  popTrace: () => void;
  clearTrace: () => void;
  setLegendOpen: (o: boolean) => void;
  select: (s: Selection) => void;
  showDisputed: (id: string | null) => void;
  showIncidentBin: (b: IncidentBin | null) => void;
  setIncidentState: (s: IncidentState) => void;
  setTier: (t: Tier) => void;
  setCompareYear: (y: number | null) => void;
  setTierOpen: (v: boolean) => void;
  setSearch: (q: string, hits: Set<string>) => void;
  setMapMode: (m: 'globe' | 'map') => void;
  setMapStyle: (s: MapStyleId) => void;
  setLabelDensity: (d: LabelDensity) => void;
  setMapView: (v: MapView) => void;
  setGlobeView: (v: { lat: number; lng: number; altitude: number }) => void;
  setCompare: (c: Iso | null) => void;
  setPicking: (p: boolean) => void;
  setYear: (y: number) => void;
  setPlaying: (p: boolean) => void;
  setOrg: (id: string | null) => void;
  toggleStatus: (s: StatusFilter) => void;
  setTypeFilter: (t: ConflictType | 'all') => void;
  setScenario: (id: string) => void;
  setKnots: (k: number) => void;
  setModal: (m: ModalId) => void;
  setLeftOpen: (o: boolean) => void;
  setRightOpen: (o: boolean) => void;
  setLowPower: (o: boolean) => void;
}

/** One side of a front-line comparison: a month of the published series, or the current line. */
export type CompareKey = HistoryMonth | 'now';

export interface CompareLine { key: CompareKey; label: string; date: string; segments: DiffLatLng[][]; vertices: number }

export type CompareState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; a: CompareLine; b: CompareLine; diff: FrontDiff }
  | { status: 'unavailable'; reason: string };

/**
 * Shifts below this are not reported. The monthly series is generalised by
 * the service to about 1.3 km, so two copies of the same line can sit up to
 * roughly twice that apart without anything having moved.
 */
export const COMPARE_THRESHOLD_KM = 3;

/** The geometry for one side of a comparison. */
async function lineFor(key: CompareKey, current: FrontlineSet): Promise<CompareLine | { reason: string }> {
  if (key === 'now') {
    const segs = frontlinePaths(current).map((p) => p.coords.map(([lng, lat]) => [lat, lng] as DiffLatLng));
    return { key, label: 'now', date: current.meta.assessmentDate, segments: segs, vertices: segs.reduce((t, x) => t + x.length, 0) };
  }
  const st = cachedMonth(key) ? { status: 'ready' as const, line: cachedMonth(key)! } : await loadMonth(key);
  if (st.status !== 'ready') return { reason: st.status === 'unavailable' ? st.reason : 'unavailable' };
  return { key, label: st.line.label, date: monthDate(key), segments: st.line.segments as DiffLatLng[][], vertices: st.line.vertices };
}

/**
 * Whether the right panel is showing detail rather than the overview. The
 * panel widens for detail and stays compact otherwise, so the globe keeps the
 * room until there is something to read.
 */
export const panelExpanded = (s: Pick<State, 'sel' | 'disputedId' | 'incidentBin' | 'trace'>): boolean =>
  s.sel !== null || s.disputedId !== null || s.incidentBin !== null || s.trace.length > 0;

const detectLowPower = () =>
  import.meta.env?.VITE_FORCE_FULL !== '1' &&
  typeof window !== 'undefined' &&
  (window.innerWidth < 820 || (navigator.hardwareConcurrency ?? 8) <= 4 || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

export const useStore = create<State>((set, get) => ({
  lang: 'no',
  view: 'conflict',
  layers: rememberedLayers({ conflicts: true, incidents: false, attacks: true, hydro: true, flashpoints: true, alliances: false, routes: false, chokepoints: false, energy: false, links: true, borders: true, sanctions: false, displacement: false, events: false, territories: true, fronts: true, sourceline: true }),
  layerOpacity: rememberedLayers({ conflicts: 1, incidents: 1, attacks: 1, hydro: 0.85, flashpoints: 1, alliances: 1, routes: 1, chokepoints: 1, energy: 1, links: 1, borders: 1, sanctions: 1, displacement: 1, events: 1, territories: 1, fronts: 1, sourceline: 1 }),
  trace: [],
  legendOpen: false,
  sel: null,
  disputedId: null,
  incidentBin: null,
  incidentState: { status: 'not_ingested', n: 0, busy: false },
  frontline: { set: bundledFrontline(), note: undefined, loading: false },
  frontMonth: null,
  frontMonthState: { status: 'idle' },
  frontCompare: null,
  frontCompareState: { status: 'idle' },
  linkedView: false,
  frame: null,
  tier: 'free',
  compareYear: null,
  tierOpen: remembered('ga.tierOpen', ['0', '1'] as const, '0') === '1',
  searchQuery: '',
  searchHits: new Set<string>(),
  mapMode: 'globe',
  mapStyle: remembered('ga.mapStyle', ['conflict', 'standard', 'terrain', 'satellite', 'hybrid'] as const, 'conflict'),
  labelDensity: remembered('ga.labelDensity', ['low', 'normal', 'high'] as const, 'normal'),
  mapView: { lat: 48.5, lng: 33.0, zoom: 5 },
  globeView: { lat: 36, lng: 33, altitude: 2.15 },
  compare: null,
  picking: false,
  year: SNAPSHOT_YEAR,
  playing: false,
  orgId: 'nato',
  statusOn: { tier4: true, tier3: true, tier2: true, tier1: true, ceasefire: true, flashpoint: true },
  typeFilter: 'all',
  scenarioId: 'sc-redsea',
  knots: 14,
  modal: null,
  leftOpen: false,
  rightOpen: false,
  leftCollapsed: remembered('ga.c.left', ['0', '1'] as const, '0') === '1',
  rightCollapsed: remembered('ga.c.right', ['0', '1'] as const, '0') === '1',
  eventsCollapsed: remembered('ga.c.events', ['0', '1'] as const, '0') === '1',
  lowPower: detectLowPower(),
  setLang: (lang) => {
    document.documentElement.lang = lang === 'no' ? 'nb' : 'en';
    set({ lang });
  },
  setView: (view) =>
    set((s) => ({
      view,
      trace: [],
      layers: { ...s.layers, ...PRESETS[view] },
      sel: view === 'scenario' ? null : s.sel,
      disputedId: null,
      incidentBin: null,
      playing: view === 'history' ? s.playing : false,
      year: view === 'history' ? s.year : SNAPSHOT_YEAR,
    })),
  toggleLayer: (l) => set((s) => {
    const layers = { ...s.layers, [l]: !s.layers[l] };
    saveLayers(layers, s.layerOpacity);
    return { layers };
  }),
  setOpacity: (l, v) => set((s) => {
    const layerOpacity = { ...s.layerOpacity, [l]: Math.min(1, Math.max(0.15, v)) };
    saveLayers(s.layers, layerOpacity);
    return { layerOpacity };
  }),
  pushTrace: (linkId) => set((s) => ({ trace: s.trace.includes(linkId) ? s.trace : [...s.trace, linkId], rightOpen: true, rightCollapsed: false })),
  popTrace: () => set((s) => ({ trace: s.trace.slice(0, -1) })),
  clearTrace: () => set({ trace: [] }),
  setLegendOpen: (legendOpen) => set({ legendOpen }),
  select: (sel) => {
    const s = get();
    // In compare mode a country click fills the second slot instead of replacing the first.
    if (s.picking && sel?.kind === 'country' && s.sel?.kind === 'country' && sel.id !== s.sel.id) {
      set({ compare: sel.id, picking: false, rightOpen: true, rightCollapsed: false });
      return;
    }
    // Selecting something brings its panel back if it was folded away: a click
    // on a conflict that appears to do nothing is the worst outcome a fold
    // could have. The stored preference is left alone, so the fold is back on
    // the next visit.
    set({
      sel, disputedId: null, incidentBin: null, compare: null, picking: false, trace: [],
      rightOpen: sel !== null || s.rightOpen, leftOpen: false,
      ...(sel !== null && s.rightCollapsed ? { rightCollapsed: false } : {}),
    });
  },
  loadFrontline: async () => {
    if (get().frontline.loading || get().frontline.set.tier === 'live') return;
    set((s) => ({ frontline: { ...s.frontline, loading: true } }));
    const r = await loadFrontlineData();
    set({ frontline: { set: r.set, note: r.note, loading: false } });
  },
  /**
   * Opens the detailed map on a conflict. The frame comes from the units that
   * carry control records for it; a conflict with no control data falls back
   * to its own point at a fixed zoom rather than to an invented extent.
   */
  openDetail: (isos, at, region) => {
    const b = conflictBbox(isos, region);
    // The room the map actually has: between the floating panels on a
    // desktop, the whole width on a phone where the panels are drawers.
    const W = typeof window !== 'undefined' ? window.innerWidth : 1600;
    const H = typeof window !== 'undefined' ? window.innerHeight : 900;
    const narrow = W <= 880;
    const w = narrow ? W - 30 : W - 700;
    const h = narrow ? H - 330 : H - 220;
    const view = b
      ? { lng: (b[0] + b[2]) / 2, lat: (b[1] + b[3]) / 2, zoom: zoomForBbox(b, Math.max(w, narrow ? 240 : 420), Math.max(h, narrow ? 240 : 360)) }
      : { lng: at[1], lat: at[0], zoom: 6.5 };
    set({ mapMode: 'map', mapView: view });
  },
  /**
   * Shows one month of the published series, or returns to the current line.
   * The month is set immediately so the control responds, and the state
   * follows: a month that cannot be fetched says so rather than leaving the
   * previous month on screen under the new label.
   */
  setFrontMonth: (m) => {
    if (m === null) {
      set({ frontMonth: null, frontMonthState: { status: 'idle' } });
      return;
    }
    const hit = cachedMonth(m);
    if (hit) {
      set({ frontMonth: m, frontMonthState: { status: 'ready', line: hit } });
      return;
    }
    set({ frontMonth: m, frontMonthState: { status: 'loading' } });
    void loadMonth(m).then((state) => {
      // Ignore an answer for a month the reader has already moved off.
      if (get().frontMonth === m) set({ frontMonthState: state });
    });
  },
  setFrontCompare: (pair, opts) => {
    if (!pair) { set({ frontCompare: null, frontCompareState: { status: 'idle' } }); return; }
    set({ frontCompare: pair, frontCompareState: { status: 'loading' } });
    const key = `${pair.a}|${pair.b}`;
    void Promise.all([lineFor(pair.a, get().frontline.set), lineFor(pair.b, get().frontline.set)]).then(([la, lb]) => {
      const now = get().frontCompare;
      // Ignore an answer for a pair the reader has already moved off.
      if (!now || `${now.a}|${now.b}` !== key) return;
      if ('reason' in la || 'reason' in lb) {
        set({ frontCompareState: { status: 'unavailable', reason: ('reason' in la ? la : lb as { reason: string }).reason } });
        return;
      }
      const diff = diffFronts(la.segments, lb.segments, COMPARE_THRESHOLD_KM);
      set({ frontCompareState: { status: 'ready', a: la, b: lb, diff } });
      if (diff.bbox && opts?.frame !== false) get().frameArea(diff.bbox);
    });
  },
  frameArea: (bbox) => set((s) => ({ frame: { bbox, n: (s.frame?.n ?? 0) + 1 } })),
  setCollapsed: (which, collapsed) => {
    remember(`ga.c.${which}`, collapsed ? '1' : '0');
    if (which === 'left') set({ leftCollapsed: collapsed });
    else if (which === 'right') set({ rightCollapsed: collapsed });
    else set({ eventsCollapsed: collapsed });
  },
  showDisputed: (disputedId) => set({ disputedId, incidentBin: null, rightOpen: disputedId !== null || get().rightOpen }),
  showIncidentBin: (incidentBin) => set({ incidentBin, sel: null, disputedId: null, rightOpen: incidentBin !== null || get().rightOpen, leftOpen: false }),
  setIncidentState: (incidentState) => set({ incidentState }),
  setTier: (tier) => set({ tier }),
  setCompareYear: (compareYear) => set({ compareYear }),
  setTierOpen: (tierOpen) => { remember('ga.tierOpen', tierOpen ? '1' : '0'); set({ tierOpen }); },
  setSearch: (searchQuery, searchHits) => set({ searchQuery, searchHits }),
  setMapMode: (mapMode) => set({ mapMode }),
  setMapStyle: (mapStyle) => { remember('ga.mapStyle', mapStyle); set({ mapStyle }); },
  setLabelDensity: (labelDensity) => { remember('ga.labelDensity', labelDensity); set({ labelDensity }); },
  setMapView: (mapView) => set({ mapView }),
  setGlobeView: (globeView) => set({ globeView }),
  setCompare: (compare) => set({ compare }),
  setPicking: (picking) => set({ picking }),
  setYear: (year) => set({ year: Math.max(FIRST_YEAR, Math.min(SNAPSHOT_YEAR, year)) }),
  setPlaying: (playing) => set({ playing }),
  setOrg: (orgId) => set((s) => ({ orgId, layers: { ...s.layers, alliances: orgId !== null } })),
  toggleStatus: (k) => set((s) => ({ statusOn: { ...s.statusOn, [k]: !s.statusOn[k] } })),
  setTypeFilter: (typeFilter) => set({ typeFilter }),
  setScenario: (scenarioId) => set({ scenarioId }),
  setKnots: (knots) => set({ knots }),
  setModal: (modal) => set({ modal }),
  setLeftOpen: (leftOpen) => set({ leftOpen }),
  setRightOpen: (rightOpen) => set({ rightOpen }),
  setLowPower: (lowPower) => set({ lowPower }),
}));
