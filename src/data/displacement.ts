import type { Iso, L } from '../types';

/**
 * Documented refugee corridors: where people fled from, and where they are hosted.
 *
 * Every figure is a count published by UNHCR for a stated date and basis. Bases
 * differ between sources — registered refugees, arrivals since a start date,
 * planning figures — so each flow states its own, and figures from different
 * bases are never added together. Internal displacement is counted separately
 * from refugees and is not drawn as a corridor, because it does not cross a border.
 */
export interface Flow {
  id: string;
  /** Country of origin and country of asylum. */
  from: Iso;
  to: Iso;
  /** People counted, on the basis given in `basis`. */
  people: number;
  /** What exactly was counted. */
  basis: L;
  note: L;
  /** The date the figure refers to. */
  d: string;
  /** The conflict this displacement belongs to, where the dataset holds one. */
  conflict?: string;
  s: string[];
}

export interface DisplacementTotal {
  id: string;
  label: L;
  value: L;
  basis: L;
  d: string;
  s: string[];
}

export const FLOWS: Flow[] = [
  // ── Sudan ──
  { id: 'fl-sdn-egy', from: 'SDN', to: 'EGY', people: 851947, d: '2026-06-30', conflict: 'sdn',
    basis: ['Registrerte sudanske flyktninger og asylsøkere', 'Registered Sudanese refugees and asylum seekers'],
    note: ['Sudanere utgjør 78 % av alle flyktninger i Egypt. Giza alene huset 569 800 flyktninger ved utgangen av 2025, de fleste sudanske.', 'Sudanese make up 78% of all refugees in Egypt. Giza alone hosted 569,800 refugees at the end of 2025, most of them Sudanese.'],
    s: ['unhcrSudanJun', 'unhcrPlaces'] },
  { id: 'fl-sdn-tcd', from: 'SDN', to: 'TCD', people: 935400, d: '2026-06-30', conflict: 'sdn',
    basis: ['Sudanske flyktninger ankommet siden april 2023', 'Sudanese refugees arrived since April 2023'],
    note: ['Tsjad har tatt imot flest sudanere. Flyktningbefolkningen i landet er mer enn tredoblet siden april 2023.', 'Chad has taken in the most Sudanese. The country’s refugee population has more than tripled since April 2023.'],
    s: ['unhcrSudanJun'] },
  { id: 'fl-sdn-ssd', from: 'SDN', to: 'SSD', people: 452080, d: '2026-06-30', conflict: 'sdn',
    basis: ['Sudanske flyktninger', 'Sudanese refugees'],
    note: ['I tillegg vendte 940 514 sørsudanere hjem over samme grense. Sør-Sudan har selv 2 millioner internt fordrevne.', 'A further 940,514 South Sudanese returned home across the same border. South Sudan itself has 2 million internally displaced people.'],
    s: ['unhcrSudanJun'] },
  { id: 'fl-sdn-uga', from: 'SDN', to: 'UGA', people: 95579, d: '2026-06-30', conflict: 'sdn',
    basis: ['Sudanske flyktninger', 'Sudanese refugees'],
    note: ['Uganda er et av sju naboland i UNHCRs regionale responsplan for Sudan.', 'Uganda is one of seven neighbouring countries in UNHCR’s regional response plan for Sudan.'],
    s: ['unhcrSudanJun'] },
  { id: 'fl-sdn-lby', from: 'SDN', to: 'LBY', people: 93831, d: '2026-06-30', conflict: 'sdn',
    basis: ['Sudanere registrert i Tripoli', 'Sudanese registered in Tripoli'],
    note: ['Kilden presiserer at langt flere er uregistrerte.', 'The source notes that many more are unregistered.'],
    s: ['unhcrSudanJun'] },
  { id: 'fl-ssd-sdn', from: 'SSD', to: 'SDN', people: 638747, d: '2026-03-31',
    basis: ['Sørsudanske flyktninger i Sudan (74,1 % av 862 277)', 'South Sudanese refugees in Sudan (74.1% of 862,277)'],
    note: ['Sudan huser selv flyktninger midt i sin egen krig. White Nile-delstaten alene huset 347 900 ved utgangen av 2025.', 'Sudan hosts refugees of its own in the middle of its war. White Nile state alone hosted 347,900 at the end of 2025.'],
    s: ['unhcrSudan3y', 'unhcrPlaces'] },

  // ── Ukraine ──
  { id: 'fl-ukr-pol', from: 'UKR', to: 'POL', people: 991000, d: '2025-08-06', conflict: 'ukr',
    basis: ['Ukrainske flyktninger i Polen', 'Ukrainian refugees in Poland'],
    note: ['Polen ble et av de største vertslandene fra 2022. Over 991 000 av landets om lag 1 million flyktninger er ukrainske.', 'Poland became one of the largest host countries from 2022. More than 991,000 of its roughly 1 million refugees are Ukrainian.'],
    s: ['concernHosts'] },
  { id: 'fl-ukr-deu', from: 'UKR', to: 'DEU', people: 1200000, d: '2026-06-11', conflict: 'ukr',
    basis: ['Ukrainske flyktninger i Tyskland (anslag innenfor Tysklands 2,7 millioner)', 'Ukrainian refugees in Germany (estimate within Germany’s 2.7 million)'],
    note: ['Tyskland var nest største vertsland i verden ved utgangen av 2025 med 2,7 millioner flyktninger i alt, der ukrainere og syrere utgjør de største gruppene. Fordelingen per nasjonalitet er ikke oppgitt i denne kilden.', 'Germany was the world’s second largest host country at the end of 2025 with 2.7 million refugees in all, of whom Ukrainians and Syrians form the largest groups. The source does not give the split by nationality.'],
    s: ['unhcrRDF', 'unhcrGT'] },

  // ── Syria ──
  { id: 'fl-syr-tur', from: 'SYR', to: 'TUR', people: 2400000, d: '2026-06-11', conflict: 'syr',
    basis: ['Flyktninger i Tyrkia i alt, nesten alle syrere', 'Total refugees in Türkiye, almost all Syrian'],
    note: ['Istanbul alene huset 399 200 syriske flyktninger ved utgangen av 2025. Antallet registrerte syrere falt i de fleste vertsland i 2025 etter Assad-regimets fall.', 'Istanbul alone hosted 399,200 Syrian refugees at the end of 2025. The number of registered Syrians fell in most host countries during 2025 after the fall of the Assad government.'],
    s: ['unhcrRDF', 'unhcrPlaces', 'unhcrGT'] },
  { id: 'fl-syr-lbn', from: 'SYR', to: 'LBN', people: 1120000, d: '2026-06-11', conflict: 'syr',
    basis: ['Syrere i Libanon, libanesiske myndigheters anslag', 'Syrians in Lebanon, Lebanese government estimate'],
    note: ['Libanon er verdens største vertsland per innbygger: om lag én av åtte i landet er flyktning.', 'Lebanon is the world’s largest host country per capita: about one in eight people in the country is a refugee.'],
    s: ['unhcrGT', 'unhcrMid25'] },

  // ── Afghanistan ──
  { id: 'fl-afg-irn', from: 'AFG', to: 'IRN', people: 1600000, d: '2025-12-31', conflict: 'afgpak',
    basis: ['Afghanske flyktninger og andre med behov for beskyttelse', 'Afghan refugees and others in need of international protection'],
    note: ['Fire av fem afghanske flyktninger er i Iran og Pakistan. I 2025 vendte om lag 2,9 millioner afghanere tilbake, de fleste ufrivillig etter endringer i vertslandenes politikk.', 'Four in five Afghan refugees are in Iran and Pakistan. In 2025 about 2.9 million Afghans returned, most involuntarily after changes in host-country policy.'],
    s: ['unhcrGT'] },
  { id: 'fl-afg-pak', from: 'AFG', to: 'PAK', people: 1300000, d: '2025-12-31', conflict: 'afgpak',
    basis: ['Afghanske flyktninger og andre med behov for beskyttelse', 'Afghan refugees and others in need of international protection'],
    note: ['Khyber Pakhtunkhwa alene huset 460 400 flyktninger og asylsøkere ved utgangen av 2025, de fleste afghanere.', 'Khyber Pakhtunkhwa alone hosted 460,400 refugees and asylum seekers at the end of 2025, most of them Afghan.'],
    s: ['unhcrGT', 'unhcrPlaces'] },

  // ── Myanmar, Somalia, Venezuela, DR Congo ──
  { id: 'fl-mmr-bgd', from: 'MMR', to: 'BGD', people: 1100000, d: '2025-12-31', conflict: 'mmr',
    basis: ['Flyktninger i Cox’s Bazar, nesten alle rohingyaer', 'Refugees in Cox’s Bazar, almost all Rohingya'],
    note: ['Verdens største enkeltsted for flyktninger siden 2018, fordelt på over 30 formelle leirer. Rohingyaene er også verdens største statsløse gruppe.', 'The world’s largest single location hosting refugees since 2018, across more than 30 formal settlements. The Rohingya are also the world’s largest stateless group.'],
    s: ['unhcrPlaces', 'unhcrGT'] },
  { id: 'fl-som-ken', from: 'SOM', to: 'KEN', people: 406700, d: '2025-12-31', conflict: 'som',
    basis: ['Flyktninger og asylsøkere i Dadaab, overveiende somaliske', 'Refugees and asylum seekers in Dadaab, predominantly Somali'],
    note: ['Dadaab er en av verdens eldste og største flyktningleirer.', 'Dadaab is one of the world’s oldest and largest refugee camps.'],
    s: ['unhcrPlaces'] },
  { id: 'fl-ven-col', from: 'VEN', to: 'COL', people: 2800000, d: '2025-12-31', conflict: 'ven',
    basis: ['Flyktninger og andre med behov for beskyttelse i Colombia', 'Refugees and others in need of international protection in Colombia'],
    note: ['Colombia var verdens største vertsland ved utgangen av 2025. Venezuela var samtidig det største opprinnelseslandet med 6,5 millioner.', 'Colombia was the world’s largest host country at the end of 2025. Venezuela was at the same time the largest country of origin, with 6.5 million.'],
    s: ['unhcrRDF', 'unhcrGT'] },
  { id: 'fl-ven-per', from: 'VEN', to: 'PER', people: 761100, d: '2025-12-31', conflict: 'ven',
    basis: ['Flyktninger og asylsøkere i Lima, nesten alle venezuelanske', 'Refugees and asylum seekers in Lima, almost all Venezuelan'],
    note: ['Tallet gjelder byen Lima alene.', 'The figure is for the city of Lima alone.'],
    s: ['unhcrPlaces'] },
  { id: 'fl-ven-chl', from: 'VEN', to: 'CHL', people: 437600, d: '2025-12-31', conflict: 'ven',
    basis: ['Venezuelanere i Santiago', 'Venezuelans in Santiago'],
    note: ['Tallet gjelder byen Santiago alene.', 'The figure is for the city of Santiago alone.'],
    s: ['unhcrPlaces'] },
];

