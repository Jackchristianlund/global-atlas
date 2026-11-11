import type { Iso, L } from '../types';

/**
 * Territorial control, generalised to administrative units.
 *
 * METHOD. Control is assigned per first-level administrative unit (Natural Earth
 * 1:10m admin-1, public domain). Nothing is drawn freehand: the only geometry used
 * is real administrative geography. Where a unit is split between actors, it is
 * marked CONTESTED rather than guessing where the line runs inside it. Every
 * assignment carries its own date and sources, and a unit with no sourced
 * assessment is simply absent — never coloured by assumption.
 *
 * This is an approximate regional overview, not a battlefield map, and military
 * control is not the same thing as legal sovereignty (see `legalNote`).
 */

export type ActorKind =
  | 'government'          // internationally recognised government
  | 'de_facto'            // de facto authority without wide recognition
  | 'opposition'          // armed opposition / rebel movement
  | 'separatist'          // separatist or autonomy movement
  | 'occupying'           // foreign occupying power
  | 'paramilitary'        // paramilitary or militia force
  | 'jihadist';           // jihadist armed group

export interface Actor {
  id: string;
  /** Conflict region this actor belongs to (one colour scheme per region). */
  region: string;
  name: L;
  short: string;
  kind: ActorKind;
  color: string;
  about: L;
  objectives: L;
  /** Documented external supporters (allegations are marked as such in the text). */
  supporters: L;
  opponents: string[];
  /** Strategic resources and infrastructure the actor is documented to hold. */
  assets: L;
  s: string[];
}

export type ControlStatus =
  | 'control'
  | 'contested'
  | 'partial'
  /**
   * A de facto administration: an authority that actually runs the territory
   * while the territory remains internationally recognised as part of another
   * state. Distinct from `control` along an active front, and distinct again
   * from sovereignty, which this dataset never asserts.
   */
  | 'defacto'
  /**
   * An ordinary constituent region of the state that holds it — no current
   * contest over control. Used for territories with a contested history that
   * are not contested today, so they are never drawn as occupied.
   */
  | 'federal';

export interface ControlRecord {
  iso: Iso;
  /** ISO 3166-2 code of the admin-1 unit, as in the unit manifest. */
  code: string;
  /** Primary actor. For `contested`, the actor whose presence the sources put first. */
  actor: string;
  /** Second actor where the unit is contested or split. */
  with?: string;
  status: ControlStatus;
  /** For `partial`: documented share held by `actor`, as the source states it. */
  share?: L;
  note: L;
  /**
   * How finely the assessment resolves control inside the unit.
   * `unit` — the source assesses the whole unit as held by one actor.
   * `split` — the unit is divided and the source gives a share, but the line
   *   inside it is not resolved here; the unit is drawn contested rather than
   *   cut at a guessed boundary.
   * `approx` — presence or influence rather than administered control.
   */
  precision?: 'unit' | 'split' | 'approx';
  /**
   * Weight of the assessment. `high` where a named monitoring organisation
   * gives a dated figure, `medium` where reporting is consistent but not
   * measured, `low` where sources are thin or disagree.
   */
  confidence?: 'high' | 'medium' | 'low';
  /** Date the assessment refers to (when it was verified). */
  d: string;
  /**
   * When this arrangement is documented to have begun, where a source states it.
   * The timeline uses `since ?? d`, so an assessment verified in 2026 can still be
   * shown for earlier years when the source says the arrangement held then.
   */
  since?: string;
  s: string[];
}

/** One dated step in a place's control history. */
export interface PlaceControl {
  /** Actor id, or null where control was contested and the sources say so. */
  actor: string | null;
  from: string;
  what: L;
  s: string[];
}

export interface KeyPlace {
  id: string;
  name: string;
  at: [number, number];
  region: string;
  /** Actor id, or null where the sources in this dataset do not settle it. */
  actor: string | null;
  note: L;
  d: string;
  /** The administrative unit the place sits in, as `ISO:code`, where known. */
  unit?: string;
  /** Pre-war population, where a source gives one. */
  pop?: number;
  /** Documented changes of control, oldest first. */
  history?: PlaceControl[];
  s: string[];
}

/** A named, dated frontline area — taken from the sources, not derived from geometry. */
export interface FrontLine {
  id: string;
  region: string;
  name: L;
  at: [number, number];
  between: [string, string];
  note: L;
  d: string;
  s: string[];
}

export interface Region {
  id: string;
  /** The conflict record this region belongs to. */
  conflict: string;
  name: L;
  iso: Iso[];
  /** Camera framing for the region. */
  at: [number, number];
  altitude: number;
  /** What the control assessment does and does not cover. */
  coverage: L;
  legalNote?: L;
  verified: string;
  s: string[];
}

const C = (iso: string, code: string, actor: string, status: ControlStatus, d: string, note: L, s: string[], extra: Partial<ControlRecord> = {}): ControlRecord =>
  ({ iso, code, actor, status, d, note, s, ...extra });

// ════════════════════════════════════════════════════════════════════════════
// Actors
// ════════════════════════════════════════════════════════════════════════════

