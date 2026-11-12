import type { ImpactLink, L, RelType, Scenario } from '../types';

type End = { label: L; at: [number, number]; iso?: string };
const P = {
  hormuz: { label: ['Hormuzstredet', 'Strait of Hormuz'] as L, at: [26.5, 56.4] as [number, number] },
  bab: { label: ['Bab el-Mandeb', 'Bab el-Mandeb'] as L, at: [12.6, 43.35] as [number, number] },
  suez: { label: ['Suezkanalen', 'Suez Canal'] as L, at: [30.5, 32.35] as [number, number] },
  cape: { label: ['Kapp det gode håp', 'Cape of Good Hope'] as L, at: [-35, 19] as [number, number] },
};
const cty = (iso: string, no: string, en: string, lat: number, lng: number): End => ({ label: [no, en], at: [lat, lng], iso });
const C = {
  irn: cty('IRN', 'Iran', 'Iran', 32.5, 53.5), qat: cty('QAT', 'Qatar', 'Qatar', 25.3, 51.2), chn: cty('CHN', 'Kina', 'China', 35, 104),
  ind: cty('IND', 'India', 'India', 22, 79), jpn: cty('JPN', 'Japan', 'Japan', 36, 138), kor: cty('KOR', 'Sør-Korea', 'South Korea', 36.5, 127.8),
  eu: { label: ['EU', 'EU'], at: [50.85, 4.35] } as End, sau: cty('SAU', 'Saudi-Arabia', 'Saudi Arabia', 24, 45), lbn: cty('LBN', 'Libanon', 'Lebanon', 33.9, 35.9),
  yem: cty('YEM', 'Jemen', 'Yemen', 15.4, 44.2), egy: cty('EGY', 'Egypt', 'Egypt', 27, 30), gaza: cty('PSE', 'Gaza', 'Gaza', 31.42, 34.38),
  ukr: cty('UKR', 'Ukraina', 'Ukraine', 49, 32), rus: cty('RUS', 'Russland', 'Russia', 55.75, 37.6), prk: cty('PRK', 'Nord-Korea', 'North Korea', 39.03, 125.75),
  nor: cty('NOR', 'Norge', 'Norway', 61, 9), sdn: cty('SDN', 'Sudan', 'Sudan', 15.5, 32.5), are: cty('ARE', 'Emiratene', 'UAE', 24.4, 54.4),
  eth: cty('ETH', 'Etiopia', 'Ethiopia', 9, 39), tcd: cty('TCD', 'Tsjad', 'Chad', 13.5, 21.5), cod: cty('COD', 'Øst-Kongo', 'Eastern DR Congo', -1.68, 29.22),
  rwa: cty('RWA', 'Rwanda', 'Rwanda', -1.95, 30.06), eri: cty('ERI', 'Eritrea', 'Eritrea', 15.3, 38.9), usa: cty('USA', 'USA', 'United States', 38.9, -77),
  mmr: cty('MMR', 'Myanmar', 'Myanmar', 21.5, 96.5), mli: cty('MLI', 'Mali', 'Mali', 12.65, -8), isr: cty('ISR', 'Israel', 'Israel', 31.8, 35.0),
};

let n = 0;
const link = (
  conflict: string, from: End, to: End, type: RelType, kind: ImpactLink['kind'], confidence: ImpactLink['confidence'],
  d: string, evidence: L, mechanism: L, ...s: string[]
): ImpactLink => ({ id: `l${++n}`, conflict, from, to, type, kind, confidence, d, evidence, mechanism, s });

/**
 * Cause-and-effect explorer. One row = one documented connection from a conflict to
 * another place. `kind` separates what has been observed from what analysts assess and
 * from what is only a possible risk. Proximity alone never creates a link.
 */
