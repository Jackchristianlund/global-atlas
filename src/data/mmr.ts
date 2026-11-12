import type { L } from '../types';

/**
 * Myanmar, at township level.
 *
 * WHY THIS FILE EXISTS SEPARATELY. The rest of the atlas assigns control to
 * first-level administrative units. For Myanmar that would be a lie: the war is
 * counted, fought and reported township by township, and a township's state says
 * close to nothing about who runs it. Sagaing Region holds both the junta's
 * garrison towns and the countryside around them. So Myanmar's states are left
 * uncoloured (see NO_CONTROL in territory.ts) and these 330 townships carry the
 * detail instead.
 *
 * WHAT IS DELIBERATELY MISSING. There is no national control map here, because
 * no source publishes one. Nobody assigns all 330 townships to an actor at a
 * current date: the junta's own figures, the resistance's claims and the
 * monitors' counts disagree, and BTI's 2026 review says plainly that the rival
 * claims are hard to verify. Inventing the missing 270 townships would be the
 * single easiest way to make this map look authoritative and be wrong.
 *
 * WHAT IS HERE. Three things that are named, dated and documented:
 *   - who administers Rakhine, where every source agrees on the same townships;
 *   - the two areas run under the 1989 ceasefires, which are constitutional
 *     geography rather than battlefield geography;
 *   - the junta's own martial-law decree, which is a legal act and not a claim
 *     of control — in several places it marks ground the army has lost.
 * Each layer states on the map what it asserts and what it does not.
 */

export type MmrLayerKind =
  /** An authority that actually runs the townships, with civil departments. */
  | 'administration'
  /** Autonomy recognised in law or by long-standing ceasefire, not an active front. */
  | 'autonomy'
  /** A legal designation by the state. Says nothing by itself about who holds the ground. */
  | 'legal'
  /** Named in the sources, but the sources disagree about who holds it. */
  | 'disputed';

export interface MmrLayer {
  id: string;
  kind: MmrLayerKind;
  name: L;
  /** What the colour asserts — and, where it matters more, what it does not. */
  means: L;
  color: string;
  /** Whether the map fills the townships or only outlines them. */
  fill: boolean;
  /** The date the decree or assessment refers to. */
  d: string;
  /** Township names, spelled as in the boundary data. */
  townships: string[];
  /** How the list was arrived at, where that is not simply "the source lists them". */
  derivation?: L;
  s: string[];
}

/**
 * Rakhine, plus Paletwa in Chin.
 *
 * This is the one part of Myanmar where the township-level picture is not in
 * doubt. Three independent routes give the same 14 Rakhine townships: the
 * Arakan Army's own capture record, ISP-Myanmar's finding that it holds 92.6%
 * of the state, and the junta's martial-law decree, which covers all of Rakhine
 * except Sittwe, Kyaukpyu and Munaung — the three the AA does not hold. The
 * ULA/AA runs courts, schools and health services here through the Arakan
 * People's Revolutionary Government, which is why this is 'administration'
 * rather than a front line.
 */
const AA: MmrLayer = {
  id: 'aa',
  kind: 'administration',
  name: ['ULA/AA-administrasjon', 'ULA/AA administration'],
  means: [
    'Townships der Arakan Army og United League of Arakan styrer sivilt: domstoler, skoler og helsetjenester under Arakan People’s Revolutionary Government. Dette er ikke en påstand om suverenitet, og ikke en frontlinje.',
    'Townships the Arakan Army and United League of Arakan administer: courts, schools and health services under the Arakan People’s Revolutionary Government. This is not a claim of sovereignty, and not a front line.',
  ],
  color: '#C9742E',
  fill: true,
  d: '2026-10-19',
  townships: [
    'Ann', 'Buthidaung', 'Gwa', 'Kyauktaw', 'Maungdaw', 'Minbya', 'Mrauk-U', 'Myebon',
    'Pauktaw', 'Ponnagyun', 'Ramree', 'Rathedaung', 'Thandwe', 'Toungup',
    'Paletwa',
  ],
  derivation: [
    'De 14 i Rakhine er delstatens 17 townships minus Sittwe, Kyaukpyu og Munaung. Paletwa ligger i Chin. Kildene oppgir 15 townships samlet, og de tre uavhengige listene gir de samme navnene.',
    'The 14 in Rakhine are the state’s 17 townships minus Sittwe, Kyaukpyu and Munaung. Paletwa is in Chin. The sources state 15 townships in total, and the three independent lists name the same ones.',
  ],
  s: ['wikiAAterr', 'ispMmrAA', 'dmgMartial'],
};

