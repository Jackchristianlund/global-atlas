import * as maplibregl from 'maplibre-gl';
import type { Map as MLMap } from 'maplibre-gl';
import { MMR_FILLED, MMR_OUTLINED, layerFC, layersOf, mmrSitePoints, township, townshipMeshFC } from '../lib/mmr';
import { MMR_SITES } from '../data/mmr';
import type { Lang } from '../types';

/**
 * Myanmar's township layers on the detail map.
 *
 * Two things make this different from every other control layer in the atlas,
 * and both are deliberate.
 *
 * It does not fade out as the reader zooms in. The oblast and governorate fills
 * elsewhere do, because a whole oblast painted one colour is a regional summary
 * that a front line running through it visibly contradicts. A township is small
 * enough to be the unit the sources actually assign, so going closer does not
 * make the claim weaker.
 *
 * Fills and outlines mean different things. A fill says someone administers
 * these townships. A dashed outline says the state has declared a legal status
 * over them — which, in the martial-law case, in places marks ground the army
 * has lost. Styling the two alike would collapse that distinction, so the
 * stylesheet keeps them apart and the popup spells it out on click.
 */

const MESH = 'mmr-mesh';
const fillId = (id: string) => `mmr-f-${id}`;
const edgeId = (id: string) => `mmr-e-${id}`;
const dashId = (id: string) => `mmr-d-${id}`;

/** Every layer this module owns, for visibility switching. */
export function mmrLayerIds(): string[] {
  return [
    'mmr-mesh-line',
    ...MMR_FILLED.flatMap((l) => [fillId(l.id), edgeId(l.id)]),
    ...MMR_OUTLINED.map((l) => dashId(l.id)),
  ];
}

export const MMR_SITE_LAYERS = ['mmr-site-pt', 'mmr-site-label'];

export function addMmrLayers(m: MLMap): void {
  const src = (id: string, data: unknown) => {
    if (!m.getSource(id)) m.addSource(id, { type: 'geojson', data: data as never });
  };
  const add = (spec: Parameters<MLMap['addLayer']>[0]) => {
    if (!m.getLayer(spec.id)) m.addLayer(spec);
  };

  src(MESH, townshipMeshFC());
  for (const l of [...MMR_FILLED, ...MMR_OUTLINED]) src(`mmr-l-${l.id}`, layerFC(l));
  src('mmr-sites', {
    type: 'FeatureCollection',
    features: mmrSitePoints().map((p) => {
      const site = MMR_SITES.find((s) => s.id === p.id);
      return {
        type: 'Feature',
        properties: { id: p.id, no: site?.name[0] ?? p.id, en: site?.name[1] ?? p.id },
        geometry: { type: 'Point', coordinates: p.at },
      };
    }),
  });

  // The administrative mesh. Held back until the reader is close enough for a
  // township to be a shape rather than a speck, or the country turns to gauze.
  add({
    id: 'mmr-mesh-line', type: 'line', source: MESH,
    paint: {
      'line-color': '#9FB3CC',
      'line-width': ['interpolate', ['linear'], ['zoom'], 5, 0.3, 8, 0.6, 11, 1],
      'line-opacity': ['interpolate', ['linear'], ['zoom'], 4.2, 0, 5.5, 0.22, 8, 0.4],
    },
  });

  for (const l of MMR_FILLED) {
    add({
      id: fillId(l.id), type: 'fill', source: `mmr-l-${l.id}`,
      paint: {
        'fill-color': l.color,
        // Unlike the oblast fills, this does not fade away: the unit is the one
        // the sources assign, so the closer view is still the sourced claim.
        'fill-opacity': ['interpolate', ['linear'], ['zoom'], 3, 0.5, 6, 0.42, 9, 0.32, 12, 0.26],
      },
    });
    add({
      id: edgeId(l.id), type: 'line', source: `mmr-l-${l.id}`,
      paint: { 'line-color': l.color, 'line-width': ['interpolate', ['linear'], ['zoom'], 4, 0.8, 10, 2], 'line-opacity': 0.95 },
    });
  }

  // Dashed, and never filled: a decree is not a colour on the ground.
  for (const l of MMR_OUTLINED) {
    add({
      id: dashId(l.id), type: 'line', source: `mmr-l-${l.id}`,
      layout: { 'line-cap': 'butt', 'line-join': 'round' },
      paint: {
        'line-color': l.color,
        'line-width': ['interpolate', ['linear'], ['zoom'], 4, 1.2, 10, 2.6],
        'line-dasharray': [2.5, 2],
        'line-opacity': 0.9,
      },
    });
  }

  add({
    id: 'mmr-site-pt', type: 'circle', source: 'mmr-sites',
    paint: {
      'circle-color': '#FFD678',
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 4, 4.5, 10, 8],
      'circle-stroke-color': 'rgba(7,11,20,.85)', 'circle-stroke-width': 1.5, 'circle-opacity': 0.95,
    },
  });
}