export const LINKS: ImpactLink[] = [
  {
    id: 'lk-geo-straits', conflict: 'geo08', type: 'shipping', kind: 'observed', confidence: 'high', d: '2026-07-02',
    from: { label: ['Russisk milit\u00e6r tilstedev\u00e6relse i Abkhasia', 'Russian military presence in Abkhazia'], at: [43.1, 40.6], iso: 'GEO' },
    to: { label: ['Bosporos og Dardanellene', 'Bosporus and Dardanelles'], at: [41.1, 29.07], iso: 'TUR' },
    evidence: ['Tyrkia brukte Montreux-fullmaktene over gjennomfarten f\u00f8rste gang i denne sammenhengen under krigen mellom Russland og Georgia i 2008.', 'Turkey first exercised its Montreux powers over passage in this context during the 2008 war between Russia and Georgia.'],
    mechanism: ['Svartehavet har \u00e9n utgang. Milit\u00e6r tilstedev\u00e6relse langs den \u00f8stlige kysten endrer hvem som kan operere der, og gjennomfarten styres av \u00e9n konvensjon som Tyrkia forvalter.', 'The Black Sea has one exit. Military presence along the eastern coast changes who can operate there, and passage is governed by a single convention that Turkey administers.'],
    s: ['carnegieMontreux', 'warWatchGeo'],
  },
  {
    id: 'lk-straits-grain', conflict: 'ukr', type: 'trade', kind: 'observed', confidence: 'high', d: '2026-11-03',
    from: { label: ['Bosporos og Dardanellene', 'Bosporus and Dardanelles'], at: [41.1, 29.07], iso: 'TUR' },
    to: { label: ['Ukrainsk korneksport sj\u00f8veien', 'Ukrainian seaborne grain exports'], at: [46.5, 30.7], iso: 'UKR' },
    evidence: ['Handelsskip har fri gjennomfart i fredstid under Montreux. Tyrkia hevet satsen transittavgiftene regnes ut fra til 6,70 dollar per nettotonn fra juli 2026, under samme ramme.', 'Merchant ships have free passage in peacetime under Montreux. Turkey raised the rate transit charges are calculated from to $6.70 per net tonne from July 2026, under the same framework.'],
    mechanism: ['Korn fra Svartehavet har ingen annen sj\u00f8vei ut. Kostnader og vilk\u00e5r i stredene sl\u00e5r direkte inn i eksporten.', 'Black Sea grain has no other sea route out. Costs and conditions at the straits feed straight through to exports.'],
    s: ['eutodayStraits', 'carnegieMontreux'],
  },
  {
    id: 'lk-straits-nato', conflict: 'ukr', type: 'military', kind: 'observed', confidence: 'high', d: '2026-11-03',
    from: { label: ['Montreux-konvensjonen', 'The Montreux Convention'], at: [40.2, 26.4], iso: 'TUR' },
    to: { label: ['NATOs sj\u00f8milit\u00e6re tilgang til Svartehavet', 'NATO naval access to the Black Sea'], at: [43.3, 31.0] },
    evidence: ['Tyrkia stengte stredene for krigf\u00f8rende staters krigsskip 28. februar 2022 og avviste h\u00f8sten 2026 fortsatt \u00e5 \u00e5pne dem for NATO-fartøyer, tross press fra USA og Frankrike.', 'Turkey closed the straits to belligerents\u2019 warships on 28 February 2022 and as of autumn 2026 still refused to open them to NATO vessels, despite pressure from the United States and France.'],
    mechanism: ['Krigsskip fra stater uten Svartehavskyst er begrenset i tonnasje og liggetid. \u00c9n stat forvalter gjennomfarten, og det avgj\u00f8r hvilke mariner som kan operere i havet.', 'Warships of states without a Black Sea coast are limited in tonnage and in how long they may stay. One state administers passage, and that decides which navies can operate in the sea.'],
    s: ['carnegieMontreux', 'eutodayStraits', 'usnwcStraits'],
  },

  // ── Iran war → Hormuz → importers ──
  link('iran', C.irn, P.hormuz, 'shipping', 'observed', 'high', '2026-11-08',
    ['Trafikken gjennom stredet ligger på rundt 20 % av nivået før krigen (Lloyd’s List Intelligence).', 'Traffic through the strait is at about 20% of the pre-war level (Lloyd’s List Intelligence).'],
    ['Iran angriper og minelegger for å styre gjennomfarten. Rederier og forsikringsselskaper holder skip unna.', 'Iran attacks and mines to control passage. Shipowners and insurers keep vessels away.'], 'national1108', 'wikiHormuz'),
  link('iran', P.hormuz, C.chn, 'energy', 'assessed', 'medium', '2024-06-25',
    ['Kina, India, Japan og Sør-Korea tok 69 % av råolje og kondensat gjennom stredet i 2023 (EIA).', 'China, India, Japan and South Korea took 69% of crude and condensate through the strait in 2023 (EIA).'],
    ['Eksponeringen følger av importandelen før krigen. Den faktiske virkningen per land i 2026 er ikke målt her.', 'Exposure follows from the pre-war import share. The actual 2026 effect per country is not measured here.'], 'eia'),
  link('iran', P.hormuz, C.ind, 'energy', 'assessed', 'medium', '2024-06-25',
    ['Blant de fire største mottakerne av olje gjennom stredet i 2023 (EIA).', 'Among the four largest destinations for oil through the strait in 2023 (EIA).'],
    ['Eksponering ut fra importandel før krigen.', 'Exposure based on the pre-war import share.'], 'eia'),
  link('iran', P.hormuz, C.jpn, 'energy', 'assessed', 'medium', '2024-06-25',
    ['Blant de fire største mottakerne av olje gjennom stredet i 2023 (EIA).', 'Among the four largest destinations for oil through the strait in 2023 (EIA).'],
    ['Eksponering ut fra importandel før krigen.', 'Exposure based on the pre-war import share.'], 'eia'),
  link('iran', P.hormuz, C.kor, 'energy', 'assessed', 'medium', '2024-06-25',
    ['Blant de fire største mottakerne av olje gjennom stredet i 2023 (EIA).', 'Among the four largest destinations for oil through the strait in 2023 (EIA).'],
    ['Eksponering ut fra importandel før krigen.', 'Exposure based on the pre-war import share.'], 'eia'),
  link('iran', P.hormuz, C.eu, 'energy', 'observed', 'medium', '2026-05-05',
    ['EU oppga over 30 milliarder euro i ekstra drivstoffimportkostnader innen begynnelsen av mai. Europa får 12–14 % av sin LNG fra Qatar gjennom stredet.', 'The EU reported over €30 billion in extra fuel import costs by early May. Europe gets 12–14% of its LNG from Qatar through the strait.'],
    ['Bortfall av olje og LNG fra Golfen presser prisene opp på verdensmarkedet, også for land som ikke importerer direkte.', 'Lost Gulf oil and LNG push up world prices, including for countries that do not import directly.'], 'wikiHormuz'),
  link('iran', C.irn, C.qat, 'energy', 'observed', 'high', '2026-03-18',
    ['Iran traff LNG-anlegget Ras Laffan 18. mars 2026.', 'Iran hit the Ras Laffan LNG complex on 18 March 2026.'],
    ['Direkte angrep på eksportinfrastruktur stanser leveranser uavhengig av om stredet er åpent.', 'A direct strike on export infrastructure halts deliveries whether or not the strait is open.'], 'wikiIran'),
  link('iran', P.hormuz, C.sau, 'supply', 'observed', 'high', '2026-08-11',
    ['Saudi-Arabia leder råolje gjennom East-West-rørledningen til Yanbu. Volumet gjennom Bab el-Mandeb steg fra 5,4 til 8,1 millioner fat per dag (EIA).', 'Saudi Arabia is routing crude through the East-West pipeline to Yanbu. Volume through Bab el-Mandeb rose from 5.4 to 8.1 million barrels a day (EIA).'],
    ['Omruting flytter risikoen fra Hormuz til Rødehavet, der houthiene angriper saudisk skipsfart.', 'Rerouting moves the risk from Hormuz to the Red Sea, where the Houthis attack Saudi shipping.'], 'steo'),
  link('iran', C.irn, C.lbn, 'military', 'observed', 'high', '2026-03-02',
    ['Hizbollah gjenopptok angrep på Israel to dager etter angrepene på Iran.', 'Hezbollah resumed attacks on Israel two days after the strikes on Iran.'],
    ['Hizbollah er alliert med Iran. Krigen åpnet en ny front i Libanon.', 'Hezbollah is allied with Iran. The war opened a new front in Lebanon.'], 'wikiLebanon', 'wikiIran'),
  link('iran', C.irn, C.yem, 'military', 'observed', 'high', '2026-03-28',
    ['Houthiene gikk inn i krigen 28. mars med rakettangrep mot Israel.', 'The Houthis joined the war on 28 March with missile launches at Israel.'],
    ['Houthiene regnes som støttet av Iran og truet med å stenge Bab el-Mandeb.', 'The Houthis are widely seen as Iran-backed and threatened to close Bab el-Mandeb.'], 'wikiIran'),
  link('iran', C.usa, C.irn, 'sanction', 'observed', 'high', '2026-07-15',
    ['USAs marineblokade av iranske havner ble gjeninnført 15. juli 2026.', 'The US naval blockade of Iranian ports was reinstated on 15 July 2026.'],
    ['Blokaden stanser det meste av Irans oljeeksport. Verdensbanken venter 7,7 % fall i Irans økonomi i 2026.', 'The blockade stops most Iranian oil exports. The World Bank expects Iran’s economy to shrink 7.7% in 2026.'], 'wikiHormuz', 'cw1026'),

  // ── Yemen / Gaza → Red Sea → Suez → Cape ──
  link('gaza', C.gaza, C.yem, 'diplomatic', 'observed', 'high', '2023-11-19',
    ['Houthiene begrunnet angrepene på skip med krigen i Gaza, og stanset dem etter våpenhvilen i oktober 2025.', 'The Houthis justified ship attacks by the Gaza war, and paused them after the October 2025 ceasefire.'],
    ['Angrepene var politisk knyttet til Gaza, ikke en følge av geografisk nærhet.', 'The attacks were politically tied to Gaza, not a consequence of geographic proximity.'], 'wikiRedSea'),
  link('yem', C.yem, P.bab, 'shipping', 'observed', 'high', '2026-09-30',
    ['12 angrep eller angrepsforsøk på handelsskip i det sørlige Rødehavet siden juli 2026.', '12 attacks or attempted attacks on merchant ships in the southern Red Sea since July 2026.'],
    ['Houthiene kontrollerer kysten ved stredet og har erklært blokade av saudiske skip.', 'The Houthis control the shore of the strait and have declared a blockade of Saudi ships.'], 'acss', 'wikiYemen'),
  link('yem', P.bab, P.suez, 'shipping', 'observed', 'high', '2026-08-23',
    ['Suez-passeringene lå 40 % under nivået før houthi-angrepene i fire uker til 23. august 2026.', 'Suez transits were 40% below the pre-Houthi-attack level in the four weeks to 23 August 2026.'],
    ['Skip som unngår Bab el-Mandeb, bruker heller ikke Suezkanalen.', 'Ships that avoid Bab el-Mandeb do not use the Suez Canal either.'], 'lli0827'),
  link('yem', P.suez, P.cape, 'shipping', 'observed', 'high', '2026-08-11',
    ['Oljevolumet rundt Kapp det gode håp var 9,4 millioner fat per dag i 2. kvartal 2026, mot 6,0 i 2023 (EIA).', 'Oil volume around the Cape of Good Hope was 9.4 million barrels a day in Q2 2026, against 6.0 in 2023 (EIA).'],
    ['Omveien rundt Afrika gir lengre seilingstid og høyere kostnader.', 'The detour around Africa means longer voyages and higher costs.'], 'steo', 'eia', 'seatrade'),
  link('yem', P.suez, C.egy, 'trade', 'observed', 'medium', '2026-01-07',
    ['Trafikken gjennom Suezkanalen lå 60 % under 2023-nivået i første uke av 2026.', 'Suez Canal traffic was 60% below the 2023 level in the first week of 2026.'],
    ['Egypt får avgifter per passering. Færre skip gir lavere inntekter.', 'Egypt earns tolls per transit. Fewer ships mean lower revenue.'], 'gcaptain'),
  link('yem', C.yem, C.sau, 'military', 'observed', 'high', '2026-09-08',
    ['Houthi-angrep traff Aramco-anlegg i Jizan og Najran i august og byer i Sør-Saudi-Arabia 8. september.', 'Houthi strikes hit Aramco facilities in Jizan and Najran in August and towns in southern Saudi Arabia on 8 September.'],
    ['Krigen i Jemen har gått over i direkte angrep på saudisk territorium og oljeinfrastruktur.', 'The war in Yemen has turned into direct attacks on Saudi territory and oil infrastructure.'], 'wikiYemen'),

  // ── Ukraine ──
  link('ukr', C.prk, C.rus, 'arms', 'observed', 'high', '2024-10-01',
    ['Nordkoreanske soldater ble sendt til Kursk. Ukraina sier nordkoreanske KN-23-raketter er brukt mot strømnettet.', 'North Korean soldiers were sent to Kursk. Ukraine says North Korean KN-23 missiles have been used against the power grid.'],
    ['Avtalen om strategisk partnerskap fra 2024 har en klausul om gjensidig bistand.', 'The 2024 strategic partnership treaty contains a mutual assistance clause.'], 'wikiUkr', 'isw1107'),
  link('ukr', C.eu, C.rus, 'sanction', 'observed', 'high', '2022-02-24',
    ['EU, USA, Storbritannia og andre har innført omfattende sanksjoner.', 'The EU, the US, the UK and others have imposed extensive sanctions.'],
    ['Sanksjonene begrenser Russlands tilgang til finansmarkeder, teknologi og energiinntekter.', 'The sanctions restrict Russia’s access to financial markets, technology and energy revenue.'], 'euSanc', 'ofac'),
  link('ukr', C.ukr, C.eu, 'energy', 'observed', 'high', '2025-01-01',
    ['Transitten av russisk gass gjennom Ukraina stanset 1. januar 2025.', 'Transit of Russian gas through Ukraine ended on 1 January 2025.'],
    ['Europa erstattet russisk rørgass med norsk gass og LNG.', 'Europe replaced Russian pipeline gas with Norwegian gas and LNG.'], 'euGas'),
  link('ukr', C.nor, C.eu, 'energy', 'observed', 'high', '2025-01-01',
    ['Norge har vært EUs største leverandør av rørgass siden 2022.', 'Norway has been the EU’s largest supplier of pipeline gas since 2022.'],
    ['Bortfallet av russisk gass økte Europas avhengighet av norske leveranser.', 'The loss of Russian gas increased Europe’s dependence on Norwegian supplies.'], 'euGas', 'norPet'),
  link('ukr', C.ukr, C.eu, 'displacement', 'observed', 'medium', '2026-11-09',
    ['6–7 millioner ukrainere har flyktet til utlandet, de fleste til Europa.', '6–7 million Ukrainians have fled abroad, most to Europe.'],
    ['Krigshandlinger og angrep på strøm og varme driver folk på flukt.', 'Fighting and attacks on power and heating drive people to flee.'], 'wikiUkr'),

  // ── Sudan, Ethiopia, DRC, Sahel, Myanmar ──
  link('sdn', C.are, C.sdn, 'arms', 'assessed', 'low', '2025-01-01',
    ['Emiratene anklages for å sende våpen til RSF. Emiratene avviser anklagene.', 'The UAE is accused of sending weapons to the RSF. The UAE rejects the allegations.'],
    ['FNs generalsekretær krever at våpenstrømmen utenfra til Sudan stanser.', 'The UN Secretary-General insists that the external flow of weapons into Sudan must end.'], 'wikiSudan', 'unSudan'),
  link('sdn', C.sdn, C.tcd, 'displacement', 'observed', 'medium', '2025-02-05',
    ['Rundt 3,5 millioner har flyktet fra Sudan til nabolandene.', 'About 3.5 million people have fled Sudan to neighbouring countries.'],
    ['Kamper og overgrep i Darfur driver flyktninger over grensen. Tsjad er blant mottakerlandene.', 'Fighting and atrocities in Darfur drive refugees across the border. Chad is among the host countries.'], 'wikiSudan'),
  link('sdn', C.sdn, C.eth, 'diplomatic', 'observed', 'medium', '2026-11-04',
    ['Sudan anklager Etiopia for å huse oppskytingssteder for RSF-droner.', 'Sudan accuses Ethiopia of hosting launch sites for RSF drones.'],
    ['Anklagen er ikke uavhengig bekreftet. Den viser hvordan krigen belaster forholdet mellom nabolandene.', 'The accusation is not independently confirmed. It shows how the war strains relations between the neighbours.'], 'cfrSudan'),
  link('eth', C.eth, C.eri, 'diplomatic', 'observed', 'high', '2026-10-01',
    ['Etiopia utviste eritreiske diplomater, og Eritrea brøt de diplomatiske forbindelsene.', 'Ethiopia expelled Eritrean diplomats and Eritrea severed diplomatic relations.'],
    ['Etiopia anklager Eritrea for å støtte TPLF. Striden om havtilgang øker faren for mellomstatlig konflikt.', 'Ethiopia accuses Eritrea of backing the TPLF. The dispute over sea access raises the risk of interstate conflict.'], 'cw1026'),
  link('cod', C.rwa, C.cod, 'military', 'assessed', 'medium', '2024-04-30',
    ['FN-eksperter anslo 3 000–4 000 rwandiske soldater i Øst-Kongo. Rwanda benekter støtte til M23.', 'UN experts estimated 3,000–4,000 Rwandan troops in eastern DR Congo. Rwanda denies supporting M23.'],
    ['Utenlandsk militær støtte har gjort M23 i stand til å ta og holde byer.', 'Foreign military support has enabled M23 to take and hold cities.'], 'wikiM23'),
  link('sahel', C.rus, C.mli, 'military', 'observed', 'high', '2025-06-30',
    ['Africa Corps ble værende i Mali etter Wagners uttrekning.', 'Africa Corps stayed in Mali after Wagner’s exit.'],
    ['Russisk militær støtte erstattet franske og FN-styrker som forlot landet i 2022–2023.', 'Russian military support replaced the French and UN forces that left in 2022–2023.'], 'wikiMali'),
  link('mmr', C.chn, C.mmr, 'diplomatic', 'observed', 'medium', '2025-10-02',
    ['MNDAA trakk seg ut av Lashio etter kinesisk press.', 'The MNDAA withdrew from Lashio under Chinese pressure.'],
    ['Kina bruker sin innflytelse over væpnede grupper ved grensen til å forme utviklingen i krigen.', 'China uses its leverage over armed groups on the border to shape the course of the war.'], 'wikiMyanmar'),
  link('mmr', C.mmr, C.chn, 'supply', 'observed', 'high', '2026-05-01',
    ['To tredeler av terbiumet og dysprosiumet som bearbeides i Kina kommer fra Myanmar, og KIA har kontrollert gruvebeltet i Kachin siden oktober 2024.', 'Two thirds of the terbium and dysprosium processed in China comes from Myanmar, and the KIA has controlled the mining belt in Kachin since October 2024.'],
    ['En væpnet gruppe i en borgerkrig sitter på innsatsfaktoren til kinesisk magnetproduksjon. Da KIA strammet inn, steg terbiumprisen kraftig i løpet av uker.', 'An armed group in a civil war sits on the input to Chinese magnet production. When the KIA tightened its grip, the terbium price rose sharply within weeks.'],
    'dandcRee', 'jamestownRee', 'reexRee'),
  link('mmr', C.mmr, C.eu, 'trade', 'assessed', 'medium', '2026-05-01',
    ['98 % av verdens separering av tunge sjeldne jordarter skjer i Kina, med Myanmar som hovedkilde til råstoffet.', '98% of the world’s heavy rare-earth separation happens in China, with Myanmar the main source of the feedstock.'],
    ['Magneter til elbiler, vindturbiner og forsvarsmateriell utenfor Asia henger dermed i to ledd: kinesisk prosessering, og et gruvebelte som skifter hender i en krig.', 'Magnets for electric vehicles, wind turbines and defence equipment outside Asia therefore hang on two links: Chinese processing, and a mining belt changing hands in a war.'],
    'dandcRee', 'jamestownRee'),
  link('mmr', C.mmr, C.usa, 'trade', 'observed', 'medium', '2026-08-28',
    ['Svindelsentrene i Myawaddy ble raidet i oktober 2025, men C4ADS fant at 14 av 21 kjente anlegg i townshipen hadde bygget ut i samme periode.', 'The Myawaddy scam compounds were raided in October 2025, but C4ADS found 14 of 21 known compounds in the township had built out over the same period.'],
    ['Grenseøkonomien i krigen driver nettsvindel mot folk på alle kontinenter. Aksjonene flyttet virksomheten til mindre steder og videre til Kambodsja framfor å stanse den.', 'The war’s border economy powers online fraud aimed at people on every continent. The operations moved the business to smaller sites and on into Cambodia rather than stopping it.'],
    'apScam', 'prachataiScam', 'irrawaddyScam'),
  link('iran', C.usa, C.isr, 'military', 'observed', 'high', '2026-02-28',
    ['USA og Israel gjennomførte angrepene på Iran sammen.', 'The United States and Israel carried out the strikes on Iran together.'],
    ['Militært partnerskap uten formell forsvarstraktat.', 'A military partnership without a formal defence treaty.'], 'wikiIran'),

  // ── Potential (not observed) ──
  link('taiwan', { label: ['Taiwanstredet', 'Taiwan Strait'], at: [24.5, 119.6] }, C.jpn, 'trade', 'potential', 'low', '2026-11-09',
    ['Ingen forstyrrelse er observert.', 'No disruption has been observed.'],
    ['Mulig risiko: En krise i stredet ville berøre skipsfart mellom Nordøst-Asia og resten av verden.', 'Possible risk: a crisis in the strait would affect shipping between North-East Asia and the rest of the world.'], 'cw1026'),
];

