/**
 * Export compact, provenance-carrying extracts for the frontend bundle.
 * Only integrated datasets are published; blocked/keyed sources never produce
 * placeholder files. Each file is { meta, ... } so the UI can show source,
 * licence, vintage and retrieval time next to every number.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
const liveMeta = (e) => ({
    id: e.dataset.id,
    name: e.dataset.name,
    providers: e.dataset.providers,
    license: e.dataset.license,
    attribution: e.dataset.attribution,
    url: e.dataset.url,
    vintage: e.dataset.vintage,
    retrieved_at: e.retrieved_at,
    record_count: e.record_count,
    sha256: e.sha256,
});
/** { meta, series: { ISO3: [[year, v1, v2…], …] }, keys: [names of v1, v2…] } */
function countrySeries(env, keys, fromYear) {
    const series = {};
    for (const r of env.records) {
        if (r.year < fromYear)
            continue;
        const vals = keys.map((k) => (r.values[k] ?? null));
        if (vals.every((v) => v === null))
            continue;
        (series[r.iso3] ??= []).push([r.year, ...vals]);
    }
    for (const k of Object.keys(series))
        series[k].sort((a, b) => a[0] - b[0]);
    return { meta: liveMeta(env), keys, series };
}
function regionSeries(env, keys) {
    const series = {};
    for (const r of env.records) {
        (series[r.region] ??= []).push([r.year, ...keys.map((k) => r.values[k] ?? null)]);
    }
    for (const k of Object.keys(series))
        series[k].sort((a, b) => a[0] - b[0]);
    return { meta: liveMeta(env), keys, series };
}
/**
 * Event-level UCDP GED, packed for the browser.
 *
 * Hundreds of thousands of points will not fit comfortably in the JS bundle, so
 * this file is written to `public/` and fetched only when the incident layer is
 * switched on. Rows are integer tuples rather than objects: at this volume the
 * field names would be most of the bytes.
 *
 * ACLED is deliberately absent. Its terms do not permit redistributing raw
 * events, so ACLED snapshots stay in the server-side store and only aggregates
 * may ever leave it. There is no code path here that writes them.
 */
export function packEvents(env, fromYear) {
    const iso = [];
    const isoIndex = new Map();
    // UCDP's types of violence, kept as the source's own labels and referenced by
    // index. Casting them to numbers would throw the distinction away.
    const types = [];
    const typeIndex = new Map();
    const rows = [];
    let lo = '9999-99-99';
    let hi = '';
    for (const e of env.records) {
        if (e.source !== 'ucdp-ged')
            continue; // never ACLED
        if (Number(e.date.slice(0, 4)) < fromYear)
            continue;
        let ti = typeIndex.get(e.event_type) ?? -1;
        if (ti === -1) {
            ti = types.length;
            types.push(e.event_type);
            typeIndex.set(e.event_type, ti);
        }
        let ii = -1;
        if (e.iso3) {
            ii = isoIndex.get(e.iso3) ?? -1;
            if (ii === -1) {
                ii = iso.length;
                iso.push(e.iso3);
                isoIndex.set(e.iso3, ii);
            }
        }
        rows.push([
            Math.round(e.lat * 100),
            Math.round(e.lng * 100),
            // Days since 1989-01-01, UCDP GED's own start; keeps the field small.
            Math.round((Date.parse(e.date) - Date.parse('1989-01-01')) / 86400000),
            e.fatalities_best ?? -1,
            ti,
            ii,
        ]);
        if (e.date < lo)
            lo = e.date;
        if (e.date > hi)
            hi = e.date;
    }
    rows.sort((a, b) => a[2] - b[2]);
    return {
        status: 'ingested',
        meta: liveMeta(env),
        // Fields of each row, in order. Coordinates are hundredths of a degree
        // (about 1 km); `day` counts days from the epoch below.
        fields: ['lat_e2', 'lng_e2', 'day', 'fatalities_best', 'type_index', 'iso_index'],
        epoch: '1989-01-01',
        from_year: fromYear,
        date_range: (rows.length ? [lo, hi] : null),
        iso,
        types,
        count: rows.length,
        events: rows,
    };
}
/** The file the app reads when no ingest has run: empty, and says why. */
export const NO_EVENTS = {
    status: 'not_ingested',
    meta: null,
    fields: ['lat_e2', 'lng_e2', 'day', 'fatalities_best', 'type_index', 'iso_index'],
    epoch: '1989-01-01',
    from_year: null,
    date_range: null,
    iso: [],
    types: [],
    count: 0,
    events: [],
    reason: 'No UCDP GED snapshot in the store. Run `npm run ingest` where outbound HTTPS reaches ucdpapi.pcr.uu.se.',
};
/**
 * Writes the event file into `public/data/`, so Vite serves it as a static
 * asset instead of bundling it. Always writes something: an app that fetches
 * this file must get a defined answer, not a 404 it has to interpret.
 */
export const UCDP_GED_DATASET_ID = 'ucdp-ged-api';
export function publishEvents(store, publicDir, fromYear = 1989) {
    mkdirSync(publicDir, { recursive: true });
    // The id the GED connector snapshots under. A mismatch here would leave the
    // layer silently empty after a successful ingest, so a test pins the pair.
    const env = store.latest(UCDP_GED_DATASET_ID);
    const packed = env ? packEvents(env, fromYear) : NO_EVENTS;
    writeFileSync(join(publicDir, 'ucdp_events.json'), JSON.stringify(packed));
    return { count: packed.count, ingested: packed.status === 'ingested' };
}
export function publishLive(store, outDir) {
    mkdirSync(outDir, { recursive: true });
    const written = [];
    const skipped = [];
    const w = (name, data) => {
        writeFileSync(join(outDir, name), JSON.stringify(data));
        written.push(name);
    };
    const ucdp = store.latest('ucdp-country-deaths');
    if (ucdp)
        w('ucdp_country_deaths.json', countrySeries(ucdp, ['deaths'], 1989));
    else
        skipped.push('ucdp-country-deaths');
    const sipri = store.latest('sipri-milex');
    if (sipri)
        w('sipri_milex.json', countrySeries(sipri, ['milex_usd', 'milex_share_gdp', 'milex_per_capita'], 1990));
    else
        skipped.push('sipri-milex');
    const energy = store.latest('owid-energy');
    if (energy)
        w('energy.json', countrySeries(energy, ['oil_prod_twh', 'gas_prod_twh', 'oil_cons_twh', 'gas_cons_twh'], 1990));
    else
        skipped.push('owid-energy');
    const deaths = store.latest('prio-region-deaths');
    if (deaths)
        w('prio_region_deaths.json', regionSeries(deaths, ['civil', 'colonial', 'civil_intl', 'interstate', 'all']));
    else
        skipped.push('prio-region-deaths');
    const counts = store.latest('prio-region-counts');
    if (counts)
        w('prio_region_counts.json', regionSeries(counts, ['civil', 'colonial', 'civil_intl', 'interstate', 'all']));
    else
        skipped.push('prio-region-counts');
    return { written, skipped };
}
/** Registry of every connector's metadata + live status, for the UI dataset panel. */
export function publishRegistry(store, metas, outDir) {
    const rows = metas.map((m) => {
        const latest = store.latest(m.id);
        return {
            ...m,
            retrieved_at: latest?.retrieved_at ?? null,
            record_count: latest?.record_count ?? null,
            history: store.history(m.id).length,
            unmapped: latest?.unmapped_entities ?? [],
        };
    });
    writeFileSync(join(outDir, 'registry.json'), JSON.stringify(rows, null, 1));
}