/** Headline totals, each on its own stated basis. */
export const TOTALS: DisplacementTotal[] = [
  { id: 'tt-world', d: '2025-12-31', label: ['Tvangsfordrevne i verden', 'Forcibly displaced worldwide'], value: ['117,8 millioner', '117.8 million'],
    basis: ['Internt fordrevne, flyktninger og andre med behov for beskyttelse ved utgangen av 2025. Første nedgang på ti år.', 'Internally displaced people, refugees and others in need of international protection at the end of 2025. The first fall in a decade.'],
    s: ['unhcrGT', 'unhcrNordic', 'tocGT'] },
  { id: 'tt-origin', d: '2025-12-31', label: ['Seks opprinnelsesland står for sju av ti flyktninger', 'Six countries of origin account for seven in ten refugees'], value: ['Afghanistan, Sør-Sudan, Sudan, Syria, Ukraina, Venezuela', 'Afghanistan, South Sudan, Sudan, Syria, Ukraine, Venezuela'],
    basis: ['Flyktninger under UNHCRs mandat og andre med behov for internasjonal beskyttelse.', 'Refugees under UNHCR’s mandate and others in need of international protection.'],
    s: ['unhcrGT'] },
  { id: 'tt-returns', d: '2025-12-31', label: ['Flyktninger som vendte hjem i 2025', 'Refugees who returned home in 2025'], value: ['nær 4,4 millioner', 'nearly 4.4 million'],
    basis: ['Inkluderer om lag 1,3 millioner syrere etter Assad-regimets fall og om lag 2,9 millioner afghanere, der de fleste returene var ufrivillige.', 'Includes about 1.3 million Syrians after the fall of the Assad government and about 2.9 million Afghans, most of those returns involuntary.'],
    s: ['unhcrGT'] },
  { id: 'tt-sdn-idp', d: '2025-12-31', label: ['Internt fordrevne i Sudan', 'Internally displaced in Sudan'], value: ['9,1 millioner', '9.1 million'],
    basis: ['Verdens største interne fordrivelseskrise. Internt fordrevne krysser ingen grense og tegnes derfor ikke som korridor.', 'The world’s largest internal displacement crisis. Internally displaced people cross no border and are therefore not drawn as a corridor.'],
    s: ['unhcrGT', 'tocGT'] },
];
