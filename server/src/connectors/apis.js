/**
 * Connectors for the official APIs. Fully implemented; they run wherever the
 * network allows the hosts (the hosted build environment does not — status
 * 'connector_ready' with blocked_reason). None of them fabricates fallback data:
 * a failed fetch is a failed fetch.
 */
import { getJson } from '../http';
import { normalizeCountry } from '../normalize';
import { dedupeEvents } from '../dedup';
import { validCoord, validISODate } from '../validate';
const BLOCKED = 'Host not on the build environment’s network allowlist; run `npm run ingest` where outbound HTTPS is open.';
const UCDP_TOV = { 1: 'state-based', 2: 'non-state', 3: 'one-sided' };
/**
 * `maxPages` is the ceiling on a full pull. GED 25.1 holds a few hundred
 * thousand events, so the default allows the whole dataset rather than the
 * first slice of it; the loop still stops as soon as the API reports no next
 * page. Override both from the CLI when you want a smaller sample.
 */
export function ucdpGed(store, version = '25.1', pagesize = 1000, maxPages = 800) {
    const meta = {
        id: 'ucdp-ged-api',
        name: `UCDP GED ${version} (official API)`,
        providers: ['Uppsala Conflict Data Program (UCDP)'],
        license: 'Free to use with citation (UCDP terms)',
        attribution: `UCDP Georeferenced Event Dataset ${version}`,
        url: `https://ucdpapi.pcr.uu.se/api/gedevents/${version}`,
        cadence: 'Annual release + monthly candidate data',
        vintage: `GED ${version}`,
        access: 'Open, paged',
        status: 'connector_ready',
        blocked_reason: BLOCKED,
    };
    return {
        meta,
        async fetch() {
            try {
                const events = [];
                let url = `${meta.url}?pagesize=${pagesize}&page=0`;
                for (let page = 0; url && page < maxPages; page++) {
                    const res = await getJson(url);
                    for (const r of res.Result) {
                        if (!validCoord(r.latitude, r.longitude))
                            continue; // reject, never patch
                        const date = r.date_start.slice(0, 10);
                        if (!validISODate(date))
                            continue;
                        const n = normalizeCountry(r.country);
                        events.push({
                            source: 'ucdp-ged', source_event_id: String(r.id), date,
                            iso3: n.kind === 'country' ? (n.iso3 ?? null) : null,
                            lat: r.latitude, lng: r.longitude,
                            actors: [r.side_a, r.side_b].filter(Boolean),
                            fatalities_best: Number.isFinite(r.best) ? r.best : null,
                            event_type: UCDP_TOV[r.type_of_violence] ?? String(r.type_of_violence),
                        });
                    }
                    url = res.NextPageUrl || null;
                }
                const { unique } = dedupeEvents(events);
                const env = store.envelope(meta, unique);
                store.save(env);
                return { ok: true, envelope: env };
            }
            catch (e) {
                return { ok: false, error: e instanceof Error ? e.message : String(e) };
            }
        },
    };
}
// ── ACLED (requires registered key; redistribution restricted) ──────────────
export function acled(store) {
    const meta = {
        id: 'acled',
        name: 'ACLED – Armed Conflict Location & Event Data',
        providers: ['ACLED'],
        license: 'ACLED Terms of Use: registration required; attribution required; bulk redistribution of raw data NOT permitted',
        attribution: 'Armed Conflict Location & Event Data (acleddata.com)',
        url: 'https://api.acleddata.com/acled/read',
        cadence: 'Weekly',
        vintage: 'Rolling',
        access: 'API key + registered email (ACLED_API_KEY, ACLED_EMAIL)',
        status: 'connector_ready',
        blocked_reason: `${BLOCKED} Also requires ACLED_API_KEY and ACLED_EMAIL. Because redistribution is restricted, snapshots of raw ACLED events must stay server-side; only aggregates may be published.`,
    };
    return {
        meta,
        async fetch() {
            const key = process.env.ACLED_API_KEY;
            const email = process.env.ACLED_EMAIL;
            if (!key || !email)
                return { ok: false, error: 'ACLED_API_KEY / ACLED_EMAIL not set' };
            try {
                const events = [];
                for (let page = 1; page <= 20; page++) {
                    const res = await getJson(`${meta.url}?key=${key}&email=${encodeURIComponent(email)}&limit=5000&page=${page}`);
                    if (!res.data?.length)
                        break;
                    for (const r of res.data) {
                        const lat = Number(r.latitude), lng = Number(r.longitude);
                        if (!validCoord(lat, lng) || !validISODate(r.event_date))
                            continue;
                        events.push({
                            source: 'acled', source_event_id: r.event_id_cnty, date: r.event_date,
                            iso3: /^[A-Z]{3}$/.test(r.iso3) ? r.iso3 : null, lat, lng,
                            actors: [r.actor1, r.actor2].filter(Boolean),
                            fatalities_best: Number.isFinite(Number(r.fatalities)) ? Number(r.fatalities) : null,
                            event_type: r.event_type,
                        });
                    }
                    if (res.data.length < 5000)
                        break;
                    await new Promise((r) => setTimeout(r, 1200)); // stay polite within rate limits
                }
                const { unique } = dedupeEvents(events);
                const env = store.envelope(meta, unique);
                store.save(env);
                return { ok: true, envelope: env };
            }
            catch (e) {
                return { ok: false, error: e instanceof Error ? e.message : String(e) };
            }
        },
    };
}
// ── UNHCR Refugee Data Finder (open API) ────────────────────────────────────
export function unhcrPopulation(store) {
    const meta = {
        id: 'unhcr-population',
        name: 'UNHCR Refugee Data Finder – population statistics',
        providers: ['UNHCR'],
        license: 'CC BY 4.0 IGO',
        attribution: 'UNHCR Refugee Data Finder',
        url: 'https://api.unhcr.org/population/v1/population/',
        cadence: 'Twice a year (Global Trends in June, Mid-Year Trends in Oct/Nov)',
        vintage: 'API returns through latest reporting year',
        access: 'Open',
        status: 'connector_ready',
        blocked_reason: BLOCKED,
    };
    return {
        meta,
        async fetch() {
            try {
                const records = [];
                let page = 1;
                for (;;) {
                    const res = await getJson(`${meta.url}?limit=1000&page=${page}&yearFrom=2000`);
                    for (const it of res.items) {
                        if (!/^[A-Z]{3}$/.test(it.coo_iso ?? ''))
                            continue;
                        records.push({ iso3: it.coo_iso, year: it.year, values: { refugees_from: it.refugees ?? null, idps: it.idps ?? null, asylum_from: it.asylum_seekers ?? null } });
                    }
                    if (page >= res.maxPages)
                        break;
                    page++;
                }
                const env = store.envelope(meta, records);
                store.save(env);
                return { ok: true, envelope: env };
            }
            catch (e) {
                return { ok: false, error: e instanceof Error ? e.message : String(e) };
            }
        },
    };
}
/**
 * The same API, read as corridors instead of totals: one record per
 * origin-and-asylum pair per year, so the question "where did people go" is
 * answerable from the snapshot. Internally displaced people have no country of
 * asylum and are therefore skipped here; they stay in `unhcr-population`.
 */