/**
 * The Wa Self-Administered Division, where the UWSA has governed since the 1989
 * ceasefire. Four of its six constitutional townships are listed here; Hopang
 * and Matman are not, because the sources disagree about them (see WA_UNCLEAR).
 */
const WA: MmrLayer = {
  id: 'wa',
  kind: 'autonomy',
  name: ['Wa (UWSA, selvstyre fra 1989)', 'Wa (UWSA, self-rule since 1989)'],
  means: [
    'Grunnlovsfestet selvstyreområde som United Wa State Army har styrt siden våpenhvilen i 1989, med egne skoler, sykehus, domstoler og politi. Området er ikke i strid, og er derfor tegnet annerledes enn en frontlinje.',
    'A constitutional self-administered area the United Wa State Army has run since the 1989 ceasefire, with its own schools, hospitals, courts and police. It is not in combat, and is therefore drawn differently from a front line.',
  ],
  color: '#2E9B9B',
  fill: true,
  d: '2026-11-12',
  townships: ['Mongmao', 'Pangwaun', 'Narphan', 'Pangsang'],
  derivation: [
    'Grunnloven av 2008 § 56 utpeker seks townships til Wa-divisjonen. Hopang og Matman er holdt utenfor dette laget fordi kildene gir ulike svar på hvem som styrer dem.',
    'The 2008 constitution, section 56, designates six townships as the Wa division. Hopang and Matman are kept out of this layer because the sources give different answers about who runs them.',
  ],
  s: ['wikiUwsa', 'shanWaSad'],
};

/**
 * Hopang and Matman. Shown, but shown as unresolved.
 *
 * Reporting on these two runs in opposite directions: that Hopang stayed under
 * central control for 34 years, that it was handed to the UWSA in 2023, that the
 * MNDAA took it in January 2024 with UWSA troops moving in afterwards, and that
 * it was the one Wa township on the junta's martial-law list. The atlas does not
 * pick a winner between those accounts.
 */
const WA_UNCLEAR: MmrLayer = {
  id: 'wa-unclear',
  kind: 'disputed',
  name: ['Wa-townships med uklar status', 'Wa townships of unclear status'],
  means: [
    'Hopang og Matman hører til Wa-divisjonen i grunnloven, men kildene gir motstridende opplysninger om hvem som faktisk styrer dem i 2026. Fargen betyr uenighet mellom kilder, ikke delt kontroll på bakken.',
    'Hopang and Matman belong to the Wa division in the constitution, but the sources conflict on who actually runs them in 2026. The colour marks disagreement between sources, not split control on the ground.',
  ],
  color: '#8894A8',
  fill: true,
  d: '2026-11-12',
  townships: ['Hopang', 'Matman'],
  s: ['wikiUwsa', 'rfaHopang', 'shanWaSad'],
};

/** Mongla, Shan State Special Region 4, run by the NDAA since the same 1989 ceasefire. */
const NDAA: MmrLayer = {
  id: 'ndaa',
  kind: 'autonomy',
  name: ['Mongla (NDAA, spesialregion 4)', 'Mongla (NDAA, Special Region 4)'],
  means: [
    'Spesialregion 4, styrt av National Democratic Alliance Army siden våpenhvilen i 1989. Området er ikke grunnlovsfestet som selvstyreområde, og NDAA krever at det blir det.',
    'Special Region 4, administered by the National Democratic Alliance Army since the 1989 ceasefire. It is not constitutionally designated as a self-administered area, and the NDAA is demanding that it should be.',
  ],
  color: '#3FA8A0',
  fill: true,
  d: '2026-11-12',
  townships: ['Mongla'],
  s: ['ispNdaa', 'shanWaSad'],
};

