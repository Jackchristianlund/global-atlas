/**
 * Connectors for datasets Our World in Data redistributes on GitHub.
 * OWID processed data is CC BY 4.0; the underlying providers must also be
 * credited (UCDP, PRIO, SIPRI, Energy Institute, Ember, The Shift Data Portal).
 * Vintages differ per dataset and are recorded in the metadata — the archived
 * owid-datasets mirrors are NOT current and are labelled with their end year.
 */
import { getText } from '../http';
import { normalizeBatch } from '../normalize';
import { csvToObjects, num, validYear } from '../validate';
import type { Connector, ConnectorResult, CountryYearValue, DatasetMeta, RegionYearValue } from '../types';
import { SnapshotStore } from '../store';

const RAW = 'https://raw.githubusercontent.com';
const enc = (s: string) => encodeURIComponent(s);
const owidDatasetUrl = (folder: string) => `${RAW}/owid/owid-datasets/master/datasets/${enc(folder)}/${enc(folder)}.csv`;

function countryYearConnector(store: SnapshotStore, meta: DatasetMeta, url: string, columns: Record<string, string>): Connector<CountryYearValue> {
  return {
    meta,
    async fetch(): Promise<ConnectorResult<CountryYearValue>> {
      try {
        const rows = csvToObjects(await getText(url));
        const prepared = rows
          .map((r) => ({ entity: r.Entity ?? r.country ?? '', year: Number(r.Year ?? r.year), raw: r }))
          .filter((r) => r.entity && validYear(r.year, 1800, 2030));
        const { mapped, unmapped } = normalizeBatch(prepared);
        const records: CountryYearValue[] = mapped.map((m) => ({
          iso3: m.iso3,
          year: m.year,
          values: Object.fromEntries(Object.entries(columns).map(([out, col]) => [out, num(m.raw[col])])),
        }));
        const env = store.envelope(meta, records, unmapped);
        store.save(env);
        return { ok: true, envelope: env };
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : String(e) };
      }
    },
  };
}

function regionYearConnector(store: SnapshotStore, meta: DatasetMeta, url: string, columns: Record<string, string>): Connector<RegionYearValue> {
  return {
    meta,
    async fetch(): Promise<ConnectorResult<RegionYearValue>> {
      try {
        const rows = csvToObjects(await getText(url));
        const records: RegionYearValue[] = rows
          .filter((r) => r.Entity && validYear(Number(r.Year), 1900, 2030))
          .map((r) => ({
            region: r.Entity,
            year: Number(r.Year),
            values: Object.fromEntries(Object.entries(columns).map(([out, col]) => [out, num(r[col])])),
          }));
        const env = store.envelope(meta, records);
        store.save(env);
        return { ok: true, envelope: env };
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : String(e) };
      }
    },
  };
}

