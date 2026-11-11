/**
 * Joins the administrative geometry with the sourced control assignments.
 * A unit with no assignment is never drawn: absence of evidence is left blank
 * rather than coloured in.
 */
import { feature } from 'topojson-client';
import topo from '../data/admin1.topo.json';
import { ACTOR, BELLIGERENT, CONTROL, CONTROL_HISTORY, FRONTS, PLACES, REGIONS, type ControlRecord, type ControlStatus } from '../data/territory';
import type { Iso, L } from '../types';
import { centroid, type LatLng } from './geo';
import { SNAPSHOT_YEAR } from '../store';

interface UnitProps { iso: string; code: string; name: string; standalone?: boolean }

interface AdminUnit {
  iso: string;
  code: string;
  name: string;
  geometry: { type: string; coordinates: number[][][][] };
}

/**
 * The geometry is a topology, not a bag of polygons. Each border is stored once
 * as an arc that both neighbours reference, so neighbouring units agree on the
 * line between them — no hairline gaps — and the boundary between two
 * differently-held units can be read straight out of the data instead of being
 * drawn by hand.
 */
interface UnitTopology {
  type: 'Topology';
  arcs: [number, number][][];
  objects: { units: { type: 'GeometryCollection'; geometries: { arcs: unknown; properties: UnitProps }[] } };
}

const TOPO = topo as unknown as UnitTopology;

export interface TerritoryFeature {
  type: 'Feature';
  geometry: { type: string; coordinates: unknown };
  properties: {
    kind: 'territory';
    id: string;
    iso: Iso;
    code: string;
    unitName: string;
    record: ControlRecord;
    region: string;
    centroid: LatLng;
  };
}

const UNITS: AdminUnit[] = (feature(TOPO as never, TOPO.objects.units as never) as unknown as {
  features: { properties: UnitProps; geometry: { type: string; coordinates: unknown } }[];
}).features.map((f) => ({
  iso: f.properties.iso,
  code: f.properties.code,
  name: f.properties.name,
  // topojson emits Polygon for a single-ring unit. Everything downstream — the
  // globe, the centroid, the dashed outlines — treats a unit as a list of
  // polygons, so a bare Polygon is wrapped here rather than special-cased in
  // five other places.
  geometry: {
    type: 'MultiPolygon',
    coordinates: (f.geometry.type === 'Polygon'
      ? [f.geometry.coordinates]
      : f.geometry.coordinates) as number[][][][],
  },
}));

/** Arc index → the units that reference it, built once. */
const ARC_UNITS = (() => {
  const m = new Map<number, string[]>();
  for (const g of TOPO.objects.units.geometries) {
    const key = `${g.properties.iso}:${g.properties.code}`;
    const seen = new Set<number>();
    const walk = (a: unknown): void => {
      if (typeof a === 'number') seen.add(a < 0 ? ~a : a);
      else if (Array.isArray(a)) a.forEach(walk);
    };
    walk(g.arcs);
    for (const i of seen) {
      const l = m.get(i);
      if (l) l.push(key); else m.set(i, [key]);
    }
  }
  return m;
})();

/** Absolute positions of one arc, decoded from the topology. */
function arcLine(i: number): LatLng[] {
  const arc = TOPO.arcs[i];
  const out: LatLng[] = [];
  for (const [lng, lat] of arc) out.push([lat, lng]);
  return out;
}

/**
 * A stretch of border where the units on either side are held by different
 * actors, for the year asked for.
 *
 * This is derived from the control assessment, not surveyed. It follows
 * administrative borders because that is the resolution the assessments have;
 * it is not a line of contact mapped in the field, and the app says so wherever
 * it is shown. Where a unit's control is unassessed for that year, no line is
 * drawn against it: a boundary of a blank area is not a front.
 */
export interface ContactLine {
  id: string;
  coords: LatLng[];
  a: string;
  b: string;
  region: string;
  /** The older of the two assessments: the line is only as current as its weaker side. */
  d: string;
  s: string[];
}

const CONTACT_CACHE = new Map<number, ContactLine[]>();

