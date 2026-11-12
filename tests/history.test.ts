import { beforeEach, describe, expect, it } from 'vitest';
import { HISTORY_MONTHS, clearHistoryCache, loadMonth, monthDate } from '../src/lib/frontlineHistory';

const feature = (coords: number[][], month = 'July') => ({
  type: 'Feature',
  properties: { objectid: 1, month },
  geometry: { type: 'LineString', coordinates: coords },
});
const ok = (body: unknown) =>
  (async () => ({ ok: true, status: 200, json: async () => body })) as unknown as typeof fetch;

beforeEach(clearHistoryCache);

describe('the monthly series', () => {
  it('covers the months the source publishes', () => {
    expect(HISTORY_MONTHS).toHaveLength(11);
    expect(monthDate(3)).toBe('2026-03-01');
  });

  it('turns a month into globe-ready segments', async () => {
    const r = await loadMonth(7, undefined, ok({ features: [feature([[36, 49], [36.1, 49.1]])] }));
    expect(r.status).toBe('ready');
    if (r.status !== 'ready') return;
    // Stored [lat, lng], which is what the globe uses.
    expect(r.line.segments[0][0]).toEqual([49, 36]);
    expect(r.line.vertices).toBe(2);
    expect(r.line.label).toBe('July');
  });

  it('refuses an answer whose month is not the month asked for', async () => {
    // The filter silently not taking is exactly the failure that would put
    // January's line on screen under July's label.
    const r = await loadMonth(7, undefined, ok({
      features: [feature([[36, 49], [36.1, 49.1]], 'July'), feature([[36, 49], [36.1, 49.1]], 'January')],
    }));
    expect(r.status).toBe('unavailable');
    if (r.status === 'unavailable') expect(r.reason).toMatch(/mixed months/);
  });

  it('refuses geometry in the wrong projection instead of drawing it', async () => {
    const r = await loadMonth(5, undefined, ok({ features: [feature([[3508016, 6651760], [3600000, 6600000]])] }));
    expect(r.status).toBe('unavailable');
    if (r.status === 'unavailable') expect(r.reason).toMatch(/validation|lon\/lat/);
  });

  it('refuses geometry outside Ukraine', async () => {
    const r = await loadMonth(5, undefined, ok({ features: [feature([[2.35, 48.85], [2.4, 48.9]])] }));
    expect(r.status).toBe('unavailable');
  });

  it('reports an empty month rather than an empty line', async () => {
    const r = await loadMonth(2, undefined, ok({ features: [] }));
    expect(r.status).toBe('unavailable');
    if (r.status === 'unavailable') expect(r.reason).toMatch(/no features/);
  });

  it('says it is unavailable when there is no network, and does not throw', async () => {
    const dead = (async () => { throw new Error('Failed to fetch'); }) as unknown as typeof fetch;
    const r = await loadMonth(4, undefined, dead);
    expect(r.status).toBe('unavailable');
    if (r.status === 'unavailable') expect(r.reason).toMatch(/Failed to fetch/);
  });

  it('reports an HTTP error as unavailable', async () => {
    const bad = (async () => ({ ok: false, status: 503, json: async () => ({}) })) as unknown as typeof fetch;
    const r = await loadMonth(6, undefined, bad);
    expect(r.status).toBe('unavailable');
  });

  it('fetches a month once and remembers it', async () => {
    let calls = 0;
    const counting = (async () => { calls++; return { ok: true, status: 200, json: async () => ({ features: [feature([[36, 49], [36.1, 49.1]])] }) }; }) as unknown as typeof fetch;
    await loadMonth(7, undefined, counting);
    await loadMonth(7, undefined, counting);
    await loadMonth(7, undefined, counting);
    expect(calls).toBe(1);
  });

  it('does not cache a failure, so a later attempt can succeed', async () => {
    const dead = (async () => { throw new Error('offline'); }) as unknown as typeof fetch;
    expect((await loadMonth(8, undefined, dead)).status).toBe('unavailable');
    const r = await loadMonth(8, undefined, ok({ features: [feature([[36, 49], [36.1, 49.1]], 'August')] }));
    expect(r.status).toBe('ready');
  });
});
