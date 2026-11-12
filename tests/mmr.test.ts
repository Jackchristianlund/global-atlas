import { describe, expect, it } from 'vitest';
import { MMR_GAP, MMR_LAYERS, MMR_NAMED, MMR_SITES } from '../src/data/mmr';
import {
  MMR_AMBIGUOUS, MMR_BBOX, MMR_META, MMR_STATES, MMR_TOWNSHIP_COUNT,
  layerFC, layersOf, mmrCovered, mmrSitePoints, township, townshipMeshFC,
} from '../src/lib/mmr';
import { SOURCES } from '../src/data/sources';

/**
 * Myanmar's township layers are the one place in the atlas where a claim is
 * attached to a place by name rather than by code, so the names are what can
 * silently go wrong. Two Myanmar township names occur twice, and a lookup that
 * took the first match would put a layer in the wrong half of the country.
 */
describe('Myanmar township geometry', () => {
  it('carries all 330 townships across the 14 base-map states', () => {
    expect(MMR_TOWNSHIP_COUNT).toBe(330);
    expect(MMR_STATES).toHaveLength(14);
    expect(MMR_META.count).toBe(330);
  });

  it('records its licence and the fact that it is administrative geography only', () => {
    expect(MMR_META.licence).toContain('CC BY 4.0');
    expect(MMR_META.attribution).toContain('geoBoundaries');
    expect(MMR_META.note).toMatch(/no claim about who controls/i);
  });

  it('spans Myanmar and nothing else', () => {
    const [w, s, e, n] = MMR_BBOX;
    expect(w).toBeGreaterThan(91);
    expect(e).toBeLessThan(102);
    expect(s).toBeGreaterThan(9);
    expect(n).toBeLessThan(29);
  });

  it('knows which township names are ambiguous', () => {
    expect([...MMR_AMBIGUOUS].sort()).toEqual(['Htantabin', 'Minhla']);
  });

  it('refuses to guess on an ambiguous name, and resolves it when given the state', () => {
    expect(() => township('Htantabin')).toThrow(/ambiguous/);
    expect(township('Htantabin', 'Yangon').state).toBe('Yangon');
    expect(township('Htantabin', 'Bago').state).toBe('Bago');
  });

  it('throws on a name it does not have', () => {
    expect(() => township('Nowhere')).toThrow(/no Myanmar township/);
  });

  it('builds closed rings for every township', () => {
    for (const f of townshipMeshFC().features) {
      for (const ring of f.geometry.coordinates) {
        expect(ring.length).toBeGreaterThanOrEqual(4);
        expect(ring[0]).toEqual(ring[ring.length - 1]);
      }
    }
  });
});

describe('Myanmar layers', () => {
  it('resolves every named township to exactly one polygon set', () => {
    for (const name of MMR_NAMED) expect(() => township(name)).not.toThrow();
  });

  it('holds the counts the sources state', () => {
    const by = Object.fromEntries(MMR_LAYERS.map((l) => [l.id, l.townships.length]));
    // 15 townships: 14 of Rakhine's 17, plus Paletwa in Chin.
    expect(by.aa).toBe(15);
    // 55 as extended on 18 October 2026: 60 in April, less two in July and three in October.
    expect(by.martial).toBe(55);
    // Six constitutional Wa townships, split into four settled and two the sources dispute.
    expect(by.wa + by['wa-unclear']).toBe(6);
    expect(by.ndaa).toBe(1);
  });

  it('puts the AA layer on 14 Rakhine townships and leaves the other three alone', () => {
    const aa = MMR_LAYERS.find((l) => l.id === 'aa')!;
    const rakhine = aa.townships.filter((n) => township(n).state === 'Rakhine');
    expect(rakhine).toHaveLength(14);
    for (const held of ['Sittwe', 'Kyaukpyu', 'Munaung']) {
      expect(aa.townships).not.toContain(held);
      expect(township(held).state).toBe('Rakhine');
    }
  });

  it('keeps martial law outline-only, because a decree is not control', () => {
    const ml = MMR_LAYERS.find((l) => l.id === 'martial')!;
    expect(ml.kind).toBe('legal');
    expect(ml.fill).toBe(false);
    expect(ml.means[0]).toMatch(/ikke kontroll/);
    expect(ml.means[1]).toMatch(/not control/);
  });

  it('covers only part of the country, and says so', () => {
    const covered = mmrCovered();
    expect(covered).toBeGreaterThan(50);
    expect(covered).toBeLessThan(80);
    // The gap note has to name the real remainder, not a rounder, nicer number.
    const left = MMR_TOWNSHIP_COUNT - covered;
    const stated = Number(/(\d+)/.exec(MMR_GAP[1])![1]);
    expect(Math.abs(stated - left)).toBeLessThanOrEqual(10);
  });

  it('cites a real source for every layer and site', () => {
    for (const l of MMR_LAYERS) {
      expect(l.s.length).toBeGreaterThan(0);
      for (const id of l.s) expect(SOURCES[id], `${l.id} cites ${id}`).toBeDefined();
    }
    for (const site of MMR_SITES) for (const id of site.s) expect(SOURCES[id], `site cites ${id}`).toBeDefined();
  });

  it('dates every layer and site', () => {
    for (const l of MMR_LAYERS) expect(l.d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    for (const s of MMR_SITES) expect(s.d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('builds a feature collection per layer with the layer id on every feature', () => {
    for (const l of MMR_LAYERS) {
      const fc = layerFC(l);
      expect(fc.features.length).toBeGreaterThanOrEqual(l.townships.length);
      for (const f of fc.features) expect(f.properties.layer).toBe(l.id);
    }
  });

  it('places both named sites on a township it actually has', () => {
    const pts = mmrSitePoints();
    expect(pts).toHaveLength(MMR_SITES.length);
    for (const p of pts) {
      expect(p.at[0]).toBeGreaterThan(91);
      expect(p.at[1]).toBeGreaterThan(9);
    }
  });

  it('reports every layer a township carries', () => {
    // Paletwa is both AA-administered and under martial law: the decree covers
    // ground the army does not hold, which is the point of keeping them apart.
    const ls = layersOf('Paletwa').map((l) => l.id).sort();
    expect(ls).toEqual(['aa', 'martial']);
    expect(layersOf('Yangon')).toHaveLength(0);
  });
});
