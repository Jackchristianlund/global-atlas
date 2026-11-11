/**
 * Country-name normalisation to stable ISO 3166-1 alpha-3 identifiers.
 * Names are the least stable key in cross-source joins ("Russia" vs "Russian
 * Federation" vs "USSR"), so everything is forced through this module, and
 * anything that cannot be mapped is reported — never guessed and never dropped
 * silently.
 */
import iso from 'i18n-iso-countries';
import en from 'i18n-iso-countries/langs/en.json' with { type: 'json' };
iso.registerLocale(en);
/** Aliases seen in OWID, UCDP, SIPRI, World Bank and ACLED exports. */
const ALIAS = {
    'democratic republic of congo': 'COD',
    'democratic republic of the congo': 'COD',
    'dr congo': 'COD',
    'congo, dem. rep.': 'COD',
    congo: 'COG',
    'congo, rep.': 'COG',
    'congo (brazzaville)': 'COG',
    'congo (kinshasa)': 'COD',
    "cote d'ivoire": 'CIV',
    "côte d'ivoire": 'CIV',
    'ivory coast': 'CIV',
    russia: 'RUS',
    'russian federation': 'RUS',
    syria: 'SYR',
    'syrian arab republic': 'SYR',
    iran: 'IRN',
    'iran, islamic rep.': 'IRN',
    'iran (islamic republic of)': 'IRN',
    laos: 'LAO',
    'lao pdr': 'LAO',
    vietnam: 'VNM',
    'viet nam': 'VNM',
    'south korea': 'KOR',
    'korea, rep.': 'KOR',
    'republic of korea': 'KOR',
    'north korea': 'PRK',
    "korea, dem. people's rep.": 'PRK',
    'democratic people’s republic of korea': 'PRK',
    moldova: 'MDA',
    'moldova, rep.': 'MDA',
    tanzania: 'TZA',
    'united republic of tanzania': 'TZA',
    'united states': 'USA',
    'united states of america': 'USA',
    'united kingdom': 'GBR',
    bolivia: 'BOL',
    'bolivia (plurinational state of)': 'BOL',
    venezuela: 'VEN',
    'venezuela, rb': 'VEN',
    'venezuela (bolivarian republic of)': 'VEN',
    brunei: 'BRN',
    'brunei darussalam': 'BRN',
    'cape verde': 'CPV',
    'cabo verde': 'CPV',
    czechia: 'CZE',
    'czech republic': 'CZE',
    'east timor': 'TLS',
    'timor-leste': 'TLS',
    'timor leste': 'TLS',
    egypt: 'EGY',
    'egypt, arab rep.': 'EGY',
    eswatini: 'SWZ',
    swaziland: 'SWZ',
    gambia: 'GMB',
    'gambia, the': 'GMB',
    'the gambia': 'GMB',
    kyrgyzstan: 'KGZ',
    'kyrgyz republic': 'KGZ',
    'macedonia': 'MKD',
    'north macedonia': 'MKD',
    'micronesia (country)': 'FSM',
    'micronesia (fed. states of)': 'FSM',
    myanmar: 'MMR',
    burma: 'MMR',
    palestine: 'PSE',
    'state of palestine': 'PSE',
    'west bank and gaza': 'PSE',
    'palestine/gaza': 'PSE',
    'palestine/west bank': 'PSE',
    slovakia: 'SVK',
    'slovak republic': 'SVK',
    'saint kitts and nevis': 'KNA',
    'st. kitts and nevis': 'KNA',
    'saint lucia': 'LCA',
    'st. lucia': 'LCA',
    'saint vincent and the grenadines': 'VCT',
    'st. vincent and the grenadines': 'VCT',
    turkey: 'TUR',
    turkiye: 'TUR',
    'türkiye': 'TUR',
    'united arab emirates': 'ARE',
    uae: 'ARE',
    yemen: 'YEM',
    'yemen, rep.': 'YEM',
    kosovo: 'XKX',
    'bosnia and herzegovina': 'BIH',
    'bosnia-herzegovina': 'BIH',
    brunei_: 'BRN',
    'hong kong': 'HKG',
    'hong kong sar, china': 'HKG',
    'macao': 'MAC',
    'macao sar, china': 'MAC',
    taiwan: 'TWN',
    'china, taiwan province of': 'TWN',
    'cambodia (kampuchea)': 'KHM',
    'madagascar (malagasy)': 'MDG',
    'myanmar (burma)': 'MMR',
    'zimbabwe (rhodesia)': 'ZWE',
    'yemen (north yemen)': 'YEM',
    'vietnam (north vietnam)': 'VNM',
    'serbia (yugoslavia)': 'SRB',
    'rumania': 'ROU',
};
/** Entities that are real in the sources but are not of today's countries. */
const REGIONS = new Set(['africa', 'americas', 'asia', 'asia and oceania', 'europe', 'middle east', 'oceania', 'north america', 'south america',
    'european union', 'european union (27)', 'high income', 'low income', 'lower middle income', 'upper middle income',
    'eu28', 'africa (owid)', 'asia (owid)', 'europe (owid)'].map((s) => s));
const WORLD = new Set(['world', 'global', 'total']);
const HISTORICAL = new Set([
    'ussr', 'soviet union', 'yugoslavia', 'czechoslovakia', 'east germany', 'west germany', 'german democratic republic',
    'federal republic of germany', 'yemen arab republic', "yemen people's republic", 'south yemen', 'north yemen',
    'republic of vietnam', 'south vietnam', 'serbia and montenegro', 'zanzibar', 'hyderabad', 'ottoman empire',
    'austria-hungary', 'korea', 'german federal republic',
]);
export function normalizeCountry(name) {
    const input = name;
    const n = name.trim().toLowerCase();
    if (WORLD.has(n))
        return { kind: 'world', input };
    if (REGIONS.has(n))
        return { kind: 'region', input };
    if (HISTORICAL.has(n))
        return { kind: 'historical', input };
    if (ALIAS[n])
        return { kind: 'country', iso3: ALIAS[n], input };
    const code = iso.getAlpha3Code(name.trim(), 'en');
    if (code)
        return { kind: 'country', iso3: code, input };
    // ISO code given directly?
    const up = name.trim().toUpperCase();
    if (/^[A-Z]{3}$/.test(up) && (iso.isValid(up) || up === 'XKX'))
        return { kind: 'country', iso3: up, input };
    return { kind: 'unknown', input };
}
/** Normalise a batch; returns mapped rows and the distinct unmapped entity names. */
export function normalizeBatch(rows) {
    const mapped = [];
    const unmapped = new Set();
    for (const r of rows) {
        const n = normalizeCountry(r.entity);
        if (n.kind === 'country' && n.iso3)
            mapped.push({ ...r, iso3: n.iso3 });
        else if (n.kind === 'unknown')
            unmapped.add(r.entity);
        // regions/world/historical are intentionally excluded from country joins
    }
    return { mapped, unmapped: [...unmapped].sort() };
}
