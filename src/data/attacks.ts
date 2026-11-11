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
 */
export type Precision = 'exact' | 'district' | 'city' | 'region';

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
];
