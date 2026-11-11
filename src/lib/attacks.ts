import { ATTACKS, type Attack, type AttackCategory } from '../data/attacks';
import { SNAPSHOT_DATE } from '../data/sources';
import type { Iso } from '../types';

export const ATTACK = Object.fromEntries(ATTACKS.map((a) => [a.id, a])) as Record<string, Attack>;

/** Named windows for the Recent Developments panel. */
export type Period = '24h' | '7d' | '30d' | '90d' | '1y' | 'all';

const DAYS: Record<Exclude<Period, 'all'>, number> = { '24h': 1, '7d': 7, '30d': 30, '90d': 90, '1y': 365 };

/**
 * The window is measured from the snapshot date, not from today's clock. The
 * dataset is a snapshot; counting back from the reader's own "now" would make
 * "last 24 hours" mean something different every time the page is opened, and
 * would imply the data is live when it is not.
 */
export function since(period: Period, from: string = SNAPSHOT_DATE): string {
  if (period === 'all') return '0000-01-01';
  return new Date(Date.parse(from) - DAYS[period] * 86400000).toISOString().slice(0, 10);
}

export interface AttackFilter {
  period?: Period;
  /** Upper bound, so the timeline year governs what is shown. */
  until?: string;
  iso?: Iso | null;
  conflict?: string | null;
  category?: AttackCategory | 'all';
  /** Matches the attacker or the target text. */
  actor?: string | null;
}

/** Incidents matching the filter, most recent first. */
export function attacksIn(f: AttackFilter = {}): Attack[] {
  const lo = since(f.period ?? 'all', f.until ?? SNAPSHOT_DATE);
  const hi = f.until ?? SNAPSHOT_DATE;
  return ATTACKS.filter((a) => {
    if (a.d < lo || a.d > hi) return false;
    if (f.iso && a.iso !== f.iso) return false;
    if (f.conflict && a.conflict !== f.conflict) return false;
    if (f.category && f.category !== 'all' && a.category !== f.category) return false;
    if (f.actor) {
      const hay = `${a.attacker?.join(' ') ?? ''} ${a.target?.join(' ') ?? ''}`.toLowerCase();
      if (!hay.includes(f.actor.toLowerCase())) return false;
    }
    return true;
  }).sort((x, y) => y.d.localeCompare(x.d));
}

/** Incidents up to and including a year, for the globe's timeline. */
export const attacksUpTo = (year: number): Attack[] =>
  ATTACKS.filter((a) => Number(a.d.slice(0, 4)) <= year).sort((x, y) => y.d.localeCompare(x.d));

/** Incidents the dataset places inside one territorial unit. */
export const attacksInUnit = (id: string): Attack[] => ATTACKS.filter((a) => a.territory === id);

/**
 * Days between the event and the first report of it. The spec asks for the two
 * dates to be shown separately; this is the gap between them.
 */
export const reportingDelay = (a: Attack): number =>
  Math.round((Date.parse(a.published) - Date.parse(a.d)) / 86400000);

export const CATEGORIES: AttackCategory[] = [
  'clash', 'airstrike', 'drone', 'missile', 'rocket', 'shelling', 'explosion',
  'civilians', 'infrastructure', 'maritime', 'energy', 'ceasefire_violation', 'territorial_change',
];

/** Marker colour per category. Distinct, flat, and never graphic. */
export const CATEGORY_COLOR: Record<AttackCategory, string> = {
  clash: '#FF7A7A', airstrike: '#FF4545', drone: '#FFB04A', missile: '#FF6B2C', rocket: '#FF9B42',
  shelling: '#E8604C', explosion: '#FF5E3A', civilians: '#FFD23F', infrastructure: '#7BE0C3',
  maritime: '#00D9FF', energy: '#FFD23F', ceasefire_violation: '#B8C7DA', territorial_change: '#C9A2FF',
};