export const ACTORS: Actor[] = [
  // ── Caucasus ──────────────────────────────────────────────────────────────
  {
    id: 'ge-gov', region: 'caucasus', name: ['Georgias regjering', 'Government of Georgia'], short: 'Georgia', kind: 'government', color: '#D64545',
    about: ['Den internasjonalt anerkjente regjeringen i Tbilisi. Georgia omtaler Abkhasia og S\u00f8r-Ossetia som okkuperte territorier og krever at russiske styrker trekkes ut.', 'The internationally recognised government in Tbilisi. Georgia describes Abkhazia and South Ossetia as occupied territories and demands the withdrawal of Russian forces.'],
    objectives: ['\u00c5 gjenopprette kontroll over hele det anerkjente territoriet. Den offisielle posisjonen er at konflikten skal l\u00f8ses fredelig.', 'To restore control over the whole of its recognised territory. Its official position is that the conflict should be resolved peacefully.'],
    supporters: ['EU og USA, samt n\u00e6r sagt alle andre stater, regner begge territoriene som georgiske.', 'The EU and the United States, along with nearly every other state, regard both territories as Georgian.'],
    opponents: ['ab-defacto', 'so-defacto', 'ru-mil'],
    assets: ['Svartehavskysten s\u00f8r for Abkhasia, havnene i Poti og Batumi, og transittkorridoren mellom Kaspihavet og Svartehavet.', 'The Black Sea coast south of Abkhazia, the ports of Poti and Batumi, and the transit corridor between the Caspian and the Black Sea.'],
    s: ['topGeo', 'warWatchGeo'],
  },
  {
    id: 'ab-defacto', region: 'caucasus', name: ['Abkhasias faktiske myndigheter', 'De facto authorities of Abkhazia'], short: 'Abkhasia', kind: 'de_facto', color: '#7FA6D9',
    about: ['Egne politiske strukturer siden krigen p\u00e5 1990-tallet, anerkjent av Russland i august 2008 og av sv\u00e6rt f\u00e5 andre stater. Moskva finansierer en betydelig del av budsjettet.', 'Its own political structures since the war of the 1990s, recognised by Russia in August 2008 and by very few other states. Moscow funds a substantial part of its budget.'],
    objectives: ['\u00c5 opprettholde en separat politisk identitet og sikkerhetsordninger utenfor Tbilisis kontroll.', 'To maintain a separate political identity and security arrangements outside Tbilisi\u2019s control.'],
    supporters: ['Russland, gjennom milit\u00e6rbase, budsjettst\u00f8tte, pass og politisk tilsyn. Abkhasiske styrker trente sammen med russisk personell i \u00f8velser sent i 2025.', 'Russia, through a military base, budget support, passports and political oversight. Abkhaz forces trained alongside Russian personnel in exercises in late 2025.'],
    opponents: ['ge-gov'],
    assets: ['Den \u00f8stlige Svartehavskysten, havneanlegget ved Ochamchire og Enguri-dammen.', 'The eastern Black Sea coast, the port facility at Ochamchire and the Enguri Dam.'],
    s: ['topGeo', 'warWatchGeo', 'base7'],
  },
  {
    id: 'so-defacto', region: 'caucasus', name: ['S\u00f8r-Ossetias faktiske myndigheter', 'De facto authorities of South Ossetia'], short: 'S\u00f8r-Ossetia', kind: 'de_facto', color: '#9D7FD9',
    about: ['Egne politiske strukturer, anerkjent av Russland i august 2008 og av sv\u00e6rt f\u00e5 andre stater. Russisk finansiering utgj\u00f8r om lag fire femdeler av budsjettet, og om lag 90 % av de 56 000 innbyggerne har russisk statsborgerskap.', 'Its own political structures, recognised by Russia in August 2008 and by very few other states. Russian funding accounts for about four fifths of the budget, and about 90% of its 56,000 residents hold Russian citizenship.'],
    objectives: ['Tettere integrasjon med Russland. En traktat i 2026 utvidet samarbeidet innen forsvar, sikkerhet, utenrikspolitikk, grensepolitikk og rettslig tilpasning.', 'Closer integration with Russia. A treaty in 2026 widened cooperation in defence, security, foreign policy, border policy and legal alignment.'],
    supporters: ['Russland. Egne v\u00e6pnede styrker er formelt integrert i russiske kommandostrukturer, og russiske tjenestemenn bekler sentrale funksjoner.', 'Russia. Its own armed forces are formally integrated into Russian command structures, and Russian officials staff key functions.'],
    opponents: ['ge-gov'],
    assets: ['Fjellpassasjene mot Nord-Ossetia og Roki-tunnelen, som er landforbindelsen til Russland.', 'The mountain passes towards North Ossetia and the Roki tunnel, which is the land link to Russia.'],
    s: ['niSOss', 'warWatchGeo', 'topGeo'],
  },
  {
    id: 'ru-mil', region: 'caucasus', name: ['Russlands milit\u00e6re tilstedev\u00e6relse i Georgia', 'Russian military presence in Georgia'], short: 'Russiske baser', kind: 'occupying', color: '#C03A3A',
    about: ['Russiske styrker har v\u00e6rt til stede i begge territoriene siden august 2008. Avtalene fra 2010 ble ratifisert i 2011 og l\u00f8per i 49 \u00e5r med mulighet for forlengelse i bolker p\u00e5 15 \u00e5r.', 'Russian forces have been present in both territories since August 2008. The 2010 agreements were ratified in 2011 and run for 49 years, renewable in blocks of 15 years.'],
    objectives: ['\u00c5 holde en framskutt posisjon ved den \u00f8stlige Svartehavskysten og ved passasjene gjennom Kaukasus.', 'To hold a forward position on the eastern Black Sea coast and at the passes through the Caucasus.'],
    supporters: ['Russland selv. Begge basene ligger under den 49. kombinerte v\u00e5penarm\u00e9en i S\u00f8rlige milit\u00e6rdistrikt.', 'Russia itself. Both bases sit under the 49th Combined Arms Army of the Southern Military District.'],
    opponents: ['ge-gov'],
    assets: ['7. milit\u00e6rbase i Abkhasia med hovedkvarter og flyplass ved Bombora utenfor Gudauta, anslagsvis 3 500 soldater fordelt p\u00e5 flere anlegg. 4. gardes milit\u00e6rbase i Tskhinvali i S\u00f8r-Ossetia, opprettet i februar 2009, anslagsvis 3 000\u20134 500 soldater.', 'The 7th Military Base in Abkhazia with its headquarters and airfield at Bombora outside Gudauta, an estimated 3,500 personnel across several sites. The 4th Guards Military Base in Tskhinvali in South Ossetia, established in February 2009, an estimated 3,000\u20134,500 personnel.'],
    s: ['base7', 'base4', 'riaBases', 'warWatchGeo'],
  },
  {
    id: 'ru-fed', region: 'chechnya', name: ['Den russiske f\u00f8derasjonen', 'The Russian Federation'], short: 'Russland', kind: 'government', color: '#8894A8',
    about: ['Tsjetsjenia er en delrepublikk i Den russiske f\u00f8derasjonen, ikke et okkupert fremmed territorium. Ramzan Kadyrov har ledet republikken siden 2007 og ble gjenvalgt 18.\u201320. september 2026 med 99,85 % av stemmene, opp fra 99,73 % i 2021. Internasjonale observat\u00f8rer har tidligere kritisert gjennomf\u00f8ringen av valg i republikken skarpt.', 'Chechnya is a constituent republic of the Russian Federation, not an occupied foreign territory. Ramzan Kadyrov has led the republic since 2007 and was re-elected on 18\u201320 September 2026 with 99.85% of the vote, up from 99.73% in 2021. International observers have previously criticised the conduct of elections in the republic sharply.'],
    objectives: ['\u00c5 holde republikken stabil innenfor f\u00f8derasjonen. Kadyrov har f\u00e5tt vide fullmakter mot \u00e5 sikre den stabiliteten.', 'To keep the republic stable within the federation. Kadyrov has been given wide leeway in return for ensuring that stability.'],
    supporters: ['F\u00f8derale myndigheter i Moskva. Tsjetsjenske Akhmat-styrker har deltatt i krigen i Ukraina siden 2022.', 'Federal authorities in Moscow. Chechen Akhmat forces have taken part in the war in Ukraine since 2022.'],
    opponents: [],
    assets: ['Grosnyj og de f\u00f8derale institusjonene i republikken.', 'Grozny and the federal institutions within the republic.'],
    s: ['reutersChe', 'wikiCheHead', 'wikiCheElec', 'fpChechnya'],
  },
  // ── Yemen ──────────────────────────────────────────────────────────────
  {
    id: 'ye-houthi', region: 'yemen', short: 'Ansar Allah', kind: 'de_facto', color: '#3E9E5F',
    name: ['Ansar Allah (houthiene)', 'Ansar Allah (the Houthis)'],
    about: ['Zaydi-sjiittisk bevegelse som har styrt Sanaa og det meste av Nord-Jemen siden 2014, gjennom Det øverste politiske rådet. Ikke internasjonalt anerkjent som Jemens regjering.', 'A Zaydi Shia movement that has governed Sanaa and most of northern Yemen since 2014 through the Supreme Political Council. Not internationally recognised as Yemen’s government.'],
    objectives: ['Beholde kontrollen over nord og Rødehavskysten, presse Saudi-Arabia til å avslutte intervensjonen, og hevde en rolle i Rødehavets skipsfart.', 'Hold the north and the Red Sea coast, press Saudi Arabia to end the intervention, and assert a role over Red Sea shipping.'],
    supporters: ['Bredt omtalt som støttet av Iran. Gikk inn i Iran-krigen 28. mars 2026 med angrep mot Israel.', 'Widely described as Iran-backed. Entered the 2026 Iran war on 28 March 2026 with attacks on Israel.'],
    opponents: ['ye-plc'],
    assets: ['Havnen i Hodeidah, Sanaa internasjonale lufthavn, Mokha og Perim ved Bab el-Mandeb, og hele Rødehavskysten utenom Midi-distriktet.', 'Hodeidah port, Sanaa international airport, Mokha and Perim at Bab el-Mandeb, and the entire Red Sea coast apart from Midi district.'],
    s: ['wikiHouthiYem', 'wikiYem2026', 'ajYemenMaps'],
  },
  {
    id: 'ye-plc', region: 'yemen', short: 'PLC', kind: 'government', color: '#D6453D',
    name: ['Presidentrådet (den anerkjente regjeringen)', 'Presidential Leadership Council (recognised government)'],
    about: ['Jemens internasjonalt anerkjente regjering, ledet av Presidentrådet, med sete i Aden. Støttet av den saudiskledede koalisjonen.', 'Yemen’s internationally recognised government, led by the Presidential Leadership Council and seated in Aden. Backed by the Saudi-led coalition.'],
    objectives: ['Ta tilbake territorium fra houthiene, holde sammen de sørlige styrkene etter at STC ble oppløst, og sikre oljefeltene i Marib og Hadhramaut.', 'Retake territory from the Houthis, hold the southern forces together after the STC’s dissolution, and secure the oil fields in Marib and Hadhramaut.'],
    supporters: ['Saudi-Arabia leder koalisjonen. De forente arabiske emirater trakk ut sine siste styrker i desember 2025 etter at forsvarspakten ble sagt opp.', 'Saudi Arabia leads the coalition. The United Arab Emirates withdrew its last forces in December 2025 after the defence pact was cancelled.'],
    opponents: ['ye-houthi'],
    assets: ['Aden med havn og lufthavn, oljefeltene i Marib og Hadhramaut, og havnen i Mukalla.', 'Aden with its port and airport, the oil fields in Marib and Hadhramaut, and the port of Mukalla.'],
    s: ['wikiYemen', 'ajYemenMaps', 'wikiSouthYem'],
  },

  {
    id: 'ye-stc', region: 'yemen', short: 'STC', kind: 'separatist', color: '#E2B13C',
    name: ['Det sørlige overgangsrådet (STC)', 'Southern Transitional Council (STC)'],
    about: ['Sørlig separatistråd som i desember 2025 tok nesten hele det tidligere Sør-Jemen. Oppløst i januar 2026 etter regjeringens motoffensiv; lederen Aidarous al-Zubaidi forlot landet.', 'A southern separatist council that in December 2025 took almost all of former South Yemen. Dissolved in January 2026 after the government counteroffensive; its leader Aidarous al-Zubaidi left the country.'],
    objectives: ['Selvstyre eller selvstendighet for Sør-Jemen innenfor grensene til det tidligere Sør-Jemen.', 'Autonomy or independence for South Yemen within the borders of the former South Yemen.'],
    supporters: ['Støttet av De forente arabiske emirater, som trakk ut sine siste styrker i desember 2025.', 'Backed by the United Arab Emirates, which withdrew its last forces in December 2025.'],
    opponents: ['ye-plc'],
    assets: ['Aden, Mukalla og kystlinjen i sør, på det meste om lag 52 % av Jemens territorium.', 'Aden, Mukalla and the southern coastline \u2014 at its height about 52% of Yemen\u2019s territory.'],
    s: ['wikiSouthYem', 'ajYemenMaps'],
  },

  // ── Ukraine ────────────────────────────────────────────────────────────
  {
    id: 'ua-gov', region: 'ukraine', short: 'Ukraina', kind: 'government', color: '#4D8CFF',
    name: ['Ukrainas regjering', 'Government of Ukraine'],
    about: ['Ukrainas folkevalgte regjering, som utøver kontroll over om lag 80 % av landets internasjonalt anerkjente territorium.', 'Ukraine’s elected government, exercising control over roughly 80% of the country’s internationally recognised territory.'],
    objectives: ['Gjenvinne okkupert territorium og sikre landets uavhengighet. Deltar i amerikanskmeklede samtaler i Abu Dhabi fra 10. november 2026.', 'Recover occupied territory and secure the country’s independence. Taking part in US-brokered talks in Abu Dhabi from 10 November 2026.'],
    supporters: ['Våpen og økonomisk støtte fra EU-land, Storbritannia, USA og andre partnere.', 'Arms and financial support from EU states, the United Kingdom, the United States and other partners.'],
    opponents: ['ua-rus'],
    assets: ['Kyiv, havnene i Odesa, kornkorridoren gjennom Svartehavet og det meste av energinettet.', 'Kyiv, the ports of Odesa, the Black Sea grain corridor and most of the power grid.'],
    s: ['wikiUkr', 'ajUkrMap'],
  },
  {
    id: 'ua-rus', region: 'ukraine', short: 'Russisk okkupasjon', kind: 'occupying', color: '#D6453D',
    name: ['Russisk okkupasjon', 'Russian occupation'],
    about: ['Russiske styrker og okkupasjonsmyndigheter i deler av Ukraina. Annekteringene er ikke internasjonalt anerkjent.', 'Russian forces and occupation administrations in parts of Ukraine. The annexations are not internationally recognised.'],
    objectives: ['Holde og utvide de okkuperte områdene, og få kontrollen anerkjent i en framtidig avtale.', 'Hold and extend the occupied areas, and have the control recognised in a future settlement.'],
    supporters: ['Belarus som oppmarsjområde, nordkoreanske soldater i Kursk fra oktober 2024, og iranske droner.', 'Belarus as a staging area, North Korean soldiers in Kursk from October 2024, and Iranian drones.'],
    opponents: ['ua-gov'],
    assets: ['Krim med Sevastopol, Zaporizjzja kjernekraftverk, og landkorridoren langs Azovhavet.', 'Crimea with Sevastopol, the Zaporizhzhia nuclear plant, and the land corridor along the Sea of Azov.'],
    s: ['wikiUkr', 'ctpUkr1016'],
  },

  // ── Syria ──────────────────────────────────────────────────────────────
  {
    id: 'sy-gov', region: 'syria', short: 'Overgangsregjeringen', kind: 'government', color: '#3E9E5F',
    name: ['Den syriske overgangsregjeringen', 'Syrian transitional government'],
    about: ['Regjeringen som overtok etter Assad-regimets fall 8. desember 2024. Kontrollerer flertallet av landet etter offensiven i nordøst i januar 2026.', 'The government that took over after the fall of the Assad government on 8 December 2024. Controls the majority of the country after the north-eastern offensive of January 2026.'],
    objectives: ['Samle alle væpnede grupper under én struktur og gjenopprette sentral kontroll over hele landet.', 'Unify all armed groups under a single structure and restore central control over the whole country.'],
    supporters: ['Tyrkia og USA har støttet sentraliseringen. EU og USA opphevet de fleste økonomiske sanksjonene i 2025.', 'Turkey and the United States have supported the centralisation. The EU and the US lifted most economic sanctions in 2025.'],
    opponents: ['sy-sdf'],
    assets: ['Damaskus, Aleppo, Raqqa, Deir ez-Zor og de viktigste oljefeltene i øst, overtatt fra SDF i januar 2026.', 'Damascus, Aleppo, Raqqa, Deir ez-Zor and the main eastern oil fields, taken from the SDF in January 2026.'],
    s: ['euaaSyria', 'ukParlSyria', 'crsSyria'],
  },
  {
    id: 'sy-sdf', region: 'syria', short: 'SDF / AANES', kind: 'separatist', color: '#E2B13C',
    name: ['Syriske demokratiske styrker (SDF) og selvstyret i nordøst', 'Syrian Democratic Forces (SDF) and the north-east autonomous administration'],
    about: ['Kurdiskledet styrke og selvstyreadministrasjon. Etter kampene i januar 2026 er kontrollen begrenset til to atskilte områder rundt Hasakah og Qamishli, og rundt Kobani.', 'A Kurdish-led force and autonomous administration. After the fighting of January 2026 its control is limited to two separate areas around Hasakah and Qamishli, and around Kobani.'],
    objectives: ['Beholde selvstyre i nordøst innenfor rammen av integreringsavtalen fra 18. januar 2026. Lederen sier gruppen ikke søker løsrivelse.', 'Retain autonomy in the north-east within the integration agreement of 18 January 2026. Its commander says the group is not pursuing separatism.'],
    supporters: ['Tidligere hovedpartner for USA mot IS. Den amerikanske utsendingen erklærte i januar 2026 at rollen var utløpt.', 'Formerly the main US partner against Islamic State. The US envoy declared in January 2026 that this role had expired.'],
    opponents: ['sy-gov'],
    assets: ['Hasakah, Qamishli og Kobani. Oljefeltene i Deir ez-Zor gikk tapt i januar 2026.', 'Hasakah, Qamishli and Kobani. The Deir ez-Zor oil fields were lost in January 2026.'],
    s: ['euaaKurds', 'ukParlSyria', 'euaaSyria'],
  },

  // ── Sudan ──────────────────────────────────────────────────────────────
  {
    id: 'sd-saf', region: 'sudan', short: 'SAF', kind: 'government', color: '#3E9E5F',
    name: ['Sudans væpnede styrker (SAF)', 'Sudanese Armed Forces (SAF)'],
    about: ['Hæren under general al-Burhan, som leder den internasjonalt anerkjente regjeringen. Tok tilbake Khartoum i mars 2025.', 'The army under General al-Burhan, which heads the internationally recognised government. Retook Khartoum in March 2025.'],
    objectives: ['Drive RSF ut av Kordofan og deretter Darfur, og gjenopprette kontroll over hele landet.', 'Drive the RSF out of Kordofan and then Darfur, and restore control over the whole country.'],
    supporters: ['Russlands Africa Corps er beskrevet som støttespiller med logistikk og etterretning. Egypt regnes som nær partner.', 'Russia’s Africa Corps is described as providing logistics and intelligence. Egypt is seen as a close partner.'],
    opponents: ['sd-rsf', 'sd-splmn'],
    assets: ['Khartoum, Port Sudan ved Rødehavet, og hovedforsyningsrutene gjennom Nord-Kordofan.', 'Khartoum, Port Sudan on the Red Sea, and the main supply routes through North Kordofan.'],
    s: ['ajSudanCtrl', 'ajKordofan', 'wikiSudan'],
  },
  {
    id: 'sd-rsf', region: 'sudan', short: 'RSF', kind: 'paramilitary', color: '#D6453D',
    name: ['Rapid Support Forces (RSF)', 'Rapid Support Forces (RSF)'],
    about: ['Paramilitær styrke under Hemedti, med røtter i Janjaweed-militsene. Leder en rivaliserende regjering og kontrollerer nesten hele Darfur.', 'A paramilitary force under Hemedti, rooted in the Janjaweed militias. Heads a rival government and controls almost all of Darfur.'],
    objectives: ['Holde Darfur og Vest-Kordofan, og stanse hærens framrykning østfra.', 'Hold Darfur and West Kordofan, and halt the army’s advance from the east.'],
    supporters: ['De forente arabiske emirater anklages for å levere våpen. Emiratene avviser anklagene.', 'The United Arab Emirates is accused of supplying weapons. The UAE rejects the allegations.'],
    opponents: ['sd-saf'],
    assets: ['El Fasher og de øvrige delstatshovedstedene i Darfur, og forsyningsrutene vestover mot Tsjad og Libya.', 'El Fasher and the other Darfur state capitals, and the supply routes west towards Chad and Libya.'],
    s: ['ajSudanCtrl', 'wikiSudan'],
  },
  {
    id: 'sd-splmn', region: 'sudan', short: 'SPLM-N', kind: 'opposition', color: '#9B6BD6',
    name: ['SPLM-N (al-Hilu)', 'SPLM-N (al-Hilu)'],
    about: ['Opprørsbevegelse som holder lommer i Sør-Kordofan og sørlige Blå Nil, alliert med RSF siden 2026.', 'A rebel movement holding pockets in South Kordofan and southern Blue Nile, allied with the RSF since 2026.'],
    objectives: ['Beholde kontroll i Nuba-fjellene og sørlige Blå Nil.', 'Retain control in the Nuba Mountains and southern Blue Nile.'],
    supporters: ['Alliert med RSF i Blå Nil-kampanjen fra januar 2026.', 'Allied with the RSF in the Blue Nile campaign from January 2026.'],
    opponents: ['sd-saf'],
    assets: ['Lommer i Nuba-fjellene og sørlige deler av Blå Nil-delstaten.', 'Pockets in the Nuba Mountains and the southern parts of Blue Nile state.'],
    s: ['ajKordofan', 'wikiBlueNile'],
  },

  // ── Libya ──────────────────────────────────────────────────────────────
  {
    id: 'ly-gnu', region: 'libya', short: 'GNU', kind: 'government', color: '#3E9E5F',
    name: ['Samlingsregjeringen (GNU), Tripoli', 'Government of National Unity (GNU), Tripoli'],
    about: ['FN-anerkjent regjering under statsminister Dbeibah, med myndighet i hovedstaden og Vest-Libya, basert på en koalisjon av militser.', 'UN-recognised government under Prime Minister Dbeibah, with authority in the capital and western Libya, resting on a coalition of militias.'],
    objectives: ['Beholde kontrollen i vest og de sentrale statsinstitusjonene fram til valg.', 'Hold the west and the central state institutions until elections.'],
    supporters: ['Tyrkisk militær støtte. Tyrkia har samtidig utvidet kontakten med LNA.', 'Turkish military support. Turkey has at the same time widened its contacts with the LNA.'],
    opponents: ['ly-lna'],
    assets: ['Tripoli med sentralbanken og det statlige oljeselskapet, havnen i Misrata.', 'Tripoli with the central bank and the national oil corporation, and the port of Misrata.'],
    s: ['ajLibya', 'crsLibya'],
  },
  {
    id: 'ly-lna', region: 'libya', short: 'LNA / HoR', kind: 'de_facto', color: '#D6453D',
    name: ['Den libyske nasjonalhæren (LNA) og østregjeringen', 'Libyan National Army (LNA) and the eastern government'],
    about: ['Styrkene under Khalifa Haftar og den Tobruk-baserte regjeringen, som dominerer Øst-Libya og store deler av det oljerike innlandet og sør.', 'The forces under Khalifa Haftar and the Tobruk-based government, dominating eastern Libya and much of the oil-rich interior and south.'],
    objectives: ['Sikre kontroll over øst, sentrum og sør, og oppnå internasjonal anerkjennelse på linje med GNU.', 'Secure control of the east, centre and south, and obtain international recognition on a par with the GNU.'],
    supporters: ['Egypt, Russland og De forente arabiske emirater.', 'Egypt, Russia and the United Arab Emirates.'],
    opponents: ['ly-gnu'],
    assets: ['Benghazi, Sirte og Jufra, oljehavnene langs kysten og flere store oljefelt i sør.', 'Benghazi, Sirte and Jufra, the coastal oil ports and several large southern oil fields.'],
    s: ['crsLibya', 'ajLibya'],
  },

  // ── DR Congo ───────────────────────────────────────────────────────────
  {
    id: 'cd-gov', region: 'drc', short: 'FARDC', kind: 'government', color: '#3E9E5F',
    name: ['DR Kongos regjering og hær (FARDC)', 'DR Congo government and army (FARDC)'],
    about: ['Regjeringsstyrkene og de allierte Wazalendo-militsene, som holder det meste av landet utenom deler av Nord- og Sør-Kivu.', 'Government forces and allied Wazalendo militias, holding most of the country apart from parts of North and South Kivu.'],
    objectives: ['Ta tilbake områdene M23 holder i øst og gjennomføre fredsavtalene fra Washington og Doha.', 'Retake the areas held by M23 in the east and implement the Washington and Doha agreements.'],
    supporters: ['Regionale styrker og FN-operasjonen MONUSCO. Burundiske styrker opererer i Sør-Kivu.', 'Regional forces and the UN mission MONUSCO. Burundian forces operate in South Kivu.'],
    opponents: ['cd-m23'],
    assets: ['Kinshasa, Kisangani, gruvedistriktene i sør, og Uvira som ble tatt tilbake i januar 2026.', 'Kinshasa, Kisangani, the southern mining districts, and Uvira, retaken in January 2026.'],
    s: ['ctpCongo1007', 'ipisCongo', 'wikiM23'],
  },
  {
    id: 'cd-m23', region: 'drc', short: 'M23 / AFC', kind: 'opposition', color: '#D6453D',
    name: ['M23 og Kongoelvens allianse (AFC)', 'M23 and the Congo River Alliance (AFC)'],
    about: ['Opprørsgruppe som tok Goma i januar 2025 og Bukavu i februar 2025, og som holder store deler av Nord- og Sør-Kivu.', 'A rebel group that took Goma in January 2025 and Bukavu in February 2025, and holds large parts of North and South Kivu.'],
    objectives: ['Konsolidere kontrollen i Kivu-provinsene og utvide vestover fra Masisi.', 'Consolidate control in the Kivu provinces and expand westwards from Masisi.'],
    supporters: ['FN-eksperter har anslått 3 000–4 000 rwandiske soldater i Øst-Kongo. Rwanda benekter å støtte M23.', 'UN experts have estimated 3,000–4,000 Rwandan troops in eastern DR Congo. Rwanda denies supporting M23.'],
    opponents: ['cd-gov'],
    assets: ['Goma, Bukavu, Rutshuru og Masisi, og koltan-gruvene rundt Rubaya.', 'Goma, Bukavu, Rutshuru and Masisi, and the coltan mines around Rubaya.'],
    s: ['wikiM23', 'ctpCongo1007', 'ipisCongo'],
  },

  // ── Israel and the Palestinian territories ─────────────────────────────
  {
    id: 'il-mil', region: 'palestine', short: 'Israelsk kontroll', kind: 'occupying', color: '#6EA8D8',
    name: ['Israelsk militær kontroll', 'Israeli military control'],
    about: ['Israelske styrker kontrollerer om lag 60 % av Gazastripen bak linjen fra våpenhvilen 10. oktober 2025, og Vestbredden har vært okkupert siden 1967.', 'Israeli forces control about 60% of the Gaza Strip behind the line from the ceasefire of 10 October 2025, and the West Bank has been occupied since 1967.'],
    objectives: ['Opprettholde militær kontroll bak våpenhvilelinjen og kreve avvæpning av Hamas.', 'Maintain military control behind the ceasefire line and require the disarmament of Hamas.'],
    supporters: ['Militært partnerskap med USA uten formell forsvarstraktat.', 'A military partnership with the United States without a formal defence treaty.'],
    opponents: ['ps-auth'],
    assets: ['Grensekontroll, luftrommet og tilgangen til sjøen for Gaza og Vestbredden.', 'Border control, the airspace and sea access for Gaza and the West Bank.'],
    s: ['wikiGaza'],
  },
  {
    id: 'ps-auth', region: 'palestine', short: 'Palestinske myndigheter', kind: 'de_facto', color: '#3E9E5F',
    name: ['Palestinske myndigheter og Hamas-administrasjonen', 'Palestinian authorities and the Hamas administration'],
    about: ['Den palestinske selvstyremyndigheten administrerer deler av Vestbredden. Hamas beholder faktisk administrasjon i den delen av Gaza som ikke er under israelsk kontroll.', 'The Palestinian Authority administers parts of the West Bank. Hamas retains de facto administration in the part of Gaza not under Israeli control.'],
    objectives: ['Beholde sivil administrasjon og sikre gjenoppbygging og israelsk tilbaketrekking.', 'Retain civil administration and secure reconstruction and an Israeli withdrawal.'],
    supporters: ['Palestina er observatørstat i FN og anerkjent av et flertall av FNs medlemsland.', 'Palestine is a UN observer state recognised by a majority of UN member states.'],
    opponents: ['il-mil'],
    assets: ['Ramallah og byene i område A, og den delen av Gaza som ligger utenfor den israelske linjen.', 'Ramallah and the Area A cities, and the part of Gaza outside the Israeli line.'],
    s: ['wikiGaza'],
  },
];

