import { CONFLICTS } from '../data/conflicts';
import { ATTACKS } from '../data/attacks';
import { ACTOR, PLACES } from '../data/territory';
import { CATEGORY_COLOR } from '../lib/attacks';
import { belligerentsInView, contactLines, territoryFeatures, unitFill } from '../lib/territory';
import type { CountryFeature } from '../data/countries';
import { frontlinePaths, type FrontlineSet } from '../lib/frontline';
import { STATUS_COLOR, displayStatus } from '../lib/selectors';
import type { Lang } from '../types';

/**
 * The map overlays, built from the same data the globe draws.
 *
 * This file contains no geometry of its own. Every polygon, line and point
 * here comes from the existing assessments, so a sharper base map underneath
 * changes how the ground looks and nothing about what is claimed on top of it.
 */
export interface FC {
  type: 'FeatureCollection';
  features: { type: 'Feature'; id?: string | number; geometry: unknown; properties: Record<string, unknown> }[];
}

const fc = (features: FC['features']): FC => ({ type: 'FeatureCollection', features });

/** Control polygons for a year, carrying their own colour and the panel's id. */
export function territoryFC(year: number, region?: string): FC {
  return fc(
    territoryFeatures(year)
      .filter((f) => !region || f.properties.region === region)
      .map((f) => ({
        type: 'Feature' as const,
        id: f.properties.id,
        geometry: f.geometry,
        properties: {
          id: f.properties.id,
          region: f.properties.region,
          name: f.properties.unitName,
          actor: f.properties.record.actor,
          status: f.properties.record.status,
          // The same fill the globe uses, so the two views agree at a glance.
          color: unitFill(f.properties.record, 1).replace(/,[^,]+\)$/, ',1)'),
          d: f.properties.record.d,
        },
      })),
  );
}

/**
 * Where the derived line of contact is not drawn.
 *
 * The derived line is the stretch of administrative border between two units
 * assessed as held by different actors. That is a fair summary where nothing
 * better exists, but it is a boundary, not a front:
 *
 * - **Yemen** has no continuous front line, and its governorate borders are
 *   not military lines. Drawing them as one would turn administrative
 *   geography into an invented front, so Yemen never gets the derived line.
 * - **Ukraine** has the sourced ISW/CTP line. Wherever that line is on the
 *   map for the year being shown, an oblast border painted the same way next
 *   to it would only compete with the real thing.
 */
export function derivedContactHidden(region: string, year: number, sourcedLineShown: boolean, sourcedYear: number): boolean {
  if (region === 'yemen') return true;
  if (region === 'ukraine' && sourcedLineShown && year === sourcedYear) return true;
  return false;
}

/** The derived line of contact, as line strings. */
export function contactFC(year: number, region?: string, hide?: (region: string) => boolean): FC {
  return fc(
    contactLines(year)
      .filter((c) => (!region || c.region === region) && !(hide && hide(c.region)))
      .map((c) => ({
        type: 'Feature' as const,
        id: c.id,
        geometry: { type: 'LineString', coordinates: c.coords.map(([lat, lng]) => [lng, lat]) },
        properties: { id: c.id, a: ACTOR[c.a]?.short ?? c.a, b: ACTOR[c.b]?.short ?? c.b, d: c.d },
      })),
  );
}

/**
 * The sourced front line, as GeoJSON for MapLibre. The geometry is already in
 * degrees and already in [lon, lat] order, so nothing is transformed here.
 */
export function frontlineFC(set: FrontlineSet): FC {
  return fc(
    frontlinePaths(set).map((seg) => ({
      type: 'Feature' as const,
      id: `fl:${seg.id}`,
      geometry: { type: 'LineString', coordinates: seg.coords },
      properties: { id: seg.id, d: seg.date, src: set.meta.source, tier: set.tier },
    })),
  );
}

/**
 * The states that are parties to the selected conflict, as a country-level
 * wash under everything else.
 *
 * Without it the map stops at the border: the occupied oblasts sit against
 * blank ground, and the reader cannot see which state the ground to the east
 * belongs to. It is drawn far more faintly than any control polygon, because
 * being a party to a war is a different claim from holding territory in one,
 * and the two must not read alike.
 */
export function belligerentFC(
  view: [number, number, number, number] | null,
  world: CountryFeature[],
  selectedConflict?: string | null,
): FC {
  if (!view || !world.length) return fc([]);
  const sides = belligerentsInView(view, 1, selectedConflict);
  if (!sides.size) return fc([]);
  return fc(
    world
      .filter((f) => sides.has(f.properties.iso))
      .map((f) => ({
        type: 'Feature' as const,
        id: `bel:${f.properties.iso}`,
        geometry: f.geometry,
        properties: { iso: f.properties.iso, color: sides.get(f.properties.iso) as string },
      })),
  );
}

/** Documented incidents up to a year. */
export function attackFC(year: number, region?: string): FC {
  const isos = region === 'ukraine' ? ['UKR'] : region === 'yemen' ? ['YEM'] : null;
  return fc(
    ATTACKS.filter((a) => Number(a.d.slice(0, 4)) <= year && (!isos || isos.includes(a.iso))).map((a) => ({
      type: 'Feature' as const,
      id: a.id,
      geometry: { type: 'Point', coordinates: [a.at[1], a.at[0]] },
      properties: {
        id: a.id, category: a.category, color: CATEGORY_COLOR[a.category],
        // Square for an approximate location, circle for an exact one: the
        // marker shape carries the precision the source actually gave.
        exact: a.precision === 'exact',
        d: a.d, verification: a.verification,
      },
    })),
  );
}