/**
 * Martial law, as extended on 18 October 2026.
 *
 * Read this layer carefully. It is the state's own decree transferring security,
 * administration and judicial authority to regional military commanders. It is
 * not a control map, and analysts read it the other way round: the list takes in
 * ground the army has lost, and areas run by ethnic armed organisations that
 * already hold ceasefire understandings with it. Fourteen of the 55 are the
 * townships the Arakan Army administers.
 *
 * The 55 are reconstructed, and the arithmetic closes exactly. The order of
 * 23 April 2026 named 60 townships; IMNA enumerated 59 of them and ISP-Myanmar's
 * per-state breakdown accounts for the 60th as the one Mandalay township, which
 * DMG later names as Nganzun when it is removed. Falam and one neighbouring Chin
 * township went on 22 July, taking the list to 58, and Nganzun, Kyaukme and
 * Hsipaw went on 18 October, taking it to 55. Reports differ on whether the
 * second Chin township removed in July was Tedim or Tonzang; the five Chin
 * townships that remain are the same either way.
 */
const MARTIAL: MmrLayer = {
  id: 'martial',
  kind: 'legal',
  name: ['Krigsrett (juntaens kunngjøring)', 'Martial law (junta decree)'],
  means: [
    'Townships der militæret har overtatt sikkerhet, forvaltning og domsmyndighet ved dekret. Dette er en rettslig status, ikke kontroll: listen omfatter områder hæren har mistet, og områder etniske grupper styrer under våpenhvile. 14 av de 55 er townships Arakan Army administrerer.',
    'Townships where the military has taken over security, administration and judicial authority by decree. This is a legal status, not control: the list takes in ground the army has lost, and areas ethnic armed groups run under ceasefire. Fourteen of the 55 are townships the Arakan Army administers.',
  ],
  color: '#E2B13C',
  fill: false,
  d: '2026-10-18',
  townships: [
    // Rakhine (14)
    'Ann', 'Buthidaung', 'Gwa', 'Kyauktaw', 'Maungdaw', 'Minbya', 'Mrauk-U', 'Myebon',
    'Pauktaw', 'Ponnagyun', 'Ramree', 'Rathedaung', 'Thandwe', 'Toungup',
    // Kachin (5)
    'Sumprabum', 'Shwegu', 'Injangyang', 'Tsawlaw', 'Chipwi',
    // Kayah (3)
    'Shadaw', 'Hpasawng', 'Mese',
    // Kayin (2)
    'Kawkareik', 'Kyainseikgyi',
    // Chin (5)
    'Kanpetlet', 'Thantlang', 'Paletwa', 'Mindat', 'Matupi',
    // Sagaing (8)
    'Kawlin', 'Pinlebu', 'Khin-U', 'Wetlet', 'Kani', 'Tabayin', 'Pale', 'Indaw',
    // Magway (5)
    'Pauk', 'Myaing', 'Saw', 'Tilin', 'Yesagyo',
    // Shan (13)
    'Namtu', 'Mabein', 'Kutkai', 'Namhkan', 'Hseni', 'Kunlong', 'Namhsan', 'Manton',
    'Hopang', 'Laukkaing', 'Konkyan', 'Mongmit', 'Mongla',
  ],
  derivation: [
    '60 townships 23. april 2026, minus Falam og én nabo-township i Chin 22. juli (58), minus Nganzun, Kyaukme og Hsipaw 18. oktober (55). Regnestykket stemmer med tallet kildene oppgir. Fire navn er stavet annerledes i grensedataene: Depayin/Tabayin, Htilin/Tilin, Momeik/Mongmit, Nganzun/Ngazun.',
    '60 townships on 23 April 2026, less Falam and one neighbouring Chin township on 22 July (58), less Nganzun, Kyaukme and Hsipaw on 18 October (55). The arithmetic matches the figure the sources give. Four names are spelled differently in the boundary data: Depayin/Tabayin, Htilin/Tilin, Momeik/Mongmit, Nganzun/Ngazun.',
  ],
  s: ['dmgMartial', 'imnaMartial', 'ispMmrML', 'taipeiMartial'],
};

export const MMR_LAYERS: MmrLayer[] = [AA, WA, WA_UNCLEAR, NDAA, MARTIAL];