// ════════════════════════════════════════════════════════════════════════════
// Regions
// ════════════════════════════════════════════════════════════════════════════

/**
 * The states that are parties to each conflict, and the actor each one fights
 * as, so the map can show the sides rather than painting every country
 * involved the same colour.
 *
 * This is a statement about who is a party, not about contested control: a
 * country shaded here is not being called occupied or disputed, and it is
 * drawn far more faintly than any control record so the two cannot be
 * confused. Only conflicts where the sides are a matter of record appear; the
 * rest keep the neutral "involved" tint.
 */
export const BELLIGERENT: Record<string, { iso: Iso; actor: string }[]> = {
  ukraine: [
    { iso: 'RUS', actor: 'ua-rus' },
    { iso: 'UKR', actor: 'ua-gov' },
  ],
};

export const REGIONS: Region[] = [
  {
    id: 'caucasus', conflict: 'geo08', name: ['Georgia og Kaukasus', 'Georgia and the Caucasus'], iso: ['GEO'], at: [42.6, 43.4], altitude: 0.6, verified: '2026-09-23',
    coverage: ['Dekker Abkhasia og S\u00f8r-Ossetia som egne omr\u00e5der. Geometrien er Natural Earths egne utbryterpolygoner, ikke tegnet for hånd. Resten av Georgia vises ikke som kontrollomr\u00e5de, fordi det ikke er omstridt.', 'Covers Abkhazia and South Ossetia as areas of their own. The geometry is Natural Earth\u2019s own breakaway polygons, not drawn by hand. The rest of Georgia is not shown as controlled territory, because it is not contested.'],
    legalNote: ['Begge territoriene er internasjonalt anerkjent som deler av Georgia. Kartet viser hvem som faktisk administrerer dem, ikke suverenitet. Dette er ikke det samme som en aktiv frontlinje, og de er bevisst tegnet annerledes enn russisk-okkupert ukrainsk territorium.', 'Both territories are internationally recognised as parts of Georgia. The map shows who actually administers them, not sovereignty. This is not the same as an active front line, and they are deliberately drawn differently from Russian-occupied Ukrainian territory.'],
    s: ['topGeo', 'warWatchGeo', 'neDisputed'],
  },
  {
    id: 'chechnya', conflict: 'che2', name: ['Tsjetsjenia', 'Chechnya'], iso: ['RUS'], at: [43.4, 45.7], altitude: 0.5, verified: '2026-10-30',
    coverage: ['Vises som delrepublikk i Den russiske f\u00f8derasjonen, ikke som omstridt eller okkupert omr\u00e5de. Kategorien finnes for \u00e5 kunne vise en historisk omstridt region uten \u00e5 fargelegge den som okkupert territorium.', 'Shown as a constituent republic of the Russian Federation, not as contested or occupied territory. The category exists so that a historically contested region can be shown without colouring it as occupied territory.'],
    legalNote: ['Tsjetsjenia er en del av Russland b\u00e5de rettslig og faktisk. De to tsjetsjenske krigene og separatisthistorien h\u00f8rer til regionens bakgrunn, ikke til dagens kontrollbilde.', 'Chechnya is part of Russia both legally and in fact. The two Chechen wars and the separatist history belong to the region\u2019s background, not to the present picture of control.'],
    s: ['reutersChe', 'wikiCheHead', 'fpChechnya'],
  },
  {
    id: 'yemen', conflict: 'yem', name: ['Jemen', 'Yemen'], iso: ['YEM'], at: [15.5, 45.5], altitude: 0.95, verified: '2026-11-09',
    coverage: ['Dekker alle 21 guvernementene i basiskartet. Guvernementer der kildene beskriver delt kontroll er merket omstridt i stedet for å tegne en frontlinje inne i dem. Socotra ligger i basiskartet under Hadhramaut.', 'Covers all 21 governorates in the base map. Governorates the sources describe as split are marked contested rather than drawing a front line inside them. Socotra sits under Hadhramaut in the base map.'],
    s: ['ajYemenMaps', 'wikiYem2026', 'wikiYemMap'],
  },
  {
    id: 'ukraine', conflict: 'ukr', name: ['Ukraina', 'Ukraine'], iso: ['UKR'], at: [48.5, 35.0], altitude: 1.0, verified: '2026-10-16',
    coverage: ['Dekker alle oblaster. Oblaster der fronten går gjennom området er merket delvis okkupert med den andelen kilden oppgir, ikke med en tegnet frontlinje. Russland kontrollerer samlet om lag 18–20 % av Ukraina.', 'Covers all oblasts. Oblasts the front runs through are marked partially occupied with the share the source states, not with a drawn front line. Russia controls about 18–20% of Ukraine in total.'],
    legalNote: ['Krim og de fire annekterte oblastene er internasjonalt anerkjent som ukrainsk territorium. Kartet viser militær kontroll, ikke suverenitet.', 'Crimea and the four annexed oblasts are internationally recognised as Ukrainian territory. The map shows military control, not sovereignty.'],
    s: ['ctpUkr1016', 'ajUkrMap', 'wikiUkr'],
  },
  {
    id: 'syria', conflict: 'syr', name: ['Syria', 'Syria'], iso: ['SYR'], at: [35.0, 38.5], altitude: 0.9, verified: '2026-07-31',
    coverage: ['Dekker de 14 guvernementene. Etter offensiven i januar 2026 holder overgangsregjeringen flertallet av landet, mens SDF holder to atskilte områder. Tyrkiskstøttede SNA opererer i nord uten at datasettet fordeler kontroll på guvernementsnivå for dem.', 'Covers the 14 governorates. After the January 2026 offensive the transitional government holds the majority of the country, while the SDF holds two separate areas. The Turkish-backed SNA operates in the north; the dataset does not assign governorate-level control to it.'],
    legalNote: ['Golanhøydene er okkupert fra Syria siden 1967. Israels annektering er anerkjent av USA, men ikke av FN.', 'The Golan Heights have been occupied from Syria since 1967. Israel’s annexation is recognised by the United States but not by the UN.'],
    s: ['euaaSyria', 'ukParlSyria', 'euaaKurds'],
  },
  {
    id: 'sudan', conflict: 'sdn', name: ['Sudan', 'Sudan'], iso: ['SDN'], at: [14.5, 29.5], altitude: 1.05, verified: '2026-11-08',
    coverage: ['Basiskartet har Sudans eldre delstatsinndeling og mangler Vest-Kordofan som egen enhet. Kordofan er den aktive fronten, og delstatene der er merket omstridt. Kontrollen i Darfur endret seg da RSF tok El Fasher i oktober 2025.', 'The base map uses Sudan’s older state division and lacks West Kordofan as a separate unit. Kordofan is the active front, and its states are marked contested. Control in Darfur changed when the RSF took El Fasher in October 2025.'],
    s: ['ajSudanCtrl', 'ajKordofan', 'stKordofan'],
  },
  {
    id: 'libya', conflict: 'lby', name: ['Libya', 'Libya'], iso: ['LBY'], at: [27.0, 17.5], altitude: 1.1, verified: '2026-08-20',
    coverage: ['Fordelingen følger skillet mellom den FN-anerkjente regjeringen i vest og LNA/østregjeringen i øst, sentrum og sør, slik amerikanske og regionale kilder beskriver det sommeren 2026. Innflytelsessfærer, ikke frontlinjer i strid.', 'The split follows the division between the UN-recognised government in the west and the LNA/eastern government in the east, centre and south, as US and regional sources describe it in summer 2026. Spheres of influence, not front lines in active combat.'],
    s: ['crsLibya', 'ajLibya'],
  },
  {
    id: 'drc', conflict: 'cod', name: ['Øst-Kongo', 'Eastern DR Congo'], iso: ['COD'], at: [-2.0, 28.5], altitude: 0.85, verified: '2026-10-07',
    coverage: ['Basiskartet har DR Kongos gamle elleve-provinsinndeling. M23 holder deler av Nord-Kivu og Sør-Kivu; begge provinsene er merket omstridt fordi kontrollen veksler på distriktsnivå. Resten av landet er under regjeringen.', 'The base map uses DR Congo’s old eleven-province division. M23 holds parts of North Kivu and South Kivu; both provinces are marked contested because control shifts at district level. The rest of the country is under the government.'],
    s: ['ctpCongo1007', 'ipisCongo'],
  },
  {
    id: 'palestine', conflict: 'gaza', name: ['Gaza og Vestbredden', 'Gaza and the West Bank'], iso: ['PSX'], at: [31.8, 35.0], altitude: 0.55, verified: '2026-09-27',
    coverage: ['Dekker Gazastripen og Vestbredden som to enheter. Gaza er merket omstridt fordi Israel kontrollerer om lag 60 % bak våpenhvilelinjen og Hamas administrerer resten. Vestbredden er okkupert, med palestinsk sivil administrasjon i områdene A og B.', 'Covers the Gaza Strip and the West Bank as two units. Gaza is marked contested because Israel controls about 60% behind the ceasefire line and Hamas administers the rest. The West Bank is occupied, with Palestinian civil administration in Areas A and B.'],
    legalNote: ['Okkupert palestinsk område. Militær kontroll er ikke det samme som suverenitet.', 'Occupied Palestinian territory. Military control is not the same as sovereignty.'],
    s: ['wikiGaza'],
  },
];

