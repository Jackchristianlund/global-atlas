/**
 * Typed relationship graph over every entity in the atlas.
 * Each edge records: id, endpoints, type, validity period, evidence, how it was
 * established (derivation), original sources and a confidence/kind classification.
 * Edges are DERIVED deterministically from the sourced dataset — the graph never
 * invents a connection, and proximity alone never creates one.
 */
import { CHOKEPOINTS, CONFLICTS, ENERGY_SITES, LINKS, ORGS, RELATIONS, ALL_ROUTES, SANCTIONS } from '../data';
import type { Iso, L, RelType } from '../types';

export type NodeKind = 'country' | 'conflict' | 'org' | 'chokepoint' | 'route' | 'site';
export interface NodeRef { kind: NodeKind; id: string }
export type EdgeType = RelType | 'membership' | 'party' | 'exposure' | 'passes' | 'located';

export interface GraphEdge {
  id: string;
  a: NodeRef;
  b: NodeRef;
  type: EdgeType;
  /** Validity period: ISO date or year as string; open end = still in force. */
  from?: string;
  to?: string;
  /** What supports the connection. */
  evidence: L;
  /** How the connection was established. */
  derivation: L;
  /** Original data source ids (see sources.ts). */
  s: string[];
  confidence: 'high' | 'medium' | 'low';
  kind: 'observed' | 'assessed' | 'potential';
}

const C = (id: Iso): NodeRef => ({ kind: 'country', id });

const D = {
  membership: ['Avledet av organisasjonens medlemskapsregister, datert per medlem.', 'Derived from the organisation’s membership register, dated per member.'] as L,
  treaty: ['Bilateral avtale ført i datasettet med dato og kilde.', 'Bilateral agreement recorded in the dataset with date and source.'] as L,
  sanction: ['Avledet av sanksjonsregisteret: hver pålegger kobles til mållandet.', 'Derived from the sanctions register: each imposer is linked to the target.'] as L,
  party: ['Landet står oppført under konflikten i datasettet. Oppføring betyr berørt part eller territorium, ikke nødvendigvis krigførende.', 'The country is listed under the conflict in the dataset. Listing means affected party or territory, not necessarily belligerent.'] as L,
  exposure: ['Dokumentert eksponering fra kildens import- eller ruteandeler.', 'Documented exposure from the source’s import or routing shares.'] as L,
  passes: ['Den illustrative korridoren er tegnet gjennom knutepunktet.', 'The illustrative corridor is drawn through the chokepoint.'] as L,
  located: ['Anleggets plassering, fra kildene i posten.', 'The facility’s location, from the record’s sources.'] as L,
  impact: ['Dokumentert kobling i årsak–virkning-registeret, med belegg og mekanisme.', 'Documented link in the cause-and-effect register, with evidence and mechanism.'] as L,
};

let GRAPH: GraphEdge[] | null = null;

export function buildGraph(): GraphEdge[] {
  if (GRAPH) return GRAPH;
  const edges: GraphEdge[] = [];
  let n = 0;
  const push = (e: Omit<GraphEdge, 'id'>) => edges.push({ id: `g${++n}`, ...e });

  for (const o of ORGS) {
    for (const m of o.members) {
      push({
        a: { kind: 'org', id: o.id }, b: C(m.iso), type: 'membership',
        from: String(m.from), to: m.to !== undefined ? String(m.to) : undefined,
        evidence: o.note, derivation: D.membership, s: o.s, confidence: 'high', kind: 'observed',
      });
    }
  }
  for (const r of RELATIONS) {
    push({ a: C(r.a), b: C(r.b), type: r.type, from: r.since, evidence: r.note, derivation: D.treaty, s: r.s, confidence: 'high', kind: 'observed' });
  }
  for (const g of SANCTIONS) {
    for (const by of g.by) {
      const a: NodeRef = by === 'EU' ? { kind: 'org', id: 'eu' } : by === 'UN' ? { kind: 'org', id: 'un' } : C(by);
      push({ a, b: C(g.target), type: 'sanction', from: g.since, evidence: g.note, derivation: D.sanction, s: g.s, confidence: 'high', kind: 'observed' });
    }
  }
  for (const c of CONFLICTS) {
    for (const code of c.iso) {
      push({
        a: { kind: 'conflict', id: c.id }, b: C(code), type: 'party',
        from: c.start, to: c.end,
        evidence: c.sum, derivation: D.party, s: c.s, confidence: 'medium', kind: 'observed',
      });
    }
  }
  for (const cp of CHOKEPOINTS) {
    for (const e of cp.exposed) {
      push({ a: { kind: 'chokepoint', id: cp.id }, b: C(e.iso), type: 'exposure', evidence: e.t, derivation: D.exposure, s: e.s, confidence: 'medium', kind: 'assessed' });
    }
  }
  for (const r of ALL_ROUTES) {
    for (const v of r.via) {
      push({ a: { kind: 'route', id: r.id }, b: { kind: 'chokepoint', id: v }, type: 'passes', evidence: r.note, derivation: D.passes, s: r.s.length ? r.s : ['ne'], confidence: 'medium', kind: 'observed' });
    }
  }
  for (const site of ENERGY_SITES) {
    push({ a: { kind: 'site', id: site.id }, b: C(site.iso), type: 'located', evidence: site.note, derivation: D.located, s: site.s, confidence: 'high', kind: 'observed' });
  }
  const cpByCoord = new Map(CHOKEPOINTS.map((cp) => [`${cp.at[0]},${cp.at[1]}`, cp.id]));
  for (const l of LINKS) {
    const ref = (end: { iso?: string; at: [number, number] }): NodeRef | null => {
      if (end.iso) return C(end.iso);
      const cp = cpByCoord.get(`${end.at[0]},${end.at[1]}`);
      return cp ? { kind: 'chokepoint', id: cp } : null;
    };
    const a = ref(l.from) ?? { kind: 'conflict', id: l.conflict };
    const b = ref(l.to);
    if (!b) continue;
    push({ a, b, type: l.type, from: l.d, evidence: l.evidence, derivation: D.impact, s: l.s, confidence: l.confidence, kind: l.kind });
  }
  GRAPH = edges;
  return edges;
}

const sameRef = (x: NodeRef, y: NodeRef) => x.kind === y.kind && x.id === y.id;

/** Is the edge in force in `year`? Open-ended edges are; year-granular comparison. */
export function activeIn(e: GraphEdge, year: number): boolean {
  const y0 = e.from ? Number(e.from.slice(0, 4)) : -Infinity;
  const y1 = e.to ? Number(e.to.slice(0, 4)) : Infinity;
  // membership `to` is an exit year (exclusive); other `to` dates are inclusive end dates
  return y0 <= year && (e.type === 'membership' ? year < y1 : year <= y1);
}

export function edgesOf(ref: NodeRef, year: number): GraphEdge[] {
  return buildGraph().filter((e) => (sameRef(e.a, ref) || sameRef(e.b, ref)) && activeIn(e, year));
}

export function otherEnd(e: GraphEdge, ref: NodeRef): NodeRef {
  return sameRef(e.a, ref) ? e.b : e.a;
}

export interface GraphStats { edges: number; byType: Record<string, number> }
export function graphStats(): GraphStats {
  const g = buildGraph();
  const byType: Record<string, number> = {};
  for (const e of g) byType[e.type] = (byType[e.type] ?? 0) + 1;
  return { edges: g.length, byType };
}