export function makeOwidConnectors(store: SnapshotStore) {
  const ucdpFolder = 'Conflict deaths by country – UCDP (2019)';
  const sipriFolder = 'SIPRI Military Expenditure Database';
  const prioDeathsFolder = 'State-based conflict deaths since 1946, by region and conflict type (PRIO; UCDP 2022)';
  const prioCountFolder = 'Number of state-based conflicts, by conflict type and region (UCDP-PRIO)';

  const ucdpCountryDeaths = countryYearConnector(
    store,
    {
      id: 'ucdp-country-deaths',
      name: 'Conflict deaths by country (UCDP GED 19.1)',
      providers: ['Uppsala Conflict Data Program (UCDP)', 'Our World in Data (processing)'],
      license: 'CC BY 4.0 (OWID processing); UCDP data free to use with citation',
      attribution: 'UCDP Georeferenced Event Dataset 19.1, aggregated by Our World in Data',
      url: owidDatasetUrl(ucdpFolder),
      cadence: 'Static mirror (UCDP itself updates annually)',
      vintage: '1989–2018 (GED 19.1, published 2019). NB: the file excludes Syria entirely — stated in the source’s own README.',
      access: 'Open',
      status: 'integrated',
    },
    owidDatasetUrl(ucdpFolder),
    { deaths: 'Violent deaths in conflicts and one-sided violence (UCDP 2019)' },
  );

  const sipriMilex = countryYearConnector(
    store,
    {
      id: 'sipri-milex',
      name: 'SIPRI Military Expenditure Database (OWID mirror)',
      providers: ['Stockholm International Peace Research Institute (SIPRI)', 'Our World in Data (processing)'],
      license: 'CC BY 4.0 (OWID processing); SIPRI data may be freely used with citation of SIPRI',
      attribution: 'SIPRI Military Expenditure Database, via Our World in Data; constant 2019 USD',
      url: owidDatasetUrl(sipriFolder),
      cadence: 'Static mirror (SIPRI updates annually in April)',
      vintage: '1949–2020',
      access: 'Open',
      status: 'integrated',
    },
    owidDatasetUrl(sipriFolder),
    { milex_usd: 'military_expenditure', milex_share_gdp: 'military_expenditure_share_gdp', milex_per_capita: 'military_expenditure_per_capita' },
  );

  const prioRegionDeaths = regionYearConnector(
    store,
    {
      id: 'prio-region-deaths',
      name: 'State-based conflict deaths by region and type (PRIO/UCDP)',
      providers: ['UCDP Battle-related Deaths Dataset; PRIO Battle Deaths Dataset', 'Our World in Data (processing)'],
      license: 'CC BY 4.0 (OWID processing); UCDP/PRIO free with citation',
      attribution: 'UCDP Battle-related Deaths 22.1 and PRIO Battle Deaths 3.1, via Our World in Data',
      url: owidDatasetUrl(prioDeathsFolder),
      cadence: 'Static mirror (UCDP updates annually)',
      vintage: '1946–2020',
      access: 'Open',
      status: 'integrated',
    },
    owidDatasetUrl(prioDeathsFolder),
    {
      civil: 'Deaths in civil conflicts',
      colonial: 'Deaths in colonial or imperial conflicts',
      civil_intl: 'Deaths in civil conflicts with foreign state intervention',
      interstate: 'Deaths in conflicts between states',
      all: 'Deaths in all state-based conflict types',
    },
  );

  const prioRegionCounts = regionYearConnector(
    store,
    {
      id: 'prio-region-counts',
      name: 'Number of state-based conflicts by region and type (UCDP/PRIO ACD 21.1)',
      providers: ['UCDP/PRIO Armed Conflict Dataset', 'Our World in Data (processing)'],
      license: 'CC BY 4.0 (OWID processing); UCDP/PRIO free with citation',
      attribution: 'UCDP/PRIO Armed Conflict Dataset 21.1, via Our World in Data',
      url: owidDatasetUrl(prioCountFolder),
      cadence: 'Static mirror (UCDP updates annually)',
      vintage: '1946–2020',
      access: 'Open',
      status: 'integrated',
    },
    owidDatasetUrl(prioCountFolder),
    {
      colonial: 'Number of colonial or imperial conflicts',
      interstate: 'Number of conflicts between states',
      civil: 'Number of civil conflicts',
      civil_intl: 'Number of civil conflicts with foreign state intervention',
      all: 'Number of conflicts (all types)',
    },
  );

  const energy = countryYearConnector(
    store,
    {
      id: 'owid-energy',
      name: 'Energy production and consumption (OWID energy dataset)',
      providers: ['Energy Institute – Statistical Review of World Energy (2025)', 'Ember', 'The Shift Data Portal', 'Our World in Data (processing)'],
      license: 'CC BY 4.0 (OWID); underlying Energy Institute data free for non-commercial use with attribution',
      attribution: 'Our World in Data energy dataset, based on the Energy Institute Statistical Review of World Energy (2025) and Ember',
      url: `${RAW}/owid/energy-data/master/owid-energy-data.csv`,
      cadence: 'OWID updates the file after each annual Statistical Review (and Ember releases)',
      vintage: 'Through 2024',
      access: 'Open',
      status: 'integrated',
    },
    `${RAW}/owid/energy-data/master/owid-energy-data.csv`,
    { oil_prod_twh: 'oil_production', gas_prod_twh: 'gas_production', oil_cons_twh: 'oil_consumption', gas_cons_twh: 'gas_consumption' },
  );

  return { ucdpCountryDeaths, sipriMilex, prioRegionDeaths, prioRegionCounts, energy };
}
