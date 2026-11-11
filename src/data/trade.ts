import type { Chokepoint, Claim, L, Route } from '../types';

const c = (kind: Claim['kind'], d: string, t: L, ...s: string[]): Claim => ({ cat: 'econ', kind, t, d, s });

/**
 * Maritime chokepoints. Oil volumes are U.S. EIA estimates in million barrels per day:
 * `oil2023` from the 2024 chokepoints brief, `oil2q26` from the August 2026 Short-Term
 * Energy Outlook as reported by Rigzone. null means no estimate was published.
 */
export const CHOKEPOINTS: Chokepoint[] = [
  {
    id: 'hormuz', name: ['Hormuzstredet', 'Strait of Hormuz'], at: [26.5, 56.4], oil2023: 20.9, oil2q26: 4.9,
    importance: ['Eneste sjøvei ut av Persiabukta. I 2023 gikk rundt 20 % av verdens forbruk av petroleumsvæsker og 10,4 milliarder kubikkfot LNG per dag gjennom stredet.', 'The only sea route out of the Persian Gulf. In 2023 about 20% of global petroleum liquids consumption and 10.4 billion cubic feet of LNG per day passed through.'],
    regions: ['Persiabukta til Asia (83 % av råolje og kondensat i 2023), Europa og Nord-Amerika.', 'Persian Gulf to Asia (83% of crude and condensate in 2023), Europe and North America.'],
    commodities: ['Råolje, kondensat, raffinerte produkter, LNG fra Qatar, LPG, kunstgjødsel.', 'Crude oil, condensate, refined products, Qatari LNG, LPG, fertiliser.'],
    status: [
      c('fact', '2026-11-08', ['Trafikken ligger på rundt 20 % av nivået før krigen, ifølge Lloyd’s List Intelligence. Iran krever å styre skipsfarten gjennom en egen led.', 'Traffic stands at about 20% of the pre-war level, according to Lloyd’s List Intelligence. Iran claims the right to direct shipping through its own lane.'], 'national1108'),
      c('fact', '2026-11-04', ['USAs marineblokade av iranske havner er i kraft. Skip går gjennom den sørlige korridoren uten AIS, mange med amerikansk bistand.', 'The US naval blockade of Iranian ports is in force. Vessels transit the southern corridor without AIS, many with US assistance.'], 'uani1104'),
      c('fact', '2026-08-11', ['EIA anslår oljetransitten til 4,9 millioner fat per dag i 2. kvartal 2026, ned fra 21,6 i 4. kvartal 2025.', 'The EIA estimates oil transit at 4.9 million barrels a day in Q2 2026, down from 21.6 in Q4 2025.'], 'steo'),
      c('fact', '2026-05-05', ['Iran opprettet 5. mai en egen myndighet for å godkjenne og regulere gjennomfart.', 'On 5 May Iran set up an authority to authorise and regulate transit.'], 'wikiHormuz'),
    ],
    exposed: [
      { iso: 'CHN', t: ['Blant de fire største mottakerne. Kina, India, Japan og Sør-Korea tok til sammen 69 % av råolje og kondensat gjennom stredet i 2023.', 'Among the four largest destinations. China, India, Japan and South Korea together took 69% of crude and condensate through the strait in 2023.'], s: ['eia'] },
      { iso: 'IND', t: ['Blant de fire største mottakerne (EIA, 2023).', 'Among the four largest destinations (EIA, 2023).'], s: ['eia'] },
      { iso: 'JPN', t: ['Blant de fire største mottakerne (EIA, 2023).', 'Among the four largest destinations (EIA, 2023).'], s: ['eia'] },
      { iso: 'KOR', t: ['Blant de fire største mottakerne (EIA, 2023).', 'Among the four largest destinations (EIA, 2023).'], s: ['eia'] },
      { iso: 'QAT', t: ['All LNG-eksport går gjennom stredet. Ras Laffan ble truffet 18. mars 2026.', 'All LNG exports pass through the strait. Ras Laffan was hit on 18 March 2026.'], s: ['eia', 'wikiIran'] },
      { iso: 'SAU', t: ['Kan lede olje utenom via East-West-rørledningen til Yanbu ved Rødehavet.', 'Can bypass the strait through the East-West pipeline to Yanbu on the Red Sea.'], s: ['eia', 'steo'] },
      { iso: 'ARE', t: ['Kan lede olje utenom via rørledningen til Fujairah (1,5 millioner fat per dag).', 'Can bypass the strait through the pipeline to Fujairah (1.5 million barrels a day).'], s: ['eia'] },
    ],
    conflicts: ['iran'], s: ['eia', 'steo', 'national1108', 'uani1104', 'wikiHormuz'],
  },
  {
    id: 'bab', name: ['Bab el-Mandeb', 'Bab el-Mandeb Strait'], at: [12.6, 43.35], oil2023: 8.6, oil2q26: 8.1,
    importance: ['Sørlig inngang til Rødehavet og Suezkanalen. Alternativ rute for saudisk olje når Hormuz er stengt.', 'Southern gateway to the Red Sea and the Suez Canal. An alternative route for Saudi oil when Hormuz is closed.'],
    regions: ['Asia og Persiabukta til Europa og Middelhavet.', 'Asia and the Persian Gulf to Europe and the Mediterranean.'],
    commodities: ['Containergods, råolje, raffinerte produkter, LNG, korn.', 'Container cargo, crude oil, refined products, LNG, grain.'],
    status: [
      c('fact', '2026-07-20', ['Houthiene erklærte blokade av saudiske havner og skip. Siden juli 2026 er det registrert 12 angrep eller angrepsforsøk på handelsskip i det sørlige Rødehavet.', 'The Houthis declared a blockade of Saudi ports and ships. Since July 2026 there have been 12 attacks or attempted attacks on merchant ships in the southern Red Sea.'], 'wikiYemen', 'acss'),
      c('fact', '2026-09-11', ['Houthiene kontrollerer hele den jemenittiske kysten ved stredet etter å ha tatt Mokha og Perim.', 'The Houthis control the entire Yemeni shore of the strait after taking Mokha and Perim.'], 'wikiYemen'),
      c('fact', '2026-08-11', ['Oljevolumet steg fra 5,4 til 8,1 millioner fat per dag fordi Saudi-Arabia sender råolje via Yanbu i stedet for Hormuz.', 'Oil volume rose from 5.4 to 8.1 million barrels a day because Saudi Arabia is shipping crude via Yanbu instead of Hormuz.'], 'steo'),
      c('fact', '2026-05-31', ['Rundt 31 skip per dag passerte stredet i mai 2026, mot 75 før krisen.', 'About 31 ships a day transited the strait in May 2026, against 75 before the crisis.'], 'wikiRedSea'),
    ],
    exposed: [
      { iso: 'EGY', t: ['Trafikken til Suezkanalen sørfra må gjennom stredet.', 'Traffic reaching the Suez Canal from the south must pass the strait.'], s: ['gcaptain'] },
      { iso: 'SAU', t: ['Rødehavseksporten fra Yanbu må passere stredet eller gå nordover gjennom Suez.', 'Red Sea exports from Yanbu must pass the strait or go north through Suez.'], s: ['lli0806', 'steo'] },
      { iso: 'YEM', t: ['Matimporten til Nord-Jemen går gjennom de samme farvannene.', 'Food imports to northern Yemen pass through the same waters.'], s: ['wikiRedSea'] },
    ],
    conflicts: ['yem', 'gaza', 'iran'], s: ['eia', 'steo', 'wikiYemen', 'acss', 'wikiRedSea'],
  },
  {
    id: 'suez', name: ['Suezkanalen', 'Suez Canal'], at: [30.5, 32.35], oil2023: 8.8, oil2q26: 5.8,
    importance: ['Korteste sjøvei mellom Asia og Europa. EIAs 2023-tall omfatter også SUMED-rørledningen.', 'The shortest sea route between Asia and Europe. The EIA 2023 figure also includes the SUMED pipeline.'],
    regions: ['Asia, Persiabukta og Øst-Afrika til Europa.', 'Asia, the Persian Gulf and East Africa to Europe.'],
    commodities: ['Containergods, råolje, raffinerte produkter, LNG, bulk.', 'Container cargo, crude oil, refined products, LNG, bulk.'],
    status: [
      c('fact', '2026-08-23', ['Passeringene i fire uker til 23. august var de høyeste siden februar 2024, men fortsatt 40 % under nivået før houthi-angrepene.', 'Transits in the four weeks to 23 August were the highest since February 2024 but still 40% below the level before the Houthi attacks.'], 'lli0827'),
      c('fact', '2026-03-02', ['Containerrederiene la om til Kapp det gode håp igjen da Iran-krigen brøt ut.', 'Container lines diverted back to the Cape of Good Hope when the Iran war broke out.'], 'seatrade'),
      c('fact', '2026-08-06', ['Supertankere fra Yanbu letter lasten eller losser delvis i Ain Sukhna for å klare kanalens dypgangsgrense.', 'Supertankers from Yanbu lighten cargo or part-discharge at Ain Sukhna to meet the canal’s draught limit.'], 'lli0806'),
    ],
    exposed: [{ iso: 'EGY', t: ['Trafikken gjennom kanalen lå 60 % under 2023-nivået i første uke av 2026.', 'Traffic through the canal was 60% below the 2023 level in the first week of 2026.'], s: ['gcaptain'] }],
    conflicts: ['yem', 'gaza'], s: ['eia', 'steo', 'lli0827', 'lli0806', 'seatrade', 'gcaptain'],
  },
  {
    id: 'malacca', name: ['Malakkastredet', 'Strait of Malacca'], at: [2.5, 101.4], oil2023: 23.7, oil2q26: 16.6,
    importance: ['Verdens største oljeknutepunkt målt i volum i 2023, og hovedleden mellom Det indiske hav og Øst-Asia.', 'The world’s largest oil chokepoint by volume in 2023, and the main lane between the Indian Ocean and East Asia.'],
    regions: ['Midtøsten og Afrika til Kina, Japan og Sør-Korea.', 'Middle East and Africa to China, Japan and South Korea.'],
    commodities: ['Råolje, LNG, containergods, kull, palmeolje.', 'Crude oil, LNG, container cargo, coal, palm oil.'],
    status: [c('fact', '2026-08-11', ['EIA anslår 16,6 millioner fat per dag i 2. kvartal 2026. Kilden forklarer ikke nedgangen, men den faller i tid sammen med bortfallet av olje fra Persiabukta.', 'The EIA estimates 16.6 million barrels a day in Q2 2026. The source does not explain the drop, which coincides with the loss of Persian Gulf oil.'], 'steo')],
    exposed: [], conflicts: [], s: ['eia', 'steo'],
  },
  {
    id: 'taiwanstrait', name: ['Taiwanstredet', 'Taiwan Strait'], at: [24.5, 119.6], oil2023: null, oil2q26: null,
    importance: ['Viktig led for containerskip mellom Nordøst-Asia og resten av verden.', 'A major lane for container ships between North-East Asia and the rest of the world.'],
    regions: ['Kina, Japan, Sør-Korea og Taiwan til Sørøst-Asia, Europa og Midtøsten.', 'China, Japan, South Korea and Taiwan to South-East Asia, Europe and the Middle East.'],
    commodities: ['Containergods, halvledere, energi.', 'Container cargo, semiconductors, energy.'],
    status: [c('fact', '2026-11-09', ['Ingen bekreftede restriksjoner på handelsskipsfart.', 'No confirmed restrictions on merchant shipping.'], 'cw1026')],
    exposed: [], conflicts: ['taiwan'], s: ['cw1026'],
  },
  {
    id: 'bosporus', name: ['Bosporos og Dardanellene', 'Bosporus and Dardanelles'], at: [41.1, 29.07], oil2023: 3.4, oil2q26: 4.1,
    importance: ['Eneste sjøvei mellom Svartehavet og Middelhavet. Regulert av Montreux-konvensjonen av 1936.', 'The only sea route between the Black Sea and the Mediterranean. Governed by the 1936 Montreux Convention.'],
    regions: ['Russland, Ukraina, Kasakhstan og Kaukasus til Middelhavet.', 'Russia, Ukraine, Kazakhstan and the Caucasus to the Mediterranean.'],
    commodities: ['Råolje, raffinerte produkter, korn, stål.', 'Crude oil, refined products, grain, steel.'],
    status: [
      c('fact', '2022-02-28', ['Tyrkia stengte stredene for krigførende staters krigsskip etter Montreux-konvensjonen fra februar 2022. Det blokkerte både russiske forsterkninger fra Middelhavet og NATO-fartøyer på vei inn.', 'Turkey closed the straits to belligerents’ warships under the Montreux Convention from February 2022. That blocked both Russian reinforcements from the Mediterranean and NATO vessels heading in.'], 'wMontreux'),
      c('fact', '2026-07-20', ['Montreux-konvensjonen fylte 90 år i juli 2026. Handelsskip har fri gjennomfart i fredstid; krigsskip fra stater uten Svartehavskyst er begrenset i tonnasje og kan ligge der i høyst 21 dager, og de største fartøysklassene er i praksis utelukket.', 'The Montreux Convention turned ninety in July 2026. Merchant ships have free passage in peacetime; warships of states without a Black Sea coast are limited by tonnage and may stay at most 21 days, and the largest classes are in practice excluded.'], 'carnegieMontreux'),
      c('fact', '2026-11-03', ['Tyrkia har gjentatte ganger hevet satsen transittavgiftene regnes ut fra, fra 0,80 dollar per nettotonn før revisjonen til 6,70 dollar fra juli 2026. Satsen gjelder alle under Montreux-rammen, ikke russisk skipsfart spesielt.', 'Turkey has repeatedly raised the rate transit charges are calculated from, from $0.80 per net tonne before the revision to $6.70 from July 2026. The rate applies to all shipping under the Montreux framework, not to Russian shipping in particular.'], 'eutodayStraits'),
      c('assessment', '2026-11-03', ['Tyrkia avviste fortsatt høsten 2026 å åpne stredene for NATO-krigsskip, tross press fra USA og Frankrike. Ankara viser til Montreux-konvensjonen.', 'As of autumn 2026 Turkey still refused to open the straits to NATO warships despite pressure from the United States and France. Ankara points to the Montreux Convention.'], 'eutodayStraits'),
      c('fact', '2008-08-07', ['Tyrkia brukte Montreux-fullmaktene i denne sammenhengen første gang under krigen mellom Russland og Georgia i 2008.', 'Turkey first exercised its Montreux powers in this context during the 2008 war between Russia and Georgia.'], 'carnegieMontreux'),
    ],
    exposed: [
      { iso: 'UKR', t: ['Korneksporten sjøveien går gjennom stredene.', 'Seaborne grain exports pass through the straits.'], s: ['wikiUkr'] },
      { iso: 'GEO', t: ['Georgisk eksport fra Poti og Batumi, og transitt fra Kaspihavet, må ut gjennom stredene.', 'Georgian exports from Poti and Batumi, and Caspian transit, must leave through the straits.'], s: ['carnegieMontreux'] },
      { iso: 'TUR', t: ['Tyrkia forvalter gjennomfarten og tar transittavgiftene, og er samtidig part i regionens sikkerhetspolitikk.', 'Turkey administers passage and collects the transit charges, and is at the same time a party to the region’s security politics.'], s: ['eutodayStraits'] },
    ],
    conflicts: ['ukr', 'geo08'], s: ['eia', 'steo', 'carnegieMontreux', 'usnwcStraits'],
  },
  {
    id: 'gibraltar', name: ['Gibraltarstredet', 'Strait of Gibraltar'], at: [35.95, -5.6], oil2023: null, oil2q26: null,
    importance: ['Forbinder Middelhavet med Atlanterhavet.', 'Connects the Mediterranean with the Atlantic.'],
    regions: ['Middelhavet og Suez til Nord-Europa og Amerika.', 'The Mediterranean and Suez to northern Europe and the Americas.'],
    commodities: ['Containergods, energi, bulk.', 'Container cargo, energy, bulk.'],
    status: [c('fact', '2026-11-09', ['Ingen kjente restriksjoner.', 'No known restrictions.'], 'eia')],
    exposed: [], conflicts: [], s: ['eia'],
  },
  {
    id: 'panama', name: ['Panamakanalen', 'Panama Canal'], at: [9.1, -79.7], oil2023: 2.1, oil2q26: 3.2,
    importance: ['Forbinder Atlanterhavet og Stillehavet. Kapasiteten avhenger av ferskvann i Gatún-sjøen.', 'Connects the Atlantic and the Pacific. Capacity depends on fresh water in Lake Gatún.'],
    regions: ['USAs østkyst og Mexicogolfen til Asia og Sør-Amerikas vestkyst.', 'The US East and Gulf coasts to Asia and the west coast of South America.'],
    commodities: ['Containergods, LPG, LNG, korn, raffinerte produkter.', 'Container cargo, LPG, LNG, grain, refined products.'],
    status: [c('fact', '2023-10-31', ['Tørke i 2023 tvang kanalmyndigheten til å begrense antall passeringer og dypgang.', 'Drought in 2023 forced the canal authority to limit transits and draught.'], 'eia')],
    exposed: [], conflicts: [], s: ['eia', 'steo'],
  },
  {
    id: 'danish', name: ['De danske stredene', 'Danish Straits'], at: [55.7, 11.0], oil2023: 4.9, oil2q26: 4.7,
    importance: ['Sjøveien mellom Østersjøen og Nordsjøen, og utskipingsrute for russisk olje fra Østersjøhavnene.', 'The sea route between the Baltic and the North Sea, and the export route for Russian oil from Baltic ports.'],
    regions: ['Østersjøen til Nordsjøen og verdensmarkedet.', 'The Baltic to the North Sea and world markets.'],
    commodities: ['Råolje, raffinerte produkter, containergods.', 'Crude oil, refined products, container cargo.'],
    status: [c('fact', '2026-08-11', ['EIA anslår 4,7 millioner fat per dag i 2. kvartal 2026.', 'The EIA estimates 4.7 million barrels a day in Q2 2026.'], 'steo')],
    exposed: [], conflicts: ['ukr'], s: ['eia', 'steo'],
  },
  {
    id: 'cape', name: ['Kapp det gode håp', 'Cape of Good Hope'], at: [-35.0, 19.0], oil2023: 6.0, oil2q26: 9.4,
    importance: ['Ikke et knutepunkt, men hovedalternativet når Rødehavet og Suez unngås.', 'Not a chokepoint, but the main alternative when the Red Sea and Suez are avoided.'],
    regions: ['Asia og Persiabukta til Europa og Amerika rundt Afrika.', 'Asia and the Persian Gulf to Europe and the Americas around Africa.'],
    commodities: ['Containergods, råolje, bulk.', 'Container cargo, crude oil, bulk.'],
    status: [c('fact', '2026-08-11', ['EIA anslår 9,4 millioner fat per dag i 2. kvartal 2026, mot 6,0 i 2023.', 'The EIA estimates 9.4 million barrels a day in Q2 2026, against 6.0 in 2023.'], 'steo', 'eia')],
    exposed: [], conflicts: [], s: ['eia', 'steo'],
  },
];

