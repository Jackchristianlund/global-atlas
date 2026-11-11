/** Shared types for the ingestion service. */

export type DatasetStatus = 'integrated' | 'connector_ready' | 'planned';

export interface DatasetMeta {
  id: string;
  /** Human name of the dataset. */
  name: string;
  /** Who produced the underlying data (chain, outermost first). */
  providers: string[];
  /** Licence or terms of the copy we fetch. */
  license: string;
  /** Attribution line that must accompany any display of the data. */
  attribution: string;
  /** Where the fetched copy lives. */
  url: string;
  /** How often the upstream source updates. */
  cadence: string;
  /** Data vintage: the last period the fetched copy covers. */
  vintage: string;
  /** Access requirements (key, registration, none). */
  access: string;
  status: DatasetStatus;
  /** Why the connector cannot run here, when it cannot. */
  blocked_reason?: string;
}

/** Envelope written around every snapshot so provenance travels with the data. */
export interface SnapshotEnvelope<T> {
  dataset: DatasetMeta;
  retrieved_at: string; // ISO timestamp of the fetch
  sha256: string; // of the canonicalised records
  record_count: number;
  records: T[];
  /** Entities the normaliser could not map to ISO3 — kept visible, never silently dropped. */
  unmapped_entities?: string[];
}

export interface ConnectorResult<T> {
  ok: boolean;
  envelope?: SnapshotEnvelope<T>;
  error?: string;
}

export interface Connector<T = unknown> {
  meta: DatasetMeta;
  fetch(): Promise<ConnectorResult<T>>;
}

/** Country-year numeric observation, the common shape most sources normalise into. */
export interface CountryYearValue {
  iso3: string;
  year: number;
  values: Record<string, number | null>;
}

/**
 * A displacement corridor for one year: how many people from one country of
 * origin were counted in one country of asylum. The pair is kept intact because
 * collapsing it to a per-origin total loses where people actually went.
 */
export interface DisplacementFlowRecord {
  /** Country of origin (coo) and country of asylum (coa), ISO3. */
  origin_iso3: string;
  asylum_iso3: string;
  year: number;
  /** Each population type UNHCR reports separately; null where not reported. */
  values: Record<string, number | null>;
}

/** Region-year observation (UCDP/PRIO regional aggregates). */
export interface RegionYearValue {
  region: string;
  year: number;
  values: Record<string, number | null>;
}

/** A conflict event as normalised from event-level sources (UCDP GED, ACLED). */
export interface ConflictEvent {
  source: 'ucdp-ged' | 'acled';
  source_event_id: string;
  date: string; // ISO
  iso3: string | null;
  lat: number;
  lng: number;
  actors: string[];
  fatalities_best: number | null;
  event_type: string;
}