/** Conflicts shown with markers only: no admin-level control assessment in this dataset. */
export const NO_TERRITORY: { conflict: string; reason: L }[] = [
  { conflict: 'mmr', reason: ['Militærets stabile kontroll var i desember 2025 anslått til mellom 72 og 220 av 330 kommuner. Spennet er for vidt til å fordele kontroll på delstatsnivå, så Myanmar vises bare med konfliktmarkører.', 'The military’s stable control was estimated in December 2025 at between 72 and 220 of 330 townships. That range is too wide to assign control at state level, so Myanmar is shown with conflict markers only.'] },
  { conflict: 'som', reason: ['Datasettet har ingen datert vurdering av kontroll per region i Somalia. Vises bare med konfliktmarkører.', 'The dataset holds no dated assessment of control by region in Somalia. Shown with conflict markers only.'] },
  { conflict: 'sahel', reason: ['Kontrollen i Sahel veksler lokalt og er ikke kartlagt per region i dette datasettet. Vises bare med konfliktmarkører.', 'Control in the Sahel shifts locally and is not mapped by region in this dataset. Shown with conflict markers only.'] },
];

// ════════════════════════════════════════════════════════════════════════════
// Control assignments, per admin-1 unit
// ════════════════════════════════════════════════════════════════════════════

const yemCoast: L = ['Houthiene tok Hays og Al Khawkhah i Al Hudaydah og Mokha og Dhubab i Taiz i september 2026, og kontrollerer dermed hele Rødehavskysten med unntak av Midi-distriktet.', 'The Houthis took Hays and Al Khawkhah in Al Hudaydah and Mokha and Dhubab in Taiz in September 2026, giving them the entire Red Sea coast apart from Midi district.'];
const yemNorth: L = ['Under houthienes styre siden 2014, administrert fra Sanaa.', 'Under Houthi rule since 2014, administered from Sanaa.'];
const yemGov: L = ['Holdt av den anerkjente regjeringen. Presidentrådet tok tilbake alle STC-kontrollerte områder i januar 2026.', 'Held by the recognised government. The Presidential Leadership Council retook all STC-held areas in January 2026.'];
const YS = ['ajYemenMaps', 'wikiYem2026', 'wikiYemMap'];