// ── Shared waypoint segments [lat, lng]. Hand-placed, illustrative. ─────────
type P = [number, number];
const SH_SG: P[] = [[31.2, 122.5], [27, 121.5], [25.5, 120.3], [23, 118.5], [20, 115], [12, 111.5], [6, 107.5], [1.3, 104.3]];
const SG_LK: P[] = [[1.3, 104.3], [2.5, 101.4], [4.5, 99.5], [6, 96.5], [6.5, 95], [5.8, 90], [5.5, 80.5]];
const LK_BAB: P[] = [[5.5, 80.5], [7.6, 73.2], [11, 62], [13, 55], [12.8, 50], [12.2, 45], [12.6, 43.4]];
const BAB_SUEZ: P[] = [[12.6, 43.4], [14.5, 42.2], [20, 38.8], [25, 35.5], [27.7, 33.8], [29.9, 32.55], [31.3, 32.35]];
const SUEZ_GIB: P[] = [[31.3, 32.35], [33.5, 27], [35.5, 18], [37.3, 11.3], [37.6, 5], [36.3, -2], [35.95, -5.6]];
const GIB_FIN: P[] = [[35.95, -5.6], [36.5, -9.5], [39, -10.2], [43.6, -10]];
const FIN_ROT: P[] = [[43.6, -10], [48.5, -6], [50, -1.5], [51.1, 1.6], [52, 3.6]];
const LK_CAPE: P[] = [[5.5, 80.5], [-10, 65], [-22, 52.5], [-27, 48.5], [-35.5, 22], [-35, 18]];
const CAPE_FIN: P[] = [[-35, 18], [-20, 8], [0, -8], [14, -19.5], [21, -19], [30, -14.5], [36.5, -11], [43.6, -10]];
const GULF_OUT: P[] = [[26.7, 50.3], [26.3, 53], [26.4, 56.3], [25.2, 57.5], [22.5, 60.5]];
const OUT_LK: P[] = [[22.5, 60.5], [12, 68], [7.6, 73.2], [5.8, 78], [5.5, 80.5]];
const OUT_BAB: P[] = [[22.5, 60.5], [20, 60], [16, 55.5], [13, 50], [12.2, 45], [12.6, 43.4]];
const LOMBOK_N: P[] = [[-8.8, 115.75], [-6.5, 116.8], [-3, 118.2], [1, 119.3], [3.5, 121], [4.7, 126.2]];
const join = (...segs: P[][]): P[] => segs.flatMap((s, i) => (i === 0 ? s : s.slice(1)));
const rev = (s: P[]): P[] => s.slice().reverse();

