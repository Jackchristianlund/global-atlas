import iso from 'i18n-iso-countries';
import en from 'i18n-iso-countries/langs/en.json';
import nb from 'i18n-iso-countries/langs/nb.json';
import type { Iso, L, Lang } from '../types';
import { centroid, type LatLng } from '../lib/geo';

iso.registerLocale(en);
iso.registerLocale(nb);

const OVERRIDE: Record<string, L> = {
  COD: ['DR Kongo', 'DR Congo'], COG: ['Kongo-Brazzaville', 'Congo (Brazzaville)'], KOR: ['Sør-Korea', 'South Korea'],
  SYR: ['Syria', 'Syria'], LAO: ['Laos', 'Laos'], MDA: ['Moldova', 'Moldova'], BRN: ['Brunei', 'Brunei'],
  FLK: ['Falklandsøyene', 'Falkland Islands'], GBR: ['Storbritannia', 'United Kingdom'], USA: ['USA', 'United States'],
  ARE: ['De forente arabiske emirater', 'United Arab Emirates'], PSE: ['Palestina', 'Palestine'], TWN: ['Taiwan', 'Taiwan'],
  XKX: ['Kosovo', 'Kosovo'], XNC: ['Nord-Kypros', 'Northern Cyprus'], XSL: ['Somaliland', 'Somaliland'],
};

/** Natural Earth features that carry no ISO numeric code. */
const NO_CODE: Record<string, Iso> = { Kosovo: 'XKX', 'N. Cyprus': 'XNC', Somaliland: 'XSL' };

export function countryName(code: Iso, lang: Lang): string {
  const o = OVERRIDE[code];
  if (o) return o[lang === 'no' ? 0 : 1];
  return iso.getName(code, lang === 'no' ? 'nb' : 'en', { select: 'alias' }) ?? code;
}

export const isKnownIso = (code: Iso) => code in OVERRIDE || iso.isValid(code);

/** Selectable countries: all ISO alpha-3 codes plus Kosovo. */
export const COUNTRY_CODES: Iso[] = [...Object.keys(iso.getAlpha3Codes()), 'XKX'];

export interface CountryFeature {
  type: 'Feature';
  geometry: { type: string; coordinates: unknown };
  properties: { iso: Iso; neName: string; centroid: LatLng };
}

/**
 * Places where the base map (Natural Earth, de facto boundaries) draws a line that is
 * contested. Shown as markers so that the drawn border is never read as a settled fact.
 */
export const DISPUTED: { id: string; name: L; at: LatLng; note: L }[] = [
  { id: 'd-crimea', name: ['Krim', 'Crimea'], at: [45.3, 34.4], note: ['Basiskartet tegner Krim som del av Russland (faktisk kontroll). Annekteringen i 2014 er ikke internasjonalt anerkjent. FNs generalforsamling regner Krim som ukrainsk.', 'The base map draws Crimea as part of Russia (de facto control). The 2014 annexation is not internationally recognised. The UN General Assembly regards Crimea as Ukrainian.'] },
  { id: 'd-donbas', name: ['Russiskokkuperte deler av Ukraina', 'Russian-occupied parts of Ukraine'], at: [47.6, 37.6], note: ['Basiskartet viser Ukrainas anerkjente grenser her. Russland okkuperer om lag 20 % av landet og krever fire regioner. Frontlinjen er ikke tegnet.', 'The base map shows Ukraine’s recognised borders here. Russia occupies about 20% of the country and claims four regions. The front line is not drawn.'] },
  { id: 'd-golan', name: ['Golanhøydene', 'Golan Heights'], at: [33.0, 35.75], note: ['Basiskartet tegner Golan som del av Israel. Området ble okkupert fra Syria i 1967. Israels annektering er anerkjent av USA, men ikke av FN.', 'The base map draws the Golan as part of Israel. It was occupied from Syria in 1967. Israel’s annexation is recognised by the United States but not by the UN.'] },
  { id: 'd-palestine', name: ['Vestbredden og Gaza', 'West Bank and Gaza'], at: [31.95, 35.25], note: ['Okkupert palestinsk område. Palestina er observatørstat i FN og anerkjent av et flertall av FNs medlemsland.', 'Occupied Palestinian territory. Palestine is a UN observer state recognised by a majority of UN members.'] },
  { id: 'd-kashmir', name: ['Kashmir', 'Kashmir'], at: [35.0, 76.0], note: ['India, Pakistan og Kina gjør krav på hele eller deler av området. Basiskartet følger faktisk kontroll, inkludert Aksai Chin under Kina.', 'India, Pakistan and China claim all or parts of the area. The base map follows de facto control, including Aksai Chin under China.'] },
  { id: 'd-wsahara', name: ['Vest-Sahara', 'Western Sahara'], at: [24.2, -13.5], note: ['Ikke-selvstyrt område ifølge FN. Marokko kontrollerer det meste. Polisario har utropt Den saharawiske republikk.', 'A non-self-governing territory according to the UN. Morocco controls most of it. Polisario has proclaimed the Sahrawi Republic.'] },
  { id: 'd-taiwan', name: ['Taiwan', 'Taiwan'], at: [23.7, 121.0], note: ['Styres som Republikken Kina. Folkerepublikken Kina gjør krav på øya. Taiwan er ikke medlem av FN.', 'Governed as the Republic of China. The People’s Republic of China claims the island. Taiwan is not a UN member.'] },
  { id: 'd-kosovo', name: ['Kosovo', 'Kosovo'], at: [42.6, 20.9], note: ['Erklærte selvstendighet i 2008. Anerkjent av rundt halvparten av FNs medlemsland, ikke av Serbia.', 'Declared independence in 2008. Recognised by about half of UN member states, not by Serbia.'] },
  { id: 'd-ncyprus', name: ['Nord-Kypros', 'Northern Cyprus'], at: [35.25, 33.6], note: ['Bare anerkjent av Tyrkia.', 'Recognised only by Turkey.'] },
  { id: 'd-somaliland', name: ['Somaliland', 'Somaliland'], at: [9.8, 46.2], note: ['Erklærte selvstendighet fra Somalia i 1991. Status er omstridt og anerkjennelsen svært begrenset.', 'Declared independence from Somalia in 1991. Its status is disputed and recognition is very limited.'] },
  { id: 'd-abkhazia', name: ['Abkhasia og Sør-Ossetia', 'Abkhazia and South Ossetia'], at: [42.6, 42.6], note: ['Utbryterområder i Georgia under russisk militær kontroll. Basiskartet viser dem som del av Georgia.', 'Breakaway regions of Georgia under Russian military control. The base map shows them as part of Georgia.'] },
];

/** Lazy-loaded so the 110m boundary file stays out of the first bundle. */
export async function loadWorld(): Promise<CountryFeature[]> {
  const [{ feature }, topo] = await Promise.all([import('topojson-client'), import('world-atlas/countries-110m.json')]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = (topo as any).default ?? topo;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fc = feature(t, t.objects.countries) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return fc.features.map((f: any) => {
    const code = (f.id && iso.numericToAlpha3(String(f.id))) || NO_CODE[f.properties.name] || `X${String(f.properties.name).slice(0, 2).toUpperCase()}`;
    return { type: 'Feature', geometry: f.geometry, properties: { iso: code, neName: f.properties.name, centroid: centroid(f.geometry) } };
  });
}
