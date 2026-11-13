import type { Claim, Iso, L } from '../types';

/**
 * Conflict Events & Attacks: individual documented incidents.
 *
 * This is a curated selection, not a register of every incident. Each record is
 * one real, publicly reported event, with the date it happened kept separate
 * from the date it was reported, and with the precision of its location stated
 * rather than implied. Where sources differ on how many people were hurt, the
 * record carries each figure with its own source rather than picking one or
 * averaging them.
 *
 * Nothing here is live. An attack location is not a claim about territorial
 * control, and no strike is read as a successful advance.
 */
export type AttackCategory =
  | 'clash'
  | 'airstrike'
  | 'drone'
  | 'missile'
  | 'rocket'
  | 'shelling'
  | 'explosion'
  | 'civilians'
  | 'infrastructure'
  | 'maritime'
  | 'energy'
  | 'ceasefire_violation'
  | 'territorial_change';

/**
 * How precisely the sources place the event. Only `exact` means a specific
 * site; the rest are the centre of the named place, and the panel says so.
 * `offshore` is a position at sea worked out from the distance and bearing a
 * maritime authority gave from a named port ("30 nm southwest of Al
 * Hudaydah"): good to a few nautical miles, never a ship's track.
 */
export type Precision = 'exact' | 'district' | 'city' | 'region' | 'offshore';

/**
 * `confirmed`: reported by named sources that observed or recorded it.
 * `attributed`: asserted by a party to the conflict, not independently verified.
 * `disputed`: sources contradict each other on what happened.
 * `unreported`: the dataset has the event but not this detail.
 */
export type Verification = 'confirmed' | 'attributed' | 'disputed' | 'unreported';

export interface Attack {
  id: string;
  title: L;
  category: AttackCategory;
  /** When it happened. */
  d: string;
  /** When it was published or verified — kept separate from `d` on purpose. */
  published: string;
  iso: Iso;
  place: L;
  at: [number, number];
  precision: Precision;
  /** Who the sources say carried it out, and what was hit. */
  attacker: L | null;
  target: L | null;
  what: L;
  damage: L | null;
  /** Each reported figure with its own source; never merged into one number. */
  casualties: Claim[];
  civilian: L | null;
  conflict: string;
  /** The territorial unit this sits in, as `ISO:code`, where the dataset holds one. */
  territory?: string;
  verification: Verification;
  s: string[];
}

const cas = (t: L, d: string, s: string[], kind: Claim['kind'] = 'fact'): Claim => ({ cat: 'human', kind, t, d, s });

/** Ports that maritime incident reports measure from. */
const PORT: Record<string, [number, number]> = {
  hudaydah: [14.80, 42.95],
  mukha: [13.32, 43.25],
  shuqaiq: [17.72, 42.02],
  yanbu: [24.09, 38.06],
  perim: [12.66, 43.42],
  khasab: [26.18, 56.25],
  rasLaffan: [25.91, 51.58],
  rasHadd: [22.53, 59.80],
  jubayl: [27.01, 49.66],
  khorFakkan: [25.34, 56.36],
  lavan: [26.80, 53.36],
  khafji: [28.42, 48.50],
};
/**
 * The position `nm` nautical miles from a port on a compass bearing, on a
 * flat-earth approximation that is far inside the reports' own rounding.
 */
export function offshore(port: keyof typeof PORT, nm: number, bearing: number): [number, number] {
  const [lat, lng] = PORT[port];
  const r = (bearing * Math.PI) / 180;
  const dLat = (nm / 60) * Math.cos(r);
  const dLng = ((nm / 60) * Math.sin(r)) / Math.cos((lat * Math.PI) / 180);
  return [Math.round((lat + dLat) * 1000) / 1000, Math.round((lng + dLng) * 1000) / 1000];
}
const NOT_STATED: L = ['Ikke oppgitt i dette datasettet.', 'Not stated in this dataset.'];

