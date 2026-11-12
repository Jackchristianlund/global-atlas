/**
 * Myanmar's township layer, resolved against the boundary data.
 *
 * The rule enforced here: a township name in src/data/mmr.ts must resolve to
 * exactly one polygon. Two Myanmar township names occur twice (Htantabin in
 * Yangon and Bago, Minhla in Bago and Magway), so a name lookup that quietly
 * took the first match could put a layer in the wrong half of the country.
 * `township()` throws on a miss and on an ambiguity instead of guessing, and a
 * test walks every name in every layer through it.
 */
import pack from '../data/mmr/townships.json';
import { MMR_LAYERS, MMR_SITES, type MmrLayer } from '../data/mmr';

export interface Township {
  name: string;
  state: string;
  /** [lon, lat] of the area-weighted centroid of the largest ring. */
  at: [number, number];
  /** Polygons, each an array of rings, each a closed ring of [lon, lat] pairs. */
  polys: number[][][][];
}

export const MMR_META = pack.meta;
export const MMR_STATES: readonly string[] = pack.states;
export const MMR_BBOX = pack.meta.bbox as [number, number, number, number];
/** Township names that occur more than once in the boundary data. */
export const MMR_AMBIGUOUS: readonly string[] = pack.meta.ambiguous;

const BY_NAME = new Map<string, Township[]>();
for (const t of pack.t) {
  const row: Township = {
    name: t.n,
    state: pack.states[t.s],
    at: [t.c[0], t.c[1]],
    polys: t.g as number[][][][],
  };
  const list = BY_NAME.get(t.n);
  if (list) list.push(row);
  else BY_NAME.set(t.n, [row]);
}

export const MMR_TOWNSHIP_COUNT = pack.t.length;

/** All townships, in boundary-data order. */
export function townships(): Township[] {
  return [...BY_NAME.values()].flat();
}

/**
 * The one township with this name.
 *
 * @throws if no township carries the name, or if more than one does. An
 * ambiguous name has to be disambiguated by its state, not by position in the
 * file, because the two Myanmar duplicates sit hundreds of kilometres apart.
 */
export function township(name: string, state?: string): Township {
  const list = BY_NAME.get(name);
  if (!list) throw new Error(`no Myanmar township named ${name}`);
  if (state) {
    const hit = list.filter((t) => t.state === state);
    if (hit.length !== 1) throw new Error(`${name} in ${state}: ${hit.length} matches`);
    return hit[0];
  }
  if (list.length > 1)
    throw new Error(`${name} is ambiguous (${list.map((t) => t.state).join(', ')}); pass a state`);
  return list[0];
}

type Poly = { type: 'Polygon'; coordinates: number[][][] };
type Feat<P> = { type: 'Feature'; properties: P; geometry: Poly };
type FC<P> = { type: 'FeatureCollection'; features: Feat<P>[] };

const polyFeatures = <P>(t: Township, props: P): Feat<P>[] =>
  t.polys.map((rings) => ({ type: 'Feature', properties: props, geometry: { type: 'Polygon', coordinates: rings } }));

/** Every township, for the faint administrative mesh under the layers. */
export function townshipMeshFC(): FC<{ n: string; st: string }> {
  return {
    type: 'FeatureCollection',
    features: townships().flatMap((t) => polyFeatures(t, { n: t.name, st: t.state })),
  };
}

/** One layer's townships, carrying the layer id so the map can style and query them. */
export function layerFC(layer: MmrLayer): FC<{ layer: string; n: string; st: string }> {
  return {
    type: 'FeatureCollection',
    features: layer.townships.flatMap((name) => {
      const t = township(name);
      return polyFeatures(t, { layer: layer.id, n: t.name, st: t.state });
    }),
  };
}

/** The filled layers, bottom to top: autonomy under the administration it predates. */
export const MMR_FILLED = MMR_LAYERS.filter((l) => l.fill);
/** The outline-only layers, which assert a legal status rather than control. */
export const MMR_OUTLINED = MMR_LAYERS.filter((l) => !l.fill);

/** Which layers name a township, for a click on the map. */
export function layersOf(name: string): MmrLayer[] {
  return MMR_LAYERS.filter((l) => l.townships.includes(name));
}

/** How many townships carry at least one layer, against the 330 total. */
export function mmrCovered(): number {
  return new Set(MMR_LAYERS.flatMap((l) => l.townships)).size;
}

/** Site markers, placed on the centroid of the township the source names. */
export function mmrSitePoints(): { id: string; at: [number, number]; township: string }[] {
  return MMR_SITES.map((s) => ({ id: s.id, at: township(s.township).at, township: s.township }));
}