export function contactLines(year = SNAPSHOT_YEAR): ContactLine[] {
  const hit = CONTACT_CACHE.get(year);
  if (hit) return hit;
  const out: ContactLine[] = [];
  for (const [arc, units] of ARC_UNITS) {
    if (units.length !== 2) continue;
    const [ka, kb] = units;
    const [ia, ca] = ka.split(':');
    const [ib, cb] = kb.split(':');
    const ra = controlAt(ia as Iso, ca, year);
    const rb = controlAt(ib as Iso, cb, year);
    if (!ra || !rb || ra.actor === rb.actor) continue;
    const coords = arcLine(arc);
    if (coords.length < 2) continue;
    out.push({
      id: `ct-${arc}`,
      coords,
      a: ra.actor,
      b: rb.actor,
      region: REGION_OF[ia] ?? REGION_OF[ib] ?? '',
      d: ra.d < rb.d ? ra.d : rb.d,
      s: Array.from(new Set([...ra.s, ...rb.s])),
    });
  }
  CONTACT_CACHE.set(year, out);
  return out;
}

/** Contact lines inside one region. */
export const contactIn = (region: string, year = SNAPSHOT_YEAR): ContactLine[] =>
  contactLines(year).filter((c) => c.region === region);

/** Region id for a country code. */
const REGION_OF: Record<string, string> = Object.fromEntries(REGIONS.flatMap((r) => r.iso.map((i) => [i, r.id])));

/** When an assessment takes effect: the documented start of the arrangement, else the verification date. */
export const effectiveFrom = (r: ControlRecord) => r.since ?? r.d;

/** Every assessment for a unit, oldest first. */
const TIMELINE = new Map<string, ControlRecord[]>();
for (const r of [...CONTROL_HISTORY, ...CONTROL]) {
  const k = `${r.iso}:${r.code}`;
  const list = TIMELINE.get(k) ?? [];
  list.push(r);
  TIMELINE.set(k, list);
}
for (const list of TIMELINE.values()) list.sort((a, b) => effectiveFrom(a).localeCompare(effectiveFrom(b)));

export const unitHistory = (iso: string, code: string) => TIMELINE.get(`${iso}:${code}`) ?? [];

/** The assessment in force at the end of `year`, or null if none had begun yet. */
export function controlAt(iso: string, code: string, year: number): ControlRecord | null {
  const end = `${year}-12-31`;
  let found: ControlRecord | null = null;
  for (const r of unitHistory(iso, code)) {
    if (effectiveFrom(r) <= end) found = r;
    else break;
  }
  return found;
}

const CACHE = new Map<number, TerritoryFeature[]>();

/** Units with a sourced assessment in force in `year`. Nothing else is drawn. */
export function territoryFeatures(year = SNAPSHOT_YEAR): TerritoryFeature[] {
  const hit = CACHE.get(year);
  if (hit) return hit;
  const out: TerritoryFeature[] = [];
  for (const u of UNITS) {
    const record = controlAt(u.iso, u.code, year);
    if (!record) continue; // no sourced assessment for this year → not drawn
    out.push({
      type: 'Feature',
      geometry: u.geometry,
      properties: {
        kind: 'territory',
        id: `${u.iso}:${u.code}`,
        iso: u.iso,
        code: u.code,
        unitName: u.name,
        record,
        region: REGION_OF[u.iso] ?? '',
        centroid: centroid(u.geometry),
      },
    });
  }
  CACHE.set(year, out);
  return out;
}

/** Regions that have any assessment in force in `year`. */
export function regionsWithData(year: number): string[] {
  return [...new Set(territoryFeatures(year).map((f) => f.properties.region))].filter(Boolean);
}

export const territoryById = (id: string, year = SNAPSHOT_YEAR) => territoryFeatures(year).find((f) => f.properties.id === id) ?? null;

/** Units that make up one region, in a stable order. */
export const territoriesOfRegion = (region: string, year = SNAPSHOT_YEAR) => territoryFeatures(year).filter((f) => f.properties.region === region);

export const placesOfRegion = (region: string) => PLACES.filter((p) => p.region === region);
export const frontsOfRegion = (region: string) => FRONTS.filter((f) => f.region === region);

/** Units an actor holds or contests, with the count split by status. */
export function actorHoldings(actorId: string, year = SNAPSHOT_YEAR) {
  const held = territoryFeatures(year).filter((f) => f.properties.record.actor === actorId);
  const contested = territoryFeatures(year).filter((f) => f.properties.record.with === actorId);
  return {
    full: held.filter((f) => f.properties.record.status === 'control'),
    partial: held.filter((f) => f.properties.record.status !== 'control'),
    alsoIn: contested,
    places: PLACES.filter((p) => p.actor === actorId),
  };
}

export const actorsOfRegion = (region: string) => Object.values(ACTOR).filter((a) => a.region === region);