const A = {
  noProb: ['Ingen sannsynlighet er anslått for at dette skjer.', 'No probability is estimated for this happening.'] as L,
  geom: ['Distanser er regnet langs de illustrative korridorene i kartet, ikke faktiske skipsleder.', 'Distances are computed along the illustrative corridors on the map, not actual shipping lanes.'] as L,
  speed: ['Seilingstid forutsetter konstant fart uten venting, kanalpassering eller værforhold.', 'Sailing time assumes constant speed with no waiting, canal transit or weather.'] as L,
};

/** Scenario Lab. Every output is hypothetical and built only from documented exposure. */
export const SCENARIOS: Scenario[] = [
  {
    id: 'sc-hormuz', kind: 'chokepoint', chokepoint: 'hormuz', name: ['Hormuzstredet helt stengt', 'Strait of Hormuz fully closed'],
    assumptions: [['All handelstrafikk gjennom stredet stanser.', 'All merchant traffic through the strait stops.'], ['Rørledningene utenom stredet går for fullt.', 'The bypass pipelines run at full capacity.'], A.noProb],
    detours: [],
    facts: [
      { cat: 'econ', kind: 'fact', d: '2024-06-25', s: ['eia'], t: ['20,9 millioner fat olje per dag gikk gjennom stredet i 2023, om lag 20 % av verdens forbruk. EIA anslo at 2,6 millioner fat per dag ledig rørkapasitet kunne gå utenom.', '20.9 million barrels of oil a day passed through the strait in 2023, about 20% of world consumption. The EIA estimated that 2.6 million barrels a day of spare pipeline capacity could bypass it.'] },
      { cat: 'econ', kind: 'fact', d: '2026-08-11', s: ['steo'], t: ['Dette er delvis observert: transitten falt til 4,9 millioner fat per dag i 2. kvartal 2026.', 'This has partly been observed: transit fell to 4.9 million barrels a day in Q2 2026.'] },
    ],
    unknowns: [['Hvor lenge lagrene i importlandene varer.', 'How long importers’ stocks last.'], ['Hvor raskt etterspørselen tilpasser seg.', 'How quickly demand adjusts.'], ['Prisutviklingen.', 'The price path.']],
  },
  {
    id: 'sc-redsea', kind: 'chokepoint', chokepoint: 'bab', name: ['Bab el-Mandeb og Suez stengt for all trafikk', 'Bab el-Mandeb and Suez closed to all traffic'],
    assumptions: [['All trafikk mellom Asia og Europa går rundt Kapp det gode håp.', 'All Asia–Europe traffic goes around the Cape of Good Hope.'], A.geom, A.speed, A.noProb],
    detours: [
      { label: ['Shanghai–Rotterdam', 'Shanghai–Rotterdam'], base: 'asia-eu-suez', alt: 'asia-eu-cape' },
      { label: ['Persiabukta–Rotterdam', 'Persian Gulf–Rotterdam'], base: 'gulf-eu-suez', alt: 'gulf-eu-cape' },
    ],
    facts: [
      { cat: 'econ', kind: 'fact', d: '2024-06-25', s: ['eia'], t: ['8,6 millioner fat olje per dag gikk gjennom Bab el-Mandeb og 8,8 gjennom Suez og SUMED i 2023.', '8.6 million barrels of oil a day passed through Bab el-Mandeb and 8.8 through Suez and SUMED in 2023.'] },
      { cat: 'econ', kind: 'fact', d: '2026-08-23', s: ['lli0827'], t: ['Delvis observert siden slutten av 2023: Suez-trafikken lå 40 % under normalen i august 2026.', 'Partly observed since late 2023: Suez traffic was 40% below normal in August 2026.'] },
    ],
    unknowns: [['Fraktrater og forsikringspremier.', 'Freight rates and insurance premiums.'], ['Tilgjengelig skipskapasitet.', 'Available vessel capacity.']],
  },
  {
    id: 'sc-malacca', kind: 'chokepoint', chokepoint: 'malacca', name: ['Malakkastredet stengt', 'Strait of Malacca closed'],
    assumptions: [['Tankskip fra Persiabukta til Øst-Asia går via Lombokstredet.', 'Tankers from the Persian Gulf to East Asia go via the Lombok Strait.'], A.geom, A.speed, A.noProb],
    detours: [{ label: ['Persiabukta–Shanghai', 'Persian Gulf–Shanghai'], base: 'gulf-asia', alt: 'gulf-asia-lombok' }],
    facts: [{ cat: 'econ', kind: 'fact', d: '2024-06-25', s: ['eia'], t: ['23,7 millioner fat olje per dag gikk gjennom stredet i 2023, mest av alle knutepunkter.', '23.7 million barrels of oil a day passed through the strait in 2023, the most of any chokepoint.'] }],
    unknowns: [['Hvilke land som rammes hardest. Datasettet har ingen importfordeling for Malakka.', 'Which countries are hit hardest. The dataset has no import breakdown for Malacca.']],
  },
  {
    id: 'sc-panama', kind: 'chokepoint', chokepoint: 'panama', name: ['Panamakanalen stengt over lengre tid', 'Prolonged closure of the Panama Canal'],
    assumptions: [['Trafikk fra Asia til USAs østkyst går via Suez.', 'Traffic from Asia to the US East Coast goes via Suez.'], A.geom, A.speed, A.noProb],
    detours: [{ label: ['Shanghai–New York', 'Shanghai–New York'], base: 'asia-usec-panama', alt: 'asia-usec-suez' }],
    facts: [{ cat: 'econ', kind: 'fact', d: '2023-10-31', s: ['eia'], t: ['Tørke i 2023 tvang fram begrensninger på passeringer og dypgang. 2,1 millioner fat olje per dag gikk gjennom kanalen i 2023.', 'Drought in 2023 forced limits on transits and draught. 2.1 million barrels of oil a day passed through the canal in 2023.'] }],
    unknowns: [['Samlet handelsvolum. Datasettet har bare oljetall.', 'Total trade volume. The dataset holds oil figures only.']],
  },
  {
    id: 'sc-qatar', kind: 'energy', chokepoint: 'hormuz', name: ['Langvarig bortfall av LNG fra Qatar', 'Prolonged loss of Qatari LNG'],
    assumptions: [['Ras Laffan eksporterer ikke.', 'Ras Laffan does not export.'], ['Ingen ny LNG-kapasitet kommer til i perioden.', 'No new LNG capacity comes online in the period.'], A.noProb],
    detours: [],
    facts: [
      { cat: 'econ', kind: 'fact', d: '2024-06-25', s: ['eia'], t: ['10,4 milliarder kubikkfot LNG per dag gikk gjennom Hormuz i 2023, det meste fra Qatar.', '10.4 billion cubic feet of LNG a day passed through Hormuz in 2023, most of it from Qatar.'] },
      { cat: 'econ', kind: 'fact', d: '2026-03-18', s: ['wikiHormuz', 'wikiIran'], t: ['Europa får 12–14 % av sin LNG fra Qatar. Ras Laffan ble truffet 18. mars 2026.', 'Europe gets 12–14% of its LNG from Qatar. Ras Laffan was hit on 18 March 2026.'] },
    ],
    unknowns: [['Fordelingen av Qatars eksport per mottakerland.', 'The breakdown of Qatar’s exports by destination.'], ['Lagerfylling i Europa og Asia.', 'Storage levels in Europe and Asia.']],
  },
  {
    id: 'sc-rail', kind: 'corridor', name: ['Nordlig jernbanekorridor Kina–Europa stengt', 'Northern China–Europe rail corridor closed'],
    assumptions: [['Gods flyttes til Midtkorridoren over Kaspihavet.', 'Freight moves to the Middle Corridor across the Caspian.'], A.geom, A.noProb],
    detours: [{ label: ['Xi’an–Europa', 'Xi’an–Europe'], base: 'rail-north', alt: 'rail-middle' }],
    facts: [],
    unknowns: [['Kapasitet og transporttid. Datasettet har ingen målinger for jernbanekorridorene.', 'Capacity and transit time. The dataset has no measurements for the rail corridors.']],
  },
];
