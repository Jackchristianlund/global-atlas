/**
 * The front line month by month.
 *
 * OCHA publishes the ISW/CTP assessment as a dated monthly series alongside
 * the current line. Scrubbing it is the difference between "Russia holds about
 * four fifths of Donetsk oblast" and watching where the line actually moved
 * over a year — the same upgrade the current line got when it stopped being a
 * percentage.
 *
 * This is fetched, never bundled. Two reasons, and the second is the real one:
 * the series is 11 requests and about 75 KB, which is cheap over a network;
 * and it keeps moving. The current assessment advanced a week during the work
 * that built this, and a stored copy would have started ageing immediately.
 *
 * Where there is no network — a published artifact reaches no external host —
 * the layer reports that it is unavailable. It does not approximate, and it
 * does not quietly show one month while implying others.
 */
import { queryUrl, validateGeometry, type GeoJsonFeature } from './arcgis';

export const HISTORY_SERVICE =
  'https://gis.unocha.org/server/rest/services/Hosted/UKR_Front_Line_FLC/FeatureServer/8';

/** Ukraine plus a margin, to reject a feed in the wrong projection. */
const UKR_BBOX: [number, number, number, number] = [21.5, 43.8, 41.0, 53.0];

/** The months the series covers, as published. */
export const HISTORY_YEAR = 2026;
export const HISTORY_MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;
export type HistoryMonth = (typeof HISTORY_MONTHS)[number];

export interface MonthLine {
  month: HistoryMonth;
  /** [lat, lng] per vertex, ready for the globe. */
  segments: number[][][];
  vertices: number;
  /** The month name the service itself returned, not one computed here. */
  label: string;
}

export type MonthState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; line: MonthLine }
  | { status: 'unavailable'; reason: string };

const cache = new Map<number, MonthLine>();

/** Forget everything fetched, for tests. */
export function clearHistoryCache(): void {
  cache.clear();
}

export function cachedMonth(month: number): MonthLine | undefined {
  return cache.get(month);
}

/**
 * Fetches one month of the series. Resolves to an `unavailable` state rather
 * than throwing, because a missing month is a thing the interface has to say,
 * not an error it should swallow.
 */
export async function loadMonth(
  month: HistoryMonth,
  signal?: AbortSignal,
  fetchImpl: typeof fetch = fetch,
): Promise<MonthState> {
  const hit = cache.get(month);
  if (hit) return { status: 'ready', line: hit };

  const url = queryUrl(HISTORY_SERVICE, {
    where: `month_number=${month}`,
    outFields: 'objectid,month',
    precision: 4,
    toleranceDeg: 0.012,
  });

  try {
    const res = await fetchImpl(url, { signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = (await res.json()) as { features?: GeoJsonFeature[]; error?: { message: string } };
    if (body.error) throw new Error(body.error.message);
    const features = body.features ?? [];
    if (!features.length) throw new Error('no features');

    // The service returns the month it actually matched. If that disagrees
    // with what was asked for, the filter did not take, and drawing the answer
    // would put one month's line under another month's label.
    const months = new Set(features.map((f) => String(f.properties.month ?? '')));
    if (months.size !== 1) throw new Error(`mixed months: ${[...months].join(', ')}`);

    const check = validateGeometry(features, { bbox: UKR_BBOX, maxStepKm: 60 });
    if (!check.ok) throw new Error(`validation: ${check.errors[0]}`);

    const segments: number[][][] = [];
    for (const f of features) {
      if (f.geometry.type === 'LineString') {
        segments.push((f.geometry.coordinates as number[][]).map(([lon, lat]) => [lat, lon]));
      } else if (f.geometry.type === 'MultiLineString') {
        for (const part of f.geometry.coordinates as number[][][]) {
          segments.push(part.map(([lon, lat]) => [lat, lon]));
        }
      }
    }

    const line: MonthLine = {
      month,
      segments,
      vertices: check.vertices,
      label: [...months][0],
    };
    cache.set(month, line);
    return { status: 'ready', line };
  } catch (err) {
    if (signal?.aborted) throw err;
    return { status: 'unavailable', reason: err instanceof Error ? err.message : 'unreachable' };
  }
}

/** ISO date of the first of a month in the series, for labels. */
export function monthDate(month: HistoryMonth): string {
  return `${HISTORY_YEAR}-${String(month).padStart(2, '0')}-01`;
}