/** Fill colour for a unit, by status. Contested units read as muted and striped. */
export function unitFill(r: ControlRecord, alpha = 1): string {
  const a = ACTOR[r.actor];
  if (!a) return 'rgba(140,160,185,0.25)';
  // A de facto administration reads lighter than control along a front, and a
  // constituent republic lighter still: neither is an active contest, and the
  // fill must not suggest one.
  const base = r.status === 'control' ? 0.46 : r.status === 'partial' ? 0.38
    : r.status === 'defacto' ? 0.34 : r.status === 'federal' ? 0.2 : 0.3;
  // A unit is an administrative shape, not a holding. Where the record says
  // what share of it an actor holds, the fill says the same: an oblast a fifth
  // occupied is a fifth as strong as one held outright. Painting both solid
  // would assert something the assessment does not, and it is exactly what the
  // front line running through the same oblast contradicts.
  return hexA(a.color, base * shareWeight(r) * alpha);
}

/**
 * How much of a unit's fill its record earns, from the share held.
 *
 * `share` is prose, because a source states a share in words and this dataset
 * keeps what the source said: "about 79.7%", "close to 100%", or a sentence
 * naming the district that is the exception. A percentage is read out where
 * one is written; where the source gives no number, the fill stays full,
 * because an unstated share means unmeasured, not zero.
 *
 * Floored so a small but documented holding is still visible.
 */
export function shareWeight(r: ControlRecord): number {
  const pct = sharePercent(r);
  if (pct == null) return 1;
  return 0.22 + 0.78 * Math.max(0, Math.min(1, pct / 100));
}

/**
 * The percentage a share states, or null when it states none. Reads either
 * language, and accepts both the comma and the point as a decimal mark.
 */
export function sharePercent(r: ControlRecord): number | null {
  if (!r.share) return null;
  for (const text of r.share) {
    const m = /(\d{1,3})(?:[.,](\d+))?\s*%/.exec(text);
    if (m) {
      const n = Number(`${m[1]}.${m[2] ?? '0'}`);
      if (Number.isFinite(n)) return Math.min(n, 100);
    }
  }
  return null;
}

