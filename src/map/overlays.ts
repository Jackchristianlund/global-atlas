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

/** The derived line of contact, as line strings. */
export function contactFC(year: number, region?: string): FC {
  return fc(
    contactLines(year)
      .filter((c) => !region || c.region === region)
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