const ILL: L = ['Illustrativ korridor tegnet for hånd. Ikke AIS-data og ikke en eksakt skipsled.', 'Illustrative corridor drawn by hand. Not AIS data and not an exact shipping lane.'];

/** Trade corridors. All geometry is illustrative; no live vessel positions are shown anywhere. */
export const ROUTES: Route[] = [
  { id: 'asia-eu-suez', kind: 'sea', name: ['Asia–Europa via Suez', 'Asia–Europe via Suez'], via: ['taiwanstrait', 'malacca', 'bab', 'suez', 'gibraltar'], note: ILL, s: ['eia'],
    pts: join(SH_SG, SG_LK, LK_BAB, BAB_SUEZ, SUEZ_GIB, GIB_FIN, FIN_ROT) },
  { id: 'asia-eu-cape', kind: 'sea', name: ['Asia–Europa rundt Kapp det gode håp', 'Asia–Europe around the Cape of Good Hope'], via: ['taiwanstrait', 'malacca', 'cape'], note: ILL, s: ['eia', 'seatrade'],
    pts: join(SH_SG, SG_LK, LK_CAPE, CAPE_FIN, FIN_ROT),
    status: c('fact', '2026-03-02', ['Brukt som omvei siden slutten av 2023, og på nytt av containerrederiene fra mars 2026.', 'Used as a detour since late 2023, and again by container lines from March 2026.'], 'seatrade') },
  { id: 'transpacific', kind: 'sea', name: ['Stillehavsruten Asia–Nord-Amerika', 'Transpacific Asia–North America'], via: [], note: ILL, s: ['eia'],
    pts: [[31.2, 122.5], [29, 131], [34, 142], [44, 170], [46, -170], [42, -145], [34.5, -121.5], [33.7, -118.3]] },
  { id: 'asia-usec-panama', kind: 'sea', name: ['Asia–USAs østkyst via Panama', 'Asia–US East Coast via Panama'], via: ['panama'], note: ILL, s: ['eia'],
    pts: [[31.2, 122.5], [29, 131], [28, 150], [22, 180], [15, -140], [8, -90], [6.5, -81], [7.5, -79.5], [8.9, -79.55], [9.35, -79.92], [11, -79.5], [15, -76], [19.9, -73.9], [22.9, -74.6], [28, -74], [36, -74.5], [40.4, -73.8]] },
  { id: 'asia-usec-suez', kind: 'sea', name: ['Asia–USAs østkyst via Suez', 'Asia–US East Coast via Suez'], via: ['taiwanstrait', 'malacca', 'bab', 'suez', 'gibraltar'], note: ILL, s: ['eia'],
    pts: join(SH_SG, SG_LK, LK_BAB, BAB_SUEZ, SUEZ_GIB, [[35.95, -5.6], [36.5, -9.5], [38, -40], [40, -60], [40.4, -73.8]]) },
  { id: 'transatlantic', kind: 'sea', name: ['Nord-Atlanteren Europa–Nord-Amerika', 'North Atlantic Europe–North America'], via: [], note: ILL, s: ['eia'],
    pts: [[52, 3.6], [51.1, 1.6], [50, -1.5], [49.3, -6], [46, -30], [42, -55], [40.4, -73.8]] },
  { id: 'gulf-asia', kind: 'oil', name: ['Persiabukta–Øst-Asia (olje og LNG)', 'Persian Gulf–East Asia (oil and LNG)'], via: ['hormuz', 'malacca', 'taiwanstrait'], note: ILL, s: ['eia'],
    pts: join(GULF_OUT, OUT_LK, rev(SG_LK), rev(SH_SG)),
    status: c('fact', '2026-11-08', ['Sterkt redusert siden 28. februar 2026. Se Hormuzstredet.', 'Severely reduced since 28 February 2026. See the Strait of Hormuz.'], 'national1108') },
  { id: 'gulf-asia-lombok', kind: 'oil', name: ['Persiabukta–Øst-Asia via Lombok', 'Persian Gulf–East Asia via Lombok'], via: ['hormuz'], note: ILL, s: ['eia'],
    pts: join(GULF_OUT, OUT_LK, [[5.5, 80.5], [-5, 95], [-9.5, 112], [-9.5, 115.3], [-8.8, 115.75]], LOMBOK_N, [[4.7, 126.2], [20, 127.5], [25.5, 126.5], [31.2, 122.5]]) },
  { id: 'gulf-eu-suez', kind: 'oil', name: ['Persiabukta–Europa via Suez', 'Persian Gulf–Europe via Suez'], via: ['hormuz', 'bab', 'suez', 'gibraltar'], note: ILL, s: ['eia'],
    pts: join(GULF_OUT, OUT_BAB, BAB_SUEZ, SUEZ_GIB, GIB_FIN, FIN_ROT) },
  { id: 'gulf-eu-cape', kind: 'oil', name: ['Persiabukta–Europa rundt Kapp', 'Persian Gulf–Europe around the Cape'], via: ['hormuz', 'cape'], note: ILL, s: ['eia'],
    pts: join(GULF_OUT, [[22.5, 60.5], [10, 60], [-10, 52], [-22, 52.5], [-27, 48.5], [-35.5, 22], [-35, 18]], CAPE_FIN, FIN_ROT) },
  { id: 'blacksea', kind: 'sea', name: ['Svartehavet–Middelhavet (korn og olje)', 'Black Sea–Mediterranean (grain and oil)'], via: ['bosporus'], note: ILL, s: ['wikiUkr'],
    pts: [[46.4, 30.8], [44, 30.5], [41.6, 29.3], [41.2, 29.1], [41.0, 29.0], [40.75, 28], [40.4, 26.9], [40.0, 26.15], [39.2, 25.4], [37.6, 25.8], [36.2, 26.3], [35.35, 26.65], [33.5, 27], [31.3, 32.35]] },
  { id: 'us-lng-eu', kind: 'lng', name: ['LNG fra Mexicogolfen til Europa', 'LNG from the US Gulf Coast to Europe'], via: [], note: ILL, s: ['euGas'],
    pts: [[29.6, -93.8], [27.5, -90], [24.3, -84.5], [24.0, -81.5], [25.7, -79.7], [30, -78.5], [38, -60], [46, -30], [49.3, -6], [50, -1.5], [51.1, 1.6], [52, 3.6]] },
  { id: 'aus-lng-jp', kind: 'lng', name: ['LNG fra Australia til Japan', 'LNG from Australia to Japan'], via: [], note: ILL, s: ['eia'],
    pts: join([[-20.3, 116.5], [-12, 115.8], [-8.8, 115.75]], LOMBOK_N, [[4.7, 126.2], [10, 128], [25, 134], [33.5, 138.5], [34.9, 139.75]]) },
  { id: 'brazil-china', kind: 'sea', name: ['Brasil–Kina (jernmalm og soya)', 'Brazil–China (iron ore and soy)'], via: ['cape'], note: ILL, s: ['eia'],
    pts: join([[-24, -46.2], [-30, -20], [-36, 18], [-36, 25], [-25, 60], [-8, 100], [-6.1, 105.6], [-3.3, 107.2], [1.5, 105.8], [6, 107.5]], rev(SH_SG).slice(1)) },
  { id: 'rail-north', kind: 'rail', name: ['Jernbane Kina–Europa, nordlig korridor', 'China–Europe rail, northern corridor'], via: [], note: ['Skjematisk landkorridor via Kasakhstan, Russland og Belarus.', 'Schematic land corridor via Kazakhstan, Russia and Belarus.'], s: [],
    pts: [[34.3, 108.9], [43.8, 87.6], [44.2, 80.4], [51.2, 71.4], [55.75, 37.6], [52.1, 23.7], [51.4, 6.8]] },
  { id: 'rail-middle', kind: 'rail', name: ['Midtkorridoren over Kaspihavet', 'Middle Corridor across the Caspian'], via: [], note: ['Skjematisk landkorridor via Kasakhstan, ferge over Kaspihavet, Aserbajdsjan, Georgia og Tyrkia til Sentral-Europa.', 'Schematic land corridor via Kazakhstan, a Caspian ferry, Azerbaijan, Georgia and Turkey to central Europe.'], s: [],
    pts: [[34.3, 108.9], [43.8, 87.6], [44.2, 80.4], [43.65, 51.2], [40.4, 49.9], [41.7, 44.8], [40.6, 43.1], [41.0, 29.0], [44.8, 20.5], [47.5, 19.05], [48.2, 16.4], [51.4, 6.8]] },
];