export const CONTROL: ControlRecord[] = [
  // ── Caucasus ──────────────────────────────────────────────────────────────
  // Internationally Georgian territory under administrations Tbilisi does not
  // control. Drawn as `defacto`, never as occupation along a front: the legal
  // status, the military situation and the political arrangements all differ
  // from Russian-occupied Ukraine, and the region's legal note says so.
  C('GEO', 'GE-AB', 'ab-defacto', 'defacto', '2026-09-23',
    ['Egne politiske strukturer siden 1990-tallet. Russland anerkjente Abkhasia i august 2008; sv\u00e6rt f\u00e5 andre stater har gjort det. Russisk 7. milit\u00e6rbase med hovedkvarter og flyplass ved Bombora utenfor Gudauta, og anlegg spredt over Sukhumi, Gagra, Kodori-kl\u00f8fta og Enguri-dammen.', 'Its own political structures since the 1990s. Russia recognised Abkhazia in August 2008; very few other states have done so. Russia\u2019s 7th Military Base has its headquarters and airfield at Bombora outside Gudauta, with sites spread across Sukhumi, Gagra, the Kodori Gorge and the Enguri Dam.'],
    ['topGeo', 'warWatchGeo', 'base7', 'neDisputed'], { with: 'ru-mil', since: '2008-08-26' }),
  C('GEO', 'GE-SO', 'so-defacto', 'defacto', '2026-09-23',
    ['Egne politiske strukturer, anerkjent av Russland i august 2008. Russisk 4. gardes milit\u00e6rbase i Tskhinvali siden februar 2009. Russland kontrollerer grense- og sikkerhetsfunksjoner, og lokale styrker er integrert i russiske kommandostrukturer.', 'Its own political structures, recognised by Russia in August 2008. Russia\u2019s 4th Guards Military Base has been in Tskhinvali since February 2009. Russia controls border and security functions, and local forces are integrated into Russian command structures.'],
    ['niSOss', 'warWatchGeo', 'base4', 'neDisputed'], { with: 'ru-mil', since: '2008-08-26' }),
  // Chechnya is a republic of Russia. It is in the dataset because its history
  // is contested, not its present control, and it is deliberately the palest
  // fill in the set so it cannot be mistaken for occupied territory.
  C('RUS', 'RU-CE', 'ru-fed', 'federal', '2026-10-30',
    ['Delrepublikk i Den russiske f\u00f8derasjonen. De to tsjetsjenske krigene (1994\u20131996 og 1999\u20132009) og separatisthistorien h\u00f8rer til bakgrunnen. Ramzan Kadyrov har ledet republikken siden 2007 og ble gjenvalgt i september 2026.', 'A constituent republic of the Russian Federation. The two Chechen wars (1994\u20131996 and 1999\u20132009) and the separatist history belong to its background. Ramzan Kadyrov has led the republic since 2007 and was re-elected in September 2026.'],
    ['reutersChe', 'wikiCheHead', 'fpChechnya'], { since: '2009-04-16' }),
  // ── Yemen ──
  C('YEM', 'YE-SA', 'ye-houthi', 'control', '2026-11-02', yemNorth, YS, { precision: 'unit', confidence: 'medium' }),
  C('YEM', 'YE-SN', 'ye-houthi', 'control', '2026-11-02', yemNorth, YS, { precision: 'unit', confidence: 'medium' }),
  C('YEM', 'YE-SD', 'ye-houthi', 'control', '2026-11-02', ['Houthienes kjerneområde og bevegelsens opprinnelsessted.', 'The Houthi heartland and the movement’s place of origin.'], YS, { precision: 'unit', confidence: 'medium' }),
  C('YEM', 'YE-AM', 'ye-houthi', 'control', '2026-11-02', yemNorth, YS, { precision: 'unit', confidence: 'medium' }),
  C('YEM', 'YE-MW', 'ye-houthi', 'control', '2026-11-02', yemNorth, YS, { precision: 'unit', confidence: 'medium' }),
  C('YEM', 'YE-DH', 'ye-houthi', 'control', '2026-11-02', yemNorth, YS, { precision: 'unit', confidence: 'medium' }),
  C('YEM', 'YE-IB', 'ye-houthi', 'control', '2026-11-02', yemNorth, YS, { precision: 'unit', confidence: 'medium' }),
  C('YEM', 'YE-RA', 'ye-houthi', 'control', '2026-11-02', yemNorth, YS, { precision: 'unit', confidence: 'medium' }),
  C('YEM', 'YE-HU', 'ye-houthi', 'control', '2026-09-11', yemCoast, YS, { precision: 'unit', confidence: 'medium' }),
  C('YEM', 'YE-HJ', 'ye-houthi', 'partial', '2026-09-11', yemCoast, YS, { with: 'ye-plc', share: ['Hele guvernementet utenom Midi-distriktet ved kysten.', 'The whole governorate apart from Midi district on the coast.'] , precision: 'split', confidence: 'medium' }),
  C('YEM', 'YE-TA', 'ye-houthi', 'contested', '2026-09-11', ['Delt. Houthiene tok Mokha og Dhubab i september 2026, mens regjeringen holder Taiz by. Kildene beskriver aktive kamper i guvernementet.', 'Split. The Houthis took Mokha and Dhubab in September 2026, while the government holds Taiz city. The sources describe active fighting in the governorate.'], YS, { with: 'ye-plc' , precision: 'split', confidence: 'medium' }),
  C('YEM', 'YE-JA', 'ye-houthi', 'contested', '2026-11-05', ['Omstridt. Presidentrådets styrker meldte 5. november 2026 at de hadde tatt fjellkjeden Al-Dahida.', 'Contested. Presidential Leadership Council forces reported on 5 November 2026 that they had taken the Al-Dahida mountain range.'], YS, { with: 'ye-plc' , precision: 'split', confidence: 'medium' }),
  C('YEM', 'YE-BA', 'ye-houthi', 'contested', '2026-11-09', ['Omstridt. Oppført blant guvernementene med kamper i offensivene fra september 2026.', 'Contested. Listed among the governorates with fighting in the offensives from September 2026.'], YS, { with: 'ye-plc' , precision: 'split', confidence: 'medium' }),
  C('YEM', 'YE-DA', 'ye-plc', 'contested', '2026-11-09', ['Omstridt. Oppført blant guvernementene med kamper i offensivene fra september 2026.', 'Contested. Listed among the governorates with fighting in the offensives from September 2026.'], YS, { with: 'ye-houthi' , precision: 'split', confidence: 'medium' }),
  C('YEM', 'YE-LA', 'ye-plc', 'contested', '2026-11-09', ['Omstridt. Houthiene tok byen Al-Majza’a 9. november 2026.', 'Contested. The Houthis captured the town of Al-Majza’a on 9 November 2026.'], YS, { with: 'ye-houthi' , precision: 'split', confidence: 'medium' }),
  C('YEM', 'YE-MA', 'ye-plc', 'contested', '2026-11-09', ['Regjeringen holder Marib by og oljefeltene, men guvernementet er oppført blant stedene med kamper i 2026.', 'The government holds Marib city and the oil fields, but the governorate is listed among the places with fighting in 2026.'], YS, { with: 'ye-houthi' , precision: 'split', confidence: 'medium' }),
  C('YEM', 'YE-AD', 'ye-plc', 'control', '2026-01-08', ['Regjeringsstyrker sikret Aden fra 7. januar 2026 etter at STC mistet byen.', 'Government forces secured Aden from 7 January 2026 after the STC lost the city.'], YS, { precision: 'unit', confidence: 'medium' }),
  C('YEM', 'YE-AB', 'ye-plc', 'control', '2026-01-09', yemGov, YS, { precision: 'unit', confidence: 'medium' }),
  C('YEM', 'YE-SH', 'ye-plc', 'control', '2026-01-09', yemGov, YS, { precision: 'unit', confidence: 'medium' }),
  C('YEM', 'YE-HD', 'ye-plc', 'control', '2026-01-09', ['Holdt av regjeringen. Omfatter Socotra i basiskartet. STC mistet området i januar 2026.', 'Held by the government. Includes Socotra in the base map. The STC lost the area in January 2026.'], YS, { precision: 'unit', confidence: 'medium' }),
  C('YEM', 'YE-MR', 'ye-plc', 'control', '2026-01-09', yemGov, YS, { precision: 'unit', confidence: 'medium' }),

  // ── Ukraine ──
  C('UKR', 'UA-43', 'ua-rus', 'control', '2026-10-30', ['Annektert av Russland i 2014. Annekteringen er ikke internasjonalt anerkjent. Om lag 27 000 km\u00b2, og dermed om lag en fjerdedel av alt areal Russland holder i Ukraina.', 'Annexed by Russia in 2014. The annexation is not internationally recognised. About 27,000 km\u00b2, and so roughly a quarter of all the ground Russia holds in Ukraine.'], ['orbisUkr', 'wikiOccUkr', 'ajUkrMap'], { precision: 'unit', confidence: 'high' }),
  C('UKR', 'UA-40', 'ua-rus', 'control', '2026-10-30', ['Annektert med Krim i 2014. Russlands viktigste marinebase i Svartehavet.', 'Annexed with Crimea in 2014. Russia\u2019s main Black Sea naval base.'], ['orbisUkr', 'wikiOccUkr', 'ajUkrMap'], { precision: 'unit', confidence: 'high' }),
  C('UKR', 'UA-09', 'ua-rus', 'partial', '2026-10-30', ['Den mest fullstendig okkuperte oblasten utenom Krim, etter at Lysytsjansk falt i juli 2022. Council on Foreign Relations beskriver den i november 2026 som i praksis helt under russisk kontroll.', 'The most completely occupied oblast apart from Crimea, after Lysychansk fell in July 2022. The Council on Foreign Relations describes it in November 2026 as effectively entirely under Russian control.'], ['orbisUkr', 'cfrUkr'], { with: 'ua-gov', share: ['om lag 98,7 %', 'about 98.7%'], precision: 'split', confidence: 'high' }),
  C('UKR', 'UA-14', 'ua-rus', 'partial', '2026-10-30', ['Hovedfronten. ISW vurderte i oktober 2026 at russiske styrker hadde netto tap av areal i oblasten siden september. Council on Foreign Relations oppgir at Ukraina holder om lag 19 % av oblasten, som stemmer med m\u00e5lingen under.', 'The main front. ISW assessed in October 2026 that Russian forces had a net loss of ground in the oblast since September. The Council on Foreign Relations puts Ukraine\u2019s share at about 19%, which matches the measurement below.'], ['orbisUkr', 'cfrUkr', 'ctpUkr1016'], { with: 'ua-gov', share: ['om lag 79,7 %', 'about 79.7%'], precision: 'split', confidence: 'high' }),
  C('UKR', 'UA-23', 'ua-rus', 'partial', '2026-10-30', ['ISW vurderte 16. oktober 2026 at ukrainske styrker kontrollerte 24,6 % av oblasten, som stemmer med m\u00e5lingen under. Omfatter Zaporizjzja kjernekraftverk. Ukrainske styrker tok tilbake om lag 260 km\u00b2 her i februar 2026, f\u00f8rste m\u00e5ned siden 2023 der Ukraina vant mer enn det tapte.', 'ISW assessed on 16 October 2026 that Ukrainian forces controlled 24.6% of the oblast, which matches the measurement below. Includes the Zaporizhzhia nuclear plant. Ukrainian forces retook about 260 km\u00b2 here in February 2026, the first month since 2023 in which Ukraine gained more than it lost.'], ['orbisUkr', 'ctpUkr1016', 'cfrUkr'], { with: 'ua-gov', share: ['om lag 75,8 %', 'about 75.8%'], precision: 'split', confidence: 'high' }),
  C('UKR', 'UA-65', 'ua-rus', 'partial', '2026-10-30', ['Elven Dnipro deler oblasten. H\u00f8yre bredd med Kherson by ble frigjort i november 2022; venstre bredd er okkupert, og den utgj\u00f8r st\u00f8rstedelen av arealet. En tidligere vurdering i dette datasettet oppga om lag 50\u201355 %. ISW oppgir en netto endring p\u00e5 om lag 100 km\u00b2 for hele 2026, s\u00e5 forskjellen skyldes m\u00e5lem\u00e5ten, ikke territoriell endring. Det m\u00e5lte tallet er beholdt.', 'The Dnipro river divides the oblast. The right bank with Kherson city was liberated in November 2022; the left bank is occupied, and it is the larger part by area. An earlier assessment in this dataset gave about 50\u201355%. ISW puts the net change for the whole of 2026 at about 100 km\u00b2, so the difference is one of measurement, not of territorial change. The measured figure is kept.'], ['orbisUkr', 'ctpUkr1016', 'ajUkrMap'], { with: 'ua-gov', share: ['om lag 72,1 %', 'about 72.1%'], precision: 'split', confidence: 'medium' }),
  C('UKR', 'UA-63', 'ua-gov', 'partial', '2026-10-30', ['Det meste ble frigjort i september 2022. Russiske styrker holder et mindre omr\u00e5de i nord\u00f8st n\u00e6r Vovtsjansk.', 'Most was liberated in September 2022. Russian forces hold a small area in the north-east near Vovchansk.'], ['wikiKharkivOcc', 'orbisUkr', 'ajUkrMap'], { with: 'ua-rus', share: ['om lag 97 %', 'about 97%'], precision: 'split', confidence: 'medium' }),
  C('UKR', 'UA-12', 'ua-gov', 'partial', '2026-08-12', ['Ukrainske motangrep tok tilbake det meste i februar\u2013mars 2026. Per 12. august 2026 kontrollerte Russland fullt ut bare bygda Datsjne; Maliivka og Zaporizke ble gjenerobret 12. august 2026.', 'Ukrainian counterattacks retook most of it in February\u2013March 2026. As of 12 August 2026 Russia fully controlled only the village of Dachne; Maliivka and Zaporizke were recaptured on 12 August 2026.'], ['wikiDnipro', 'wikiOccDnipro'], { with: 'ua-rus', share: ['n\u00e6r 100 %', 'close to 100%'], precision: 'split', confidence: 'medium' }),
  C('UKR', 'UA-59', 'ua-gov', 'partial', '2026-10-16', ['ISW vurderte at russiske styrker hadde tatt 99,1 km\u00b2 i oblasten siden 1. januar 2026.', 'ISW assessed that Russian forces had taken 99.1 km\u00b2 in the oblast since 1 January 2026.'], ['ctpUkr1016'], { with: 'ua-rus', share: ['om lag 99 %', 'about 99%'], precision: 'split', confidence: 'high' }),
  ...['UA-30', 'UA-32', 'UA-07', 'UA-56', 'UA-18', 'UA-21', 'UA-77', 'UA-26', 'UA-51', 'UA-05', 'UA-46', 'UA-53', 'UA-68', 'UA-61', 'UA-71', 'UA-35', 'UA-74', 'UA-48'].map((code) =>
    C('UKR', code, 'ua-gov', 'control', '2026-10-30', ['Under ukrainsk kontroll. Utsatt for luftangrep, men ikke okkupert.', 'Under Ukrainian control. Subject to air attack, but not occupied.'], ['orbisUkr', 'ajUkrMap'], { precision: 'unit', confidence: 'high' })),

  // ── Syria ──
  ...['SY-DI', 'SY-RD', 'SY-HM', 'SY-HI', 'SY-LA', 'SY-TA', 'SY-ID', 'SY-DR', 'SY-SU'].map((code) =>
    C('SYR', code, 'sy-gov', 'control', '2026-07-31', ['Under overgangsregjeringen etter Assad-regimets fall i desember 2024.', 'Under the transitional government after the fall of the Assad government in December 2024.'], ['euaaSyria', 'ukParlSyria'])),
  C('SYR', 'SY-RA', 'sy-gov', 'control', '2026-02-16', ['Overgangsregjeringen tok guvernementet 17.–18. januar 2026. SDF holdt per februar 2026 bare et svært lite område i nordvest.', 'The transitional government took the governorate on 17–18 January 2026. As of February 2026 the SDF held only a very small area in the north-west.'], ['euaaSyria']),
  C('SYR', 'SY-DY', 'sy-gov', 'control', '2026-01-18', ['Overtatt fra SDF i januar 2026. Inneholder Syrias viktigste oljefelt.', 'Taken from the SDF in January 2026. Contains Syria’s main oil fields.'], ['euaaKurds', 'ukParlSyria']),
  C('SYR', 'SY-HA', 'sy-sdf', 'control', '2026-03-12', ['SDF beholdt Hasakah og Qamishli etter integreringsavtalen 18. januar 2026.', 'The SDF retained Hasakah and Qamishli after the integration agreement of 18 January 2026.'], ['euaaKurds', 'ukParlSyria']),
  C('SYR', 'SY-HL', 'sy-gov', 'contested', '2026-03-12', ['Overgangsregjeringen tok hele Aleppo by i januar 2026. SDF holder fortsatt Kobani nord i guvernementet, og tyrkiskstøttede SNA opererer i nord.', 'The transitional government took all of Aleppo city in January 2026. The SDF still holds Kobani in the north of the governorate, and the Turkish-backed SNA operates in the north.'], ['euaaKurds', 'euaaSyria'], { with: 'sy-sdf' }),
  C('SYR', 'SY-QU', 'sy-gov', 'contested', '2026-07-31', ['Grenser til de israelskokkuperte Golanhøydene. Israelske styrker har rykket inn i bufferområdet siden desember 2024.', 'Borders the Israeli-occupied Golan Heights. Israeli forces have moved into the buffer area since December 2024.'], ['euaaSyria'], { with: 'il-mil' }),

  // ── Sudan ──
  ...['SD-KH', 'SD-NO', 'SD-NR', 'SD-RS', 'SD-KA', 'SD-GD', 'SD-GZ', 'SD-SI', 'SD-NW'].map((code) =>
    C('SDN', code, 'sd-saf', 'control', '2026-10-04', ['Hæren kontrollerer Khartoum og det meste av nord, øst og sentrum.', 'The army controls Khartoum and most of the north, east and centre.'], ['ajSudanCtrl', 'ajKordofan'])),
  ...['SD-DN', 'SD-DS', 'SD-DE', 'SD-DC', 'SD-DW'].map((code) =>
    C('SDN', code, 'sd-rsf', 'control', '2026-10-04', ['RSF kontrollerer nesten hele Darfur, inkludert delstatshovedstedene, etter at El Fasher falt i oktober 2025.', 'The RSF controls almost all of Darfur, including the state capitals, after El Fasher fell in October 2025.'], ['ajSudanCtrl'])),
  C('SDN', 'SD-KN', 'sd-saf', 'contested', '2026-11-08', ['Hæren har drevet RSF ut av store deler av Nord-Kordofan, men partene hevdet motstridende kontroll over fire områder vest og sørvest for El Obeid 6. november 2026.', 'The army has pushed the RSF out of much of North Kordofan, but the two sides made conflicting claims over four areas west and south-west of El Obeid on 6 November 2026.'], ['ajSudanCtrl', 'stKordofan'], { with: 'sd-rsf' }),
  C('SDN', 'SD-KS', 'sd-saf', 'contested', '2026-10-04', ['Omstridt. Hæren holder Kadugli, mens SPLM-N (al-Hilu) holder lommer i Nuba-fjellene.', 'Contested. The army holds Kadugli, while SPLM-N (al-Hilu) holds pockets in the Nuba Mountains.'], ['ajSudanCtrl', 'ajKordofan'], { with: 'sd-splmn' }),
  C('SDN', 'SD-NB', 'sd-saf', 'contested', '2026-11-09', ['Delt. Ved utgangen av sommeren 2026 holdt RSF og SPLM-N sørlige deler av delstaten, mens hæren holdt den nordlige halvdelen.', 'Split. By the end of summer 2026 the RSF and SPLM-N held the southern parts of the state, while the army held the northern half.'], ['wikiBlueNile'], { with: 'sd-splmn' }),

  // ── Libya ──
  ...['LY-TN', 'LY-JI', 'LY-ZA', 'LY-NQ', 'LY-MB', 'LY-MI', 'LY-MZ', 'LY-GD'].map((code) =>
    C('LBY', code, 'ly-gnu', 'control', '2026-08-20', ['Vest-Libya under samlingsregjeringen i Tripoli, med tyrkisk militær støtte.', 'Western Libya under the Government of National Unity in Tripoli, with Turkish military support.'], ['ajLibya', 'crsLibya', 'wikiLibyaCF'], { since: '2020-10-23' })),
  ...['LY-BA', 'LY-MJ', 'LY-JA', 'LY-QB', 'LY-BU', 'LY-AJ', 'LY-SR', 'LY-JU', 'LY-KF', 'LY-SB', 'LY-MQ', 'LY-WD', 'LY-WS', 'LY-GT'].map((code) =>
    C('LBY', code, 'ly-lna', 'control', '2026-07-21', ['Øst, sentrum og sør under LNA og østregjeringen. Haftars styrker har utvidet innflytelsen sørover mot grensene til Niger, Tsjad og Sudan.', 'East, centre and south under the LNA and the eastern government. Haftar’s forces have extended their influence south towards the borders with Niger, Chad and Sudan.'], ['crsLibya', 'ajLibya', 'wikiLibyaCF'], { since: '2020-10-23' })),

  // ── DR Congo ──
  C('COD', 'CD-NK', 'cd-m23', 'contested', '2026-10-07', ['Omstridt. M23 holder Goma, Rutshuru og store deler av Masisi, mens regjeringsstyrker og Wazalendo-militser holder Beni, Butembo og deler av Lubero og Walikale.', 'Contested. M23 holds Goma, Rutshuru and much of Masisi, while government forces and Wazalendo militias hold Beni, Butembo and parts of Lubero and Walikale.'], ['ctpCongo1007', 'ipisCongo'], { with: 'cd-gov' }),
  C('COD', 'CD-SK', 'cd-m23', 'contested', '2026-10-07', ['Omstridt. M23 holder Bukavu og Minembwe, mens regjeringsstyrkene tok Uvira tilbake i januar 2026. Landsbyer i Kalehe-høylandet skifter hender.', 'Contested. M23 holds Bukavu and Minembwe, while government forces retook Uvira in January 2026. Villages in the Kalehe highlands change hands.'], ['ctpCongo1007', 'ctpCongo0121', 'ipisCongo'], { with: 'cd-gov' }),
  ...['CD-KN', 'CD-BC', 'CD-BN', 'CD-EQ', 'CD-OR', 'CD-MA', 'CD-KE', 'CD-KW', 'CD-KA'].map((code) =>
    C('COD', code, 'cd-gov', 'control', '2026-10-07', ['Under regjeringens kontroll. Kampene står i Kivu-provinsene i øst.', 'Under government control. The fighting is in the Kivu provinces in the east.'], ['ctpCongo1007'])),

  // ── Gaza and the West Bank ──
  C('PSX', 'PS-GZZ', 'il-mil', 'contested', '2026-09-27', ['Delt. Israel kontrollerer om lag 60 % av Gazastripen bak linjen fra våpenhvilen 10. oktober 2025. Hamas beholder faktisk administrasjon i resten.', 'Split. Israel controls about 60% of the Gaza Strip behind the line from the ceasefire of 10 October 2025. Hamas retains de facto administration in the remainder.'], ['wikiGaza'], { with: 'ps-auth', share: ['om lag 60 %', 'about 60%'], since: '2025-10-10' }),
  C('PSX', 'PS-WBK', 'il-mil', 'partial', '2026-09-27', ['Okkupert siden 1967. Den palestinske selvstyremyndigheten har sivil administrasjon i områdene A og B; Israel har sikkerhetskontroll i område C.', 'Occupied since 1967. The Palestinian Authority has civil administration in Areas A and B; Israel has security control in Area C.'], ['wikiGaza'], { with: 'ps-auth', since: '1967-06-11' }),
];