/** Site labels need the style's glyphs, so they are added only when those exist. */
export function addMmrSiteLabels(m: MLMap, lang: Lang): void {
  if (!m.getStyle().glyphs || m.getLayer('mmr-site-label')) return;
  m.addLayer({
    id: 'mmr-site-label', type: 'symbol', source: 'mmr-sites',
    layout: {
      'text-field': ['get', lang === 'no' ? 'no' : 'en'],
      'text-size': 11, 'text-offset': [0, 1.2], 'text-anchor': 'top', 'text-font': ['Noto Sans Regular'],
    },
    paint: { 'text-color': '#FFE7B0', 'text-halo-color': 'rgba(7,11,20,.9)', 'text-halo-width': 1.4 },
  });
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * What a township carries, in words, on click.
 *
 * A township with no layer is the common case and gets an answer of its own:
 * the atlas has no sourced assignment for it. Saying so is the whole point —
 * an empty popup would read as an empty map.
 */
export function mmrPopupHtml(name: string, state: string, lang: Lang): string {
  const i = lang === 'no' ? 0 : 1;
  const ls = layersOf(name);
  const head = `<div class="mmr-pop"><b>${esc(name)}</b><span>${esc(state)}</span>`;
  if (!ls.length) {
    const none = lang === 'no'
      ? 'Ingen kildebelagt vurdering av hvem som styrer denne townshipen i datasettet.'
      : 'No sourced assessment of who administers this township in this dataset.';
    return `${head}<p class="mmr-none">${esc(none)}</p></div>`;
  }
  const rows = ls
    .map(
      (l) =>
        `<p><i style="background:${esc(l.color)}"></i><b>${esc(l.name[i])}</b><br>${esc(l.means[i])}` +
        `<br><em>${esc(lang === 'no' ? 'Gjelder' : 'As of')} ${esc(l.d)}</em></p>`,
    )
    .join('');
  return `${head}${rows}</div>`;
}

/** Binds the click popup. Call once per map. */
export function bindMmrPopup(m: MLMap, lang: () => Lang): void {
  const targets = [...MMR_FILLED.map((l) => fillId(l.id)), 'mmr-mesh-line'];
  for (const id of targets) {
    if (!m.getLayer(id)) continue;
    m.on('click', id, (e) => {
      const f = e.features?.[0];
      const n = f?.properties?.n as string | undefined;
      const st = f?.properties?.st as string | undefined;
      if (!n || !st) return;
      new maplibregl.Popup({ closeButton: true, maxWidth: '280px', className: 'mmr-popup' })
        .setLngLat(e.lngLat)
        .setHTML(mmrPopupHtml(n, st, lang()))
        .addTo(m);
    });
  }
  m.on('click', 'mmr-site-pt', (e) => {
    const id = e.features?.[0]?.properties?.id as string | undefined;
    const site = MMR_SITES.find((s) => s.id === id);
    if (!site) return;
    const i = lang() === 'no' ? 0 : 1;
    new maplibregl.Popup({ closeButton: true, maxWidth: '320px', className: 'mmr-popup' })
      .setLngLat(township(site.township).at)
      .setHTML(
        `<div class="mmr-pop"><b>${esc(site.name[i])}</b><span>${esc(site.township)}</span>` +
        `<p>${esc(site.what[i])}</p></div>`,
      )
      .addTo(m);
  });
}
