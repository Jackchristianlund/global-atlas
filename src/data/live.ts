/**
 * Typed access to the ingested external datasets (see server/).
 * Every file carries its own meta: provider chain, licence, attribution,
 * vintage and retrieval time — shown in the UI next to every number.
 */
import energyJson from './live/energy.json';
import sipriJson from './live/sipri_milex.json';
import ucdpJson from './live/ucdp_country_deaths.json';
import prioDeathsJson from './live/prio_region_deaths.json';
import prioCountsJson from './live/prio_region_counts.json';
import registryJson from './live/registry.json';

export interface LiveMeta {
  id: string;
  name: string;
  providers: string[];
  license: string;
  attribution: string;
  url: string;
  vintage: string;
  retrieved_at: string;
  record_count: number;
  sha256: string;
}

export interface SeriesFile {
  meta: LiveMeta;
  keys: string[];
  /** entity -> rows of [year, v1, v2, …] aligned with keys. */
  series: Record<string, (number | null)[][]>;
}

export interface RegistryRow {
  id: string;
  name: string;
  providers: string[];
  license: string;
  attribution: string;
  url: string;
  cadence: string;
  vintage: string;
  access: string;
  status: 'integrated' | 'connector_ready' | 'planned';
  blocked_reason?: string;
  retrieved_at: string | null;
  record_count: number | null;
  history: number;
  unmapped: string[];
}

export const ENERGY = energyJson as SeriesFile;
export const SIPRI = sipriJson as SeriesFile;
export const UCDP_DEATHS = ucdpJson as SeriesFile;
export const PRIO_DEATHS = prioDeathsJson as SeriesFile;
export const PRIO_COUNTS = prioCountsJson as SeriesFile;
export const REGISTRY = registryJson as RegistryRow[];

/** Latest non-null value of `key` for `entity`, as { year, v }. */
export function latest(f: SeriesFile, entity: string, key: string): { year: number; v: number } | null {
  const ki = f.keys.indexOf(key) + 1;
  const rows = f.series[entity];
  if (!rows || ki === 0) return null;
  for (let i = rows.length - 1; i >= 0; i--) {
    const v = rows[i][ki];
    if (v !== null) return { year: rows[i][0] as number, v };
  }
  return null;
}

/** Value of `key` for `entity` in `year` (exact year, else null). */
export function at(f: SeriesFile, entity: string, key: string, year: number): number | null {
  const ki = f.keys.indexOf(key) + 1;
  const row = f.series[entity]?.find((r) => r[0] === year);
  return row && ki > 0 ? (row[ki] ?? null) : null;
}

export const REGION_NAMES: Record<string, [string, string]> = {
  Africa: ['Afrika', 'Africa'],
  Americas: ['Amerika', 'Americas'],
  'Asia & Oceania': ['Asia og Oseania', 'Asia & Oceania'],
  'Asia and Oceania': ['Asia og Oseania', 'Asia & Oceania'],
  Europe: ['Europa', 'Europe'],
  'Middle East': ['Midtøsten', 'Middle East'],
  World: ['Verden', 'World'],
};
