import { describe, expect, it } from 'vitest';
import { AUDIENCE_STATS, BILLING_ENABLED, FREE_FEATURES, GATED, PRICE, PRO_FEATURES, gated, isPro, showAds } from '../src/lib/entitlement';

describe('Free and Pro', () => {
  it('does not charge anyone in this build', () => {
    // No payment provider, no accounts, no server-side entitlement check.
    expect(BILLING_ENABLED).toBe(false);
  });

  it('prices match the brief', () => {
    expect(PRICE.monthly.display).toBe('$3.99');
    expect(PRICE.annual.display).toBe('$39.99');
    expect(PRICE.monthly.currency).toBe('USD');
  });

  it('keeps conflict data and sources out of the paid tier', () => {
    const freeIds = FREE_FEATURES.map((f) => f.id);
    expect(freeIds).toContain('sources');
    expect(freeIds).toContain('conflicts');
    expect(freeIds).toContain('territory');
    expect(freeIds).toContain('attacks');
    const proIds = PRO_FEATURES.map((f) => f.id);
    for (const essential of ['sources', 'conflicts', 'territory', 'attacks', 'globe']) {
      expect(proIds, essential).not.toContain(essential);
    }
    // Nothing essential is gated either.
    for (const g of GATED) expect(freeIds).not.toContain(g);
  });

  it('every free feature is actually built', () => {
    for (const f of FREE_FEATURES) expect(f.state, f.id).toBe('live');
  });

  it('gates only features that exist, and marks the rest planned', () => {
    const byId = Object.fromEntries(PRO_FEATURES.map((f) => [f.id, f]));
    for (const g of GATED) {
      expect(byId[g], `${g} is gated`).toBeDefined();
      // Charging for a gate on something unbuilt would be selling a placeholder.
      expect(byId[g].state, g).toBe('live');
    }
    expect(PRO_FEATURES.some((f) => f.state === 'planned')).toBe(true);
  });

  it('shows ads to free and not to pro', () => {
    expect(showAds('free')).toBe(true);
    expect(showAds('pro')).toBe(false);
    expect(isPro('pro')).toBe(true);
    expect(gated('scenario', 'free')).toBe(true);
    expect(gated('scenario', 'pro')).toBe(false);
    // An ungated feature is never withheld from anyone.
    expect(gated('sources', 'free')).toBe(false);
  });

  it('publishes no invented audience figures', () => {
    for (const row of AUDIENCE_STATS) {
      expect(row.value[1]).toMatch(/Not available yet/);
      expect(row.value[1]).not.toMatch(/\d/);
    }
  });
});