// ════════════════════════════════════════════════════════════════════════════
// Strategic places and named front lines
// ════════════════════════════════════════════════════════════════════════════

export const PLACES: KeyPlace[] = [
  { id: 'p-sanaa', name: 'Sanaa', at: [15.35, 44.21], region: 'yemen', actor: 'ye-houthi', d: '2026-11-02', note: ['Hovedstad, under houthienes kontroll siden 2014.', 'The capital, under Houthi control since 2014.'], s: ['wikiHouthiYem'] },
  { id: 'p-aden', name: 'Aden', at: [12.79, 45.03], region: 'yemen', actor: 'ye-plc', d: '2026-01-08', note: ['Regjeringens sete. Sikret av regjeringsstyrker fra 7. januar 2026.', 'Seat of the government. Secured by government forces from 7 January 2026.'], s: ['ajYemenMaps'] },
  { id: 'p-hodeidah', name: 'Al Hudaydah', at: [14.80, 42.95], region: 'yemen', actor: 'ye-houthi', d: '2026-09-11', note: ['Jemens viktigste havn ved Rødehavet, og inngangsport for matimporten til nord.', 'Yemen’s main Red Sea port and the entry point for food imports to the north.'], s: ['wikiYem2026'] },
  { id: 'p-mokha', name: 'Mokha', at: [13.32, 43.25], region: 'yemen', actor: 'ye-houthi', d: '2026-09-10', note: ['Havneby ved Bab el-Mandeb. Falt 10. september 2026 da Tareq Salehs styrker trakk seg ut.', 'Port town at Bab el-Mandeb. Fell on 10 September 2026 when Tareq Saleh’s forces withdrew.'], s: ['ajYemenMaps', 'wikiYem2026'] },
  { id: 'p-perim', name: 'Perim (Mayyun)', at: [12.66, 43.41], region: 'yemen', actor: 'ye-houthi', d: '2026-09-11', note: ['Øy midt i Bab el-Mandeb. Houthiene rykket inn 11. september 2026.', 'Island in the middle of Bab el-Mandeb. The Houthis moved in on 11 September 2026.'], s: ['wikiYem2026'] },
  { id: 'p-taiz', name: 'Taiz', at: [13.58, 44.02], region: 'yemen', actor: 'ye-plc', d: '2026-10-20', note: ['Jemens tredje største by, holdt av regjeringen i et omstridt guvernement.', 'Yemen’s third largest city, held by the government inside a contested governorate.'], s: ['ajYemenMaps'] },
  { id: 'p-marib', name: 'Marib', at: [15.47, 45.33], region: 'yemen', actor: 'ye-plc', d: '2026-11-09', note: ['Oljeby og regjeringens viktigste fotfeste i nord.', 'Oil city and the government’s main foothold in the north.'], s: ['wikiYem2026'] },
  { id: 'p-mukalla', name: 'Mukalla', at: [14.54, 49.13], region: 'yemen', actor: 'ye-plc', d: '2026-01-09', note: ['Havneby i Hadhramaut, tilbake under regjeringen i januar 2026.', 'Port city in Hadhramaut, back under the government in January 2026.'], s: ['wikiSouthYem'] },
  { id: 'p-kyiv', name: 'Kyiv', at: [50.45, 30.52], region: 'ukraine', actor: 'ua-gov', d: '2026-11-10', unit: 'UKR:UA-30', note: ['Hovedstad. Utsatt for gjentatte missilangrep mot energiinfrastruktur.', 'The capital. Subject to repeated missile attacks on energy infrastructure.'], s: ['isw1107'] },
  { id: 'p-sevastopol', name: 'Sevastopol', at: [44.62, 33.53], region: 'ukraine', actor: 'ua-rus', d: '2026-10-30', unit: 'UKR:UA-40', note: ['Russlands marinebase på Krim, okkupert siden 2014.', 'Russia’s naval base in Crimea, occupied since 2014.'], s: ['wikiUkr'] },
  { id: 'p-zaes', name: 'Zaporizjzja kjernekraftverk', at: [47.51, 34.59], region: 'ukraine', actor: 'ua-rus', d: '2026-11-10', unit: 'UKR:UA-23', note: ['Europas største kjernekraftverk, under russisk kontroll siden mars 2022.', 'Europe’s largest nuclear plant, under Russian control since March 2022.'], s: ['ctpUkr1016'] },
  { id: 'p-kharkiv', name: 'Kharkiv', at: [49.99, 36.23], region: 'ukraine', actor: 'ua-gov', d: '2026-11-10', unit: 'UKR:UA-63',
    note: ['Ukrainas nest st\u00f8rste by, aldri erobret. Det meste av Kharkiv oblast ble frigjort i september 2022, og byen er utsatt for gjentatte angrep.', 'Ukraine\u2019s second city, never captured. Most of Kharkiv oblast was liberated in September 2022, and the city is subject to repeated attack.'],
    history: [
      { actor: 'ua-gov', from: '2022-02-24', what: ['Holdt mot det russiske framst\u00f8tet i februar\u2013mars 2022.', 'Held against the Russian push in February\u2013March 2022.'], s: ['ajUkrMap'] },
      { actor: 'ua-gov', from: '2022-09-11', what: ['Motoffensiven i Kharkiv frigjorde det meste av oblasten.', 'The Kharkiv counteroffensive liberated most of the oblast.'], s: ['ajUkrMap26'] },
    ], s: ['wikiKharkivOcc', 'deskNote1110'] },
  { id: 'p-kherson', name: 'Kherson', at: [46.64, 32.61], region: 'ukraine', actor: 'ua-gov', d: '2026-10-30', unit: 'UKR:UA-65',
    note: ['Den eneste oblasthovedstaden Russland erobret etter invasjonen i 2022, og frigjort igjen 11. november samme \u00e5r. Ligger p\u00e5 h\u00f8yre bredd av Dnipro, rett overfor okkupert omr\u00e5de.', 'The only oblast capital Russia captured after the 2022 invasion, and liberated again on 11 November that year. It sits on the right bank of the Dnipro, directly across from occupied territory.'],
    history: [
      { actor: 'ua-rus', from: '2022-03-02', what: ['Erobret tidlig i invasjonen.', 'Captured early in the invasion.'], s: ['wikiKherson22'] },
      { actor: 'ua-gov', from: '2022-11-11', what: ['Frigjort etter at russiske styrker fikk ordre om \u00e5 trekke seg ut 9. november.', 'Liberated after Russian troops were ordered to withdraw on 9 November.'], s: ['wikiKherson22', 'ajUkrMap26'] },
    ], s: ['ajUkrMap26', 'orbisUkr'] },
  { id: 'p-zaporizhzhia', name: 'Zaporizjzja', at: [47.84, 35.14], region: 'ukraine', actor: 'ua-gov', d: '2026-11-08', unit: 'UKR:UA-23',
    note: ['Oblasthovedstaden, under ukrainsk kontroll. Kjernekraftverket med samme navn ligger 50 km unna og er p\u00e5 russisk side.', 'The oblast capital, under Ukrainian control. The nuclear plant of the same name is 50 km away and on the Russian side.'],
    s: ['cfrUkr', 'orbisUkr'] },
  { id: 'p-donetsk', name: 'Donetsk', at: [48.02, 37.80], region: 'ukraine', actor: 'ua-rus', d: '2026-10-30', unit: 'UKR:UA-14',
    note: ['Oblasthovedstaden, utenfor Kyivs kontroll siden 2014 og annektert av Russland i september 2022.', 'The oblast capital, outside Kyiv\u2019s control since 2014 and annexed by Russia in September 2022.'],
    history: [
      { actor: 'ua-rus', from: '2014-04-06', what: ['Tatt av russiskst\u00f8ttede separatister i april 2014.', 'Taken by Russian-backed separatists in April 2014.'], s: ['wikiUkr'] },
      { actor: 'ua-rus', from: '2022-09-30', what: ['Omfattet av Russlands annektering av fire oblaster.', 'Covered by Russia\u2019s annexation of four oblasts.'], s: ['wikiOccUkr'] },
    ], s: ['wikiOccUkr', 'orbisUkr'] },
  { id: 'p-luhansk', name: 'Luhansk', at: [48.57, 39.31], region: 'ukraine', actor: 'ua-rus', d: '2026-10-30', unit: 'UKR:UA-09',
    note: ['Oblasthovedstaden, utenfor Kyivs kontroll siden 2014. Oblasten er den mest fullstendig okkuperte utenom Krim.', 'The oblast capital, outside Kyiv\u2019s control since 2014. The oblast is the most completely occupied apart from Crimea.'],
    history: [{ actor: 'ua-rus', from: '2014-04-06', what: ['Tatt av russiskst\u00f8ttede separatister i april 2014.', 'Taken by Russian-backed separatists in April 2014.'], s: ['wikiUkr'] }],
    s: ['orbisUkr', 'cfrUkr'] },
  { id: 'p-mariupol', name: 'Mariupol', at: [47.10, 37.54], region: 'ukraine', actor: 'ua-rus', d: '2026-10-30', unit: 'UKR:UA-14',
    note: ['Havneby ved Azovhavet, erobret i mai 2022 etter en beleiring som \u00f8dela st\u00f8rstedelen av byen.', 'A port on the Sea of Azov, captured in May 2022 after a siege that destroyed most of the city.'],
    history: [{ actor: 'ua-rus', from: '2022-05-20', what: ['Falt etter beleiringen og kampene ved Azovstal.', 'Fell after the siege and the fighting at Azovstal.'], s: ['wikiUkr', 'ligaZel'] }],
    s: ['ligaZel', 'orbisUkr'] },
  { id: 'p-melitopol', name: 'Melitopol', at: [46.85, 35.37], region: 'ukraine', actor: 'ua-rus', d: '2026-10-30', unit: 'UKR:UA-23',
    note: ['Knutepunkt p\u00e5 landbroen mellom Krim og russisk fastland, okkupert siden mars 2022.', 'A hub on the land bridge between Crimea and mainland Russia, occupied since March 2022.'],
    history: [{ actor: 'ua-rus', from: '2022-03-01', what: ['Erobret i den f\u00f8rste uken av invasjonen.', 'Captured in the first week of the invasion.'], s: ['wikiUkr'] }],
    s: ['orbisUkr'] },
  { id: 'p-odesa', name: 'Odesa', at: [46.48, 30.73], region: 'ukraine', actor: 'ua-gov', d: '2026-10-30', unit: 'UKR:UA-51',
    note: ['Ukrainas viktigste havn og utskipningssted for korn. Aldri okkupert, men gjentatte ganger angrepet.', 'Ukraine\u2019s main port and the shipping point for grain. Never occupied, but repeatedly attacked.'],
    s: ['orbisUkr', 'ajUkrMap26'] },
  { id: 'p-dnipro', name: 'Dnipro', at: [48.46, 35.05], region: 'ukraine', actor: 'ua-gov', d: '2026-11-10', unit: 'UKR:UA-12',
    note: ['Industrisenter og logistikknutepunkt bak fronten. Oblasten ble delvis omstridt fra 2025, men byen er ikke okkupert.', 'An industrial and logistics hub behind the front. The oblast became partly contested from 2025, but the city is not occupied.'],
    s: ['wikiOccDnipro', 'deskNote1110'] },
  { id: 'p-simferopol', name: 'Simferopol', at: [44.95, 34.10], region: 'ukraine', actor: 'ua-rus', d: '2026-10-30', unit: 'UKR:UA-43',
    note: ['Krims administrative hovedsete. Annekteringen i 2014 er ikke internasjonalt anerkjent.', 'The administrative seat of Crimea. The 2014 annexation is not internationally recognised.'],
    history: [{ actor: 'ua-rus', from: '2014-03-18', what: ['Omfattet av annekteringen av Krim.', 'Covered by the annexation of Crimea.'], s: ['wikiUkr'] }],
    s: ['wikiOccUkr', 'orbisUkr'] },
  { id: 'p-kostiantynivka', name: 'Kostiantynivka', at: [48.53, 37.72], region: 'ukraine', actor: null, d: '2026-02-24', unit: 'UKR:UA-14',
    note: ['Logistikknutepunkt p\u00e5 Donetsk-fronten. Russiske styrker gikk inn i desember 2025, og kildene oppgir ikke en entydig kontrollstatus.', 'A logistics hub on the Donetsk front. Russian forces entered in December 2025, and the sources do not settle a single control status.'],
    s: ['wikiKostiant', 'cfrUkr'] },
  { id: 'p-huliaipole', name: 'Huliaipole', at: [47.66, 36.26], region: 'ukraine', actor: 'ua-rus', d: '2026-10-30', unit: 'UKR:UA-23',
    note: ['Tatt av russiske styrker i januar 2026 etter en offensiv som startet i september 2025.', 'Taken by Russian forces in January 2026 after an offensive that began in September 2025.'],
    history: [{ actor: 'ua-rus', from: '2026-01-31', what: ['Falt sammen med 42 landsbyer i Dnipropetrovsk og Zaporizjzja.', 'Fell along with 42 villages in Dnipropetrovsk and Zaporizhzhia.'], s: ['wikiHuliai'] }],
    s: ['wikiHuliai', 'cfrUkr'] },
  { id: 'p-pokrovsk', name: 'Pokrovsk', at: [48.28, 37.17], region: 'ukraine', actor: null, d: '2025-12-02', unit: 'UKR:UA-14', note: ['Knutepunkt på Donetsk-fronten. Kildene oppgir ikke en entydig kontrollstatus i dette datasettet.', 'A hub on the Donetsk front. The sources do not settle a single control status in this dataset.'], s: ['ajUkrMap'] },
  { id: 'p-damascus', name: 'Damaskus', at: [33.51, 36.29], region: 'syria', actor: 'sy-gov', d: '2026-07-31', note: ['Hovedstad og sete for overgangsregjeringen.', 'The capital and seat of the transitional government.'], s: ['euaaSyria'] },
  { id: 'p-qamishli', name: 'Qamishli', at: [37.05, 41.22], region: 'syria', actor: 'sy-sdf', d: '2026-03-12', note: ['En av byene SDF beholdt etter januar 2026.', 'One of the cities the SDF retained after January 2026.'], s: ['euaaKurds'] },
  { id: 'p-kobani', name: 'Kobani', at: [36.89, 38.35], region: 'syria', actor: 'sy-sdf', d: '2026-03-12', note: ['SDFs andre, atskilte område, ved grensen til Tyrkia.', 'The SDF’s second, separate area, on the Turkish border.'], s: ['euaaKurds'] },
  { id: 'p-deirezzor', name: 'Deir ez-Zor', at: [35.34, 40.14], region: 'syria', actor: 'sy-gov', d: '2026-01-18', note: ['Senter for Syrias oljefelt, overtatt fra SDF i januar 2026.', 'Centre of Syria’s oil fields, taken from the SDF in January 2026.'], s: ['euaaKurds'] },
  { id: 'p-khartoum', name: 'Khartoum', at: [15.50, 32.56], region: 'sudan', actor: 'sd-saf', d: '2026-10-04', note: ['Hovedstad, tatt tilbake av hæren i mars 2025.', 'The capital, retaken by the army in March 2025.'], s: ['ajSudanCtrl'] },
  { id: 'p-portsudan', name: 'Port Sudan', at: [19.62, 37.22], region: 'sudan', actor: 'sd-saf', d: '2026-10-04', note: ['Landets viktigste havn og regjeringens faktiske sete.', 'The country’s main port and the government’s de facto seat.'], s: ['ajSudanCtrl'] },
  { id: 'p-elfasher', name: 'El Fasher', at: [13.63, 25.35], region: 'sudan', actor: 'sd-rsf', d: '2026-10-04', note: ['Falt til RSF i oktober 2025 og befestet kontrollen over Darfur.', 'Fell to the RSF in October 2025, cementing its control of Darfur.'], s: ['ajSudanCtrl', 'wikiSudan'] },
  { id: 'p-elobeid', name: 'El Obeid', at: [13.18, 30.22], region: 'sudan', actor: 'sd-saf', d: '2026-11-08', note: ['Hovedstad i Nord-Kordofan og utgangspunkt for hærens framrykning vestover.', 'Capital of North Kordofan and the base for the army’s westward advance.'], s: ['stKordofan'] },
  { id: 'p-tripoli', name: 'Tripoli', at: [32.89, 13.19], region: 'libya', actor: 'ly-gnu', d: '2026-08-03', note: ['Hovedstad og sete for den FN-anerkjente regjeringen.', 'The capital and seat of the UN-recognised government.'], s: ['ajLibya'] },
  { id: 'p-benghazi', name: 'Benghazi', at: [32.12, 20.07], region: 'libya', actor: 'ly-lna', d: '2026-08-03', note: ['LNAs hovedsete i øst.', 'The LNA’s main seat in the east.'], s: ['ajLibya'] },
  { id: 'p-sirte', name: 'Sirte', at: [31.21, 16.59], region: 'libya', actor: 'ly-lna', d: '2026-08-03', note: ['Byen ved skillet mellom øst og vest, holdt av østregjeringen.', 'The city at the divide between east and west, held by the eastern government.'], s: ['ajLibya'] },
  { id: 'p-goma', name: 'Goma', at: [-1.68, 29.22], region: 'drc', actor: 'cd-m23', d: '2026-10-07', note: ['Provinshovedstad i Nord-Kivu, tatt av M23 i januar 2025.', 'Provincial capital of North Kivu, taken by M23 in January 2025.'], s: ['wikiM23'] },
  { id: 'p-bukavu', name: 'Bukavu', at: [-2.49, 28.85], region: 'drc', actor: 'cd-m23', d: '2026-10-07', note: ['Provinshovedstad i Sør-Kivu, tatt av M23 i februar 2025.', 'Provincial capital of South Kivu, taken by M23 in February 2025.'], s: ['wikiM23'] },
  { id: 'p-uvira', name: 'Uvira', at: [-3.40, 29.14], region: 'drc', actor: 'cd-gov', d: '2026-01-21', note: ['Tatt av M23 i desember 2025, tilbake under regjeringen etter M23s tilbaketrekning i januar 2026.', 'Taken by M23 in December 2025, back under the government after M23 withdrew in January 2026.'], s: ['ctpCongo0121', 'ipisCongo'] },
  { id: 'p-rubaya', name: 'Rubaya', at: [-1.47, 28.95], region: 'drc', actor: 'cd-m23', d: '2026-05-29', note: ['Koltan-gruveområde i Masisi. Regjeringsstyrkenes offensiv i mai 2026 mislyktes.', 'Coltan mining area in Masisi. A government offensive in May 2026 failed.'], s: ['ctpCongo1007'] },
  { id: 'p-gazacity', name: 'Gaza by', at: [31.52, 34.45], region: 'palestine', actor: null, d: '2026-09-27', note: ['Kontrollen i Gaza er delt langs linjen fra våpenhvilen i oktober 2025. Datasettet fordeler ikke byen til én aktør.', 'Control in Gaza is split along the line from the October 2025 ceasefire. The dataset does not assign the city to one actor.'], s: ['wikiGaza'] },
  { id: 'p-ramallah', name: 'Ramallah', at: [31.90, 35.20], region: 'palestine', actor: 'ps-auth', d: '2026-09-27', note: ['Sete for den palestinske selvstyremyndigheten, i område A.', 'Seat of the Palestinian Authority, in Area A.'], s: ['wikiGaza'] },
];