/** Shown on the detail map so the gap is visible rather than implied. */
export const MMR_GAP: L = [
  'Omtrent 270 av 330 townships står uten lag her. Det er ikke en feil: ingen kilde fordeler alle townships på aktører med en oppdatert dato, og juntaens, motstandens og overvåkernes egne tall spriker. Resten av bildet står som tall i panelet, ikke som farge på kartet.',
  'About 270 of 330 townships carry no layer here. That is not an omission: no source assigns every township to an actor at a current date, and the junta’s, the resistance’s and the monitors’ own counts diverge. The rest of the picture is given as figures in the panel, not as colour on the map.',
];

/**
 * Where this war reaches past its borders, tied to named townships.
 *
 * Both of these are the reason Myanmar's war is not a regional story. One sits
 * on the heavy rare earths that the world's magnets depend on; the other is the
 * industrial base of online fraud aimed at people on every continent.
 */
export interface MmrSite {
  id: string;
  township: string;
  name: L;
  what: L;
  d: string;
  s: string[];
}

export const MMR_SITES: MmrSite[] = [
  {
    id: 'ree',
    township: 'Chipwi',
    name: ['Panwa–Chipwi, tungmetallbeltet', 'Panwa–Chipwi rare-earth belt'],
    what: [
      'Kachin Independence Army tok dette beltet i oktober 2024. To tredeler av terbiumet og dysprosiumet som bearbeides i Kina, kommer fra Myanmar, og 98 % av verdens separering av tunge sjeldne jordarter skjer i Kina. Bransjepressen melder at terbium gikk fra rundt 1 200 til over 1 950 dollar per kilo på få uker etter at KIA økte skatter og strammet inn produksjonen, og gjengir et FN-notat som oppgir 302 nye gruvesteder i Kachin siden 2021. Begge tallene står med den kilden, ikke med et revidert produksjonsregnskap. Pangwa er et eget tettsted i samme belte, men finnes ikke som egen enhet i grensedataene.',
      'The Kachin Independence Army took this belt in October 2024. Two thirds of the terbium and dysprosium processed in China comes from Myanmar, and 98% of the world’s heavy rare-earth separation happens in China. The trade press reports terbium going from about $1,200 to over $1,950 a kilo within weeks after the KIA raised taxes and throttled production, and relays a UN report of 302 new mining sites in Kachin since 2021. Both figures rest on that source, not on audited production accounts. Pangwa is a separate settlement in the same belt, but is not a unit of its own in the boundary data.',
    ],
    d: '2026-08-15',
    s: ['dandcRee', 'jamestownRee', 'reexRee'],
  },
  {
    id: 'scam',
    township: 'Myawaddy',
    name: ['Myawaddy, svindelsentrene', 'Myawaddy scam compounds'],
    what: [
      'Militæret raidet KK Park 19.–20. oktober 2025, pågrep over 2 000 personer og tok 30 Starlink-terminaler. I januar 2026 oppgav juntaen at 635 bygninger var revet. C4ADS gikk gjennom satellittbilder av 21 kjente anlegg i Myawaddy township og fant at 14 av dem, KK Park inkludert, hadde bygget ut i samme periode. Virksomheten flyttet i stedet: til Myawaddy by, Thitkate, Mitta Lin Myaing, Paingkyon og videre til Kambodsja. Det er rundt 30 slike anlegg langs grensen mot Thailand.',
      'The military raided KK Park on 19–20 October 2025, detaining over 2,000 people and seizing 30 Starlink terminals. In January 2026 the junta reported 635 buildings demolished. C4ADS reviewed satellite imagery of 21 known compounds in Myawaddy township and found 14 of them, KK Park included, had built out over the same period. The operations moved instead: to Myawaddy town, Thitkate, Mitta Lin Myaing, Paingkyon and on into Cambodia. There are around 30 such compounds along the Thai border.',
    ],
    d: '2026-08-28',
    s: ['apScam', 'irrawaddyScam', 'prachataiScam'],
  },
];

/** Every township name the layers and sites reference, for the integrity test. */
export const MMR_NAMED = [
  ...new Set([...MMR_LAYERS.flatMap((l) => l.townships), ...MMR_SITES.map((s) => s.township)]),
];
