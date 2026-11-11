/** Bilingual text: [norsk, English]. */
export type L = [string, string];
export type Lang = 'no' | 'en';
export type Iso = string; // ISO 3166-1 alpha-3

export interface Source {
  title: string;
  publisher: string;
  url: string;
  /** Publication or "data as of" date of the source itself. */
  date: string;
}

/** How firmly a statement is established. Rendered as a badge on every claim. */
export type ClaimKind = 'fact' | 'assessment' | 'risk';
export type ClaimCat = 'military' | 'ceasefire' | 'escalation' | 'human' | 'geo' | 'econ';

export interface Claim {
  cat: ClaimCat;
  kind: ClaimKind;
  t: L;
  /** Date the statement refers to (ISO). */
  d: string;
  s: string[];
}

export interface Figure {
  l: L;
  /** null = not available in this dataset. */
  v: L | null;
  d: string;
  /** Who counted and how. */
  m: L;
  s: string[];
}

export type ConflictType =
  | 'interstate'
  | 'civil'
  | 'insurgency'
  | 'proxy'
  | 'territorial'
  | 'nonstate'
  | 'separatist'
  | 'border';

export type ConflictStatus = 'active' | 'ceasefire' | 'flashpoint' | 'ended';

/** 4 = 10 000+ deaths/yr, 3 = 1 000–9 999, 2 = 100–999, 1 = 1–99, null = not rated. */
export type Tier = 4 | 3 | 2 | 1 | null;

export interface Conflict {
  id: string;
  name: L;
  type: ConflictType;
  status: ConflictStatus;
  tier: Tier;
  /** Row of the reference list the tier is taken from, with its reported deaths. */
  row?: { name: string; f25: string; f26: string };
  at: [number, number];
  iso: Iso[];
  start: string;
  end?: string;
  /** Last date a current-status statement in this record was checked against a source. */
  verified: string;
  sum: L;
  causes: L;
  parties: L;
  claims: Claim[];
  figs: Figure[];
  s: string[];
}

export type OrgKind = 'defense' | 'security' | 'economic' | 'political' | 'universal';

export interface Membership {
  iso: Iso;
  from: number;
  to?: number;
}

export interface Org {
  id: string;
  name: L;
  short: string;
  kind: OrgKind;
  color: string;
  founded: number;
  note: L;
  members: Membership[];
  s: string[];
}

export type RelType =
  | 'defense'
  | 'partnership'
  | 'sanction'
  | 'energy'
  | 'trade'
  | 'dispute'
  | 'arms'
  | 'displacement'
  | 'shipping'
  | 'diplomatic'
  | 'supply'
  | 'military';

export interface Relation {
  id: string;
  a: Iso;
  b: Iso;
  type: RelType;
  name: L;
  since: string;
  note: L;
  s: string[];
}

export interface SanctionRegime {
  id: string;
  target: Iso;
  by: string[]; // ISO codes or 'UN' / 'EU'
  since: string;
  name: L;
  note: L;
  s: string[];
}

export interface Chokepoint {
  id: string;
  name: L;
  at: [number, number];
  importance: L;
  regions: L;
  commodities: L;
  /** EIA oil transit estimates, million barrels/day. null = no estimate published. */
  oil2023: number | null;
  oil2q26: number | null;
  status: Claim[];
  exposed: { iso: Iso; t: L; s: string[] }[];
  conflicts: string[];
  s: string[];
}

export type RouteKind = 'sea' | 'lng' | 'oil' | 'rail' | 'pipeline';

export interface Route {
  id: string;
  name: L;
  kind: RouteKind;
  /** Waypoints [lat, lng]. Hand-placed, illustrative geometry. */
  pts: [number, number][];
  via: string[];
  note: L;
  status?: Claim;
  s: string[];
}

export interface EnergySite {
  id: string;
  name: string;
  kind: 'lng' | 'oil' | 'port' | 'gasfield';
  at: [number, number];
  iso: Iso;
  note: L;
  status?: Claim;
  s: string[];
}

export type EventType = 'escalation' | 'ceasefire' | 'alliance' | 'sanction' | 'trade' | 'political';

export interface TimelineEvent {
  d: string;
  type: EventType;
  t: L;
  conflict?: string;
  at?: [number, number];
  s: string[];
}

/** One documented connection in the cause-and-effect explorer. */
export interface ImpactLink {
  id: string;
  conflict: string;
  from: { label: L; at: [number, number]; iso?: Iso };
  to: { label: L; at: [number, number]; iso?: Iso };
  type: RelType;
  kind: 'observed' | 'assessed' | 'potential';
  confidence: 'high' | 'medium' | 'low';
  evidence: L;
  mechanism: L;
  d: string;
  s: string[];
}

export interface Scenario {
  id: string;
  name: L;
  kind: 'chokepoint' | 'corridor' | 'energy';
  chokepoint?: string;
  assumptions: L[];
  /** Route pairs used to compute a detour: [normal route id, alternative route id]. */
  detours: { label: L; base: string; alt: string }[];
  facts: Claim[];
  unknowns: L[];
}

export type Selection =
  | { kind: 'conflict'; id: string }
  | { kind: 'country'; id: Iso }
  | { kind: 'chokepoint'; id: string }
  | { kind: 'route'; id: string }
  | { kind: 'site'; id: string }
  | { kind: 'org'; id: string }
  | { kind: 'territory'; id: string }
  | { kind: 'actor'; id: string }
  | { kind: 'flow'; id: string }
  | { kind: 'attack'; id: string }
  | { kind: 'place'; id: string }
  | null;

export type ViewId = 'conflict' | 'alliance' | 'trade' | 'energy' | 'human' | 'history' | 'scenario';
export type LayerId =
  | 'conflicts'
  | 'incidents'
  | 'attacks'
  | 'hydro'
  | 'flashpoints'
  | 'alliances'
  | 'routes'
  | 'chokepoints'
  | 'energy'
  | 'links'
  | 'borders'
  | 'sanctions'
  | 'displacement'
  | 'events'
  | 'territories'
  | 'fronts'
  | 'sourceline';