export function hexA(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${Math.max(0, Math.min(1, a)).toFixed(3)})`;
}

export const statusLabel: Record<ControlRecord['status'], L> = {
  control: ['Kontrollert', 'Controlled'],
  partial: ['Delvis kontrollert', 'Partially controlled'],
  contested: ['Omstridt', 'Contested'],
  defacto: ['Faktisk administrasjon', 'De facto administration'],
  federal: ['Delrepublikk i staten', 'Constituent republic of the state'],
};

/** Per-region tally, used by the panel and tests. */
export function regionSummary(region: string, year = SNAPSHOT_YEAR) {
  const units = territoriesOfRegion(region, year);
  const byActor = new Map<string, Record<ControlStatus, number>>();
  for (const u of units) {
    const r = u.properties.record;
    const e = byActor.get(r.actor) ?? { control: 0, partial: 0, contested: 0, defacto: 0, federal: 0 };
    e[r.status]++;
    byActor.set(r.actor, e);
  }
  // The date the shown picture was verified: the most recent assessment among
  // the records actually drawn, not the region's present-day date. Scrubbing to
  // 2022 must not claim the 2026 map was checked in 2022, or the reverse.
  const asOf = units.reduce((m, u) => (u.properties.record.d > m ? u.properties.record.d : m), '');
  return { units: units.length, byActor, asOf };
}

/**
 * Years for which this region actually has a dated assessment.
 *
 * The comparison only offers these. Offering every year on the timeline would
 * invite a comparison between a real snapshot and a year whose map is just the
 * previous snapshot carried forward, which looks like "no change" when what it
 * really means is "nobody looked".
 */
export function snapshotYears(region: string): number[] {
  const isos = new Set(REGIONS.find((r) => r.id === region)?.iso ?? []);
  const years = new Set<number>();
  for (const r of [...CONTROL_HISTORY, ...CONTROL]) {
    if (!isos.has(r.iso as Iso)) continue;
    years.add(Number(effectiveFrom(r).slice(0, 4)));
  }
  return [...years].sort((a, b) => a - b);
}

export interface ControlChange {
  id: string;
  unitName: string;
  from: ControlRecord | null;
  to: ControlRecord | null;
  /** What changed: who holds it, how firmly, or that it became assessed at all. */
  kind: 'actor' | 'status' | 'appeared' | 'disappeared';
}

/**
 * What differs between two dated assessments of a region.
 *
 * Only differences the records themselves state are listed. A unit assessed in
 * one year and not the other is reported as such rather than as a change of
 * hands, because an unassessed unit is not a claim that anything happened.
 */
export function diffControl(region: string, a: number, b: number): ControlChange[] {
  const isos = REGIONS.find((r) => r.id === region)?.iso ?? [];
  const out: ControlChange[] = [];
  for (const u of UNITS) {
    if (!isos.includes(u.iso as Iso)) continue;
    const from = controlAt(u.iso as Iso, u.code, a);
    const to = controlAt(u.iso as Iso, u.code, b);
    if (!from && !to) continue;
    const id = `${u.iso}:${u.code}`;
    if (from && !to) out.push({ id, unitName: u.name, from, to: null, kind: 'disappeared' });
    else if (!from && to) out.push({ id, unitName: u.name, from: null, to, kind: 'appeared' });
    else if (from && to && from.actor !== to.actor) out.push({ id, unitName: u.name, from, to, kind: 'actor' });
    else if (from && to && from.status !== to.status) out.push({ id, unitName: u.name, from, to, kind: 'status' });
  }
  return out;
}

/** Unit ids that differ between two years, for highlighting on the globe. */
export function changedUnits(region: string, a: number, b: number): Set<string> {
  return new Set(diffControl(region, a, b).map((c) => c.id));
}

/** A place by id. */
export const PLACE = Object.fromEntries(PLACES.map((p) => [p.id, p])) as Record<string, (typeof PLACES)[number]>;

/**
 * Who held a place in a given year, read from its documented history.
 * With no history the current record stands, dated as it is dated.
 */
export function placeControlAt(id: string, year: number): { actor: string | null; from: string } | null {
  const p = PLACE[id];
  if (!p) return null;
  const end = `${year}-12-31`;
  const steps = (p.history ?? []).filter((h) => h.from <= end).sort((a, b) => a.from.localeCompare(b.from));
  if (steps.length) {
    const last = steps[steps.length - 1];
    return { actor: last.actor, from: last.from };
  }
  return p.d <= end ? { actor: p.actor, from: p.d } : null;
}


/**
 * A hex colour mixed toward white, returned as rgba.
 *
 * three.js parses hex, rgb() and hsl() — not CSS `color-mix()` — so the blend
 * has to happen here rather than in the style string.
 */
export function lighten(hex: string, amount: number, alpha = 1): string {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  const mix = (c: number) => Math.round(c + (255 - c) * Math.min(1, Math.max(0, amount)));
  const r = mix((n >> 16) & 255), g = mix((n >> 8) & 255), b = mix(n & 255);
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * The area a conflict occupies, as [west, south, east, north].
 *
 * Built from the administrative units that carry control records for the
 * conflict's countries, because that is the ground the map is actually about.
 * When a conflict has no control data, the caller gets null and should fall
 * back to the conflict's own point — guessing an extent from a country code
 * would frame the Sahara for a city siege.
 */
export function conflictBbox(isos: readonly string[], region?: string): [number, number, number, number] | null {
  // A region, when given, is the authority on which countries belong to the
  // conflict; otherwise take the conflict's own list.
  const regionIsos = region ? REGIONS.find((r) => r.id === region)?.iso : undefined;
  const wanted = new Set(regionIsos?.length ? regionIsos : isos);
  const units = UNITS.filter((u) => wanted.has(u.iso));
  // Prefer the units that actually carry a control record: those are the
  // contested ground, and framing them avoids a view dominated by territory
  // the conflict never touches.
  const held = units.filter((u) => CONTROL.some((r) => r.iso === u.iso && r.code === u.code));
  const use = held.length ? held : units;
  if (!use.length) return null;

  let w = 180, s = 90, e = -180, n = -90;
  for (const u of use) {
    for (const poly of u.geometry.coordinates) {
      for (const ring of poly) {
        for (const [lon, lat] of ring) {
          if (lon < w) w = lon;
          if (lon > e) e = lon;
          if (lat < s) s = lat;
          if (lat > n) n = lat;
        }
      }
    }
  }
  return e > w && n > s ? [w, s, e, n] : null;
}

/**
 * A zoom that fits a bbox in a viewport, by the Web Mercator world-size
 * relation. Takes the tighter of the two axes so nothing is cut off.
 */
export function zoomForBbox(
  [w, s, e, n]: [number, number, number, number],
  width: number,
  height: number,
  padding = 0.82,
): number {
  const latRad = (d: number) => {
    const sin = Math.sin((d * Math.PI) / 180);
    return Math.log((1 + sin) / (1 - sin)) / 2;
  };
  const worldPx = 512;
  const lonFrac = (e - w) / 360;
  const latFrac = (latRad(n) - latRad(s)) / (2 * Math.PI);
  const zx = Math.log2((width * padding) / (worldPx * lonFrac));
  const zy = Math.log2((height * padding) / (worldPx * latFrac));
  return Math.max(2, Math.min(12, Math.min(zx, zy)));
}

/** Conflict id to the region whose control data covers it, where one exists. */
export const REGION_FOR_CONFLICT: Record<string, string> = Object.fromEntries(
  REGIONS.filter((r) => r.conflict).map((r) => [r.conflict as string, r.id]),
);

/**
 * Whether the detailed map has anything to show for a conflict. Offering the
 * view for a conflict with neither control geometry nor bundled base detail
 * would open an empty map, which is worse than not offering it.
 */
export function hasDetail(conflictId: string, isos: readonly string[]): boolean {
  if (REGION_FOR_CONFLICT[conflictId]) return true;
  return conflictBbox(isos) !== null;
}

/** Region id for a conflict id, where the conflict has control data. */
export const REGION_OF_CONFLICT: Record<string, string> = Object.fromEntries(
  REGIONS.filter((r) => r.conflict).map((r) => [r.conflict as string, r.id]),
);

/**
 * The colour a country carries as a party to a conflict, by ISO code.
 *
 * Deliberately weaker than any control fill: being a party to a war is not the
 * same claim as holding ground in one, and the map must not let the two read
 * alike. Returns an empty map when the conflict's sides are not recorded,
 * leaving the caller to fall back to a neutral tint.
 */
export function belligerentColors(conflictId: string, alpha = 0.3): Map<string, string> {
  const out = new Map<string, string>();
  const region = REGION_OF_CONFLICT[conflictId];
  for (const b of (region && BELLIGERENT[region]) || []) {
    const a = ACTOR[b.actor];
    if (a) out.set(b.iso, hexA(a.color, alpha));
  }
  return out;
}

/** Each region's extent, computed once from the units that carry its control. */
const REGION_BBOX = new Map<string, [number, number, number, number]>();
for (const r of REGIONS) {
  const b = conflictBbox(r.iso, r.id);
  if (b) REGION_BBOX.set(r.id, b);
}

export function regionBbox(region: string): [number, number, number, number] | null {
  return REGION_BBOX.get(region) ?? null;
}

/**
 * The sides to show for what is currently on screen.
 *
 * Tied to the view rather than to the selection: a reader who opens the
 * detailed map over Ukraine is looking at that war whether or not they clicked
 * its name first, and a map that only names the sides once a panel is open is
 * a map that hides what it knows.
 *
 * Returns an empty map when nothing in view has recorded sides.
 */
export function belligerentsInView(
  view: [number, number, number, number],
  alpha = 0.3,
  /** A conflict the reader has explicitly selected, whose sides show whatever
   *  the camera is doing: they asked about that war. */
  selectedConflict?: string | null,
): Map<string, string> {
  const out = new Map<string, string>();
  const asked = selectedConflict ? REGION_OF_CONFLICT[selectedConflict] : undefined;
  for (const region of Object.keys(BELLIGERENT)) {
    const b = REGION_BBOX.get(region);
    if (region !== asked && (!b || viewShare(view, b) < MIN_VIEW_SHARE)) continue;
    for (const party of BELLIGERENT[region]) {
      const a = ACTOR[party.actor];
      if (a) out.set(party.iso, hexA(a.color, alpha));
    }
  }
  return out;
}

/**
 * How much of the view a region fills.
 *
 * The test is not "is the region anywhere on screen". A belligerent is shaded
 * as a whole country, and Russia reaches Kamchatka: at a continental view that
 * paints half the map red for a war fought in Ukraine. The sides are shown
 * only once the region is what the reader is actually looking at.
 */
const MIN_VIEW_SHARE = 0.18;

function viewShare(
  [west, south, east, north]: [number, number, number, number],
  [bw, bs, be, bn]: [number, number, number, number],
): number {
  const w = Math.min(east, be) - Math.max(west, bw);
  const h = Math.min(north, bn) - Math.max(south, bs);
  if (w <= 0 || h <= 0) return 0;
  const viewArea = (east - west) * (north - south);
  return viewArea > 0 ? (w * h) / viewArea : 0;
}
