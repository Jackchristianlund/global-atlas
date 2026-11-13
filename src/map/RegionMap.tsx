import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { Map as MLMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
// MapLibre parses geometry in a worker it loads as a separate file. Without
// this the bundler never emits that file, the request 404s, and the map ends
// up with its layers in place and no tiles to put in them: everything looks
// wired up and nothing draws.
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import { SNAPSHOT_YEAR, useStore } from '../store';
import { useT } from '../i18n';
import { DEM, MAP_STYLES, adapterStyle, altitudeToZoom, enhanceStyle, fallbackStyle, imageryProvider, loadStyle, webgl2Available, withRelief, zoomToAltitude, type MapStyleId } from './styles';
import { addBaseDetail, addBaseLabels, DETAIL_META, setBaseDetailVisible } from './basedetail';
// Myanmar's township layers (and their 250 KB of geometry) load only when the
// map is over Myanmar; until then two empty placeholder layers hold their
// place in the stack.
type MmrModule = typeof import('./mmrlayers');
let mmrMod: MmrModule | null = null;
let mmrLoading: Promise<MmrModule> | null = null;
const loadMmr = () => (mmrLoading ??= import('./mmrlayers').then((mod) => (mmrMod = mod)));
const MMR_AREA: [number, number, number, number] = [91.5, 9, 102, 29];
/** An empty, invisible layer that marks where a late-loading group goes. */
function slot(m: MLMap, id: string) {
  if (!m.getLayer(id)) m.addLayer({ id, type: 'background', layout: { visibility: 'none' }, paint: { 'background-opacity': 0 } });
}
/** The layer directly above a slot: late layers are inserted under it, in order. */
function above(m: MLMap, id: string): string | undefined {
  const ls = m.getStyle().layers ?? [];
  const i = ls.findIndex((l) => l.id === id);
  return i >= 0 ? ls[i + 1]?.id : undefined;
}
import { loadWorld, type CountryFeature } from '../data/countries';
import { resolveGlyphRequest } from './glyphs';
import { LABEL_MIN_ZOOM, attackFC, belligerentFC, chokepointFC, compareFC, conflictFC, contactFC, derivedContactHidden, diffFC, districtFC, frontlineFC, monthFC, placeFC, routesFC, sitesFC, territoryFC, type LabelDensity } from './overlays';
import { REGION_FOR_CONFLICT } from '../lib/territory';
import { ALL_ROUTES, CHOKEPOINTS } from '../data';
import { isComputed, routePoints } from '../lib/routes';
import { YEMEN_SITES } from '../data/yemen/explorer';
import { ATTACK } from '../lib/attacks';
import districts from '../data/yemen/districts.json';
import { panelInsets } from '../lib/framing';
import { registerCapture } from '../lib/snapshot';
import { panelExpanded } from '../store';

/**
 * The detailed regional map.
 *
 * MapLibre renders the base map; every overlay on top of it is the same data
 * the globe draws, so the two views never disagree. The globe is not replaced:
 * this is the close-in view, and switching between them keeps the centre, the
 * scale, the selected year, the active layers and the selection.
 *
 * The base map needs tiles from a provider, which means a network the globe
 * does not need. When they cannot be reached the map says so rather than
 * showing an empty grey square.
 */
/**
 * Oblast tint by zoom: a summary when the whole country is in view, nearly
 * gone by the time single settlements are. The numbers are opacity, not data —
 * the polygons and their shares never change with zoom.
 */
function fillOpacity(scale: number, quietUkraine = false): maplibregl.ExpressionSpecification {
  // Where labelled control polygons are drawn, Ukraine's oblast tint drops to
  // a trace: still there to click, no longer painting the same claim twice.
  // A unit the atlas's own records assess as wholly occupied keeps its tint —
  // Crimea is outside the OCHA planning units, and must not turn blank.
  const quiet: maplibregl.ExpressionSpecification = ['all',
    ['==', ['get', 'region'], 'ukraine'],
    ['any', ['!=', ['get', 'status'], 'control'], ['==', ['get', 'actor'], 'ua-gov']]];
  const v = (o: number): maplibregl.ExpressionSpecification | number =>
    quietUkraine ? ['case', quiet, 0.03, o * scale] : o * scale;
  return ['interpolate', ['linear'], ['zoom'], 4, v(0.45), 7, v(0.3), 9, v(0.12), 11, v(0.06)] as maplibregl.ExpressionSpecification;
}

/** The map's current extent as [west, south, east, north]. */
function viewBounds(m: MLMap): [number, number, number, number] | null {
  try {
    const b = m.getBounds();
    return [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()];
  } catch {
    return null;
  }
}

/**
 * Lines that cross the antimeridian jump from +180 to -180; unwrapping keeps
 * them continuous so MapLibre does not draw them across the whole world.
 */
function unwrap(pts: [number, number][]): [number, number][] {
  const out: [number, number][] = [];
  let shift = 0;
  for (let i = 0; i < pts.length; i++) {
    if (i > 0) {
      const d = pts[i][1] + shift - out[i - 1][1];
      if (d > 180) shift -= 360; else if (d < -180) shift += 360;
    }
    out.push([pts[i][0], pts[i][1] + shift]);
  }
  return out;
}

const ROUTE_DATA = routesFC(ALL_ROUTES.map((r) => ({ id: r.id, kind: r.kind, pts: unwrap(routePoints(r)), computed: isComputed(r.id) })));
const DISTRICTS = districtFC(districts as unknown as { lines: number[][][]; labels: { n: string; at: number[] }[] });

/** The labelled control polygons, or nothing while they are loading or unavailable. */
function controlFC(): { type: 'FeatureCollection'; features: unknown[] } {
  const c = useStore.getState().control;
  return { type: 'FeatureCollection', features: c.status === 'ready' ? c.layer.features : [] };
}

/** The change in control since a past day, as two kinds of polygon. */
function changeFC(): { type: 'FeatureCollection'; features: unknown[] } {
  const c = useStore.getState().controlChange;
  if (c.status !== 'ready') return { type: 'FeatureCollection', features: [] };
  const f = (k: string, mp: unknown) => ({ type: 'Feature', properties: { k }, geometry: { type: 'MultiPolygon', coordinates: mp } });
  return { type: 'FeatureCollection', features: [f('gained', c.change.gained), f('lost', c.change.lost)] };
}

/** What the map is drawn on: the bundled base, a vector style, or imagery. */
type BaseKind = 'bundled' | 'vector' | 'imagery';

export default function RegionMap() {
  const host = useRef<HTMLDivElement>(null);
  const map = useRef<MLMap | null>(null);
  const moving = useRef(false);
  const [baseFailed, setBaseFailed] = useState(false);
  const baseKind = useRef<BaseKind>('bundled');
  const [base, setBase] = useState<BaseKind>('bundled');
  // The map fades in over the globe once it has drawn, rather than cutting
  // from one to the other.
  const [shown, setShown] = useState(false);
  const cmpState = useStore((st) => st.frontCompareState);
  const monthState = useStore((st) => st.frontMonthState);
  const frame = useStore((st) => st.frame);
  const control = useStore((st) => st.control);
  const controlChange = useStore((st) => st.controlChange);
  const loadControl = useStore((st) => st.loadControl);
  // As on the globe: ISW's layer is a few megabytes, fetched only once the
  // map is over Ukraine (or the war is selected), not for a look at Yemen.
  const overUkraine = useStore((st) => (st.sel?.kind === 'conflict' && st.sel.id === 'ukr')
    || (st.mapView.lat > 43 && st.mapView.lat < 54 && st.mapView.lng > 20 && st.mapView.lng < 42));
  useEffect(() => { if (overUkraine) void loadControl(); }, [overUkraine, loadControl]);
  const bound = useRef(false);
  const mmrBound = useRef(false);
  const paintRef = useRef<((m: MLMap) => void) | null>(null);
  const { t, lang } = useT();
  const s = useStore();
  const { year, layers, layerOpacity, mapStyle, labelDensity, mapView, setMapView, select, frontline, sel } = s;
  // A conflict the reader picked: its sides show whatever the camera is doing.
  const conflictId = sel?.kind === 'conflict' ? sel.id : null;
  const conflictRef = useRef<string | null>(null);
  conflictRef.current = conflictId;
  // The region of the selected conflict, for the outline on its units.
  const selRegionRef = useRef<string | null>(null);
  selRegionRef.current = conflictId ? REGION_FOR_CONFLICT[conflictId] ?? null : null;
  const sourcedOnRef = useRef(true);
  sourcedOnRef.current = layers.sourceline;
  const hideContact = (region: string) => derivedContactHidden(region, year, sourcedOnRef.current, SNAPSHOT_YEAR);
  // The popup is bound once but has to answer in whatever language is current
  // when it is opened, so it reads the language through a ref.
  const langRef = useRef(lang);
  langRef.current = lang;

  // ── Create once ──────────────────────────────────────────────────────────
  // Note the lazy initialiser: useRef evaluates its argument on every render,
  // keeping only the first result, so passing webgl2Available() directly would
  // probe on every render even though the value is read once.
  const world = useRef<CountryFeature[]>([]);
  const [worldReady, setWorldReady] = useState(0);
  const canRender = useRef<boolean | null>(null);
  if (canRender.current === null) canRender.current = webgl2Available();
  useEffect(() => {
    if (!host.current || map.current || !canRender.current) return;
    maplibregl.setWorkerUrl(workerUrl);
    const m = new maplibregl.Map({
      container: host.current,
      // Starts on the local style so the overlays draw at once; the real base
      // map swaps in below once it has loaded.
      style: fallbackStyle() as never,
      center: [mapView.lng, mapView.lat],
      zoom: mapView.zoom,
      attributionControl: { compact: true },
      maxPitch: 60,
      // Glyph requests never leave the page; everything else is untouched.
      transformRequest: (url) => {
        const local = resolveGlyphRequest(url);
        return local ? { url: local } : { url };
      },
    });
    m.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right');
    m.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');
    map.current = m;
    // A read-only handle, so the map can be inspected from outside React when
    // the rendering is being checked rather than guessed at.
    (window as unknown as { __ga_map?: unknown }).__ga_map = m;

    // "Download image": the frame is copied inside the render event, while
    // the drawing buffer still holds it.
    registerCapture('map', () => new Promise((resolve, reject) => {
      const giveUp = window.setTimeout(() => reject(new Error('the map did not render')), 8000);
      m.once('render', () => {
        window.clearTimeout(giveUp);
        const src = m.getCanvas();
        const copy = document.createElement('canvas');
        copy.width = src.width;
        copy.height = src.height;
        copy.getContext('2d')!.drawImage(src, 0, 0);
        resolve(copy);
      });
      m.triggerRepaint();
    }));

    m.on('moveend', () => {
      if (moving.current) return;
      const c = m.getCenter();
      setMapView({ lat: c.lat, lng: c.lng, zoom: m.getZoom() });
    });
    m.on('load', () => { addOverlays(m); paint(m); });
    m.once('idle', () => setShown(true));
    // Never wait forever on a slow tile server to show the map.
    window.setTimeout(() => setShown(true), 1200);
    // Tile and style failures are reported through the notice below, not by
    // filling the console with retries the user cannot act on.
    m.on('error', () => { /* handled by the notice */ });

    // The sides follow the camera, so panning onto a war shows its parties
    // without the reader having to select it first.
    const onMove = () => {
      (m.getSource('belligerent') as maplibregl.GeoJSONSource | undefined)
        ?.setData(belligerentFC(viewBounds(m), world.current, conflictRef.current) as never);
    };
    m.on('moveend', onMove);
    // Myanmar's layers come in the first time the map is over Myanmar.
    const onMoveMmr = () => { if (!mmrMod && m.getLayer('mmr-slot')) installMmr(m); };
    m.on('moveend', onMoveMmr);

    // Country outlines arrive after the map; refresh the source when they do.
    let live = true;
    void loadWorld().then((w) => {
      if (!live) return;
      world.current = w;
      setWorldReady((n) => n + 1);
    });

    return () => {
      live = false;
      registerCapture('map', null);
      m.off('moveend', onMove);
      m.off('moveend', onMoveMmr);
      m.remove();
      map.current = null;
      // Drop the inspection handle too: holding a removed map keeps its canvas
      // and its WebGL context from being collected.
      (window as unknown as { __ga_map?: unknown }).__ga_map = undefined;
    };
    // Created once; everything else is applied by the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** The comparison and the month line, from the latest state rather than a stale closure. */
  function pushHistory(m: MLMap) {
    const st = useStore.getState();
    const c = st.frontCompareState.status === 'ready' ? st.frontCompareState : null;
    (m.getSource('cmp') as maplibregl.GeoJSONSource | undefined)?.setData(compareFC(c?.a.segments ?? null, c?.b.segments ?? null) as never);
    (m.getSource('diff') as maplibregl.GeoJSONSource | undefined)?.setData(diffFC(c?.diff.stretches ?? []) as never);
    (m.getSource('ctl') as maplibregl.GeoJSONSource | undefined)?.setData(controlFC() as never);
    (m.getSource('chg') as maplibregl.GeoJSONSource | undefined)?.setData(changeFC() as never);
    const ms = st.frontMonthState;
    (m.getSource('month') as maplibregl.GeoJSONSource | undefined)?.setData(monthFC(ms.status === 'ready' ? ms.line.segments : null) as never);
  }

  /**
   * Puts Myanmar's layers into their slots once the module is here, loading
   * it the first time the map is over Myanmar.
   */
  function installMmr(m: MLMap) {
    const put = (mod: MmrModule) => {
      if (!m.getLayer('mmr-slot') || m.getSource('mmr-mesh')) return;
      mod.addMmrLayers(m, above(m, 'mmr-slot'));
      mod.addMmrSiteLabels(m, langRef.current, above(m, 'mmr-label-slot'));
      if (!mmrBound.current) { mmrBound.current = true; mod.bindMmrPopup(m, () => langRef.current); }
      paintRef.current?.(m);
    };
    if (mmrMod) { put(mmrMod); return; }
    const b = m.getBounds();
    const over = b.getWest() < MMR_AREA[2] && b.getEast() > MMR_AREA[0] && b.getSouth() < MMR_AREA[3] && b.getNorth() > MMR_AREA[1];
    if (over) void loadMmr().then((mod) => { try { put(mod); } catch { /* map gone */ } });
  }

  /** Sources and layers, in the order they must stack. */
  function addOverlays(m: MLMap) {
    // The bundled base goes in first, so every conflict layer added below
    // draws on top of it.
    addBaseDetail(m);
    // Myanmar's townships sit directly on the base map: they are the lowest
    // overlay, so the front line, markers and labels all stay readable over
    // them. They draw only where Myanmar is, so other regions are unaffected.
    slot(m, 'mmr-slot');

    const src = (id: string, data: unknown) => { if (!m.getSource(id)) m.addSource(id, { type: 'geojson', data: data as never }); };
    src('belligerent', belligerentFC(viewBounds(m), world.current, conflictRef.current));
    src('terr', territoryFC(year));
    src('contact', contactFC(year, undefined, hideContact));
    src('ctl', controlFC());
    src('chg', changeFC());
    src('routes', ROUTE_DATA);
    src('choke', chokepointFC(CHOKEPOINTS.map((c) => ({ id: c.id, name: c.name[lang === 'no' ? 0 : 1], at: c.at }))));
    src('yem-dist', DISTRICTS.lines);
    src('yem-dist-label', DISTRICTS.labels);
    src('yem-sites', sitesFC(YEMEN_SITES.filter((x) => !x.place)));
    src('month', monthFC(monthState.status === 'ready' ? monthState.line.segments : null));
    src('cmp', compareFC(cmpState.status === 'ready' ? cmpState.a.segments : null, cmpState.status === 'ready' ? cmpState.b.segments : null));
    src('diff', diffFC(cmpState.status === 'ready' ? cmpState.diff.stretches : []));
    src('frontline', frontlineFC(frontline.set));
    src('attacks', attackFC(year));
    src('places', placeFC(year));
    src('conflicts', conflictFC(year, lang, SNAPSHOT_YEAR));

    const add = (spec: Parameters<MLMap['addLayer']>[0]) => { if (!m.getLayer(spec.id)) m.addLayer(spec); };
    // The control polygons are whole administrative units carrying a share,
    // not ground truth street by street. Painted solid at city zoom they would
    // claim that every village in an oblast is held by one actor — which the
    // front line running through the same oblast visibly contradicts. So the
    // tint reads as a regional summary and fades out as the reader goes in,
    // leaving the sourced line to carry the message where it matters.
    // The sides, under everything. Faint by design: a party to a war is not a
    // claim of control, and the control polygons above are what carry that.
    add({
      id: 'belligerent-fill', type: 'fill', source: 'belligerent',
      // Gone by the time a single oblast fills the screen: at that scale the
      // control layer and the front line carry everything, and a wash over
      // them only muddies both.
      paint: { 'fill-color': ['get', 'color'], 'fill-opacity': ['interpolate', ['linear'], ['zoom'], 3, 0.3, 5.5, 0.22, 7, 0.06, 7.8, 0] },
    });
    add({
      id: 'belligerent-line', type: 'line', source: 'belligerent',
      paint: { 'line-color': ['get', 'color'], 'line-width': 1, 'line-opacity': ['interpolate', ['linear'], ['zoom'], 3, 0.5, 7, 0.25, 7.8, 0] },
    });

    add({ id: 'terr-fill', type: 'fill', source: 'terr', paint: { 'fill-color': ['get', 'color'], 'fill-opacity': fillOpacity(1) } });
    add({ id: 'terr-line', type: 'line', source: 'terr', paint: { 'line-color': ['get', 'color'], 'line-width': 1.2, 'line-opacity': 0.9 } });
    // The selected conflict's units, outlined so the reader can see at once
    // which ground the panel is talking about.
    add({
      id: 'terr-sel', type: 'line', source: 'terr', filter: ['==', ['get', 'region'], selRegionRef.current ?? '__none'],
      layout: { 'line-join': 'round' },
      paint: { 'line-color': '#7FE3FF', 'line-width': ['interpolate', ['linear'], ['zoom'], 3, 1.4, 9, 2.6], 'line-opacity': 0.9, 'line-blur': 0.4 },
    });
    // Labelled areas of control. Unlike the oblast tint these resolve the
    // ground below the oblast, so they stay readable as the reader zooms in.
    // Uncertainty first, under control: ISW's infiltration areas (presence,
    // not control) faint with a dotted edge, its assessed advances (inside
    // the forward line, not controlled) lighter with a dashed edge.
    add({
      id: 'ctl-inf', type: 'fill', source: 'ctl', filter: ['==', ['get', 'kind'], 'infiltration'],
      paint: { 'fill-color': '#F08A4B', 'fill-opacity': 0.16 },
    });
    add({
      id: 'ctl-inf-line', type: 'line', source: 'ctl', filter: ['==', ['get', 'kind'], 'infiltration'],
      paint: { 'line-color': '#E0763A', 'line-width': 1, 'line-dasharray': [1, 2], 'line-opacity': 0.8 },
    });
    add({
      id: 'ctl-adv', type: 'fill', source: 'ctl', filter: ['==', ['get', 'kind'], 'advance'],
      paint: { 'fill-color': '#E35D55', 'fill-opacity': 0.2 },
    });
    add({
      id: 'ctl-adv-line', type: 'line', source: 'ctl', filter: ['==', ['get', 'kind'], 'advance'],
      paint: { 'line-color': '#C9423A', 'line-width': 1.2, 'line-dasharray': [3, 2], 'line-opacity': 0.85 },
    });
    add({
      id: 'ctl-pre', type: 'line', source: 'ctl', filter: ['==', ['get', 'kind'], 'pre2022'],
      paint: { 'line-color': '#5E1712', 'line-width': ['interpolate', ['linear'], ['zoom'], 4, 0.8, 10, 1.6], 'line-dasharray': [2, 1.5], 'line-opacity': 0.75 },
    });
    add({
      id: 'ctl-fill', type: 'fill', source: 'ctl', filter: ['==', ['get', 'kind'], 'control'],
      paint: { 'fill-color': '#D6453D', 'fill-opacity': ['interpolate', ['linear'], ['zoom'], 4, 0.42, 8, 0.34, 12, 0.24] },
    });
    add({
      id: 'ctl-line', type: 'line', source: 'ctl', filter: ['==', ['get', 'kind'], 'control'],
      layout: { 'line-join': 'round' },
      paint: { 'line-color': '#9E2A24', 'line-width': ['interpolate', ['linear'], ['zoom'], 4, 0.8, 10, 2], 'line-opacity': 0.9 },
    });
    // Control over time: ground assessed as Russian-controlled now but not on
    // the earlier day (amber), and the reverse (cyan, hatched by a dashed edge).
    add({ id: 'chg-gain', type: 'fill', source: 'chg', filter: ['==', ['get', 'k'], 'gained'], paint: { 'fill-color': '#FFB020', 'fill-opacity': 0.7 } });
    add({ id: 'chg-gain-line', type: 'line', source: 'chg', filter: ['==', ['get', 'k'], 'gained'], paint: { 'line-color': '#8A5A00', 'line-width': 1.2 } });
    add({ id: 'chg-lost', type: 'fill', source: 'chg', filter: ['==', ['get', 'k'], 'lost'], paint: { 'fill-color': '#5CE1FF', 'fill-opacity': 0.55 } });
    add({ id: 'chg-lost-line', type: 'line', source: 'chg', filter: ['==', ['get', 'k'], 'lost'], paint: { 'line-color': '#0E6C85', 'line-width': 1.2, 'line-dasharray': [2, 1.5] } });
    // Yemen's districts: thin and dashed, administrative reference only. They
    // are never filled and never coloured by actor, because no sourced
    // district-level assessment of control exists in this dataset.
    add({
      id: 'yem-dist', type: 'line', source: 'yem-dist', minzoom: 5.5,
      paint: { 'line-color': '#7D8AA0', 'line-width': ['interpolate', ['linear'], ['zoom'], 5.5, 0.4, 10, 1.1], 'line-opacity': ['interpolate', ['linear'], ['zoom'], 5.5, 0, 6.5, 0.55], 'line-dasharray': [2, 2] },
    });
    // Shipping lanes and pipelines, for the Red Sea and Bab el-Mandeb above all.
    // Computed lanes solid, hand-drawn corridors dashed, as on the globe. Two
    // layers, because a dash pattern cannot vary feature by feature.
    const routePaint = {
      'line-color': ['match', ['get', 'kind'], 'oil', '#FFD23F', 'lng', '#7BE0C3', 'rail', '#C9A2FF', 'pipeline', '#FF9B42', '#00D9FF'],
      'line-width': ['interpolate', ['linear'], ['zoom'], 2, 1.2, 8, 2.6],
      'line-opacity': 0.85,
    } as const;
    add({ id: 'route-line', type: 'line', source: 'routes', filter: ['==', ['get', 'computed'], true], layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: routePaint as never });
    add({ id: 'route-drawn', type: 'line', source: 'routes', filter: ['!=', ['get', 'computed'], true], layout: { 'line-join': 'round' }, paint: { ...routePaint, 'line-dasharray': [3, 2] } as never });
    add({
      id: 'contact-line', type: 'line', source: 'contact',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#FFD678', 'line-width': ['interpolate', ['linear'], ['zoom'], 3, 1.6, 10, 4], 'line-opacity': 0.95 },
    });
    // Casing then line, so the front reads against both dark terrain and
    // bright satellite imagery without a glow. Width grows with zoom; the
    // geometry does not change with it.
    add({
      id: 'frontline-case', type: 'line', source: 'frontline',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': 'rgba(6,10,20,.9)', 'line-width': ['interpolate', ['linear'], ['zoom'], 3, 3.2, 10, 7.5], 'line-opacity': 0.9 },
    });
    add({
      id: 'frontline-line', type: 'line', source: 'frontline',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#FFFFFF', 'line-width': ['interpolate', ['linear'], ['zoom'], 3, 1.1, 10, 3], 'line-opacity': 0.97 },
    });
    // One month of the published series, amber where the current line is white.
    add({
      id: 'month-line', type: 'line', source: 'month',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#FFC24D', 'line-width': ['interpolate', ['linear'], ['zoom'], 3, 1.4, 10, 3.4], 'line-opacity': 0.95 },
    });
    // Comparison: where the two assessments differ, as a wide soft band under
    // both lines, then the earlier line dashed amber and the later solid cyan.
    add({
      id: 'diff-band', type: 'line', source: 'diff',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#FF5CA8', 'line-width': ['interpolate', ['linear'], ['zoom'], 3, 7, 10, 18], 'line-opacity': 0.38, 'line-blur': 2 },
    });
    add({
      id: 'cmp-a', type: 'line', source: 'cmp', filter: ['==', ['get', 'role'], 'a'],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#FFC24D', 'line-width': ['interpolate', ['linear'], ['zoom'], 3, 1.6, 10, 3.6], 'line-dasharray': [2, 1.4] },
    });
    add({
      id: 'cmp-b', type: 'line', source: 'cmp', filter: ['==', ['get', 'role'], 'b'],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#5CE1FF', 'line-width': ['interpolate', ['linear'], ['zoom'], 3, 1.6, 10, 3.6] },
    });
    // Settlement names go on after the conflict layers, so a city label is
    // never hidden under a control polygon.
    addBaseLabels(m, true);
    slot(m, 'mmr-label-slot');
    installMmr(m);

    add({
      id: 'attack-pt', type: 'circle', source: 'attacks',
      paint: {
        'circle-color': ['get', 'color'],
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 3, 4, 10, 8],
        'circle-stroke-color': 'rgba(7,11,20,.85)', 'circle-stroke-width': 1.5, 'circle-opacity': 0.95,
      },
    });
    add({
      id: 'place-pt', type: 'circle', source: 'places',
      paint: { 'circle-color': ['get', 'color'], 'circle-radius': 4, 'circle-stroke-color': 'rgba(7,11,20,.85)', 'circle-stroke-width': 1.5 },
    });
    // Text needs glyphs from the style's font server. The offline base map has
    // none, so the labels are added only when the real style is in place; the
    // markers and the panel still name every place either way.
    if (m.getStyle().glyphs) {
      add({
        id: 'place-label', type: 'symbol', source: 'places',
        layout: { 'text-field': ['get', 'name'], 'text-size': 12, 'text-offset': [0, 1.1], 'text-anchor': 'top', 'text-font': ['Noto Sans Regular'] },
        paint: { 'text-color': '#EAF2FF', 'text-halo-color': 'rgba(7,11,20,.9)', 'text-halo-width': 1.4 },
      });
    }
    if (m.getStyle().glyphs) {
      add({
        id: 'yem-dist-label', type: 'symbol', source: 'yem-dist-label', minzoom: 8.2,
        layout: { 'text-field': ['get', 'n'], 'text-size': 10.5, 'text-font': ['Noto Sans Regular'], 'text-allow-overlap': false, 'text-padding': 4 },
        paint: { 'text-color': '#8D9AB0', 'text-halo-color': 'rgba(7,11,20,.8)', 'text-halo-width': 1.2 },
      });
    }
    add({
      id: 'yem-site', type: 'circle', source: 'yem-sites', minzoom: 4.5,
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 4.5, 3, 10, 5.5],
        'circle-color': ['match', ['get', 'kind'], 'port', '#00D9FF', '#DCE7F5'],
        'circle-stroke-color': 'rgba(7,11,20,.9)', 'circle-stroke-width': 1.5,
      },
    });
    if (m.getStyle().glyphs) {
      add({
        id: 'yem-site-label', type: 'symbol', source: 'yem-sites', minzoom: 5.2,
        layout: { 'text-field': ['get', 'name'], 'text-size': 12, 'text-offset': [0, 1.0], 'text-anchor': 'top', 'text-font': ['Noto Sans Regular'] },
        paint: { 'text-color': '#EAF2FF', 'text-halo-color': 'rgba(7,11,20,.9)', 'text-halo-width': 1.4 },
      });
    }
    add({
      id: 'choke-pt', type: 'circle', source: 'choke',
      paint: { 'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 4, 8, 7], 'circle-color': '#00D9FF', 'circle-stroke-color': '#06101C', 'circle-stroke-width': 2, 'circle-opacity': 0.95 },
    });
    add({
      id: 'conflict-pt', type: 'circle', source: 'conflicts',
      paint: {
        'circle-color': ['get', 'color'],
        'circle-radius': ['interpolate', ['linear'], ['get', 'tier'], 1, 5, 4, 9],
        'circle-stroke-color': 'rgba(7,11,20,.85)', 'circle-stroke-width': 1.5,
      },
    });

    // Whatever the history layers held before a style switch, from the store.
    pushHistory(m);

    if (bound.current) return;
    bound.current = true;
    // Myanmar answers in a popup rather than the side panel: the claim being
    // made is about one township, and about 270 of the 330 carry no claim at
    // all. The popup says which of the two the reader just clicked.
    // (Myanmar's popup is bound when its layers are installed.)
    for (const [layer, kind] of [['attack-pt', 'attack'], ['place-pt', 'place'], ['conflict-pt', 'conflict'], ['choke-pt', 'chokepoint'], ['terr-fill', 'territory']] as const) {
      m.on('click', layer, (e) => {
        const f = e.features?.[0];
        const id = f?.properties?.id as string | undefined;
        if (id) select({ kind, id } as never);
      });
      m.on('mouseenter', layer, () => { m.getCanvas().style.cursor = 'pointer'; });
      m.on('mouseleave', layer, () => { m.getCanvas().style.cursor = ''; });
    }
  }

  /** Visibility and opacity, driven by the same layer controls as the globe. */
  paintRef.current = (m: MLMap) => paint(m);
  function paint(m: MLMap) {
    // The layers being present is what matters. isStyleLoaded() also waits for
    // every tile source, so on a busy map (relief, imagery) it can stay false
    // for seconds and a change — the control layer arriving, a slider moved —
    // would be skipped until the next render.
    if (!m.getLayer('terr-fill') || !m.getLayer('ctl-fill')) return;
    const vis = (id: string, on: boolean) => m.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none');
    vis('terr-fill', layers.territories); vis('terr-line', layers.territories);
    // Myanmar's townships answer the same question as the control layer, so
    // they follow the same switch. The two named sites are impact, not
    // control, and follow the impact switch instead.
    for (const id of mmrMod?.mmrLayerIds() ?? []) if (m.getLayer(id)) vis(id, layers.territories);
    for (const id of mmrMod?.MMR_SITE_LAYERS ?? []) if (m.getLayer(id)) vis(id, layers.links);
    vis('contact-line', layers.fronts);
    vis('frontline-case', layers.sourceline);
    vis('frontline-line', layers.sourceline);
    vis('attack-pt', layers.attacks);
    vis('place-pt', layers.fronts);
    if (m.getLayer('place-label')) vis('place-label', layers.fronts);
    vis('conflict-pt', layers.conflicts);
    vis('terr-sel', layers.territories);
    for (const id of ['ctl-fill', 'ctl-line', 'ctl-adv', 'ctl-adv-line', 'ctl-inf', 'ctl-inf-line', 'ctl-pre', 'chg-gain', 'chg-gain-line', 'chg-lost', 'chg-lost-line']) vis(id, layers.territories);
    // Where labelled polygons are on the map, the oblast-level tint for
    // Ukraine would only paint the same claim twice, more coarsely.
    const ctlReady = useStore.getState().control.status === 'ready';
    vis('yem-dist', layers.borders);
    if (m.getLayer('yem-dist-label')) vis('yem-dist-label', layers.borders);
    vis('yem-site', layers.fronts);
    if (m.getLayer('yem-site-label')) vis('yem-site-label', layers.fronts);
    const kindFilter = layers.routes && layers.energy ? null : layers.routes ? ['!=', ['get', 'kind'], 'pipeline'] : ['==', ['get', 'kind'], 'pipeline'];
    for (const [id, computed] of [['route-line', true], ['route-drawn', false]] as const) {
      vis(id, layers.routes || layers.energy);
      const own = computed ? ['==', ['get', 'computed'], true] : ['!=', ['get', 'computed'], true];
      m.setFilter(id, (kindFilter ? ['all', own, kindFilter] : own) as never);
    }
    vis('choke-pt', layers.chokepoints);
    for (const id of ['month-line', 'cmp-a', 'cmp-b', 'diff-band']) vis(id, layers.sourceline);
    m.setFilter('terr-sel', ['==', ['get', 'region'], selRegionRef.current ?? '__none']);
    // The bundled base draws only where nothing better loaded. Over a vector
    // style its urban fill and second set of names only muddy the map; over
    // imagery, which has no names of its own, its labels stay.
    const k = baseKind.current;
    setBaseDetailVisible(m, k === 'bundled');
    if (k === 'imagery' && mapStyle === 'satellite') {
      for (const id of ['ne-places-dot', 'ne-places-label', 'ne-towns-label']) if (m.getLayer(id)) m.setLayoutProperty(id, 'visibility', 'visible');
    }
    m.setPaintProperty('terr-fill', 'fill-opacity', fillOpacity(layerOpacity.territories, ctlReady));
    m.setPaintProperty('ctl-fill', 'fill-opacity', ['interpolate', ['linear'], ['zoom'], 4, 0.42 * layerOpacity.territories, 8, 0.34 * layerOpacity.territories, 12, 0.24 * layerOpacity.territories]);
    m.setPaintProperty('terr-line', 'line-opacity', 0.9 * layerOpacity.territories);
    m.setPaintProperty('contact-line', 'line-opacity', 0.95 * layerOpacity.fronts);
    m.setPaintProperty('frontline-case', 'line-opacity', 0.9 * layerOpacity.sourceline);
    m.setPaintProperty('frontline-line', 'line-opacity', 0.97 * layerOpacity.sourceline);
    m.setPaintProperty('attack-pt', 'circle-opacity', 0.95 * layerOpacity.attacks);

    // The base map's own labels: thinned rather than switched off, so the map
    // keeps its geography while the conflict layer stays the loudest thing.
    const min = LABEL_MIN_ZOOM[labelDensity as LabelDensity];
    for (const l of m.getStyle().layers ?? []) {
      if (l.type !== 'symbol' || l.id.startsWith('place-')) continue;
      m.setLayoutProperty(l.id, 'visibility', m.getZoom() >= min ? 'visible' : 'none');
    }
  }

  // ── Data that depends on the year or language ────────────────────────────
  useEffect(() => {
    const m = map.current;
    // Sources present is enough to swap their data; waiting for every tile to
    // load would drop a year change made while the map is still drawing.
    if (!m || !m.getSource('terr')) return;
    (m.getSource('terr') as maplibregl.GeoJSONSource | undefined)?.setData(territoryFC(year) as never);
    (m.getSource('contact') as maplibregl.GeoJSONSource | undefined)?.setData(contactFC(year, undefined, hideContact) as never);
    (m.getSource('frontline') as maplibregl.GeoJSONSource | undefined)?.setData(frontlineFC(frontline.set) as never);
    (m.getSource('belligerent') as maplibregl.GeoJSONSource | undefined)?.setData(belligerentFC(viewBounds(m), world.current, conflictRef.current) as never);
    (m.getSource('attacks') as maplibregl.GeoJSONSource | undefined)?.setData(attackFC(year) as never);
    (m.getSource('places') as maplibregl.GeoJSONSource | undefined)?.setData(placeFC(year) as never);
    (m.getSource('conflicts') as maplibregl.GeoJSONSource | undefined)?.setData(conflictFC(year, lang, SNAPSHOT_YEAR) as never);
  }, [year, lang, worldReady, conflictId, layers.sourceline]);

  // The comparison and the month series, whenever either changes. A change
  // can land while a style is still loading; then it is applied at idle, so
  // a finished comparison is never left undrawn.
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    if (m.getSource('cmp')) { pushHistory(m); paint(m); return; }
    const retry = () => { pushHistory(m); paint(m); };
    m.once('idle', retry);
    return () => { m.off('idle', retry); };
  }, [cmpState, monthState, control, controlChange]);

  // Frame an area someone asked for, leaving room for the floating panels.
  useEffect(() => {
    const m = map.current;
    if (!m || !frame) return;
    const st = useStore.getState();
    const w = m.getContainer().clientWidth;
    const ins = panelInsets(w, { leftFolded: st.leftCollapsed, rightFolded: st.rightCollapsed, expanded: panelExpanded(st) });
    const [west, south, east, north] = frame.bbox;
    moving.current = false;
    m.fitBounds([[west, south], [east, north]], {
      padding: { top: 70, bottom: 70, left: ins.left + 40, right: ins.right + 40 },
      maxZoom: 11, duration: 900,
    });
  }, [frame]);

  // An attack chosen from anywhere (a list, the timeline, the globe) is
  // brought into view, at a zoom that does not claim more precision than the
  // record has. The move ends in moveend, which stores the view, so switching
  // back to the globe lands on the same place.
  const attackId = sel?.kind === 'attack' ? sel.id : null;
  useEffect(() => {
    const m = map.current;
    const a = attackId ? ATTACK[attackId] : null;
    if (!m || !a) return;
    const zoom = a.precision === 'exact' ? 11 : a.precision === 'district' ? 9.5 : a.precision === 'city' ? 8.5 : a.precision === 'offshore' ? 7 : 5.5;
    const st = useStore.getState();
    const ins = panelInsets(m.getContainer().clientWidth, { leftFolded: st.leftCollapsed, rightFolded: st.rightCollapsed, expanded: panelExpanded(st) });
    m.easeTo({ center: [a.at[1], a.at[0]], zoom,
      padding: { top: 70, bottom: 70, left: ins.left + 40, right: ins.right + 40 }, duration: 900 });
  }, [attackId]);

  // Visibility is reapplied after every render, but a render can land while
  // MapLibre is mid-style-update, and paint bails out in that case. Without a
  // retry the bail-out is permanent until something else triggers a render:
  // switching a control layer off and straight back on left it hidden, because
  // the second paint arrived during the style update the first one caused.
  // Waiting for idle costs nothing when the style is already loaded.
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    paint(m);
    if (m.isStyleLoaded()) return;
    let done = false;
    const retry = () => { if (!done) { done = true; paint(m); } };
    m.once('idle', retry);
    return () => { done = true; m.off('idle', retry); };
  });

  // ── Style switching, keeping position and overlays ───────────────────────
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    let cancelled = false;
    const def = MAP_STYLES[mapStyle as MapStyleId];
    const apply = (doc: object, kind: BaseKind) => {
      if (cancelled) return;
      baseKind.current = kind;
      setBase(kind);
      m.once('styledata', () => { if (!cancelled) { addOverlays(m); paint(m); } });
      m.setStyle(doc as never);
    };
    setBaseFailed(false);
    if (def.state === 'live' && def.url) {
      void loadStyle(def.url).then((doc) => {
        if (cancelled) return;
        if (doc) apply(withRelief(enhanceStyle(doc, def.id), def.relief ?? 0), 'vector');
        else { setBaseFailed(true); apply(fallbackStyle(), 'bundled'); }
      });
    } else if (mapStyle === 'hybrid') {
      // Names and roads come from the terrain style's vector tiles; if that
      // cannot be reached the imagery still shows, with the bundled names.
      void loadStyle(MAP_STYLES.terrain.url!).then((doc) => {
        if (cancelled) return;
        apply(adapterStyle('hybrid', doc as never) ?? fallbackStyle(), 'imagery');
      });
    } else {
      apply(adapterStyle(mapStyle as MapStyleId) ?? fallbackStyle(), 'imagery');
    }
    return () => { cancelled = true; };
  }, [mapStyle]);

  // ── Camera, shared with the globe ────────────────────────────────────────
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const c = m.getCenter();
    if (Math.abs(c.lat - mapView.lat) < 1e-6 && Math.abs(c.lng - mapView.lng) < 1e-6 && Math.abs(m.getZoom() - mapView.zoom) < 1e-6) return;
    moving.current = true;
    m.jumpTo({ center: [mapView.lng, mapView.lat], zoom: mapView.zoom });
    moving.current = false;
  }, [mapView]);

  const def = MAP_STYLES[mapStyle as MapStyleId];
  const imagery = def.state === 'imagery' ? imageryProvider() : null;
  // Credit the district data only while it can actually be on screen.
  const inYemen = mapView.zoom >= 5.5 && mapView.lng > 40 && mapView.lng < 56 && mapView.lat > 10 && mapView.lat < 20;
  if (!canRender.current) {
    return (
      <div className="mappane">
        <div className="mapnotice static">
          <b>{t('mm_noWebgl2Title')}</b>
          <p>{t('mm_noWebgl2')}</p>
        </div>
      </div>
    );
  }
  return (
    <div className={`mappane${shown ? ' shown' : ''}`}>
      <div ref={host} className="maproot" />
      {baseFailed && (
        <div className="mapnotice">
          <b>{t(`ms_${mapStyle}` as 'ms_satellite')}</b>
          <p>{t('ms_offline')}</p>
        </div>
      )}
      {/* Imagery says when it was taken, every time it is on screen: on a war
          map a satellite picture is read as current unless it says otherwise. */}
      {imagery && (
        <div className={`imgbadge${imagery.commercial ? '' : ' nc'}`} role="note">
          <b>{imagery.name}</b>
          <span>{t('img_captured')}: {imagery.captured[lang === 'no' ? 0 : 1]} · {imagery.resolution[lang === 'no' ? 0 : 1]}</span>
          {!imagery.commercial && <span className="nc-note">{t('img_noncommercial')}</span>}
        </div>
      )}
      {/* Every source actually on the map is credited, and nothing that is not. */}
      <p className="mapattr" tabIndex={0}>
        {base === 'bundled' || mapStyle === 'satellite' ? DETAIL_META.attribution : ''}
        {base !== 'bundled' && def.attribution ? `${mapStyle === 'satellite' ? ' \u00b7 ' : ''}${def.attribution}` : ''}
        {imagery ? ` \u00b7 ${imagery.attribution}` : ''}
        {base === 'vector' && (def.relief ?? 0) > 0 ? ` \u00b7 ${DEM.attribution}` : ''}
        {control.status === 'ready' && control.layer.source === 'isw' ? ` \u00b7 ${t('ctl_iswCredit')}` : ''}
        {control.status === 'ready' && control.layer.source === 'ocha-hnrp' ? ' \u00b7 UN OCHA (HNRP 2026)' : ''}
        {layers.borders && inYemen ? ` \u00b7 ${(districts as { meta: { attribution: string } }).meta.attribution}` : ''}
      </p>
    </div>
  );
}

export { altitudeToZoom, zoomToAltitude };