export const FRONTS: FrontLine[] = [
  { id: 'f-babmandeb', region: 'yemen', name: ['Bab el-Mandeb og vestkysten', 'Bab el-Mandeb and the west coast'], at: [13.0, 43.3], between: ['ye-houthi', 'ye-plc'], d: '2026-09-11', note: ['Houthienes offensiv i september 2026 ga dem Mokha, Dhubab og Perim, og dermed hele Rødehavskysten utenom Midi.', 'The Houthi offensive of September 2026 gave them Mokha, Dhubab and Perim, and with that the whole Red Sea coast apart from Midi.'], s: ['wikiYem2026', 'ajYemenMaps'] },
  { id: 'f-aljawf', region: 'yemen', name: ['Al Jawf og Marib', 'Al Jawf and Marib'], at: [16.3, 45.0], between: ['ye-plc', 'ye-houthi'], d: '2026-11-05', note: ['Presidentrådets styrker meldte 5. november 2026 at de tok fjellkjeden Al-Dahida i Al Jawf.', 'Presidential Leadership Council forces reported taking the Al-Dahida mountain range in Al Jawf on 5 November 2026.'], s: ['wikiYem2026'] },
  { id: 'f-lahej', region: 'yemen', name: ['Lahij', 'Lahij'], at: [13.3, 44.8], between: ['ye-houthi', 'ye-plc'], d: '2026-11-09', note: ['Houthiene tok byen Al-Majza’a 9. november 2026.', 'The Houthis captured the town of Al-Majza’a on 9 November 2026.'], s: ['wikiYem2026'] },
  { id: 'f-donetsk', region: 'ukraine', name: ['Donetsk-aksen', 'The Donetsk axis'], at: [48.3, 37.3], between: ['ua-rus', 'ua-gov'], d: '2026-10-16', note: ['Hovedfronten. ISW vurderte 16. oktober 2026 at russiske styrker hadde netto tap av 198 km² i oblasten siden 1. september.', 'The main front. ISW assessed on 16 October 2026 that Russian forces had a net loss of 198 km² in the oblast since 1 September.'], s: ['ctpUkr1016'] },
  { id: 'f-zapor', region: 'ukraine', name: ['Zaporizjzja-fronten', 'The Zaporizhzhia front'], at: [47.4, 35.6], between: ['ua-rus', 'ua-gov'], d: '2026-10-16', note: ['ISW vurderte at ukrainske styrker kontrollerte 24,6 % av oblasten, mot Putins påstand om 16,5 %.', 'ISW assessed that Ukrainian forces controlled 24.6% of the oblast, against Putin’s claim of 16.5%.'], s: ['ctpUkr1016'] },
  { id: 'f-dnipro', region: 'ukraine', name: ['Dnipro-linjen i Kherson', 'The Dnipro line in Kherson'], at: [46.6, 32.6], between: ['ua-gov', 'ua-rus'], d: '2026-02-24', note: ['Elven deler oblasten: høyre bredd med Kherson by er ukrainsk, venstre bredd er okkupert.', 'The river divides the oblast: the right bank with Kherson city is Ukrainian, the left bank is occupied.'], s: ['ajUkrMap'] },
  { id: 'f-kordofan', region: 'sudan', name: ['Kordofan-korridoren', 'The Kordofan corridor'], at: [13.0, 29.0], between: ['sd-saf', 'sd-rsf'], d: '2026-11-08', note: ['Hovedfronten. Hæren tok Iyal Bakhit 7. november 2026 og rykker mot Al-Khuwei, som binder sentrale Sudan til Vest-Kordofan.', 'The main front. The army took Iyal Bakhit on 7 November 2026 and is advancing on Al-Khuwei, which links central Sudan to West Kordofan.'], s: ['stKordofan', 'ajKordofan'] },
  { id: 'f-bluenile', region: 'sudan', name: ['Blå Nil', 'Blue Nile'], at: [11.5, 34.2], between: ['sd-saf', 'sd-splmn'], d: '2026-11-09', note: ['RSF og SPLM-N holder sørlige deler av delstaten, hæren den nordlige halvdelen.', 'The RSF and SPLM-N hold the southern parts of the state, the army the northern half.'], s: ['wikiBlueNile'] },
  { id: 'f-masisi', region: 'drc', name: ['Masisi og Walikale', 'Masisi and Walikale'], at: [-1.4, 28.8], between: ['cd-m23', 'cd-gov'], d: '2026-10-07', note: ['M23 konsoliderte kontrollen i søndre Masisi gjennom 2026 og rykket vestover.', 'M23 consolidated control in southern Masisi through 2026 and pushed westwards.'], s: ['ctpCongo1007'] },
  { id: 'f-kalehe', region: 'drc', name: ['Kalehe-høylandet', 'The Kalehe highlands'], at: [-2.1, 28.7], between: ['cd-m23', 'cd-gov'], d: '2026-10-07', note: ['Landsbyer skiftet hender mellom M23 og regjeringsvennlige styrker gjennom høsten 2026.', 'Villages changed hands between M23 and pro-government forces through the autumn of 2026.'], s: ['ctpCongo1007'] },
  { id: 'f-minembwe', region: 'drc', name: ['Høylandet i Sør-Kivu', 'The South Kivu highlands'], at: [-3.9, 28.5], between: ['cd-m23', 'cd-gov'], d: '2026-07-10', note: ['Kamper om Minembwe og høydedragene rundt, mellom M23-allierte militser og regjeringsstyrkene.', 'Fighting over Minembwe and the surrounding heights, between M23-allied militias and government forces.'], s: ['ctpCongo1007'] },
];

export const ACTOR: Record<string, Actor> = Object.fromEntries(ACTORS.map((a) => [a.id, a]));
export const REGION: Record<string, Region> = Object.fromEntries(REGIONS.map((r) => [r.id, r]));

