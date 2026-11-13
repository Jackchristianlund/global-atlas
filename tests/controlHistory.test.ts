// Control over time: ISW's archive against ISW now, as geometry both ways.
import { describe, expect, it } from 'vitest';
import { ARCHIVE_DAYS, ISW_MAY_2026, compareControl, dayQueryUrl, loadArchiveDay } from '../src/lib/controlHistory';

const sq = (x: number, y: number, w: number, h = w) => ({
  type: 'Feature' as const, properties: { kind: 'control' },
  geometry: { type: 'Polygon' as const, coordinates: [[[x, y], [x, y + h], [x + w, y + h], [x + w, y], [x, y]]] },
});

describe('control over time', () => {
  it('offers exactly the days the archive has: May 2026', () => {
    expect(ARCHIVE_DAYS).toHaveLength(31);
    expect(ARCHIVE_DAYS[0]).toBe('2026-05-01');
    expect(ARCHIVE_DAYS[30]).toBe('2026-05-31');
  });

  it('asks the archive for one day only, and refuses anything that is not a date', () => {
    const u = decodeURIComponent(dayQueryUrl('2026-05-14').replace(/\+/g, ' '));
    expect(u.startsWith(ISW_MAY_2026)).toBe(true);
    expect(u).toContain("timestamp '2026-05-14 00:00:00'");
    expect(u).toContain("timestamp '2026-05-14 23:59:59'");
    expect(() => dayQueryUrl("2026-05-01' OR 1=1 --")).toThrow();
  });

  it('measures ground gained and lost, both ways', () => {
    // Then: 2°×2°. Now: the same, extended 0.5° east, with 0.25° given up in the west.
    const then = [sq(36, 47, 2)];
    const now = [sq(36.25, 47, 2.25, 2)];
    const c = compareControl(now, then, '2026-05-01', '2026-11-12');
    expect(c.gainedKm2).toBeGreaterThan(c.lostKm2);
    // 0.5° × 2° at ~48°N ≈ 37 km × 222 km ≈ 8,300 km²; 0.25° strip ≈ 4,100 km².
    expect(c.gainedKm2).toBeGreaterThan(7_500);
    expect(c.gainedKm2).toBeLessThan(9_000);
    expect(c.lostKm2).toBeGreaterThan(3_700);
    expect(c.lostKm2).toBeLessThan(4_500);
    expect(c.bbox).not.toBeNull();
  });

  it('reports no change when the two assessments coincide, and ignores slivers', () => {
    const c = compareControl([sq(36, 47, 2)], [sq(36, 47, 2)], '2026-05-01', '2026-11-12');
    expect(c.gainedKm2).toBe(0);
    expect(c.lostKm2).toBe(0);
    expect(c.bbox).toBeNull();
    // A shift of a few metres, as two generalisations of the same line produce.
    const s = compareControl([sq(36.00002, 47, 2)], [sq(36, 47, 2)], '2026-05-01', '2026-11-12');
    expect(s.gained).toHaveLength(0);
  });

  it('refuses an archive answer that is empty or implausible', async () => {
    const respond = (b: unknown) => (async () => new Response(JSON.stringify(b))) as unknown as typeof fetch;
    await expect(loadArchiveDay('2026-05-02', respond({ features: [] }))).rejects.toThrow(/no archive snapshot/);
    await expect(loadArchiveDay('2026-05-02', respond({ features: [sq(36, 47, 0.1)] }))).rejects.toThrow(/implausible/);
    await expect(loadArchiveDay('2026-05-02', respond({ features: [sq(30, 45, 3, 2), sq(33, 45, 3, 2)] }))).resolves.toHaveLength(2);
  });
});
