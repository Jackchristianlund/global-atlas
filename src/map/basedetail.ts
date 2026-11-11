/**
 * The bundled base map.
 *
 * A published artifact cannot reach any external host — not a tile server, not
 * anything — so a live basemap is not available there however the styles are
 * configured. Rather than show a void under the conflict layers, the atlas
 * carries its own base detail: Natural Earth 10m, public domain, clipped to
 * the regions it covers and simplified to what its zoom range can resolve.
 *
 * This is highway and settlement scale. It is honest orientation — where the
 * cities are, which roads join them, where the built-up land is — not street
 * level, and the interface says so rather than implying otherwise.
 */
import pack from '../data/detail/pack.json';
import { PLACES } from '../data/territory';

interface Pack {
  meta: { source: string; licence: string; attribution: string; scale: string; built: string };
  roads: unknown;
  towns: unknown;
  rail: unknown;
  urban: unknown;
  places: unknown;
}

const P = pack as unknown as Pack;

export const DETAIL_META = P.meta;

type MLMap = import('maplibre-gl').Map;

/**
 * The settlement layer minus anything the atlas already labels itself.
 *
 * The curated places carry control records and sourced notes; the bundled
 * settlements carry only a name. Drawing both puts the same town on the map
 * twice, one label above the other, which looks like a bug and reads like one.
 */
let townsCache: unknown;
function townsWithoutDuplicates(): unknown {
  if (townsCache) return townsCache;
  const own = new Set(PLACES.map((p) => p.name.toLowerCase()));
  const fc = P.towns as { type: string; features: { properties: { n: string } }[] };
  townsCache = { type: 'FeatureCollection', features: fc.features.filter((f) => !own.has(f.properties.n.toLowerCase())) };
  return townsCache;
}

/**
 * Installs the base detail. Everything here goes in before the conflict
 * layers, so control, contact lines and the front line always sit on top: the
 * base orients, it never competes.
 */
export function addBaseDetail(m: MLMap): void {
  const src = (id: string, data: unknown) => {
    if (!m.getSource(id)) m.addSource(id, { type: 'geojson', data: data as never });
  };
  src('ne-urban', P.urban);
  src('ne-rail', P.rail);
  src('ne-roads', P.roads);
  src('ne-places', P.places);
  src('ne-towns', townsWithoutDuplicates());

  const add = (spec: Parameters<MLMap['addLayer']>[0]) => { if (!m.getLayer(spec.id)) m.addLayer(spec); };

  add({
    id: 'ne-urban-fill', type: 'fill', source: 'ne-urban',
    paint: { 'fill-color': '#273755', 'fill-opacity': ['interpolate', ['linear'], ['zoom'], 4, 0.45, 8, 0.9] },
  });
  add({
    id: 'ne-rail-line', type: 'line', source: 'ne-rail',
    minzoom: 6,
    paint: {
      'line-color': '#394B63',
      'line-width': ['interpolate', ['linear'], ['zoom'], 6, 0.35, 11, 1],
      'line-dasharray': [3, 2],
      'line-opacity': 0.55,
    },
  });
  // Casing under the road so it reads over both the urban fill and open land.
  add({
    id: 'ne-roads-case', type: 'line', source: 'ne-roads',
    minzoom: 4,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': '#0A1120',
      'line-width': ['interpolate', ['linear'], ['zoom'], 4, 1.6, 11, ['match', ['get', 'k'], 1, 7, 2, 5, 3.4]],
      'line-opacity': 0.8,
    },
  });
  add({
    id: 'ne-roads-line', type: 'line', source: 'ne-roads',
    minzoom: 4,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': ['match', ['get', 'k'], 1, '#9FB6D6', 2, '#7C90AE', '#63748C'],
      'line-width': ['interpolate', ['linear'], ['zoom'], 4, 0.6, 11, ['match', ['get', 'k'], 1, 4.2, 2, 2.8, 1.8]],
      'line-opacity': ['interpolate', ['linear'], ['zoom'], 4, 0.7, 7, 1],
    },
  });
  // The small settlements. They arrive only once there is room for them, and
  // they sit under the ranked places so a city is never hidden by a village.
  add({
    id: 'ne-towns-dot', type: 'circle', source: 'ne-towns',
    minzoom: 7.4,
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 7.4, 1.1, 11, 2.6],
      'circle-color': '#8FA3BC',
      'circle-stroke-color': '#0A1120',
      'circle-stroke-width': 0.8,
      'circle-opacity': ['interpolate', ['linear'], ['zoom'], 7.4, 0.5, 9, 0.9],
    },
  });
  add({
    id: 'ne-places-dot', type: 'circle', source: 'ne-places',
    minzoom: 4,
    // Bigger places appear first and stay bigger; the threshold drops as the
    // reader goes in, so a village shows up only when there is room for it.
    filter: ['>=', ['get', 'pop'], 0],
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 4, ['case', ['>=', ['get', 'pop'], 500000], 2.6, 1.3], 10, ['case', ['>=', ['get', 'pop'], 500000], 5, 3]],
      'circle-color': '#C3D2E6',
      'circle-stroke-color': '#0A1120',
      'circle-stroke-width': 1,
      'circle-opacity': 0.9,
    },
  });
}

/** Settlement labels, added after the conflict layers so nothing buries them. */
export function addBaseLabels(m: MLMap, glyphsAvailable: boolean): void {
  if (!glyphsAvailable || m.getLayer('ne-places-label')) return;
  // Village names last, so they yield to every city name in a collision.
  m.addLayer({
    id: 'ne-towns-label', type: 'symbol', source: 'ne-towns',
    minzoom: 8.4,
    layout: {
      'text-field': ['get', 'n'],
      'text-font': ['Noto Sans Regular'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 8.4, 9.5, 11, 12],
      'text-offset': [0, 0.8],
      'text-anchor': 'top',
      'text-allow-overlap': false,
      'text-padding': 3,
    },
    paint: { 'text-color': '#A9BCD4', 'text-halo-color': '#060B14', 'text-halo-width': 1.4 },
  });
  m.addLayer({
    id: 'ne-places-label', type: 'symbol', source: 'ne-places',
    minzoom: 5,
    layout: {
      'text-field': ['get', 'n'],
      'text-font': ['Noto Sans Bold'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 5, 10.5, 11, 15],
      'text-offset': [0, 0.9],
      'text-anchor': 'top',
      'text-allow-overlap': false,
      // Rank by population so the big places win the collision fight.
      'symbol-sort-key': ['-', 0, ['get', 'pop']],
    },
    paint: {
      'text-color': '#DCE7F5',
      'text-halo-color': '#060B14',
      'text-halo-width': 1.6,
    },
  });
}

/** Zoom below which the base detail says nothing useful. */
export const DETAIL_MIN_ZOOM = 4;

/** Keeps the base visible or not, as one unit. */
export function setBaseDetailVisible(m: MLMap, on: boolean): void {
  for (const id of ['ne-urban-fill', 'ne-rail-line', 'ne-roads-case', 'ne-roads-line', 'ne-towns-dot', 'ne-places-dot', 'ne-towns-label', 'ne-places-label']) {
    if (m.getLayer(id)) m.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none');
  }
}