// ════════════════════════════════════════════════════════════════════════════
// Earlier assessments, so the timeline can show how control changed.
// Each record is the arrangement documented for its own period; the timeline
// picks the most recent record at or before the selected year. A region with
// no record for a year is simply not drawn for that year.
// ════════════════════════════════════════════════════════════════════════════

const H = (iso: string, code: string, actor: string, status: ControlStatus, d: string, note: L, s: string[], extra: Partial<ControlRecord> = {}): ControlRecord =>
  ({ iso, code, actor, status, d, note, s, ...extra });

const yemNorth14: L = ['Houthiene tok Sanaa 21. september 2014 og har styrt nordvest siden, inkludert Rødehavskysten.', 'The Houthis took Sanaa on 21 September 2014 and have governed the north-west since, including the Red Sea coast.'];
const yemGov14: L = ['Under den internasjonalt anerkjente regjeringen etter at houthiene tok Sanaa.', 'Under the internationally recognised government after the Houthis took Sanaa.'];
const stcNote: L = ['Tatt av STC i offensiven «Lovende framtid». Innen 9. desember 2025 holdt rådet de seks guvernementene i det tidligere Sør-Jemen, om lag 52 % av Jemens territorium.', 'Taken by the STC in Operation Promising Future. By 9 December 2025 the council held the six governorates of the former South Yemen, about 52% of Yemen’s territory.'];
const YH = ['wikiHouthiYem', 'ajYemenMaps'];

export const CONTROL_HISTORY: ControlRecord[] = [
  // ── Yemen: the split that followed the 2014 takeover ──
  ...['YE-SA', 'YE-SN', 'YE-SD', 'YE-AM', 'YE-MW', 'YE-DH', 'YE-IB', 'YE-RA', 'YE-HU', 'YE-HJ'].map((code) =>
    H('YEM', code, 'ye-houthi', 'control', '2015-03-26', yemNorth14, YH, { since: '2014-09-21' })),
  ...['YE-AD', 'YE-AB', 'YE-SH', 'YE-HD', 'YE-MR'].map((code) =>
    H('YEM', code, 'ye-plc', 'control', '2015-03-26', yemGov14, YH, { since: '2014-09-21' })),
  ...['YE-TA', 'YE-MA', 'YE-JA', 'YE-BA', 'YE-DA', 'YE-LA'].map((code) =>
    H('YEM', code, 'ye-plc', 'contested', '2015-03-26', ['Frontområde mellom houthiene og regjeringsstyrkene siden den saudiskledede intervensjonen i mars 2015.', 'A front-line area between the Houthis and government forces since the Saudi-led intervention in March 2015.'], YH, { since: '2014-09-21', with: 'ye-houthi' })),
  // Yemen: the STC's five weeks in the south
  ...['YE-AD', 'YE-LA', 'YE-AB', 'YE-SH', 'YE-HD', 'YE-MR'].map((code) =>
    H('YEM', code, 'ye-stc', 'control', '2025-12-09', stcNote, ['wikiSouthYem', 'ajYemenMaps'])),

  // ── Ukraine ──
  ...['UA-43', 'UA-40'].map((code) =>
    H('UKR', code, 'ua-rus', 'control', '2014-03-18', ['Annektert av Russland i mars 2014. Annekteringen er ikke internasjonalt anerkjent.', 'Annexed by Russia in March 2014. The annexation is not internationally recognised.'], ['wikiUkr', 'ajUkrMap'])),
  ...['UA-09', 'UA-14'].map((code) =>
    H('UKR', code, 'ua-gov', 'contested', '2014-04-06', ['Deler av oblasten kom under russiskstøttede separatister fra april 2014.', 'Parts of the oblast came under Russian-backed separatists from April 2014.'], ['wikiUkr'], { with: 'ua-rus' })),
  // Every other oblast was under Ukrainian control from 2014 until the 2022 invasion.
  ...['UA-65', 'UA-23', 'UA-63', 'UA-12', 'UA-59', 'UA-48', 'UA-30', 'UA-32', 'UA-07', 'UA-56', 'UA-18', 'UA-21', 'UA-77', 'UA-26', 'UA-51', 'UA-05', 'UA-46', 'UA-53', 'UA-68', 'UA-61', 'UA-71', 'UA-35', 'UA-74'].map((code) =>
    H('UKR', code, 'ua-gov', 'control', '2014-03-18', ['Under ukrainsk kontroll. Fram til invasjonen i februar 2022 var kampene begrenset til Donbas.', 'Under Ukrainian control. Until the invasion of February 2022 the fighting was confined to Donbas.'], ['wikiUkr', 'ajUkrMap'])),
  H('UKR', 'UA-09', 'ua-rus', 'partial', '2022-07-03', ['Hele oblasten var under russisk kontroll etter at Lysytsjansk falt 3. juli 2022.', 'The whole oblast was under Russian control after Lysychansk fell on 3 July 2022.'], ['ajUkrMap', 'wikiKherson22'], { with: 'ua-gov', share: ['om lag 100 %', 'about 100%'] }),
  H('UKR', 'UA-65', 'ua-rus', 'partial', '2022-07-01', ['Russland kontrollerte 95 % av oblasten tidlig i juli 2022, før den ukrainske motoffensiven.', 'Russia controlled 95% of the oblast in early July 2022, before the Ukrainian counteroffensive.'], ['wikiKherson22'], { with: 'ua-gov', share: ['95 %', '95%'] }),
  H('UKR', 'UA-23', 'ua-rus', 'partial', '2022-07-01', ['Russland kontrollerte 70 % av oblasten tidlig i juli 2022.', 'Russia controlled 70% of the oblast in early July 2022.'], ['wikiKherson22'], { with: 'ua-gov', share: ['70 %', '70%'] }),
  H('UKR', 'UA-48', 'ua-gov', 'partial', '2022-07-01', ['Russland kontrollerte 10 % av Mykolajiv oblast tidlig i juli 2022. Oblasten ble senere fullt frigjort.', 'Russia controlled 10% of Mykolaiv oblast in early July 2022. The oblast was later fully liberated.'], ['wikiKherson22'], { with: 'ua-rus', share: ['90 %', '90%'] }),
  H('UKR', 'UA-63', 'ua-gov', 'contested', '2022-07-01', ['Store deler av Kharkiv oblast var okkupert fram til den ukrainske motoffensiven i september 2022.', 'Large parts of Kharkiv oblast were occupied until the Ukrainian counteroffensive of September 2022.'], ['wikiKharkivOcc', 'ajUkrMap'], { with: 'ua-rus' }),
  H('UKR', 'UA-48', 'ua-gov', 'control', '2022-11-11', ['Fullt frigjort etter at russiske styrker trakk seg tilbake fra Kherson by.', 'Fully liberated after Russian forces withdrew from Kherson city.'], ['wikiKherson22']),
  H('UKR', 'UA-65', 'ua-rus', 'partial', '2022-11-11', ['Høyre bredd med Kherson by ble frigjort 11. november 2022; venstre bredd forble okkupert.', 'The right bank with Kherson city was liberated on 11 November 2022; the left bank remained occupied.'], ['wikiKherson22', 'ajUkrMap'], { with: 'ua-gov', share: ['om lag 50–55 %', 'about 50–55%'] }),
  H('UKR', 'UA-63', 'ua-gov', 'partial', '2022-11-11', ['Nesten hele oblasten ble frigjort i september 2022. ISW anslo at Ukraina hadde tatt tilbake om lag 74 000 km² innen slutten av november.', 'Almost the whole oblast was liberated in September 2022. ISW estimated Ukraine had retaken about 74,000 km² by late November.'], ['ajUkrMap', 'wikiKharkivOcc'], { with: 'ua-rus', share: ['om lag 97 %', 'about 97%'] }),

  // ── Syria: before the January 2026 offensive ──
  ...['SY-HA', 'SY-DY'].map((code) =>
    H('SYR', code, 'sy-sdf', 'control', '2025-11-10', ['Under SDF og selvstyret i nordøst. ISW og CTP kartla nordøst som SDF-kontrollert 10. november 2025.', 'Under the SDF and the north-east autonomous administration. ISW and CTP mapped the north-east as SDF-controlled on 10 November 2025.'], ['euaaSyria'])),
  H('SYR', 'SY-RA', 'sy-sdf', 'contested', '2025-11-10', ['ISW og CTP kartla guvernementet som delt mellom overgangsregjeringen i sør, SDF i midten og SNA i nord.', 'ISW and CTP mapped the governorate as divided between the transitional government in the south, the SDF in the centre and the SNA in the north.'], ['euaaSyria'], { with: 'sy-gov' }),
  ...['SY-DI', 'SY-RD', 'SY-HM', 'SY-HI', 'SY-LA', 'SY-TA', 'SY-ID', 'SY-DR', 'SY-SU'].map((code) =>
    H('SYR', code, 'sy-gov', 'control', '2025-11-10', ['Under overgangsregjeringen etter Assad-regimets fall 8. desember 2024.', 'Under the transitional government after the fall of the Assad government on 8 December 2024.'], ['euaaSyria', 'crsSyria'])),
  H('SYR', 'SY-HL', 'sy-gov', 'contested', '2025-11-10', ['Aleppo var delt: overgangsregjeringen holdt byen, SDF holdt bydeler og Kobani, og SNA opererte i nord.', 'Aleppo was divided: the transitional government held the city, the SDF held districts and Kobani, and the SNA operated in the north.'], ['euaaKurds', 'euaaSyria'], { with: 'sy-sdf' }),
  H('SYR', 'SY-QU', 'sy-gov', 'contested', '2025-11-10', ['Grenser til de israelskokkuperte Golanhøydene. Israelske styrker rykket inn i bufferområdet fra desember 2024.', 'Borders the Israeli-occupied Golan Heights. Israeli forces moved into the buffer area from December 2024.'], ['euaaSyria'], { with: 'il-mil' }),

  // ── Sudan ──
  ...['SD-DS', 'SD-DE', 'SD-DC', 'SD-DW'].map((code) =>
    H('SDN', code, 'sd-rsf', 'control', '2023-06-30', ['RSF tok kontroll over det meste av Darfur tidlig i krigen.', 'The RSF took control of most of Darfur early in the war.'], ['ajSudanCtrl', 'wikiSudan'])),
  H('SDN', 'SD-DN', 'sd-saf', 'contested', '2023-06-30', ['Hæren holdt El Fasher, sitt siste store fotfeste i Darfur, fram til oktober 2025.', 'The army held El Fasher, its last major foothold in Darfur, until October 2025.'], ['ajSudanCtrl'], { with: 'sd-rsf' }),
  H('SDN', 'SD-KH', 'sd-rsf', 'contested', '2023-06-30', ['RSF tok det meste av Khartoum i de første månedene av krigen. Hæren led store tap tidlig.', 'The RSF took most of Khartoum in the first months of the war. The army suffered major losses early on.'], ['ajSudanCtrl', 'wikiSudan'], { with: 'sd-saf' }),
  ...['SD-NO', 'SD-NR', 'SD-RS', 'SD-KA', 'SD-GD', 'SD-GZ', 'SD-SI', 'SD-NW', 'SD-KN', 'SD-KS', 'SD-NB'].map((code) =>
    H('SDN', code, 'sd-saf', 'control', '2023-06-30', ['Under hæren i den første fasen av krigen.', 'Under the army in the first phase of the war.'], ['ajSudanCtrl'])),
  H('SDN', 'SD-KH', 'sd-saf', 'control', '2025-03-26', ['Hæren tok Khartoum tilbake i mars 2025.', 'The army retook Khartoum in March 2025.'], ['ajSudanCtrl', 'wikiSudan']),
  H('SDN', 'SD-DN', 'sd-rsf', 'control', '2025-10-28', ['El Fasher falt til RSF 28. oktober 2025, og befestet kontrollen over Darfur.', 'El Fasher fell to the RSF on 28 October 2025, cementing its control of Darfur.'], ['ajSudanCtrl', 'wikiSudan']),

  // ── DR Congo ──
  H('COD', 'CD-NK', 'cd-gov', 'contested', '2022-03-27', ['M23 gjenopptok opprøret i mars 2022 og tok byer i østlige Nord-Kivu.', 'M23 resumed its rebellion in March 2022 and took towns in eastern North Kivu.'], ['wikiM23'], { with: 'cd-m23' }),
  ...['CD-SK', 'CD-KN', 'CD-BC', 'CD-BN', 'CD-EQ', 'CD-OR', 'CD-MA', 'CD-KE', 'CD-KW', 'CD-KA'].map((code) =>
    H('COD', code, 'cd-gov', 'control', '2022-03-27', ['Under regjeringens kontroll. Opprøret var da begrenset til Nord-Kivu.', 'Under government control. The rebellion was then confined to North Kivu.'], ['wikiM23'])),
  H('COD', 'CD-NK', 'cd-m23', 'contested', '2025-01-27', ['M23 tok Goma 27. januar 2025.', 'M23 took Goma on 27 January 2025.'], ['wikiM23'], { with: 'cd-gov' }),
  H('COD', 'CD-SK', 'cd-m23', 'contested', '2025-02-16', ['M23 tok Bukavu i februar 2025 og rykket videre sørover.', 'M23 took Bukavu in February 2025 and advanced further south.'], ['wikiM23'], { with: 'cd-gov' }),

  // ── Gaza and the West Bank ──
  H('PSX', 'PS-GZZ', 'ps-auth', 'contested', '2023-10-07', ['Hamas administrerte Gazastripen da krigen begynte 7. oktober 2023. Israelske bakkestyrker opererte i store deler av området gjennom krigen.', 'Hamas administered the Gaza Strip when the war began on 7 October 2023. Israeli ground forces operated across much of the area through the war.'], ['wikiGaza'], { with: 'il-mil' }),
];
