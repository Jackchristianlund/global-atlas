import { describe, expect, it } from 'vitest';
import snapshot from '../src/data/frontline/ukr-ocha.json';
import { rebuild, type Snapshot } from '../scripts/refresh-frontline';

const current = snapshot as unknown as Snapshot;
const ms = (d: string) => Date.parse(`${d}T00:00:00Z`);
// The bundled segments as the service would send them, with a given date.
const response = (date: string) => ({
  type: 'FeatureCollection',
  features: current.features.map((f) => ({ ...f, properties: { objectid: f.id, date: ms(date) } })),
});
const next = (d: string, days: number) => new Date(ms(d) + days * 86400000).toISOString().slice(0, 10);

describe('weekly front-line refresh', () => {
  const base = current.metadata.assessmentDate;

  it('takes a newer assessment, keeping attribution and the realtime flag', () => {
    const r = rebuild(response(next(base, 7)), current, next(base, 9));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.snapshot.metadata.assessmentDate).toBe(next(base, 7));
    expect(r.snapshot.metadata.retrieved).toBe(next(base, 9));
    expect(r.snapshot.metadata.realtime).toBe(false);
    expect(r.snapshot.metadata.attribution).toBe(current.metadata.attribution);
    expect(r.snapshot.features.filter((f) => f.properties.part === 'main')).toHaveLength(1);
  });

  it('changes nothing when the service has nothing newer', () => {
    const r = rebuild(response(base), current, next(base, 3));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.unchanged).toBe(true);
  });

  it('refuses a date in the future, a missing date and a line outside Ukraine', () => {
    expect(rebuild(response(next(base, 30)), current, next(base, 1)).ok).toBe(false);
    const undated = response(next(base, 7));
    delete (undated.features[0].properties as { date?: number }).date;
    expect(rebuild(undated, current, next(base, 9)).ok).toBe(false);
    const moved = response(next(base, 7));
    moved.features[0] = { ...moved.features[0], geometry: { type: 'LineString', coordinates: [[2, 48], [2.1, 48.1]] } } as never;
    expect(rebuild(moved, current, next(base, 9)).ok).toBe(false);
  });

  it('refuses a service error', () => {
    expect(rebuild({ error: { message: 'down' } }, current, next(base, 1)).ok).toBe(false);
  });
});