/** Cities and sites, with the label the current language uses. */
export function placeFC(year: number, region?: string): FC {
  return fc(
    PLACES.filter((p) => (!region || p.region === region) && p.d.slice(0, 4) <= String(year)).map((p) => ({
      type: 'Feature' as const,
      id: p.id,
      geometry: { type: 'Point', coordinates: [p.at[1], p.at[0]] },
      properties: {
        id: p.id, name: p.name,
        color: p.actor ? ACTOR[p.actor]?.color ?? '#EAF2FF' : '#EAF2FF',
      },
    })),
  );
}

/** Version 1 conflict markers, so the map keeps the globe's own signal. */
export function conflictFC(year: number, lang: Lang, snapshotYear: number): FC {
  return fc(
    CONFLICTS.filter((c) => Number(c.start.slice(0, 4)) <= year && (!c.end || Number(c.end.slice(0, 4)) >= year)).map((c) => {
      const st = displayStatus(c, year, snapshotYear);
      return {
        type: 'Feature' as const,
        id: c.id,
        geometry: { type: 'Point', coordinates: [c.at[1], c.at[0]] },
        properties: {
          id: c.id,
          name: c.name[lang === 'no' ? 0 : 1],
          color: STATUS_COLOR[st],
          status: st,
          tier: c.tier ?? 1,
        },
      };
    }),
  );
}

/**
 * How many of the base map's own labels to show.
 * The map carries its own place names; at full density they fight with the
 * conflict layer, so the control reduces them rather than hiding everything.
 */
export type LabelDensity = 'low' | 'normal' | 'high';

export const LABEL_MIN_ZOOM: Record<LabelDensity, number> = { low: 9, normal: 6, high: 0 };

// ── November 2026 phase: comparison, regional reference, shipping ────────

const line = (id: string, coords: number[][], props: Record<string, unknown>) =>
  ({ type: 'Feature' as const, id, geometry: { type: 'LineString', coordinates: coords }, properties: { id, ...props } });

/** [lat, lng] paths to GeoJSON [lng, lat] lines. */
const ll = (path: number[][]) => path.map(([lat, lng]) => [lng, lat]);

/**
 * Two dated front lines, as the source drew them, tagged by which side of the
 * comparison each belongs to.
 */
export function compareFC(a: number[][][] | null, b: number[][][] | null): FC {
  const out: FC['features'] = [];
  (a ?? []).forEach((seg, i) => out.push(line(`cmp-a-${i}`, ll(seg), { role: 'a' })));
  (b ?? []).forEach((seg, i) => out.push(line(`cmp-b-${i}`, ll(seg), { role: 'b' })));
  return fc(out);
}

/** The stretches where the two lines are further apart than the data resolves. */
export function diffFC(stretches: { path: number[][]; maxKm: number; of: 'a' | 'b' }[]): FC {
  return fc(stretches.map((s, i) => line(`diff-${i}`, ll(s.path), { of: s.of, km: Math.round(s.maxKm * 10) / 10 })));
}

/** One month of the published series, when it is being shown on its own. */
export function monthFC(segments: number[][][] | null): FC {
  return fc((segments ?? []).map((seg, i) => line(`month-${i}`, ll(seg), {})));
}

/** Yemen's district outlines: administrative reference, never control. */
export function districtFC(d: { lines: number[][][]; labels: { n: string; at: number[] }[] }): { lines: FC; labels: FC } {
  return {
    lines: fc([{ type: 'Feature', id: 'yem-districts', geometry: { type: 'MultiLineString', coordinates: d.lines }, properties: {} }]),
    labels: fc(d.labels.map((l, i) => ({ type: 'Feature' as const, id: `yd-${i}`, geometry: { type: 'Point', coordinates: l.at }, properties: { n: l.n } }))),
  };
}

/** Yemen's ports and cities, for orientation. */
export function sitesFC(sites: { id: string; name: string; at: [number, number]; kind: string }[]): FC {
  return fc(sites.map((s) => ({ type: 'Feature' as const, id: s.id, geometry: { type: 'Point', coordinates: [s.at[1], s.at[0]] }, properties: { id: s.id, name: s.name, kind: s.kind } })));
}

/** Shipping lanes and pipelines, drawn on the map as on the globe. */
export function routesFC(routes: { id: string; kind: string; pts: [number, number][]; computed: boolean }[]): FC {
  return fc(routes.map((r) => line(`rt-${r.id}`, r.pts.map(([lat, lng]) => [lng, lat]), { rid: r.id, kind: r.kind, computed: r.computed })));
}

/** Maritime chokepoints. */
export function chokepointFC(points: { id: string; name: string; at: [number, number] }[]): FC {
  return fc(points.map((p) => ({ type: 'Feature' as const, id: p.id, geometry: { type: 'Point', coordinates: [p.at[1], p.at[0]] }, properties: { id: p.id, name: p.name } })));
}