export function unhcrFlows(store) {
    const meta = {
        id: 'unhcr-flows',
        name: 'UNHCR Refugee Data Finder \u2013 displacement corridors (origin \u2192 country of asylum)',
        providers: ['UNHCR'],
        license: 'CC BY 4.0 IGO',
        attribution: 'UNHCR Refugee Data Finder',
        url: 'https://api.unhcr.org/population/v1/population/',
        cadence: 'Twice a year (Global Trends in June, Mid-Year Trends in Oct/Nov)',
        vintage: 'API returns through latest reporting year',
        access: 'Open',
        status: 'connector_ready',
        blocked_reason: BLOCKED,
    };
    return {
        meta,
        async fetch() {
            try {
                const records = [];
                let page = 1;
                for (;;) {
                    const res = await getJson(`${meta.url}?limit=1000&page=${page}&yearFrom=2000&coo_all=true&coa_all=true`);
                    for (const it of res.items) {
                        // Both ends must be real countries: an unmapped end is reported, never guessed.
                        if (!/^[A-Z]{3}$/.test(it.coo_iso ?? '') || !/^[A-Z]{3}$/.test(it.coa_iso ?? ''))
                            continue;
                        // A corridor crosses a border. Same-country rows are internal displacement.
                        if (it.coo_iso === it.coa_iso)
                            continue;
                        const values = {
                            refugees: it.refugees ?? null,
                            asylum_seekers: it.asylum_seekers ?? null,
                            others_of_concern: it.oip ?? null,
                            stateless: it.stateless ?? null,
                            returned_refugees: it.returned_refugees ?? null,
                        };
                        // Keep only rows that actually carry a count.
                        if (Object.values(values).every((v) => v === null || v === 0))
                            continue;
                        records.push({ origin_iso3: it.coo_iso, asylum_iso3: it.coa_iso, year: it.year, values });
                    }
                    if (page >= res.maxPages)
                        break;
                    page++;
                }
                const env = store.envelope(meta, records);
                store.save(env);
                return { ok: true, envelope: env };
            }
            catch (e) {
                return { ok: false, error: e instanceof Error ? e.message : String(e) };
            }
        },
    };
}
// ── World Bank indicators (open API) ────────────────────────────────────────
export function worldBank(store, indicators = { milex_share_gdp_wb: 'MS.MIL.XPND.GD.ZS', refugees_in: 'SM.POP.REFG' }) {
    const meta = {
        id: 'worldbank',
        name: 'World Bank World Development Indicators (selected series)',
        providers: ['World Bank', 'SIPRI (for MS.MIL.*)', 'UNHCR (for SM.POP.REFG)'],
        license: 'CC BY 4.0',
        attribution: 'World Development Indicators, The World Bank',
        url: 'https://api.worldbank.org/v2/',
        cadence: 'Quarterly WDI releases',
        vintage: 'API returns latest available year per series',
        access: 'Open',
        status: 'connector_ready',
        blocked_reason: BLOCKED,
    };
    return {
        meta,
        async fetch() {
            try {
                const byKey = new Map();
                for (const [out, code] of Object.entries(indicators)) {
                    for (let page = 1; page <= 20; page++) {
                        const res = await getJson(`${meta.url}country/all/indicator/${code}?format=json&per_page=2000&page=${page}&date=2000:2030`);
                        for (const r of res[1] ?? []) {
                            if (!/^[A-Z]{3}$/.test(r.countryiso3code) || !/^\d{4}$/.test(r.date))
                                continue;
                            const k = `${r.countryiso3code}:${r.date}`;
                            const rec = byKey.get(k) ?? { iso3: r.countryiso3code, year: Number(r.date), values: {} };
                            rec.values[out] = r.value;
                            byKey.set(k, rec);
                        }
                        if (page >= (res[0]?.pages ?? 1))
                            break;
                    }
                }
                const env = store.envelope(meta, [...byKey.values()]);
                store.save(env);
                return { ok: true, envelope: env };
            }
            catch (e) {
                return { ok: false, error: e instanceof Error ? e.message : String(e) };
            }
        },
    };
}
// ── IMF PortWatch (ArcGIS FeatureServer, open) ──────────────────────────────
export function portWatch(store) {
    const meta = {
        id: 'imf-portwatch',
        name: 'IMF PortWatch – daily chokepoint transit calls',
        providers: ['IMF & University of Oxford (PortWatch, based on AIS)'],
        license: 'Free with attribution (PortWatch terms)',
        attribution: 'IMF PortWatch (portwatch.imf.org), satellite AIS-based estimates',
        url: 'https://services9.arcgis.com/weJ1QsnbMYJlCHdG/arcgis/rest/services/Daily_Chokepoints_Data/FeatureServer/0/query',
        cadence: 'Daily, ~4-day lag',
        vintage: 'Rolling',
        access: 'Open',
        status: 'connector_ready',
        blocked_reason: BLOCKED,
    };
    return {
        meta,
        async fetch() {
            try {
                const q = `?where=1%3D1&outFields=portname,date,n_total&f=json&resultRecordCount=2000&orderByFields=date%20DESC`;
                const res = await getJson(meta.url + q);
                const records = (res.features ?? []).map((f) => ({
                    chokepoint: f.attributes.portname,
                    date: new Date(f.attributes.date).toISOString().slice(0, 10),
                    values: { transit_calls: Number.isFinite(f.attributes.n_total) ? f.attributes.n_total : null },
                }));
                const env = store.envelope(meta, records);
                store.save(env);
                return { ok: true, envelope: env };
            }
            catch (e) {
                return { ok: false, error: e instanceof Error ? e.message : String(e) };
            }
        },
    };
}
// ── UN Comtrade (key required for volume) ───────────────────────────────────
export function comtrade(store) {
    const meta = {
        id: 'un-comtrade',
        name: 'UN Comtrade – bilateral trade flows',
        providers: ['United Nations Statistics Division'],
        license: 'Free for non-commercial use with attribution; API key for meaningful volumes',
        attribution: 'UN Comtrade Database',
        url: 'https://comtradeapi.un.org/data/v1/get/C/A/HS',
        cadence: 'Continuous country submissions',
        vintage: 'Varies by reporter',
        access: 'API key (COMTRADE_KEY); strict rate limits',
        status: 'connector_ready',
        blocked_reason: `${BLOCKED} Also requires COMTRADE_KEY.`,
    };
    return {
        meta,
        async fetch() {
            const key = process.env.COMTRADE_KEY;
            if (!key)
                return { ok: false, error: 'COMTRADE_KEY not set' };
            try {
                const res = await getJson(`${meta.url}?reporterCode=all&period=2024&flowCode=X&cmdCode=TOTAL&partnerCode=0&subscription-key=${key}`);
                const records = (res.data ?? [])
                    .filter((r) => /^[A-Z]{3}$/.test(r.reporterISO))
                    .map((r) => ({ iso3: r.reporterISO, year: r.period, values: { exports_usd: r.primaryValue ?? null } }));
                const env = store.envelope(meta, records);
                store.save(env);
                return { ok: true, envelope: env };
            }
            catch (e) {
                return { ok: false, error: e instanceof Error ? e.message : String(e) };
            }
        },
    };
}
