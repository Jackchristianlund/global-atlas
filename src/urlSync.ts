import { ACTOR, PLACES } from './data/territory';
import { CHOKEPOINT, CONFLICT, COUNTRY_CODES, ORG, ROUTE, SITE } from './data';
import { ATTACK } from './lib/attacks';
import { FLOWS } from './data/displacement';
import { territoryById } from './lib/territory';
import { FIRST_YEAR, SNAPSHOT_YEAR, useStore } from './store';
import { LAYER_IDS, decodeState, encodeState, type UrlState } from './lib/urlState';
import type { LayerId, Selection } from './types';

/** Whether a selection in a link points at something this build has. */
export function knownSelection(sel: NonNullable<Selection>): boolean {
  switch (sel.kind) {
    case 'conflict': return !!CONFLICT[sel.id];
    case 'country': return COUNTRY_CODES.includes(sel.id);
    case 'chokepoint': return !!CHOKEPOINT[sel.id];
    case 'route': return !!ROUTE[sel.id];
    case 'site': return !!SITE[sel.id];
    case 'org': return !!ORG[sel.id];
    case 'territory': return !!territoryById(sel.id);
    case 'actor': return !!ACTOR[sel.id];
    case 'flow': return FLOWS.some((f) => f.id === sel.id);
    case 'attack': return !!ATTACK[sel.id];
    case 'place': return PLACES.some((p) => p.id === sel.id);
  }
}

/** The shareable part of the current state. */
export function currentUrlState(): UrlState {
  const s = useStore.getState();
  const map = s.mapMode === 'map';
  return {
    view: s.view,
    mode: s.mapMode,
    center: map ? [s.mapView.lat, s.mapView.lng] : [s.globeView.lat, s.globeView.lng],
    zoom: map ? s.mapView.zoom : s.globeView.altitude,
    year: s.year,
    sel: s.sel ?? undefined,
    layers: LAYER_IDS.filter((l) => s.layers[l]),
    style: s.mapStyle,
    compare: s.frontCompare ?? undefined,
  };
}

/** A full link to the current view. */
export function shareUrl(): string {
  const { origin, pathname, search } = window.location;
  return `${origin}${pathname}${search}#${encodeState(currentUrlState())}`;
}

/**
 * Applies a link on load, then keeps the hash in step with the view. The
 * hash is replaced, not pushed: moving the camera should not fill the
 * browser's history with hundreds of entries.
 */
export function installUrlSync(): void {
  if (typeof window === 'undefined') return;
  const st = decodeState(window.location.hash, knownSelection, [FIRST_YEAR, SNAPSHOT_YEAR]);
  const s = useStore.getState();
  if (st.view) s.setView(st.view);
  if (st.layers) {
    const want = new Set<LayerId>(st.layers);
    for (const l of LAYER_IDS) if (useStore.getState().layers[l] !== want.has(l)) useStore.getState().toggleLayer(l);
  }
  if (st.year != null) s.setYear(st.year);
  if (st.style) s.setMapStyle(st.style);
  if (st.sel) s.select(st.sel);
  if (st.center && st.zoom != null) {
    const [lat, lng] = st.center;
    if (st.mode === 'map') {
      useStore.setState({ mapMode: 'map', mapView: { lat, lng, zoom: st.zoom } });
    } else {
      // The globe applies this once it is ready, after any selection has
      // moved the camera, so the link's own framing wins.
      useStore.setState({ globeView: { lat, lng, altitude: Math.min(8, Math.max(0.05, st.zoom)) }, linkedView: true });
    }
  }
  if (st.compare) s.setFrontCompare(st.compare, { frame: !st.center });

  let timer = 0;
  useStore.subscribe(() => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      const hash = encodeState(currentUrlState());
      if (window.location.hash.slice(1) !== hash) {
        try { window.history.replaceState(null, '', `#${hash}`); } catch { /* sandboxed frame: links just do not update */ }
      }
    }, 500);
  });
}
