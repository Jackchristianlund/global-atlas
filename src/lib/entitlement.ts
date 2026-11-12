import type { L } from '../types';

/**
 * Free and Pro.
 *
 * Nothing here charges anyone. There is no payment provider wired in, no
 * account system and no server to validate an entitlement against, so the tier
 * lives in the browser and is a preview of the two tiers rather than a
 * purchase. `BILLING_ENABLED` stays false until a provider is integrated,
 * entitlements are validated server-side, and the commercial data permissions
 * in the source registry are confirmed for a paid product.
 */
export const BILLING_ENABLED = false;

export type Tier = 'free' | 'pro';

export const PRICE = {
  monthly: { amount: 3.99, currency: 'USD', display: '$3.99' },
  annual: { amount: 39.99, currency: 'USD', display: '$39.99' },
} as const;

/**
 * `state: 'live'` means the feature works in this build. `'planned'` means it
 * is described but not built, and it is listed as planned rather than sold —
 * nobody should be charged for something that is not there.
 */
export interface Feature {
  id: string;
  label: L;
  state: 'live' | 'planned';
}

/** In the free tier, and never moved out of it. */
export const FREE_FEATURES: Feature[] = [
  { id: 'globe', label: ['Interaktiv 3D-klode', 'Interactive 3D globe'], state: 'live' },
  { id: 'conflicts', label: ['Global konfliktoversikt med originalmarkørene', 'Global conflict overview with the original markers'], state: 'live' },
  { id: 'territory', label: ['Territoriell kontroll og frontlinjer', 'Territorial control and front lines'], state: 'live' },
  { id: 'attacks', label: ['Dokumenterte hendelser og angrep', 'Documented events and attacks'], state: 'live' },
  { id: 'relations', label: ['Geopolitiske sammenhenger og allianser', 'Geopolitical relationships and alliances'], state: 'live' },
  { id: 'trade', label: ['Handelsruter og knutepunkter', 'Trade routes and chokepoints'], state: 'live' },
  { id: 'sources', label: ['Alle kilder, datoer og metodebeskrivelser', 'Every source, date and methodology note'], state: 'live' },
  { id: 'history', label: ['Historisk tidslinje', 'Historical timeline'], state: 'live' },
];

/**
 * Pro. Essential conflict information and source citations are deliberately
 * absent from this list: they stay free, as the brief requires.
 */
export const PRO_FEATURES: Feature[] = [
  { id: 'noads', label: ['Ingen annonser', 'No advertising'], state: 'live' },
  { id: 'compare', label: ['Sammenlikning av to historiske datoer side om side', 'Side-by-side comparison of two historical dates'], state: 'live' },
  { id: 'network', label: ['Avansert nettverksanalyse av relasjoner', 'Advanced network analysis of relationships'], state: 'live' },
  { id: 'scenario', label: ['Scenariolab med eksponeringsberegning', 'Scenario Lab with exposure calculation'], state: 'live' },
  { id: 'watchlist', label: ['Lagrede land og konfliktregioner', 'Saved countries and conflict regions'], state: 'planned' },
  { id: 'alerts', label: ['Varsler om nye hendelser', 'Notifications about new events'], state: 'planned' },
  { id: 'export', label: ['Eksport av datasett og kildelister', 'Export of datasets and source lists'], state: 'planned' },
];

/** Features this build gates. Everything else is free for everyone. */
export const GATED = new Set(['compare', 'network', 'scenario']);

export const isPro = (tier: Tier) => tier === 'pro';
export const gated = (feature: string, tier: Tier) => GATED.has(feature) && !isPro(tier);

/**
 * Whether any ad network is integrated. The labelled slots exist but are
 * empty; nothing is sold in them.
 */
export const ADS_LIVE = false;

/**
 * Whether the atlas earns money in any form. Data used under a
 * non-commercial permission (ISW's assessed control, EOX's hosted imagery)
 * must switch off the moment this becomes true.
 */
export const COMMERCIAL = BILLING_ENABLED || ADS_LIVE;

/** Advertising is shown to the free tier only, and only in the labelled slots. */
export const showAds = (tier: Tier) => !isPro(tier);

/** Slots that sit outside the globe, never over it. */
export type AdSlot = 'left' | 'right';

/**
 * No audience figures are published here. Inventing them would be the kind of
 * claim an advertiser could act on, so the page says they are not available yet.
 */
export const AUDIENCE_STATS: { metric: L; value: L }[] = [
  { metric: ['Månedlige brukere', 'Monthly users'], value: ['Ikke tilgjengelig ennå', 'Not available yet'] },
  { metric: ['Sidevisninger', 'Page views'], value: ['Ikke tilgjengelig ennå', 'Not available yet'] },
  { metric: ['Geografisk fordeling', 'Geographic breakdown'], value: ['Ikke tilgjengelig ennå', 'Not available yet'] },
];
