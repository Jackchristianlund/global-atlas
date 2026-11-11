import { describe, expect, it } from 'vitest';
import { belligerentColors, belligerentsInView, regionBbox, sharePercent, shareWeight, unitFill } from '../src/lib/territory';
import { simplifyPath, toleranceForView } from '../src/lib/simplify';
import type { ControlRecord } from '../src/data/territory';

const rec = (share?: string): ControlRecord =>
  ({
    iso: 'UKR', code: 'UA-14', actor: 'ua-rus', status: 'partial', d: '2026-10-30', s: [], note: ['', ''],
    ...(share ? { share: [share, share] as [string, string] } : {}),
  }) as ControlRecord;

describe('a unit is not a holding', () => {
  it('reads the percentage out of the words the source used', () => {
    // The dataset keeps a share as the source stated it, in both languages.
    expect(sharePercent(rec('om lag 79,7 %'))).toBeCloseTo(79.7, 5);
    expect(sharePercent(rec('about 98.7%'))).toBeCloseTo(98.7, 5);
    expect(sharePercent(rec('about 97%'))).toBe(97);
  });

  it('reports no percentage when the source gave none', () => {
    expect(sharePercent(rec('The whole governorate apart from Midi district.'))).toBeNull();
    expect(sharePercent(rec())).toBeNull();
  });

  it('weights the fill by the share actually held', () => {
    // An oblast a fifth occupied must not read like one held outright.
    expect(shareWeight(rec('about 20%'))).toBeLessThan(shareWeight(rec('about 99%')));
  });

  it('keeps a small documented holding visible rather than invisible', () => {
    expect(shareWeight(rec('about 0%'))).toBeGreaterThan(0.15);
  });

  it('treats a missing share as unmeasured, not as zero', () => {
    expect(shareWeight(rec())).toBe(1);
    expect(shareWeight(rec('The whole governorate apart from Midi district.'))).toBe(1);
  });

  it('never exceeds full weight, whatever the text says', () => {
    expect(shareWeight(rec('about 140%'))).toBeLessThanOrEqual(1);
  });

  it('produces a fainter fill for a partly held unit', () => {
    const alpha = (c: string) => Number(c.slice(c.lastIndexOf(',') + 1, -1));
    expect(alpha(unitFill(rec('about 20%')))).toBeLessThan(alpha(unitFill(rec('about 99%'))));
  });
});

describe('display simplification', () => {
  it('keeps the ends and drops only what cannot be seen', () => {
    const line: [number, number][] = [[0, 0], [1, 0.0001], [2, 0], [3, 0]];
    const out = simplifyPath(line, 0.01);
    expect(out[0]).toEqual([0, 0]);
    expect(out[out.length - 1]).toEqual([3, 0]);
    expect(out.length).toBeLessThan(line.length);
  });

  it('keeps a real detour', () => {
    const line: [number, number][] = [[0, 0], [1, 1], [2, 0]];
    expect(simplifyPath(line, 0.01)).toHaveLength(3);
  });

  it('never returns fewer than two points', () => {
    expect(simplifyPath([[0, 0], [1, 1]], 99).length).toBe(2);
  });

  it('asks for a looser tolerance the further the camera is', () => {
    expect(toleranceForView(3, 900)).toBeGreaterThan(toleranceForView(0.3, 900));
  });
});

describe('the sides of a conflict', () => {
  it('gives the invader and the invaded different colours', () => {
    const sides = belligerentColors('ukr');
    expect(sides.get('RUS')).toBeTruthy();
    expect(sides.get('UKR')).toBeTruthy();
    expect(sides.get('RUS')).not.toBe(sides.get('UKR'));
  });

  it('uses the same colours the control layer uses for those actors', () => {
    const sides = belligerentColors('ukr', 1);
    expect(sides.get('RUS')?.toLowerCase()).toContain('214,69,61');
    expect(sides.get('UKR')?.toLowerCase()).toContain('77,140,255');
  });

  it('draws a party far more faintly than a holding', () => {
    // Being a party to a war is not a claim of control, and the map must not
    // let the two read alike.
    const alpha = (c: string) => Number(c.slice(c.lastIndexOf(',') + 1, -1));
    const party = alpha(belligerentColors('ukr', 0.3).get('RUS')!);
    const holding = alpha(unitFill(rec('about 99%')));
    expect(party).toBeLessThan(holding);
  });

  it('shows the sides when the region is in view, with nothing selected', () => {
    // A reader who pans onto a war is looking at it whether or not they
    // clicked its name first.
    const b = regionBbox('ukraine')!;
    expect(b).not.toBeNull();
    const sides = belligerentsInView(b);
    expect(sides.get('RUS')).toBeTruthy();
    expect(sides.get('UKR')).toBeTruthy();
  });

  it('shows nothing for a view that is somewhere else entirely', () => {
    expect(belligerentsInView([-120, -40, -60, -10]).size).toBe(0);
  });

  it('stays quiet at a continental view, where the wash would swamp the map', () => {
    // Russia reaches Kamchatka. Shading it whole for a war fought in Ukraine
    // paints half the world red unless the reader is actually looking at
    // Ukraine.
    expect(belligerentsInView([-25, 10, 70, 70]).size).toBe(0);
    expect(belligerentsInView([-180, -85, 180, 85]).size).toBe(0);
  });

  it('needs overlap on both axes, not just one', () => {
    // Same longitudes as Ukraine, far to the south: not in view.
    expect(belligerentsInView([22, -30, 40, -10]).size).toBe(0);
    // Same latitudes, far to the west.
    expect(belligerentsInView([-60, 44, -40, 52]).size).toBe(0);
  });

  it('says nothing about conflicts whose sides are not recorded', () => {
    // Silence is the honest answer: inventing sides is exactly the failure
    // this project exists to avoid.
    expect(belligerentColors('syr').size).toBe(0);
    expect(belligerentColors('nonexistent').size).toBe(0);
  });
});

describe('an explicitly chosen conflict', () => {
  it('shows its sides whatever the camera is doing', () => {
    // The reader asked about that war; the view no longer has to argue for it.
    const world: [number, number, number, number] = [-180, -85, 180, 85];
    expect(belligerentsInView(world, 0.3).size).toBe(0);
    expect(belligerentsInView(world, 0.3, 'ukr').get('RUS')).toBeTruthy();
  });

  it('still shows nothing for a conflict with no recorded sides', () => {
    expect(belligerentsInView([-180, -85, 180, 85], 0.3, 'syr').size).toBe(0);
  });
});