export const ATTACKS: Attack[] = [
  // ── Ukraine ──────────────────────────────────────────────────────────────
  {
    id: 'at-pokrovsk-20251201',
    title: ['Russland erkl\u00e6rer Pokrovsk erobret', 'Russia declares Pokrovsk captured'],
    category: 'territorial_change', d: '2025-12-01', published: '2025-12-02', iso: 'UKR',
    place: ['Pokrovsk, Donetsk oblast', 'Pokrovsk, Donetsk oblast'], at: [48.28, 37.17], precision: 'city',
    attacker: ['Russiske styrker', 'Russian forces'], target: ['Byen Pokrovsk og nabobyen Myrnohrad', 'The city of Pokrovsk and neighbouring Myrnohrad'],
    what: ['Russland kunngjorde 1. desember 2025 at Pokrovsk var erobret, etter at styrkene gikk inn i byen i november. Ukrainske kilder oppga samtidig at det fortsatt ble k\u00e5mpet i den nordlige delen av byen. Offensiven hadde da vart siden juli 2024.', 'Russia announced on 1 December 2025 that Pokrovsk had been captured, after its forces entered the city in November. Ukrainian sources said at the same time that fighting was still going on in the northern part of the city. The offensive had by then run since July 2024.'],
    damage: null,
    casualties: [cas(['Ikke oppgitt i dette datasettet.', 'Not stated in this dataset.'], '2025-12-02', ['oswDec1'], 'assessment')],
    civilian: null,
    conflict: 'ukr', territory: 'UKR:UA-14', verification: 'disputed',
    s: ['oswDec1', 'wikiPokrovsk'],
  },
  {
    id: 'at-vovchansk-20251201',
    title: ['Russland erkl\u00e6rer Vovtsjansk erobret', 'Russia declares Vovchansk captured'],
    category: 'territorial_change', d: '2025-12-01', published: '2025-12-02', iso: 'UKR',
    place: ['Vovtsjansk, Kharkiv oblast', 'Vovchansk, Kharkiv oblast'], at: [50.29, 36.94], precision: 'city',
    attacker: ['Russiske styrker', 'Russian forces'], target: ['Byen Vovtsjansk n\u00e6r grensen', 'The border town of Vovchansk'],
    what: ['Kunngjort samme dag som Pokrovsk. OSW vurderte at den hovedsakelig skogkledde s\u00f8r\u00f8stlige delen av byen fortsatt kunne v\u00e6re gr\u00e5sone; ved utgangen av november ble Russland oppgitt \u00e5 kontrollere om lag halve byen.', 'Announced the same day as Pokrovsk. OSW assessed that the mostly wooded south-eastern part of the town might still be a grey zone; at the end of November Russia was said to control about half the town.'],
    damage: null,
    casualties: [cas(['Ikke oppgitt i dette datasettet.', 'Not stated in this dataset.'], '2025-12-02', ['oswDec1'], 'assessment')],
    civilian: null,
    conflict: 'ukr', territory: 'UKR:UA-63', verification: 'disputed',
    s: ['oswDec1'],
  },
  {
    id: 'at-huliaipole-202601',
    title: ['Russland tar Huliaipole', 'Russia takes Huliaipole'],
    category: 'territorial_change', d: '2026-01-31', published: '2026-01-31', iso: 'UKR',
    place: ['Huliaipole, Zaporizjzja oblast', 'Huliaipole, Zaporizhzhia oblast'], at: [47.66, 36.26], precision: 'city',
    attacker: ['Russiske styrker', 'Russian forces'], target: ['Byen Huliaipole og landsbyer rundt', 'The town of Huliaipole and surrounding villages'],
    what: ['Offensiven startet 11. september 2025 og endte med at Russland tok byen i januar 2026, sammen med 42 landsbyer i Dnipropetrovsk og Zaporizjzja oblaster.', 'The offensive began on 11 September 2025 and ended with Russia taking the town in January 2026, along with 42 villages in Dnipropetrovsk and Zaporizhzhia oblasts.'],
    damage: null,
    casualties: [cas(['Guvern\u00f8ren i Zaporizjzja, Ivan Fedorov, oppga at en 56 \u00e5r gammel sivil ble drept av en russisk FPV-drone i Huliaipole. Bare om lag 500 sivile var igjen i byen sent i 2025.', 'The governor of Zaporizhzhia, Ivan Fedorov, reported that a 56-year-old civilian was killed by a Russian FPV drone in Huliaipole. Only about 500 civilians remained in the town in late 2025.'], '2026-01-31', ['wikiHuliai'])],
    civilian: ['Sivilbefolkningen var i hovedsak evakuert da byen falt.', 'The civilian population had largely been evacuated by the time the town fell.'],
    conflict: 'ukr', territory: 'UKR:UA-23', verification: 'confirmed',
    s: ['wikiHuliai', 'cfrUkr'],
  },
  {
    id: 'at-kostiantynivka-20251218',
    title: ['Gerasimov hevder Russland holder halve Kostiantynivka', 'Gerasimov claims Russia holds half of Kostiantynivka'],
    category: 'clash', d: '2025-12-18', published: '2025-12-18', iso: 'UKR',
    place: ['Kostiantynivka, Donetsk oblast', 'Kostiantynivka, Donetsk oblast'], at: [48.53, 37.72], precision: 'city',
    attacker: ['Russiske styrker', 'Russian forces'], target: ['Logistikknutepunktet Kostiantynivka', 'The logistics hub of Kostiantynivka'],
    what: ['Russlands generalstabssjef Valerij Gerasimov hevdet 18. desember 2025 at Russland kontrollerte 50 % av Kostiantynivka. Dette er en p\u00e5stand fra en part i konflikten. Ukrainske styrker tok senere en russisk soldat til fange ved jernbanestasjonen i sentrum, noe som tyder p\u00e5 ukrainsk kontroll der.', 'Russia\u2019s chief of the General Staff Valery Gerasimov claimed on 18 December 2025 that Russia controlled 50% of Kostiantynivka. This is a claim by a party to the conflict. Ukrainian troops later captured a Russian soldier near the central railway station, which points to Ukrainian control there.'],
    damage: null,
    casualties: [cas(['Ikke oppgitt i dette datasettet.', 'Not stated in this dataset.'], '2025-12-18', ['wikiKostiant'], 'assessment')],
    civilian: null,
    conflict: 'ukr', territory: 'UKR:UA-14', verification: 'attributed',
    s: ['wikiKostiant', 'cfrUkr'],
  },
  {
    id: 'at-znpp-20261110',
    title: ['Ansatt drept i droneangrep ved Zaporizjzja kjernekraftverk', 'Worker killed in a drone strike at the Zaporizhzhia nuclear plant'],
    category: 'energy', d: '2026-11-10', published: '2026-11-10', iso: 'UKR',
    place: ['Zaporizjzja kjernekraftverk, Enerhodar', 'Zaporizhzhia nuclear plant, Enerhodar'], at: [47.51, 34.59], precision: 'exact',
    attacker: ['Ikke fastsl\u00e5tt i kilden', 'Not established in the source'],
    target: ['Europas st\u00f8rste kjernekraftverk, under russisk kontroll siden mars 2022', 'Europe\u2019s largest nuclear plant, under Russian control since March 2022'],
    what: ['Det internasjonale atomenergibyr\u00e5et (IAEA) oppga at et droneangrep drepte en ansatt ved kjernekraftverket. En ansatt ved det n\u00e6rliggende varmekraftverket ble ogs\u00e5 drept. Kilden navngir ikke hvem som sto bak.', 'The International Atomic Energy Agency (IAEA) reported that a drone strike killed a worker at the nuclear plant. An employee of the nearby thermal plant was also killed. The source does not name who carried it out.'],
    damage: null,
    casualties: [cas(['\u00c9n ansatt drept ved kjernekraftverket og \u00e9n ved varmekraftverket, oppgitt av IAEA.', 'One worker killed at the nuclear plant and one at the thermal plant, reported by the IAEA.'], '2026-11-10', ['deskNote1110'])],
    civilian: ['Anlegget er sivil infrastruktur med permanente IAEA-observat\u00f8rer p\u00e5 stedet.', 'The plant is civilian infrastructure with permanent IAEA monitors on site.'],
    conflict: 'ukr', territory: 'UKR:UA-23', verification: 'confirmed',
    s: ['deskNote1110'],
  },
  {
    id: 'at-overnight-20261110',
    title: ['Iskander-M og 162 Shahed-droner over natten', 'An Iskander-M and 162 Shahed-type drones overnight'],
    category: 'infrastructure', d: '2026-11-10', published: '2026-11-10', iso: 'UKR',
    place: ['Kyiv, Kharkiv og Kherson oblaster', 'Kyiv, Kharkiv and Kherson oblasts'], at: [50.0, 32.0], precision: 'region',
    attacker: ['Russiske styrker', 'Russian forces'],
    target: ['Energiinfrastruktur, blant annet Trypillja varmekraftverk', 'Energy infrastructure, including the Trypillia thermal power plant'],
    what: ['Ett ballistisk Iskander-M-missil og 162 droner av Shahed-type over natten, med tap i Kyiv-, Kharkiv- og Kherson-omr\u00e5dene og et nytt treff mot Trypillja varmekraftverk. Et hjem for eldre i Perejaslav ble ogs\u00e5 truffet.', 'One Iskander-M ballistic missile and 162 Shahed-type drones overnight, with casualties in the Kyiv, Kharkiv and Kherson regions and another strike on the Trypillia thermal power plant. A care home in Pereiaslav was also hit.'],
    damage: ['Gjentatt treff mot Trypillja varmekraftverk og mot energianlegg i Kirovohrad og Dnipro.', 'A repeat strike on the Trypillia thermal power plant and on energy facilities in Kirovohrad and Dnipro.'],
    casualties: [cas(['Tap oppgitt i Kyiv-, Kharkiv- og Kherson-omr\u00e5dene, uten samlet tall i kilden.', 'Casualties reported in the Kyiv, Kharkiv and Kherson regions, with no total given in the source.'], '2026-11-10', ['deskNote1110'], 'assessment')],
    civilian: ['Et hjem for eldre i Perejaslav ble truffet.', 'A care home in Pereiaslav was hit.'],
    conflict: 'ukr', territory: 'UKR:UA-32', verification: 'attributed',
    s: ['deskNote1110'],
  },
  {
    id: 'at-zapor-rescue-20261108',
    title: ['Angrep mot p\u00e5g\u00e5ende redningsarbeid i Zaporizjzja', 'Strike on an ongoing rescue operation in Zaporizhzhia'],
    category: 'civilians', d: '2026-11-08', published: '2026-11-08', iso: 'UKR',
    place: ['Zaporizjzja by', 'Zaporizhzhia city'], at: [47.84, 35.14], precision: 'city',
    attacker: ['Russiske styrker', 'Russian forces'], target: ['Redningsmannskaper og gravemaskiner i arbeid', 'Rescue crews and excavation equipment at work'],
    what: ['Russiske styrker traff et p\u00e5g\u00e5ende redningsarbeid i Zaporizjzja og skadet tungt utstyr brukt til utgraving. Rapportert av AP.', 'Russian forces struck an ongoing rescue operation in Zaporizhzhia, damaging heavy equipment used for excavation. Reported by AP.'],
    damage: ['Tungt gravemateriell skadet.', 'Heavy excavation equipment damaged.'],
    casualties: [cas(['Ikke oppgitt i kilden.', 'Not stated in the source.'], '2026-11-08', ['cfrUkr'], 'assessment')],
    civilian: ['Angrep mot redningsarbeid mens det p\u00e5gikk.', 'A strike on rescue work while it was under way.'],
    conflict: 'ukr', territory: 'UKR:UA-23', verification: 'confirmed',
    s: ['cfrUkr'],
  },
  {
    id: 'at-kyiv-20261107',
    title: ['Ballistiske missiler mot Kyiv og Kyiv oblast', 'Ballistic missiles against Kyiv and Kyiv oblast'],
    category: 'missile', d: '2026-11-07', published: '2026-11-07', iso: 'UKR',
    place: ['Solomjanskyj-distriktet i Kyiv', 'Solomianskyi district, Kyiv'], at: [50.43, 30.44], precision: 'district',
    attacker: ['Russiske styrker', 'Russian forces'],
    target: ['Energianlegg, Nordbrua og boligområder', 'Energy facilities, the Northern Bridge and residential areas'],
    what: ['Tre bølger med ballistiske missiler natt til 7. november, første rundt klokken 23 den 6. november, deretter rundt klokken 01 og rundt klokken 03. Energianlegg i Kyiv og Zjytomyr oblast og Nordbrua ble skadet.', 'Three waves of ballistic missiles overnight into 7 November, the first at about 11 p.m. on 6 November, then at about 1 a.m. and about 3 a.m. Energy facilities in Kyiv and Zhytomyr oblasts and the Northern Bridge were damaged.'],
    damage: ['En toetasjes bygning på en barnehagetomt ble ødelagt, flere femetasjes boligblokker skadet, og strømsituasjonen i hovedstaden ble ifølge ordføreren «ekstremt vanskelig».', 'A two-storey building on kindergarten grounds was destroyed, several five-storey apartment blocks were damaged, and the mayor described the capital’s power situation as “extremely difficult”.'],
    casualties: [
      cas(['Fem skadde, blant dem et barn på 14 år. To ble lagt inn på sykehus. Oppgitt av Kyivs ordfører Vitalij Klitsjko.', 'Five injured, among them a 14-year-old child. Two were hospitalised. Reported by Kyiv mayor Vitali Klitschko.'], '2026-11-07', ['ukrinform1107']),
      cas(['Minst seks skadde. Oppgitt av Kyiv Independent og av ukrainske nyhetsmedier samme dag.', 'At least six injured. Reported by the Kyiv Independent and by Ukrainian news outlets the same day.'], '2026-11-07', ['kyivind1107'], 'assessment'),
    ],
    civilian: ['En barnehage, boligblokker og vannforsyningen i hovedstaden ble rammet. Kyiv var ifølge myndighetene uten vann i nærmere et døgn etter beskytningen.', 'A kindergarten, apartment blocks and the capital’s water supply were affected. According to the authorities Kyiv was without water for nearly a day after the shelling.'],
    conflict: 'ukr', territory: 'UKR:UA-32', verification: 'disputed',
    s: ['ukrinform1107', 'kyivind1107', 'isw1107'],
  },
  {
    id: 'at-ternopil-20251119',
    title: ['Missilangrep mot boligblokker i Ternopil', 'Missile strike on apartment buildings in Ternopil'],
    category: 'civilians', d: '2025-11-19', published: '2025-11-20', iso: 'UKR',
    place: ['Ternopil', 'Ternopil'], at: [49.55, 25.59], precision: 'city',
    attacker: ['Russiske styrker', 'Russian forces'],
    target: ['To boligblokker på ni etasjer', 'Two nine-storey residential buildings'],
    what: ['Et missil traff to boligblokker mellom tredje og niende etasje, som del av et koordinert angrep over hele Ukraina med hundrevis av droner og kryssermissiler.', 'A missile struck two residential blocks between the third and ninth floors, as part of a coordinated attack across Ukraine with hundreds of drones and cruise missiles.'],
    damage: ['Om lag 950 kvadratmeter armert betong ble demontert og 460 tonn bygningsavfall fjernet under redningsarbeidet fram til 20. november.', 'About 950 square metres of reinforced concrete were dismantled and 460 tonnes of construction waste removed during the rescue operation up to 20 November.'],
    casualties: [
      cas(['38 drepte, blant dem sju barn, og over 94 skadde.', '38 killed, among them seven children, and more than 94 injured.'], '2025-11-20', ['wikiTernopil']),
      cas(['Om lag 22 personer var fortsatt savnet 20. november.', 'About 22 people were still unaccounted for on 20 November.'], '2025-11-20', ['wikiTernopil']),
    ],
    civilian: ['Målet var boligbygg. Nesten alle rapporterte ofre var sivile.', 'The target was residential buildings. Almost all reported casualties were civilians.'],
    conflict: 'ukr', territory: 'UKR:UA-61', verification: 'confirmed',
    s: ['wikiTernopil'],
  },
  {
    id: 'at-elfasher-20251028',
    title: ['RSF tar El Fasher i Darfur', 'RSF takes El Fasher in Darfur'],
    category: 'territorial_change', d: '2025-10-28', published: '2025-10-28', iso: 'SDN',
    place: ['El Fasher, Nord-Darfur', 'El Fasher, North Darfur'], at: [13.63, 25.35], precision: 'city',
    attacker: ['Rapid Support Forces (RSF)', 'Rapid Support Forces (RSF)'],
    target: ['Den siste delstatshovedstaden i Darfur under hærens kontroll', 'The last state capital in Darfur under army control'],
    what: ['RSF tok El Fasher etter en langvarig beleiring. Byen var den siste delstatshovedstaden i Darfur som Sudans hær holdt.', 'The RSF took El Fasher after a prolonged siege. The city was the last state capital in Darfur held by Sudan’s army.'],
    damage: null,
    casualties: [cas(['Omfanget av tap er ikke oppgitt i dette datasettet.', 'The scale of casualties is not stated in this dataset.'], '2025-10-28', ['wikiSudan'], 'assessment')],
    civilian: null,
    conflict: 'sdn', territory: 'SDN:SD-DN', verification: 'confirmed',
    s: ['wikiSudan'],
  },
  {
    id: 'at-goma-20250127',
    title: ['M23 tar Goma', 'M23 takes Goma'],
    category: 'territorial_change', d: '2025-01-27', published: '2025-01-27', iso: 'COD',
    place: ['Goma, Nord-Kivu', 'Goma, North Kivu'], at: [-1.68, 29.22], precision: 'city',
    attacker: ['M23', 'M23'], target: ['Provinshovedstaden i Nord-Kivu', 'The provincial capital of North Kivu'],
    what: ['M23 tok kontroll over Goma i slutten av januar 2025 og rykket deretter videre sørover.', 'M23 took control of Goma in late January 2025 and then advanced further south.'],
    damage: null,
    casualties: [cas(['Omfanget av tap er ikke oppgitt i dette datasettet.', 'The scale of casualties is not stated in this dataset.'], '2025-01-27', ['wikiM23'], 'assessment')],
    civilian: null,
    conflict: 'cod', territory: 'COD:CD-NK', verification: 'confirmed',
    s: ['wikiM23'],
  },
  {
    id: 'at-mokha-20260911',
    title: ['Houthiene tar Mokha og Perim ved Bab el-Mandeb', 'Houthis take Mokha and Perim at Bab el-Mandeb'],
    category: 'maritime', d: '2026-09-11', published: '2026-09-11', iso: 'YEM',
    place: ['Mokha og øya Perim, Taiz', 'Mokha and Perim island, Taiz'], at: [13.32, 43.25], precision: 'city',
    attacker: ['Ansar Allah (houthiene)', 'Ansar Allah (the Houthis)'],
    target: ['Havnebyen Mokha og øya Perim i Bab el-Mandeb', 'The port of Mokha and Perim island in Bab el-Mandeb'],
    what: ['Houthiene tok Mokha og Perim, som ligger ved den smaleste delen av Bab el-Mandeb.', 'The Houthis took Mokha and Perim, which sit at the narrowest part of Bab el-Mandeb.'],
    damage: null,
    casualties: [cas(['Ikke oppgitt i dette datasettet.', 'Not stated in this dataset.'], '2026-09-11', ['wikiYemen'], 'assessment')],
    civilian: null,
    conflict: 'yem', territory: 'YEM:YE-TA', verification: 'confirmed',
    s: ['wikiYemen'],
  },
  {
    id: 'at-hormuz-20260228',
    title: ['USA og Israel angriper Iran; Hormuzstredet stenges i praksis', 'US and Israel strike Iran; the Strait of Hormuz is largely closed'],
    category: 'airstrike', d: '2026-02-28', published: '2026-02-28', iso: 'IRN',
    place: ['Iran, flere mål', 'Iran, multiple targets'], at: [32.5, 53.5], precision: 'region',
    attacker: ['USA og Israel', 'The United States and Israel'],
    target: ['Mål i Iran', 'Targets in Iran'],
    what: ['Felles luftkrig mot Iran fra slutten av februar 2026. Trafikken gjennom Hormuzstredet ble i praksis stanset i perioden som fulgte.', 'A joint air war against Iran from late February 2026. Traffic through the Strait of Hormuz was in practice halted in the period that followed.'],
    damage: ['Virkningen på skipsfarten er dokumentert gjennom fallet i passeringer, ikke gjennom tapstall.', 'The effect on shipping is documented through the fall in transits, not through casualty figures.'],
    casualties: [cas(['Ikke oppgitt i dette datasettet.', 'Not stated in this dataset.'], '2026-02-28', ['wikiIran'], 'assessment')],
    civilian: null,
    conflict: 'iran', verification: 'confirmed',
    s: ['wikiIran', 'wikiHormuz'],
  },
  {
    id: 'at-caracas-20260103',
    title: ['USA angriper Caracas og pågriper Maduro', 'US strikes Caracas and captures Maduro'],
    category: 'airstrike', d: '2026-01-03', published: '2026-01-03', iso: 'VEN',
    place: ['Caracas', 'Caracas'], at: [10.49, -66.88], precision: 'city',
    attacker: ['USAs styrker', 'US forces'], target: ['Mål i Caracas', 'Targets in Caracas'],
    what: ['Amerikansk operasjon mot Caracas der Nicolás Maduro ble pågrepet.', 'A US operation against Caracas in which Nicolás Maduro was captured.'],
    damage: null,
    casualties: [cas(['Ikke oppgitt i dette datasettet.', 'Not stated in this dataset.'], '2026-01-03', ['wikiSpear'], 'assessment')],
    civilian: null,
    conflict: 'ven', verification: 'confirmed',
    s: ['wikiSpear'],
  },
  {
    id: 'at-kidal-20260425',
    title: ['JNIM og FLA gjenerobrer Kidal', 'JNIM and the FLA retake Kidal'],
    category: 'clash', d: '2026-04-25', published: '2026-04-25', iso: 'MLI',
    place: ['Kidal', 'Kidal'], at: [18.44, 1.41], precision: 'city',
    attacker: ['JNIM og Front de Libération de l’Azawad', 'JNIM and the Front de Libération de l’Azawad'],
    target: ['Byen Kidal i Nord-Mali', 'The town of Kidal in northern Mali'],
    what: ['Kidal ble tatt tilbake fra maliske myndigheter i april 2026.', 'Kidal was retaken from the Malian authorities in April 2026.'],
    damage: null,
    casualties: [cas(['Ikke oppgitt i dette datasettet.', 'Not stated in this dataset.'], '2026-04-25', ['wikiMali'], 'assessment')],
    civilian: null,
    conflict: 'sahel', verification: 'confirmed',
    s: ['wikiMali'],
  },
  {
    id: 'at-kordofan-20261108',
    title: ['Sudans hær rykker fram i Vest-Kordofan', 'Sudan’s army advances in West Kordofan'],
    category: 'clash', d: '2026-11-08', published: '2026-11-08', iso: 'SDN',
    place: ['Vest-Kordofan', 'West Kordofan'], at: [12.0, 29.0], precision: 'region',
    attacker: ['Sudans væpnede styrker (SAF)', 'Sudanese Armed Forces (SAF)'],
    target: ['RSF-stillinger i Vest-Kordofan', 'RSF positions in West Kordofan'],
    what: ['Hæren rykket fram i Vest-Kordofan i november 2026.', 'The army advanced in West Kordofan in November 2026.'],
    damage: null,
    casualties: [cas(['Ikke oppgitt i dette datasettet.', 'Not stated in this dataset.'], '2026-11-08', ['aaSudan'], 'assessment')],
    civilian: null,
    conflict: 'sdn', verification: 'confirmed',
    s: ['aaSudan'],
  },
  {
    id: 'at-redsea-20260720',
    title: ['Houthiene erklærer blokade av saudiske havner og skip', 'Houthis declare a blockade of Saudi ports and ships'],
    category: 'maritime', d: '2026-07-20', published: '2026-07-20', iso: 'YEM',
    place: ['Rødehavet og Bab el-Mandeb', 'The Red Sea and Bab el-Mandeb'], at: [14.5, 42.5], precision: 'region',
    attacker: ['Ansar Allah (houthiene)', 'Ansar Allah (the Houthis)'],
    target: ['Saudiske havner og skipsfart', 'Saudi ports and shipping'],
    what: ['Houthiene erklærte en blokade av saudiske havner og skip i juli 2026. Erklæringen er en part i konfliktens egen kunngjøring, ikke en uavhengig observert blokade.', 'The Houthis declared a blockade of Saudi ports and ships in July 2026. The declaration is an announcement by a party to the conflict, not an independently observed blockade.'],
    damage: null,
    casualties: [cas(['Ikke oppgitt i dette datasettet.', 'Not stated in this dataset.'], '2026-07-20', ['wikiYemen'], 'assessment')],
    civilian: null,
    conflict: 'yem', verification: 'attributed',
    s: ['wikiYemen'],
  },
  // ── Attacks on merchant shipping: Red Sea, Bab el-Mandeb, Gulf of Aden ──
  // Positions are UKMTO's stated distance and bearing from a port, converted
  // with `offshore`; where only a sea area is reported, the record says
  // `region`. A projectile "of unknown origin" stays unknown here too.
  {
    id: 'at-ship-galaxyleader-20231119',
    title: ['Houthiene kaprer bilfrakteskipet Galaxy Leader', 'The Houthis hijack the car carrier Galaxy Leader'],
    category: 'maritime', d: '2023-11-19', published: '2023-11-19', iso: 'YEM',
    place: ['Sørlige Rødehavet', 'Southern Red Sea'], at: [15.2, 41.9], precision: 'region',
    attacker: ['Ansar Allah (houthiene)', 'Ansar Allah (the Houthis)'],
    target: ['Bilfrakteskipet Galaxy Leader og mannskapet', 'The car carrier Galaxy Leader and her crew'],
    what: ['Den første hendelsen i JMICs liste over angrep på handelsskip i Rødehavet etter oktober 2023. Skipet ble kapret fra helikopter og ført til Yemen.', 'The first incident in JMIC’s list of attacks on merchant ships in the Red Sea after October 2023. The ship was seized from a helicopter and taken to Yemen.'],
    damage: null,
    casualties: [cas(NOT_STATED, '2023-11-19', ['jmicJan26'], 'assessment')],
    civilian: null,
    conflict: 'yem', verification: 'confirmed',
    s: ['jmicJan26', 'wikiRedSea'],
  },
  {
    id: 'at-ship-trueconfidence-20240306',
    title: ['Missil treffer True Confidence: tre sjøfolk drept', 'Missile hits True Confidence: three seafarers killed'],
    category: 'maritime', d: '2024-03-06', published: '2024-03-06', iso: 'YEM',
    place: ['Adenbukta', 'Gulf of Aden'], at: [12.4, 44.6], precision: 'region',
    attacker: ['Ansar Allah (houthiene)', 'Ansar Allah (the Houthis)'],
    target: ['Bulkskipet True Confidence', 'The bulk carrier True Confidence'],
    what: ['Et houthi-missil traff skipet, og mannskapet forlot det. Dette var de første dødsfallene blant sjøfolk i kampanjen.', 'A Houthi missile hit the ship, and the crew abandoned her. These were the first seafarer deaths of the campaign.'],
    damage: ['Betydelig skade; skipet ble forlatt.', 'Significant damage; the ship was abandoned.'],
    casualties: [cas(['3 drept og 4 skadet, ifølge US Central Command.', '3 killed and 4 injured, according to US Central Command.'], '2024-03-06', ['wikiTrueConf'])],
    civilian: ['Sivile sjøfolk.', 'Civilian seafarers.'],
    conflict: 'yem', verification: 'confirmed',
    s: ['wikiTrueConf'],
  },
  {
    id: 'at-ship-tutor-20240612',
    title: ['Tutor treffes av fjernstyrt båt og synker', 'Tutor is hit by an unmanned boat and sinks'],
    category: 'maritime', d: '2024-06-12', published: '2024-06-12', iso: 'YEM',
    place: ['Ca. 67 nm sørvest for Al Hudaydah (UKMTO)', 'About 67 nm southwest of Al Hudaydah (UKMTO)'], at: offshore('hudaydah', 66.7, 225), precision: 'offshore',
    attacker: ['Ansar Allah (houthiene)', 'Ansar Allah (the Houthis)'],
    target: ['Bulkskipet Tutor', 'The bulk carrier Tutor'],
    what: ['Angrepet med en ubemannet overflatefarkost og et missil. Mannskapet forlot skipet, som sank 18. juni; UKMTO meldte at det trolig sank på 14°19′N 041°14′E.', 'Attacked with an unmanned surface vessel and a missile. The crew abandoned the ship, which sank on 18 June; UKMTO reported it likely sank at 14°19′N 041°14′E.'],
    damage: ['Skipet sank.', 'The ship sank.'],
    casualties: [cas(['1 sjømann drept.', '1 seafarer killed.'], '2024-06-18', ['wikiTutor'])],
    civilian: ['Sivil sjømann.', 'Civilian seafarer.'],
    conflict: 'yem', verification: 'confirmed',
    s: ['wikiTutor'],
  },
  {
    id: 'at-ship-sounion-20240821',
    title: ['Tankskipet Sounion angripes og brenner', 'The tanker Sounion is attacked and burns'],
    category: 'maritime', d: '2024-08-21', published: '2024-08-22', iso: 'YEM',
    place: ['Ca. 77 nm vest for Al Hudaydah', 'About 77 nm west of Al Hudaydah'], at: offshore('hudaydah', 77, 270), precision: 'offshore',
    attacker: ['Ansar Allah (houthiene)', 'Ansar Allah (the Houthis)'],
    target: ['Tankskipet Sounion', 'The tanker Sounion'],
    what: ['Det greskflaggede tankskipet ble angrepet og satt i brann i det sørlige Rødehavet.', 'The Greek-flagged tanker was attacked and set on fire in the southern Red Sea.'],
    damage: ['Brann om bord.', 'Fire on board.'],
    casualties: [cas(NOT_STATED, '2024-08-22', ['wikiSounion'], 'assessment')],
    civilian: null,
    conflict: 'yem', verification: 'confirmed',
    s: ['wikiSounion'],
  },
  {
    id: 'at-ship-magicseas-20250706',
    title: ['Magic Seas angripes og forlates', 'Magic Seas is attacked and abandoned'],
    category: 'maritime', d: '2025-07-06', published: '2025-07-06', iso: 'YEM',
    place: ['Ca. 51 nm sørvest for Al Hudaydah (UKMTO)', 'About 51 nm southwest of Al Hudaydah (UKMTO)'], at: offshore('hudaydah', 51, 225), precision: 'offshore',
    attacker: ['Ansar Allah (houthiene), som tok på seg angrepet', 'Ansar Allah (the Houthis), who claimed the attack'],
    target: ['Bulkskipet Magic Seas', 'The bulk carrier Magic Seas'],
    what: ['Angrepet med håndvåpen, rakettgranater og ubemannede båter. Mannskapet forlot skipet og ble reddet av et handelsskip; houthiene sa senere at det sank.', 'Attacked with small arms, rocket-propelled grenades and unmanned boats. The crew abandoned the ship and were rescued by a merchant vessel; the Houthis later said it sank.'],
    damage: ['Brann og vanninntrenging; skipet ble forlatt.', 'Fire and flooding; the ship was abandoned.'],
    casualties: [cas(['Hele mannskapet reddet, ifølge UKMTO.', 'All crew rescued, according to UKMTO.'], '2025-07-06', ['ajMagicSeas'])],
    civilian: null,
    conflict: 'yem', verification: 'confirmed',
    s: ['ajMagicSeas'],
  },
  {
    id: 'at-ship-eternityc-20250707',
    title: ['Eternity C senkes; sjøfolk drept og savnet', 'Eternity C is sunk; seafarers killed and missing'],
    category: 'maritime', d: '2025-07-07', published: '2025-07-09', iso: 'YEM',
    place: ['Sørlige Rødehavet', 'Southern Red Sea'], at: [14.3, 42.0], precision: 'region',
    attacker: ['Ansar Allah (houthiene), som tok på seg angrepet', 'Ansar Allah (the Houthis), who claimed the attack'],
    target: ['Bulkskipet Eternity C', 'The bulk carrier Eternity C'],
    what: ['Angrepet over to dager og sank. Seks av mannskapet ble reddet.', 'Attacked over two days and sank. Six of the crew were rescued.'],
    damage: ['Skipet sank.', 'The ship sank.'],
    casualties: [cas(['Minst 4 drept og 15 savnet, ifølge maritime kilder sitert av Reuters.', 'At least 4 killed and 15 missing, according to maritime officials cited by Reuters.'], '2025-07-09', ['ajEternity'])],
    civilian: ['Sivile sjøfolk.', 'Civilian seafarers.'],
    conflict: 'yem', verification: 'confirmed',
    s: ['ajEternity'],
  },
  {
    id: 'at-ship-hudaydah-20260705',
    title: ['Lasteskip meldt angrepet av ukjente utenfor Al Hudaydah', 'Cargo ship reports attack by unknown assailants off Al Hudaydah'],
    category: 'maritime', d: '2026-07-05', published: '2026-07-05', iso: 'YEM',
    place: ['30 nm sørvest for Al Hudaydah (UKMTO)', '30 nm southwest of Al Hudaydah (UKMTO)'], at: offshore('hudaydah', 30, 225), precision: 'offshore',
    attacker: null,
    target: ['Et lasteskip (navn ikke oppgitt)', 'A cargo ship (name not given)'],
    what: ['Skipet sendte nødsignal om angrep fra ukjente. Ingen gruppe tok på seg angrepet; UKMTO meldte at myndighetene undersøkte saken.', 'The ship sent a distress alert reporting an attack by unknown assailants. No group claimed it; UKMTO said authorities were investigating.'],
    damage: null,
    casualties: [cas(NOT_STATED, '2026-07-05', ['cnbcHud0705'], 'assessment')],
    civilian: null,
    conflict: 'yem', verification: 'confirmed',
    s: ['cnbcHud0705', 'apHud0705'],
  },
  {
    id: 'at-ship-encelia-20260722',
    title: ['Saudisk tankskip Encelia treffes; houthiene tar på seg angrepet', 'Saudi tanker Encelia is hit; the Houthis claim the attack'],
    category: 'maritime', d: '2026-07-22', published: '2026-07-22', iso: 'SAU',
    place: ['70 nm sørvest for Al Shuqaiq (UKMTO 095-26)', '70 nm southwest of Al Shuqaiq (UKMTO 095-26)'], at: offshore('shuqaiq', 70, 225), precision: 'offshore',
    attacker: ['Ansar Allah (houthiene), som tok på seg angrepet', 'Ansar Allah (the Houthis), who claimed the attack'],
    target: ['Tankskipet Encelia; houthiene hevdet også å ha angrepet Layla', 'The tanker Encelia; the Houthis also claimed to have attacked Layla'],
    what: ['Skipsføreren meldte treff av et ukjent prosjektil som førte til brann. Houthiene sa begge skipene hadde brutt deres blokade av Saudi-Arabia. Det første bekreftede angrepet etter blokadeerklæringen 20. juli.', 'The master reported being struck by an unknown projectile that caused a fire. The Houthis said both ships had violated their blockade of Saudi Arabia. The first confirmed attack after the blockade was declared on 20 July.'],
    damage: ['Brann om bord.', 'Fire on board.'],
    casualties: [cas(['Ingen skadde eller forurensning meldt, ifølge UKMTO.', 'No casualties or pollution reported, according to UKMTO.'], '2026-07-22', ['gcapEncelia'])],
    civilian: null,
    conflict: 'yem', verification: 'confirmed',
    s: ['gcapEncelia', 'meesEncelia'],
  },
  {
    id: 'at-ship-tihamah-20260811',
    title: ['Lasteskipet Tihamah treffes ved Perim: sjøfolk og redningsmannskap drept', 'Cargo ship Tihamah hit off Perim: seafarers and rescuers killed'],
    category: 'maritime', d: '2026-08-11', published: '2026-08-11', iso: 'YEM',
    place: ['Til ankers 3,3 nm nordøst for Perim (Ambrey)', 'At anchor 3.3 nm northeast of Perim (Ambrey)'], at: offshore('perim', 3.3, 45), precision: 'offshore',
    attacker: ['Omstridt: Yemens regjering og kystvakt peker på houthiene; Wall Street Journal meldte at et amerikansk helikopter skjøt mot skipet', 'Disputed: Yemen’s government and coastguard blame the Houthis; the Wall Street Journal reported a US helicopter fired on the ship'],
    target: ['Det egyptiskeide lasteskipet Tihamah', 'The Egyptian-owned cargo ship Tihamah'],
    what: ['UKMTO meldte at et lasteskip utenfor Al Mukha ble truffet av et ukjent prosjektil, med tap av liv. Houthiene tok ikke på seg angrepet.', 'UKMTO reported that a cargo ship off Al Mukha was hit by an unknown projectile, with loss of life. The Houthis did not claim the attack.'],
    damage: ['Brann og omfattende skade, ifølge kystvakten.', 'Fire and extensive damage, according to the coastguard.'],
    casualties: [
      cas(['4 av mannskapet og 2 redningsfolk drept, ifølge Yemens kystvakt.', '4 crew and 2 rescuers killed, according to Yemen’s coastguard.'], '2026-08-12', ['ajTihamah']),
      cas(['3 av mannskapet drept, ifølge Ambrey.', '3 crew killed, according to Ambrey.'], '2026-08-11', ['toiTihamah']),
    ],
    civilian: ['Sivile sjøfolk.', 'Civilian seafarers.'],
    conflict: 'yem', verification: 'disputed',
    s: ['ajTihamah', 'toiTihamah', 'abcTihamah'],
  },
  {
    id: 'at-ship-mukha-20260818',
    title: ['Ubemannet lasteskip ødelagt sørøst for Al Mukha', 'Unmanned cargo ship destroyed southeast of Al Mukha'],
    category: 'maritime', d: '2026-08-18', published: '2026-08-18', iso: 'YEM',
    place: ['Ca. 40 nm sørøst for Al Mukha (UKMTO 117-26)', 'About 40 nm southeast of Al Mukha (UKMTO 117-26)'], at: [12.75, 43.45], precision: 'region',
    attacker: null,
    target: ['Et ubemannet lasteskip (navn ikke oppgitt)', 'An unmanned cargo ship (name not given)'],
    what: ['Lokale myndigheter meldte at skipet ble truffet av flere ukjente prosjektiler og er et totaltap. Datoen er da UKMTO meldte det. Merket står i stredet, ikke på den oppgitte posisjonen, fordi 40 nm rett sørøst for Al Mukha ville havne på land.', 'Local authorities reported the ship was struck by several unknown projectiles and is a total loss. The date is when UKMTO reported it. The marker is placed in the strait rather than at the stated position, because 40 nm due southeast of Al Mukha would fall on land.'],
    damage: ['Totaltap.', 'Total loss.'],
    casualties: [cas(['Skipet var ubemannet.', 'The ship was unmanned.'], '2026-08-18', ['gcapMukha'])],
    civilian: null,
    conflict: 'yem', verification: 'confirmed',
    s: ['gcapMukha'],
  },
  {
    id: 'at-ship-yanbu-20260824',
    title: ['Saudiflagget tankskip i brann vest for Yanbu', 'Saudi-flagged tanker on fire west of Yanbu'],
    category: 'maritime', d: '2026-08-24', published: '2026-08-24', iso: 'SAU',
    place: ['Ca. 63 nm vest for Yanbu (UKMTO)', 'About 63 nm west of Yanbu (UKMTO)'], at: offshore('yanbu', 63, 270), precision: 'offshore',
    attacker: null,
    target: ['Et saudiflagget tankskip', 'A Saudi-flagged tanker'],
    what: ['Et ukjent prosjektil forårsaket brann på hoveddekket. Hvem som sto bak, er ikke fastslått.', 'An unknown projectile caused a fire on the main deck. Who was behind it has not been established.'],
    damage: ['Brann på hoveddekket.', 'Fire on the main deck.'],
    casualties: [cas(['Mannskapet i god behold; ingen miljøskade meldt, ifølge UKMTO.', 'Crew safe; no environmental impact reported, according to UKMTO.'], '2026-08-24', ['weekYanbu'])],
    civilian: null,
    conflict: 'yem', verification: 'confirmed',
    s: ['weekYanbu'],
  },
  // ── Attacks on merchant shipping: Strait of Hormuz and the Gulf ─────────
  {
    id: 'at-ship-skylight-20260301',
    title: ['Tankskipet Skylight i brann ved Khasab', 'The tanker Skylight ablaze off Khasab'],
    category: 'maritime', d: '2026-03-01', published: '2026-03-01', iso: 'OMN',
    place: ['Til ankers ca. 5 nm nord for Khasab, Oman', 'At anchor about 5 nm north of Khasab, Oman'], at: offshore('khasab', 5, 0), precision: 'offshore',
    attacker: ['Iran, ifølge anklager; ikke uavhengig fastslått', 'Iran, according to allegations; not independently established'],
    target: ['Produkttankskipet Skylight', 'The product tanker Skylight'],
    what: ['Skipet ble truffet og tok fyr mens det lå til ankers, i det første døgnet etter de amerikansk-israelske angrepene på Iran. Mannskapet ble evakuert av omanske myndigheter.', 'The ship was hit and caught fire at anchor, in the first day after the US-Israeli strikes on Iran. The crew were evacuated by Omani authorities.'],
    damage: ['Brann om bord.', 'Fire on board.'],
    casualties: [cas(['2 drept og opptil 4 skadet, ifølge Airwars’ gjennomgang.', '2 killed and up to 4 injured, according to Airwars’ assessment.'], '2026-07-07', ['airwarsSkylight']), cas(['4 skadet, ifølge Windward gjengitt av Marine Log.', '4 injured, according to Windward as cited by Marine Log.'], '2026-03-01', ['marinelogEpic'])],
    civilian: ['Sivile sjøfolk.', 'Civilian seafarers.'],
    conflict: 'iran', verification: 'disputed',
    s: ['airwarsSkylight', 'marinelogEpic'],
  },
  {
    id: 'at-ship-safeenprestige-20260304',
    title: ['Containerskipet Safeen Prestige forlates i Hormuz', 'The container ship Safeen Prestige is abandoned in Hormuz'],
    category: 'maritime', d: '2026-03-04', published: '2026-03-04', iso: 'OMN',
    place: ['Hormuzstredet (UKMTO 012-26)', 'Strait of Hormuz (UKMTO 012-26)'], at: [26.45, 56.5], precision: 'region',
    attacker: null,
    target: ['Containerskipet Safeen Prestige', 'The container ship Safeen Prestige'],
    what: ['En eksplosjon ble meldt ved akterenden etter at en liten farkost nærmet seg, og mannskapet forlot skipet. Det sank senere nord for Hormuzstredet.', 'An explosion was reported near the stern after a small craft approached, and the crew abandoned the ship. It later sank north of the Strait of Hormuz.'],
    damage: ['Skipet sank senere.', 'The ship later sank.'],
    casualties: [cas(NOT_STATED, '2026-03-04', ['jmic067'], 'assessment')],
    civilian: null,
    conflict: 'iran', verification: 'confirmed',
    s: ['jmic067', 'aryHormuz'],
  },
  {
    id: 'at-ship-mayureenaree-20260311',
    title: ['Mayuree Naree treffes ved Hormuz; tre sjøfolk omkommer', 'Mayuree Naree hit near Hormuz; three seafarers die'],
    category: 'maritime', d: '2026-03-11', published: '2026-03-11', iso: 'OMN',
    place: ['Ved Hormuzstredet', 'Near the Strait of Hormuz'], at: [26.35, 56.55], precision: 'region',
    attacker: ['Irans revolusjonsgardes marine, som tok på seg angrepet', 'The IRGC Navy, which claimed the attack'],
    target: ['Bulkskipet Mayuree Naree (thailandsk)', 'The Thai bulk carrier Mayuree Naree'],
    what: ['Skipet ble truffet av to prosjektiler like etter å ha passert stredet. Tjue av mannskapet gikk i livflåter og ble reddet av Omans marine.', 'The ship was struck by two projectiles shortly after transiting the strait. Twenty crew took to liferafts and were rescued by the Royal Navy of Oman.'],
    damage: ['Brann; skipet ble forlatt.', 'Fire; the ship was abandoned.'],
    casualties: [cas(['3 av mannskapet døde, bekreftet av Thailands utenriksminister 8. april.', '3 crew died, confirmed by Thailand’s foreign minister on 8 April.'], '2026-04-08', ['wikiMayuree'])],
    civilian: ['Sivile sjøfolk.', 'Civilian seafarers.'],
    conflict: 'iran', verification: 'confirmed',
    s: ['wikiMayuree'],
  },
  {
    id: 'at-ship-halul50-20260318',
    title: ['Forsyningsfartøyet Halul 50 truffet ved Ras Laffan', 'Offshore vessel Halul 50 hit off Ras Laffan'],
    category: 'maritime', d: '2026-03-18', published: '2026-03-18', iso: 'QAT',
    place: ['4 nm øst for Ras Laffan, Qatar', '4 nm east of Ras Laffan, Qatar'], at: offshore('rasLaffan', 4, 90), precision: 'offshore',
    attacker: null,
    target: ['Forsyningsfartøyet Halul 50', 'The offshore vessel Halul 50'],
    what: ['UKMTO meldte et fartøy truffet av et ukjent prosjektil.', 'UKMTO reported a vessel hit by an unknown projectile.'],
    damage: null,
    casualties: [cas(['Ingen tap oppgitt.', 'No casualties stated.'], '2026-03-18', ['wikiShips2026'])],
    civilian: null,
    conflict: 'iran', verification: 'confirmed',
    s: ['wikiShips2026'],
  },
  {
    id: 'at-ship-rashadd-20260407',
    title: ['Bulkskip i brann sørøst for Ras al-Hadd', 'Bulk carrier on fire southeast of Ras al-Hadd'],
    category: 'maritime', d: '2026-04-07', published: '2026-04-07', iso: 'OMN',
    place: ['112 nm sørøst for Ras al-Hadd (UKMTO 036-26)', '112 nm southeast of Ras al-Hadd (UKMTO 036-26)'], at: offshore('rasHadd', 112, 135), precision: 'offshore',
    attacker: null,
    target: ['Et bulkskip (navn ikke oppgitt)', 'A bulk carrier (name not given)'],
    what: ['Skipet ble truffet av to ukjente prosjektiler, som førte til brann.', 'The ship was struck by two unknown projectiles, causing a fire.'],
    damage: ['Brann om bord.', 'Fire on board.'],
    casualties: [cas(['Mannskapet i god behold, ifølge UKMTO.', 'Crew safe, according to UKMTO.'], '2026-04-07', ['jmic067'])],
    civilian: null,
    conflict: 'iran', verification: 'confirmed',
    s: ['jmic067'],
  },
  {
    id: 'at-ship-msc-francesca-20260422',
    title: ['Revolusjonsgarden beslaglegger MSC Francesca og Epaminondas', 'The IRGC seizes MSC Francesca and Epaminondas'],
    category: 'maritime', d: '2026-04-22', published: '2026-04-22', iso: 'OMN',
    place: ['Hormuzstredet', 'Strait of Hormuz'], at: [26.55, 56.35], precision: 'region',
    attacker: ['Irans revolusjonsgarde (IRGC)', 'Iran’s Revolutionary Guards (IRGC)'],
    target: ['Lasteskipene MSC Francesca og Epaminondas', 'The cargo ships MSC Francesca and Epaminondas'],
    what: ['To lasteskip ble beslaglagt i stredet samme dag, og et tredje ble stanset etter å ha blitt beskutt.', 'Two cargo ships were seized in the strait on the same day, and a third was stopped after being fired upon.'],
    damage: ['Skipene ble beslaglagt.', 'The ships were seized.'],
    casualties: [cas(NOT_STATED, '2026-04-22', ['wikiShips2026'], 'assessment')],
    civilian: null,
    conflict: 'iran', verification: 'confirmed',
    s: ['wikiShips2026', 'aryHormuz'],
  },
  {
    id: 'at-ship-safeseaneha-20260510',
    title: ['Drone treffer bulkskipet Safesea Neha ved Doha', 'Drone hits the bulk carrier Safesea Neha off Doha'],
    category: 'maritime', d: '2026-05-10', published: '2026-05-10', iso: 'QAT',
    place: ['Ankringsplassen ved Doha, Qatar', 'Doha anchorage, Qatar'], at: [25.32, 51.65], precision: 'city',
    attacker: null,
    target: ['Bulkskipet Safesea Neha', 'The bulk carrier Safesea Neha'],
    what: ['Skipet ble truffet av en drone; en liten brann ble slukket.', 'The ship was struck by a drone; a small fire was put out.'],
    damage: ['Liten brann.', 'Small fire.'],
    casualties: [cas(['Ingen tap oppgitt.', 'No casualties stated.'], '2026-05-10', ['wikiShips2026'])],
    civilian: null,
    conflict: 'iran', verification: 'confirmed',
    s: ['wikiShips2026'],
  },
  {
    id: 'at-ship-gfsgalaxy-20260712',
    title: ['Containerskipet GFS Galaxy settes ut av drift; én drept', 'Container ship GFS Galaxy disabled; one killed'],
    category: 'maritime', d: '2026-07-12', published: '2026-07-12', iso: 'OMN',
    place: ['Hormuzstredet', 'Strait of Hormuz'], at: [26.4, 56.45], precision: 'region',
    attacker: null,
    target: ['Containerskipet GFS Galaxy', 'The container ship GFS Galaxy'],
    what: ['Skade i maskinrommet satte skipet ut av drift, og mannskapet forlot det.', 'Engine-room damage disabled the ship, and the crew abandoned her.'],
    damage: ['Ute av drift; forlatt.', 'Disabled; abandoned.'],
    casualties: [cas(['1 drept.', '1 killed.'], '2026-07-12', ['wikiShips2026'])],
    civilian: ['Sivil sjømann.', 'Civilian seafarer.'],
    conflict: 'iran', verification: 'confirmed',
    s: ['wikiShips2026'],
  },
  {
    id: 'at-ship-sidr-20260831',
    title: ['To supertankere med saudisk olje truffet ved Khasab', 'Two supertankers carrying Saudi oil hit off Khasab'],
    category: 'maritime', d: '2026-08-31', published: '2026-09-01', iso: 'OMN',
    place: ['Ca. 16,6 nm nordøst for Khasab (Marisks)', 'About 16.6 nm northeast of Khasab (Marisks)'], at: offshore('khasab', 16.6, 45), precision: 'offshore',
    attacker: null,
    target: ['Supertankerne Sidr og Senegal Prosperity', 'The supertankers Sidr and Senegal Prosperity'],
    what: ['De to tankskipene ble truffet av ukjente prosjektiler med minutters mellomrom på vei ut av stredet; Senegal Prosperity omtrent 17 nm øst for Khasab.', 'The two tankers were struck by unknown projectiles minutes apart while leaving the strait; Senegal Prosperity about 17 nm east of Khasab.'],
    damage: null,
    casualties: [cas(['Hele mannskapet i god behold, ifølge Marisks.', 'All crew safe, according to Marisks.'], '2026-09-01', ['bairdSidr'])],
    civilian: null,
    conflict: 'iran', verification: 'confirmed',
    s: ['bairdSidr'],
  },
  {
    id: 'at-ship-gfspride-20261013',
    title: ['Containerskipet GFS Pride synker i Hormuzstredet', 'The container ship GFS Pride sinks in the Strait of Hormuz'],
    category: 'maritime', d: '2026-10-13', published: '2026-10-14', iso: 'OMN',
    place: ['Hormuzstredet', 'Strait of Hormuz'], at: [26.3, 56.6], precision: 'region',
    attacker: ['Ikke fastslått. Revolusjonsgarden hevdet at et skip traff en mine; Marisks fant ingen uavhengige bevis for det.', 'Not established. The IRGC claimed a ship struck a mine; Marisks found no independent evidence of that.'],
    target: ['Det singaporske containerskipet GFS Pride', 'The Singapore-flagged container ship GFS Pride'],
    what: ['Skipet ble truffet av ukjente prosjektiler under passering, tok fyr og sank, ifølge Singapores sjøfartsmyndighet. Søsterskipet GFS Giselle ble truffet dagen etter.', 'The ship was struck by unknown projectiles in transit, caught fire and sank, according to Singapore’s maritime authority. Its sister ship GFS Giselle was hit the next day.'],
    damage: ['Skipet sank.', 'The ship sank.'],
    casualties: [cas(['Alle 21 i mannskapet evakuert uten skader.', 'All 21 crew evacuated without injury.'], '2026-10-14', ['gcapPride'])],
    civilian: null,
    conflict: 'iran', verification: 'confirmed',
    s: ['gcapPride', 'nationalPride'],
  },
  {
    id: 'at-ship-st3-20261016',
    title: ['Tankskipet ST3 truffet nordøst for Al Jubayl', 'The tanker ST3 hit northeast of Al Jubayl'],
    category: 'maritime', d: '2026-10-16', published: '2026-10-18', iso: 'SAU',
    place: ['Ca. 68 nm nordøst for Al Jubayl (UKMTO 174-26)', 'About 68 nm northeast of Al Jubayl (UKMTO 174-26)'], at: offshore('jubayl', 68, 45), precision: 'offshore',
    attacker: null,
    target: ['Tankskipet ST3', 'The tanker ST3'],
    what: ['Skipet ble truffet av et ukjent prosjektil midt i Persiabukta.', 'The ship was struck by an unknown projectile in the central Gulf.'],
    damage: null,
    casualties: [cas(['Hele mannskapet i god behold, ifølge UKMTO.', 'All crew safe, according to UKMTO.'], '2026-10-16', ['jmic106'])],
    civilian: null,
    conflict: 'iran', verification: 'confirmed',
    s: ['jmic106'],
  },
  {
    id: 'at-ship-khorfakkan-20261018',
    title: ['Slepebåt truffet nordøst for Khor Fakkan', 'Tug hit northeast of Khor Fakkan'],
    category: 'maritime', d: '2026-10-18', published: '2026-10-18', iso: 'ARE',
    place: ['Ca. 20 nm nordøst for Khor Fakkan (UKMTO 177-26)', 'About 20 nm northeast of Khor Fakkan (UKMTO 177-26)'], at: offshore('khorFakkan', 20, 45), precision: 'offshore',
    attacker: null,
    target: ['En slepebåt på vei sørover', 'A tug heading south'],
    what: ['Slepebåten ble truffet av to uidentifiserte prosjektiler i Omanbukta, der skip venter på å passere stredet.', 'The tug was struck by two unidentified projectiles in the Gulf of Oman, where ships wait to transit the strait.'],
    damage: null,
    casualties: [cas(['1 lettere skadet.', '1 minor injury.'], '2026-10-18', ['jmic106'])],
    civilian: null,
    conflict: 'iran', verification: 'confirmed',
    s: ['jmic106'],
  },
  {
    id: 'at-ship-riti-20261029',
    title: ['Tankskipet RITI truffet ved Khasab', 'The tanker RITI hit off Khasab'],
    category: 'maritime', d: '2026-10-29', published: '2026-11-01', iso: 'OMN',
    place: ['I stredet ved Khasab, på vei ut (UKMTO 186-26)', 'In the strait off Khasab, outbound (UKMTO 186-26)'], at: [26.42, 56.55], precision: 'region',
    attacker: null,
    target: ['Tankskipet RITI', 'The tanker RITI'],
    what: ['Ifølge Omans marine ble skipet truffet av et ukjent prosjektil; en brann ble slukket, og skipet mistet framdriften.', 'According to the Royal Navy of Oman the ship was struck by an unknown projectile; a fire was put out and the ship lost propulsion.'],
    damage: ['Brann og tap av framdrift.', 'Fire and loss of propulsion.'],
    casualties: [cas(NOT_STATED, '2026-11-01', ['jmic110'], 'assessment')],
    civilian: null,
    conflict: 'iran', verification: 'confirmed',
    s: ['jmic110'],
  },
  {
    id: 'at-ship-lavan-20261030',
    title: ['Skip i brann sør for Lavan', 'Ship on fire south of Lavan'],
    category: 'maritime', d: '2026-10-30', published: '2026-10-30', iso: 'IRN',
    place: ['Ca. 40 nm sør for Lavan, Iran (UKMTO 188-26)', 'About 40 nm south of Lavan Island, Iran (UKMTO 188-26)'], at: offshore('lavan', 40, 180), precision: 'offshore',
    attacker: null,
    target: ['Et handelsskip (type ikke oppgitt)', 'A merchant vessel (type not stated)'],
    what: ['Skipet ble truffet på babord side av et ukjent prosjektil, som førte til brann.', 'The ship was hit on the port side by an unknown projectile, causing a fire.'],
    damage: ['Brann om bord.', 'Fire on board.'],
    casualties: [cas(['Mannskapet i god behold; ingen miljøskade meldt.', 'Crew safe; no environmental impact reported.'], '2026-10-30', ['palaemon1102'])],
    civilian: null,
    conflict: 'iran', verification: 'confirmed',
    s: ['palaemon1102'],
  },
  {
    id: 'at-ship-khafji-20261102',
    title: ['Tankskip truffet øst for Ras al-Khafji', 'Tanker hit east of Ras al-Khafji'],
    category: 'maritime', d: '2026-11-02', published: '2026-11-02', iso: 'SAU',
    place: ['72 nm øst for Ras al-Khafji (UKMTO)', '72 nm east of Ras al-Khafji (UKMTO)'], at: offshore('khafji', 72, 90), precision: 'offshore',
    attacker: null,
    target: ['Et tankskip på vei sørøstover', 'A tanker heading southeast'],
    what: ['Skipet ble truffet på babord side av to ukjente prosjektiler nord i Persiabukta. Minst ti hendelser ble meldt i Golfen, stredet og Omanbukta fra 31. oktober til 2. november.', 'The ship was hit on the port side by two unknown projectiles in the northern Gulf. At least ten incidents were reported across the Gulf, the strait and the Gulf of Oman from 31 October to 2 November.'],
    damage: null,
    casualties: [cas(['Hele mannskapet gjort rede for, ifølge UKMTO.', 'All crew accounted for, according to UKMTO.'], '2026-11-02', ['ilKhafji'])],
    civilian: null,
    conflict: 'iran', verification: 'confirmed',
    s: ['ilKhafji'],
  },
];
