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
import { MAP_STYLES, adapterStyle, altitudeToZoom, fallbackStyle, loadStyle, satelliteUrl, webgl2Available, zoomToAltitude, type MapStyleId } from './styles';
import { addBaseDetail, addBaseLabels, DETAIL_META } from './basedetail';
import { loadWorld, type CountryFeature } from '../data/countries';
import { resolveGlyphRequest } from './glyphs';
import { LABEL_MIN_ZOOM, attackFC, belligerentFC, conflictFC, contactFC, frontlineFC, placeFC, territoryFC, type LabelDensity } from './overlays';

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
function fillOpacity(scale: number): maplibregl.ExpressionSpecification {
  return ['interpolate', ['linear'], ['zoom'], 4, 0.45 * scale, 7, 0.3 * scale, 9, 0.12 * scale, 11, 0.06 * scale];
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

export default function RegionMap() {
  const host = useRef<HTMLDivElement>(null);
  const map = useRef<MLMap | null>(null);
  const moving = useRef(false);
  const [baseFailed, setBaseFailed] = useState(false);
  const bound = useRef(false);
  const { t, lang } = useT();
  const s = useStore();
  const { year, layers, layerOpacity, mapStyle, labelDensity, mapView, setMapView, select, frontline, sel } = s;
  // A conflict the reader picked: its sides show whatever the camera is doing.
  const conflictId = sel?.kind === 'conflict' ? sel.id : null;
  const conflictRef = useRef<string | null>(null);
  conflictRef.current = conflictId;

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

    m.on('moveend', () => {
      if (moving.current) return;
      const c = m.getCenter();
      setMapView({ lat: c.lat, lng: c.lng, zoom: m.getZoom() });
    });
    m.on('load', () => { addOverlays(m); paint(m); });
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

    // Country outlines arrive after the map; refresh the source when they do.
    let live = true;
    void loadWorld().then((w) => {
      if (!live) return;
      world.current = w;
      setWorldReady((n) => n + 1);
    });

    return () => {
      live = false;
      m.off('moveend', onMove);
      m.remove();
      map.current = null;
      // Drop the inspection handle too: holding a removed map keeps its canvas
      // and its WebGL context from being collected.
      (window as unknown as { __ga_map?: unknown }).__ga_map = undefined;
    };
    // Created once; everything else is applied by the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Sources and layers, in the order they must stack. */
  function addOverlays(m: MLMap) {
    // The bundled base goes in first, so every conflict layer added below
    // draws on top of it.
    addBaseDetail(m);

    const src = (id: string, data: unknown) => { if (!m.getSource(id)) m.addSource(id, { type: 'geojson', data: data as never }); };
    src('belligerent', belligerentFC(viewBounds(m), world.current, conflictRef.current));
    src('terr', territoryFC(year));
    src('contact', contactFC(year));
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
    // Settlement names go on after the conflict layers, so a city label is
    // never hidden under a control polygon.
    addBaseLabels(m, true);

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
    add({
      id: 'conflict-pt', type: 'circle', source: 'conflicts',
      paint: {
        'circle-color': ['get', 'color'],
        'circle-radius': ['interpolate', ['linear'], ['get', 'tier'], 1, 5, 4, 9],
        'circle-stroke-color': 'rgba(7,11,20,.85)', 'circle-stroke-width': 1.5,
      },
    });

    if (bound.current) return;
    bound.current = true;
    for (const [layer, kind] of [['attack-pt', 'attack'], ['place-pt', 'place'], ['conflict-pt', 'conflict'], ['terr-fill', 'territory']] as const) {
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
  function paint(m: MLMap) {
    if (!m.isStyleLoaded() || !m.getLayer('terr-fill')) return;
    const vis = (id: string, on: boolean) => m.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none');
    vis('terr-fill', layers.territories); vis('terr-line', layers.territories);
    vis('contact-line', layers.fronts);
    vis('frontline-case', layers.sourceline);
    vis('frontline-line', layers.sourceline);
    vis('attack-pt', layers.attacks);
    vis('place-pt', layers.fronts);
    if (m.getLayer('place-label')) vis('place-label', layers.fronts);
    vis('conflict-pt', layers.conflicts);
    m.setPaintProperty('terr-fill', 'fill-opacity', fillOpacity(layerOpacity.territories));
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
    if (!m || !m.isStyleLoaded()) return;
    (m.getSource('terr') as maplibregl.GeoJSONSource | undefined)?.setData(territoryFC(year) as never);
    (m.getSource('contact') as maplibregl.GeoJSONSource | undefined)?.setData(contactFC(year) as never);
    (m.getSource('frontline') as maplibregl.GeoJSONSource | undefined)?.setData(frontlineFC(frontline.set) as never);
    (m.getSource('belligerent') as maplibregl.GeoJSONSource | undefined)?.setData(belligerentFC(viewBounds(m), world.current, conflictRef.current) as never);
    (m.getSource('attacks') as maplibregl.GeoJSONSource | undefined)?.setData(attackFC(year) as never);
    (m.getSource('places') as maplibregl.GeoJSONSource | undefined)?.setData(placeFC(year) as never);
    (m.getSource('conflicts') as maplibregl.GeoJSONSource | undefined)?.setData(conflictFC(year, lang, SNAPSHOT_YEAR) as never);
  }, [year, lang, worldReady, conflictId]);

  useEffect(() => { const m = map.current; if (m) paint(m); });

  // ── Style switching, keeping position and overlays ───────────────────────
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    let cancelled = false;
    const def = MAP_STYLES[mapStyle as MapStyleId];
    const apply = (doc: object) => {
      if (cancelled) return;
      m.once('styledata', () => { if (!cancelled) { addOverlays(m); paint(m); } });
      m.setStyle(doc as never);
    };
    if (def.state === 'live' && def.url) {
      setBaseFailed(false);
      void loadStyle(def.url).then((doc) => {
        if (cancelled) return;
        if (doc) apply(doc);
        else { setBaseFailed(true); apply(fallbackStyle()); }
      });
    } else {
      const doc = adapterStyle(mapStyle as MapStyleId);
      // Nothing configured: keep the local base so the layers still read.
      apply(doc ?? fallbackStyle());
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
  const unavailable = def.state === 'needs_key' && !satelliteUrl();
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
    <div className="mappane">
      <div ref={host} className="maproot" />
      {(unavailable || baseFailed) && (
        <div className="mapnotice">
          <b>{t(`ms_${mapStyle}` as 'ms_satellite')}</b>
          <p>{unavailable ? def.needs?.[lang === 'no' ? 0 : 1] : t('ms_offline')}</p>
        </div>
      )}
      {/* The bundled base is always drawn, so it is always credited; a tile
          provider is credited on top of it only when its style actually loaded. */}
      <p className="mapattr">
        {DETAIL_META.attribution}
        {!baseFailed && def.attribution ? ` \u00b7 ${def.attribution}` : ''}
      </p>
    </div>
  );
}

export { altitudeToZoom, zoomToAltitude };
