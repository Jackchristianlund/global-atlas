import type { Claim, ClaimCat, Conflict, Figure, L } from '../types';

/**
 * Curated conflict records. Snapshot compiled 2026-11-09 (see sources.ts).
 *
 * Intensity tier = the tier of the row that contains the conflict in the reference list
 * `wikiList` (annual deaths, attributed there to ACLED curated data). Several rows group
 * related conflicts, so a tier describes the conflict family named in `row`, not
 * necessarily the single front shown on the map. See docs/METHODOLOGY.md.
 */

const mk =
  (kind: Claim['kind']) =>
  (cat: ClaimCat, d: string, t: L, ...s: string[]): Claim => ({ cat, kind, t, d, s });
const fact = mk('fact');
const assess = mk('assessment');
const risk = mk('risk');
const fig = (l: L, v: L | null, d: string, m: L, ...s: string[]): Figure => ({ l, v, d, m, s });
const NA_METHOD: L = ['Ikke hentet inn i dette øyeblikksbildet.', 'Not collected for this snapshot.'];

const R = {
  me: { name: 'Arab–Israeli / Iran–Israel proxy wars', f25: '28 111', f26: '11 144' },
  ukr: { name: 'Russo-Ukrainian war', f25: '80 245', f26: '42 286' },
  mmr: { name: 'Myanmar civil war', f25: '15 824', f26: '8 348' },
  sdn: { name: 'Sudanese civil wars', f25: '21 994–80 000+', f26: '10 179' },
  cod: { name: 'Congolese conflicts', f25: '7 737–10 000+', f26: '3 467' },
  som: { name: 'Somali Civil War', f25: '10 788', f26: '5 601' },
  sahel: { name: 'Islamist insurgencies in the Maghreb/Sahel', f25: '24 046', f26: '18 132' },
  mex: { name: 'Mexican drug war', f25: '8 973–10 767', f26: '5 547' },
  afg: { name: 'Afghanistan conflicts', f25: '4 409', f26: '5 097' },
  eth: { name: 'Ethiopian civil wars', f25: '6 322', f26: '5 152' },
  col: { name: 'Colombian conflict', f25: '2 293', f26: '1 481' },
  ecu: { name: 'Ecuadorian conflict', f25: '4 070', f26: '2 876' },
  nga: { name: 'Civil conflicts in Nigeria', f25: '3 200', f26: '3 400' },
  ven: { name: 'Venezuelan conflict', f25: '2 602', f26: '339' },
  yem: { name: 'Yemeni civil war', f25: '2 940', f26: '4 072' },
  syr: { name: 'Spillover of Syrian civil war', f25: '8 837', f26: '1 575' },
  cmr: { name: 'Cameroonian conflicts', f25: '1 966', f26: '1 418' },
  caf: { name: 'Central African Republic civil war', f25: '1 276', f26: '478' },
  hti: { name: 'Haitian conflict', f25: '4 826', f26: '2 359' },
  kas: { name: 'Kashmir conflict', f25: '975', f26: '200' },
  irq: { name: 'Iraqi conflict', f25: '574', f26: '419' },
  lby: { name: 'Libyan crisis', f25: '282', f26: '177' },
  moz: { name: 'Insurgency in Cabo Delgado', f25: '824', f26: '434' },
  phl: { name: 'Civil conflict in the Philippines', f25: '537', f26: '332' },
  pap: { name: 'Papua conflict', f25: '258', f26: '260' },
  wsa: { name: 'Western Sahara conflict', f25: '54', f26: '5' },
  nk: { name: 'Nagorno-Karabakh conflict', f25: '8', f26: '2' },
  sth: { name: 'South Thailand insurgency', f25: '51', f26: '39' },
};

export const CONFLICTS: Conflict[] = [
  // ════════════════ Tier 4 rows ════════════════
  {
    id: 'ukr', name: ['Russlands krig mot Ukraina', 'Russia–Ukraine war'], type: 'interstate', status: 'active', tier: 4, row: R.ukr,
    at: [48.6, 36.5], iso: ['UKR', 'RUS', 'BLR'], start: '2014-02-20', verified: '2026-11-09',
    sum: [
      'Russlands fullskalainvasjon fra 24. februar 2022 er Europas største krig siden 1945. Den vokste ut av annekteringen av Krim og kampene i Donbas fra 2014. Russland okkuperer om lag en femtedel av Ukraina.',
      'Russia’s full-scale invasion since 24 February 2022 is Europe’s largest war since 1945. It grew out of the 2014 annexation of Crimea and the fighting in Donbas. Russia occupies about a fifth of Ukraine.',
    ],
    causes: [
      'Russlands motstand mot Ukrainas vestlige orientering, territorielle krav på Krim og Donbas, og uenighet om Europas sikkerhetsorden.',
      'Russia’s opposition to Ukraine’s Western orientation, territorial claims on Crimea and Donbas, and a dispute over Europe’s security order.',
    ],
    parties: [
      'Russland, med Belarus som støttespiller og nordkoreanske soldater, mot Ukraina, som får våpen og økonomisk støtte fra en rekke land.',
      'Russia, backed by Belarus and reinforced by North Korean soldiers, against Ukraine, which receives arms and financial aid from many countries.',
    ],
    claims: [
      fact('escalation', '2026-11-07', ['Russland skjøt 36 ballistiske missiler mot Kyiv natt til 7. november, som del av en kampanje mot energiinfrastruktur.', 'Russia fired 36 ballistic missiles at Kyiv overnight on 6–7 November, part of a campaign against energy infrastructure.'], 'isw1107'),
      fact('escalation', '2026-11-09', ['Ukrainas energidepartement oppgir 128 russiske angrep på energisektoren på én uke. Nattlige angrep fra begge sider drepte minst fire og skadet et russisk oljeraffineri.', 'Ukraine’s energy ministry reports 128 Russian attacks on the energy sector in one week. Overnight strikes by both sides killed at least four and damaged a Russian oil refinery.'], 'aj1109'),
      fact('ceasefire', '2026-11-08', ['USA har innkalt ukrainske og russiske delegasjoner til samtaler i Abu Dhabi 10.–11. november. Europeiske land deltar.', 'The United States has convened Ukrainian and Russian delegations for talks in Abu Dhabi on 10–11 November. European states will attend.'], 'npr1108'),
      fact('military', '2024-10-01', ['Nordkoreanske soldater ble sendt for å støtte Russland i Kursk oblast.', 'North Korean soldiers were sent to support Russia in Kursk Oblast.'], 'wikiUkr'),
      fact('geo', '2022-02-24', ['Mange land har innført sanksjoner mot Russland og Belarus. Den internasjonale straffedomstolen har utstedt arrestordre på president Putin.', 'Many countries have imposed sanctions on Russia and Belarus. The International Criminal Court has issued an arrest warrant for President Putin.'], 'wikiUkr', 'euSanc'),
      fact('econ', '2026-11-07', ['Ukraina angriper russiske oljeraffinerier. Raffineriet i Saratov ble truffet for minst åttende gang i 2026.', 'Ukraine is striking Russian oil refineries. The Saratov refinery was hit for at least the eighth time in 2026.'], 'isw1107'),
      fact('econ', '2025-01-01', ['Transitten av russisk rørgass gjennom Ukraina tok slutt da avtalen utløp 1. januar 2025.', 'Transit of Russian pipeline gas through Ukraine ended when the contract expired on 1 January 2025.'], 'euGas'),
      fact('human', '2026-11-08', ['Russiske angrep på kritisk infrastruktur 7.–8. november førte til omfattende strømbrudd.', 'Russian strikes on critical infrastructure on 7–8 November caused widespread power outages.'], 'isw1108'),
    ],
    figs: [
      fig(['Andel av Ukraina under russisk okkupasjon', 'Share of Ukraine under Russian occupation'], ['ca. 20 %', 'about 20%'], '2026-11-09', ['Oppgitt i kildens sammendrag.', 'As stated in the source summary.'], 'wikiUkr'),
      fig(['Drepte russiske soldater', 'Russian soldiers killed'], ['nær 450 000 (rapportert, ikke uavhengig bekreftet)', 'nearly 450,000 (reported, not independently verified)'], '2026-11-08', ['Rapport gjengitt av ISW. Andre anslag er lavere. Tallet omfatter ikke sårede eller savnede.', 'Report relayed by ISW. Other estimates are lower. Excludes wounded and missing.'], 'isw1108'),
      fig(['Internt fordrevne', 'Internally displaced'], ['ca. 8 millioner', 'about 8 million'], '2026-11-09', ['Oppgitt i kildens sammendrag uten dato. Kan være et toppnivå.', 'Stated in the source summary without a date. May be a peak figure.'], 'wikiUkr'),
      fig(['Flyktninger i utlandet', 'Refugees abroad'], ['6–7 millioner', '6–7 million'], '2026-11-09', ['Oppgitt i kildens sammendrag uten dato.', 'Stated in the source summary without a date.'], 'wikiUkr'),
      fig(['Sivile drepte (FN-bekreftet)', 'Civilians killed (UN-verified)'], null, '2026-11-09', NA_METHOD),
    ],
    s: ['wikiList', 'wikiUkr', 'isw1107', 'isw1108', 'npr1108', 'aj1109'],
  },
  {
    id: 'iran', name: ['Iran-krigen 2026 (USA og Israel mot Iran)', '2026 Iran war (United States and Israel v. Iran)'], type: 'interstate', status: 'active', tier: 4, row: R.me,
    at: [32.5, 53.5], iso: ['IRN', 'ISR', 'USA', 'SAU', 'ARE', 'KWT', 'BHR', 'QAT', 'IRQ', 'JOR', 'OMN'], start: '2026-02-28', verified: '2026-11-08',
    sum: [
      'USA og Israel innledet en luftkrig mot Iran 28. februar 2026. Irans øverste leder Ali Khamenei ble drept, og Iran svarte med angrep på Israel, amerikanske baser og Golfstatene og stengte i praksis Hormuzstredet. Våpenhvilen fra april og Islamabad-memorandumet fra juni brøt sammen 8. juli. Partene utveksler forslag, men krigen er uløst.',
      'The United States and Israel opened an air war on Iran on 28 February 2026. Supreme Leader Ali Khamenei was killed, and Iran struck Israel, US bases and the Gulf states and largely closed the Strait of Hormuz. The April ceasefire and the June Islamabad Memorandum collapsed on 8 July. The parties are trading proposals, but the war is unresolved.',
    ],
    causes: [
      'Strid om Irans atom- og missilprogram, mangeårig konflikt mellom Iran og Israel gjennom allierte grupper, og sammenbrudd i forhandlingene mellom USA og Iran.',
      'The dispute over Iran’s nuclear and missile programmes, the long Iran–Israel conflict through allied groups, and the breakdown of US–Iran negotiations.',
    ],
    parties: [
      'USA og Israel mot Iran og allierte grupper (Hizbollah, houthiene, irakiske militser). Saudi-Arabia, De forente arabiske emirater, Kuwait og Bahrain er angrepet og står oppført på amerikansk side.',
      'The United States and Israel against Iran and allied groups (Hezbollah, the Houthis, Iraqi militias). Saudi Arabia, the UAE, Kuwait and Bahrain have been attacked and are listed on the US side.',
    ],
    claims: [
      fact('escalation', '2026-02-28', ['Amerikanske og israelske angrep drepte øverste leder Ali Khamenei. Mojtaba Khamenei ble utnevnt til etterfølger 8. mars.', 'US and Israeli strikes killed Supreme Leader Ali Khamenei. Mojtaba Khamenei was named successor on 8 March.'], 'wikiIran'),
      fact('escalation', '2026-03-18', ['Israel angrep gassfeltet South Pars. Iran traff Qatars LNG-anlegg Ras Laffan.', 'Israel struck the South Pars gas field. Iran hit Qatar’s Ras Laffan LNG complex.'], 'wikiIran'),
      fact('military', '2026-03-31', ['Iranske missiler eller droner har truffet Bahrain, Kuwait, De forente arabiske emirater, Saudi-Arabia, Qatar, Jordan og irakisk Kurdistan.', 'Iranian missiles or drones have struck Bahrain, Kuwait, the UAE, Saudi Arabia, Qatar, Jordan and Iraqi Kurdistan.'], 'wikiIran'),
      fact('ceasefire', '2026-04-13', ['En to ukers våpenhvile trådte i kraft 7.–8. april. Samtalene i Islamabad mislyktes, og USA innførte marineblokade av iranske havner 13. april.', 'A two-week ceasefire took effect on 7–8 April. The Islamabad talks failed, and the US imposed a naval blockade of Iranian ports on 13 April.'], 'wikiIran', 'wikiHormuz'),
      fact('ceasefire', '2026-07-08', ['Islamabad-memorandumet ble undertegnet 17. juni og blokaden opphevet. Avtalen brøt sammen 8. juli etter iranske angrep på handelsskip. USA gjeninnførte blokaden 15. juli.', 'The Islamabad Memorandum was signed on 17 June and the blockade lifted. It collapsed on 8 July after Iranian attacks on merchant ships. The US reinstated the blockade on 15 July.'], 'wikiIran', 'wikiHormuz'),
      fact('escalation', '2026-10-16', ['Mer enn to dusin fartøyer ble truffet i og rundt Hormuzstredet i første halvdel av oktober.', 'More than two dozen vessels were struck in and around the Strait of Hormuz in the first half of October.'], 'cgRadar'),
      risk('escalation', '2026-11-01', ['Crisis Group advarer om at USA kan starte en ny offensiv etter mellomvalget 3. november, eller at Iran kan slå til først.', 'Crisis Group warns that the US may launch a new offensive after the 3 November mid-term election, or that Iran may strike first.'], 'cw1026'),
      fact('geo', '2026-03-28', ['Hizbollah gjenopptok angrep på Israel 2. mars. Houthiene gikk inn i krigen 28. mars.', 'Hezbollah resumed fire on Israel on 2 March. The Houthis joined the war on 28 March.'], 'wikiIran'),
      fact('econ', '2026-03-11', ['Brent-olje passerte 100 dollar fatet 8. mars og nådde 126 dollar. IEA-landene vedtok 11. mars å frigi 400 millioner fat fra beredskapslagre.', 'Brent crude passed $100 a barrel on 8 March and peaked at $126. IEA members agreed on 11 March to release 400 million barrels from emergency stocks.'], 'wikiHormuz'),
      fact('econ', '2026-05-05', ['EU oppga over 30 milliarder euro i ekstra kostnader til drivstoffimport innen begynnelsen av mai.', 'The EU reported more than €30 billion in extra fuel import costs by early May.'], 'wikiHormuz'),
      assess('econ', '2026-10-06', ['Verdensbanken anslår at Irans økonomi krymper 7,7 % i 2026.', 'The World Bank projects that Iran’s economy will contract 7.7% in 2026.'], 'cw1026'),
    ],
    figs: [
      fig(['Drepte i Iran', 'Killed in Iran'], ['3 528 (iranske myndigheter) · 3 684 (HRANA)', '3,528 (Iranian government) · 3,684 (HRANA)'], '2026-07-08', ['To ulike tellinger. USA og Israel oppgir over 6 000 drepte iranske soldater. Tallene er ikke uavhengig bekreftet.', 'Two separate counts. The US and Israel claim more than 6,000 Iranian military killed. Not independently verified.'], 'wikiIran'),
      fig(['Drepte amerikanske soldater', 'US military killed'], ['19 soldater og 1 kontraktør', '19 soldiers and 1 contractor'], '2026-07-08', ['Offisielle amerikanske tall.', 'Official US figures.'], 'wikiIran'),
      fig(['Midlertidig fordrevne i Iran', 'Temporarily displaced inside Iran'], ['ca. 3,2 millioner', 'about 3.2 million'], '2026-03-31', ['UNHCRs anslag for utgangen av mars, gjengitt fra Global Trends.', 'UNHCR estimate for end of March, as reported from Global Trends.'], 'tocGT'),
      fig(['Sjøfolk drept i Golfen og Hormuz', 'Seafarers killed in the Gulf and Hormuz'], ['24 (128 bekreftede hendelser)', '24 (128 confirmed incidents)'], '2026-11-04', ['IMOs telling, gjengitt av en interesseorganisasjon.', 'IMO count, relayed by an advocacy organisation.'], 'uani1104'),
    ],
    s: ['wikiList', 'wikiIran', 'wikiHormuz', 'cgRadar', 'cw1026', 'uani1104'],
  },
  {
    id: 'gaza', name: ['Gaza-krigen', 'Gaza war'], type: 'territorial', status: 'ceasefire', tier: 4, row: R.me,
    at: [31.42, 34.38], iso: ['PSE', 'ISR', 'EGY'], start: '2023-10-07', verified: '2026-11-06',
    sum: [
      'Hamas-ledede angrep 7. oktober 2023 drepte 1 195 mennesker i Israel, og 251 ble tatt som gisler. Israels krigføring i Gaza fulgte. En våpenhvile har formelt vært i kraft siden 10. oktober 2025, men dødelige israelske angrep fortsetter, og Israel kontrollerer om lag 60 % av Gazastripen.',
      'Hamas-led attacks on 7 October 2023 killed 1,195 people in Israel, and 251 were taken hostage. Israel’s campaign in Gaza followed. A ceasefire has formally been in force since 10 October 2025, but deadly Israeli strikes continue and Israel controls about 60% of the Strip.',
    ],
    causes: [
      'Den uløste israelsk-palestinske konflikten, blokaden av Gaza siden 2007, og angrepet 7. oktober 2023.',
      'The unresolved Israeli–Palestinian conflict, the blockade of Gaza since 2007, and the 7 October 2023 attack.',
    ],
    parties: ['Israel mot Hamas og andre palestinske væpnede grupper.', 'Israel against Hamas and other Palestinian armed groups.'],
    claims: [
      fact('ceasefire', '2025-10-10', ['Den tredje våpenhvilen trådte i kraft etter at partene godtok første fase av en 20-punkts plan lagt fram av USA.', 'The third ceasefire took effect after both sides accepted phase one of a 20-point plan proposed by the United States.'], 'wikiGaza'),
      fact('ceasefire', '2026-07-31', ['Hamas og andre grupper gikk med på avvæpning, betinget av gjenoppbygging og israelsk tilbaketrekking. Israels statsminister avviste avtalen.', 'Hamas and other groups agreed to disarm, conditional on reconstruction and Israeli withdrawal. Israel’s prime minister rejected the agreement.'], 'wikiGaza'),
      fact('escalation', '2026-11-06', ['Fem palestinere, blant dem en tolv år gammel gutt, ble drept 6. november, ifølge palestinske nødetater.', 'Five Palestinians, including a 12-year-old boy, were killed on 6 November, according to Palestinian emergency services.'], 'latin1106'),
      risk('escalation', '2026-11-01', ['Crisis Group har utstedt konfliktvarsel for Israel/Palestina for november 2026.', 'Crisis Group has issued a conflict risk alert for Israel/Palestine for November 2026.'], 'cw1026'),
      fact('human', '2025-12-19', ['IPC bekreftet hungersnød i deler av Gaza i august 2025. 19. desember 2025 meldte IPC at hungersnøden var over, men at situasjonen var skjør.', 'The IPC confirmed famine in parts of Gaza in August 2025. On 19 December 2025 it reported that famine conditions had ended but the situation remained fragile.'], 'wikiGaza'),
      fact('human', '2026-06-30', ['FNs satellittanalyse fant at 82 % av bygningene i Gaza er skadet, og om lag to tredeler av disse er ødelagt.', 'UN satellite analysis found 82% of structures in Gaza damaged, about two thirds of those destroyed.'], 'wikiGaza'),
      fact('geo', '2023-11-19', ['Houthiene i Jemen begrunnet angrepene på skipsfart i Rødehavet med krigen i Gaza.', 'The Houthis in Yemen cited the Gaza war as the reason for their attacks on Red Sea shipping.'], 'wikiRedSea'),
    ],
    figs: [
      fig(['Drepte palestinere', 'Palestinians killed'], ['73 919–75 225+', '73,919–75,225+'], '2026-09-27', ['Gazas helsedepartement, gjengitt med to ulike tall i kildene. Uavhengige studier tyder på undertelling.', 'Gaza Health Ministry, cited with two different totals in the sources. Independent studies indicate an undercount.'], 'wikiGaza'),
      fig(['Drepte israelere', 'Israelis killed'], ['2 046+', '2,046+'], '2026-09-27', ['Israelske myndigheter, inkludert sikkerhetsstyrker.', 'Israeli authorities, including security forces.'], 'wikiGaza'),
      fig(['Fordrevne', 'Displaced'], ['nesten hele befolkningen på 2,3 millioner', 'nearly all of the 2.3 million population'], '2026-09-27', ['Oppgitt i kildens sammendrag.', 'As stated in the source summary.'], 'wikiGaza'),
    ],
    s: ['wikiList', 'wikiGaza', 'latin1106', 'cw1026'],
  },
  {
    id: 'lbn', name: ['Libanon-krigen 2026 (Israel og Hizbollah)', '2026 Lebanon war (Israel and Hezbollah)'], type: 'proxy', status: 'ceasefire', tier: 4, row: R.me,
    at: [33.6, 35.6], iso: ['LBN', 'ISR'], start: '2026-03-02', verified: '2026-08-12',
    sum: [
      'Hizbollah gjenopptok angrep på Nord-Israel 2. mars 2026 i forbindelse med Iran-krigen, og Israel gikk inn i Sør-Libanon. En midlertidig våpenhvile gjelder formelt siden 16. april og ble fornyet 19. juni, men begge sider melder om brudd. Israel holder deler av Sør-Libanon.',
      'Hezbollah resumed attacks on northern Israel on 2 March 2026 in connection with the Iran war, and Israel invaded southern Lebanon. A temporary ceasefire has formally applied since 16 April and was renewed on 19 June, but both sides report violations. Israel holds parts of southern Lebanon.',
    ],
    causes: ['Hizbollahs allianse med Iran, uavklart grense og krav om avvæpning av Hizbollah.', 'Hezbollah’s alliance with Iran, an unsettled border, and demands that Hezbollah disarm.'],
    parties: ['Israel mot Hizbollah. Libanons regjering forhandler med Israel med USA som tilrettelegger.', 'Israel against Hezbollah. Lebanon’s government negotiates with Israel, with the United States facilitating.'],
    claims: [
      fact('escalation', '2026-04-08', ['Israelske angrep 8. april drepte minst 357 mennesker på én dag, ifølge kilden.', 'Israeli strikes on 8 April killed at least 357 people in one day, according to the source.'], 'wikiLebanon'),
      fact('ceasefire', '2026-04-16', ['USAs president kunngjorde ti dagers våpenhvile fra natt til 17. april. Den ble senere forlenget.', 'The US president announced a ten-day truce from the night of 16–17 April. It was later extended.'], 'wikiLebanon'),
      fact('ceasefire', '2026-06-26', ['USA la fram et rammeverk som krever full avvæpning av Hizbollah. Hizbollah avviste det.', 'The United States announced a framework requiring Hezbollah’s full disarmament. Hezbollah rejected it.'], 'wikiLebanon'),
      fact('escalation', '2026-08-12', ['Israel angrep Nabatieh og Al-Mansouri, i strid med den amerikanskmeklede avtalen ifølge kilden.', 'Israel struck Nabatieh and Al-Mansouri, in breach of the US-brokered agreement according to the source.'], 'wikiLebanon'),
    ],
    figs: [
      fig(['Drepte i Libanon', 'Killed in Lebanon'], ['over 3 000 (18. mai) · over 4 000 (senere, kilde ikke oppgitt)', 'over 3,000 (18 May) · over 4,000 (later, source not stated)'], '2026-08-12', ['Libanons helsedepartement for det første tallet. Det andre står uten kilde i artikkelen.', 'Lebanon’s health ministry for the first figure. The second is unsourced in the article.'], 'wikiLebanon'),
      fig(['Fordrevne i Libanon', 'Displaced in Lebanon'], ['ca. 1 million', 'about 1 million'], '2026-05-15', ['UNHCRs anslag for midten av mai.', 'UNHCR estimate for mid-May.'], 'tocGT'),
    ],
    s: ['wikiList', 'wikiLebanon'],
  },
  {
    id: 'sdn', name: ['Borgerkrigen i Sudan', 'Sudanese civil war'], type: 'civil', status: 'active', tier: 4, row: R.sdn,
    at: [13.2, 30.2], iso: ['SDN', 'TCD', 'SSD', 'EGY', 'ETH', 'LBY', 'CAF'], start: '2023-04-15', verified: '2026-11-09',
    sum: [
      'Krigen mellom Sudans hær (SAF) under general al-Burhan og Rapid Support Forces (RSF) under Hemedti startet 15. april 2023. Hæren tok tilbake Khartoum i mars 2025, RSF tok El Fasher i oktober 2025, og kampene står nå i Kordofan med daglige droneangrep. Det finnes ingen våpenhvile.',
      'The war between Sudan’s army (SAF) under General al-Burhan and the Rapid Support Forces (RSF) under Hemedti began on 15 April 2023. The army retook Khartoum in March 2025, the RSF took El Fasher in October 2025, and fighting now centres on Kordofan with daily drone strikes. There is no ceasefire.',
    ],
    causes: ['Maktkamp mellom to militære ledere etter kuppet i 2021, og strid om RSFs innlemming i hæren.', 'A power struggle between two military leaders after the 2021 coup, and a dispute over integrating the RSF into the army.'],
    parties: ['SAF og allierte grupper mot RSF og allierte, blant dem SPLM-N (al-Hilu). RSF leder en rivaliserende regjering.', 'The SAF and allied groups against the RSF and allies including SPLM-N (al-Hilu). The RSF heads a rival government.'],
    claims: [
      fact('escalation', '2026-11-08', ['Hæren melder at den har tatt Ayal Bakhit i Vest-Kordofan og rykker mot Al-Khuwei.', 'The army says it has taken Ayal Bakhit in West Kordofan and is advancing on Al-Khuwei.'], 'aaSudan'),
      fact('escalation', '2026-11-04', ['Sudans utenriksdepartement anklager Etiopia for å huse oppskytingssteder for RSF-droner.', 'Sudan’s foreign ministry accuses Ethiopia of hosting launch sites for RSF drones.'], 'cfrSudan'),
      assess('military', '2025-01-01', ['De forente arabiske emirater anklages for å forsyne RSF med våpen. Emiratene avviser det.', 'The UAE is accused of supplying weapons to the RSF. The UAE denies this.'], 'wikiSudan'),
      assess('military', '2026-11-06', ['Russlands Africa Corps beskrives som støttespiller for hæren med logistikk og etterretning.', 'Russia’s Africa Corps is described as supporting the army with logistics and intelligence.'], 'cfrSudan'),
      fact('ceasefire', '2025-09-30', ['USA, Saudi-Arabia, Egypt og Emiratene foreslo i september 2025 en tre måneders humanitær våpenhvile. RSF sa ja, hæren har ikke sluttet seg til.', 'The US, Saudi Arabia, Egypt and the UAE proposed a three-month humanitarian truce in September 2025. The RSF accepted; the army has not signed on.'], 'wikiSudan'),
      fact('human', '2026-11-06', ['15,4 millioner mennesker trenger husly, og 5,2 millioner har vendt tilbake til hjemstedet, ifølge UNHCR og IOM.', '15.4 million people need shelter and 5.2 million have returned to their areas of origin, according to UNHCR and IOM.'], 'unSudan'),
      fact('human', '2026-06-30', ['Hungersnød er bekreftet i flere regioner, og hungersnødlignende forhold ble meldt i Sør-Kordofan i 2026.', 'Famine has been confirmed in several regions, and famine conditions were reported in South Kordofan in 2026.'], 'wikiSudan'),
      fact('geo', '2025-01-07', ['USAs regjering fastslo at RSF og allierte militser har begått folkemord.', 'The US government determined that the RSF and allied militias committed genocide.'], 'wikiSudan'),
    ],
    figs: [
      fig(['Drepte totalt', 'Total killed'], ['svært usikkert: anslag fra 150 000 til over 400 000', 'highly uncertain: estimates from 150,000 to over 400,000'], '2026-06-30', ['Spenn fra ulike kilder samlet i artikkelen. Ingen autoritativ telling finnes.', 'Range compiled from several sources in the article. No authoritative count exists.'], 'wikiSudan'),
      fig(['Internt fordrevne', 'Internally displaced'], ['9,1 millioner', '9.1 million'], '2025-12-31', ['UNHCR Global Trends, ved utgangen av 2025. Verdens største interne fordrivelseskrise.', 'UNHCR Global Trends, end of 2025. The world’s largest internal displacement crisis.'], 'tocGT'),
      fig(['Flyktninger i nabolandene', 'Refugees in neighbouring countries'], ['ca. 3,5 millioner', 'about 3.5 million'], '2025-02-05', ['Oppgitt i artikkelen per februar 2025.', 'As stated in the article for February 2025.'], 'wikiSudan'),
    ],
    s: ['wikiList', 'wikiSudan', 'unSudan', 'cfrSudan', 'aaSudan'],
  },
  {
    id: 'mmr', name: ['Borgerkrigen i Myanmar', 'Myanmar civil war'], type: 'civil', status: 'active', tier: 4, row: R.mmr,
    at: [21.5, 96.5], iso: ['MMR', 'BGD', 'THA', 'CHN', 'IND'], start: '2021-02-01', verified: '2026-05-31',
    sum: [
      'Militærkuppet 1. februar 2021 utløste væpnet motstand fra den folkevalgte skyggeregjeringens styrker og etniske væpnede grupper. Militæret har mistet stabil kontroll over store deler av landet, men holder de fleste større byene og gjennomførte motoffensiver i Shan-staten sent i 2025.',
      'The military coup of 1 February 2021 triggered armed resistance by forces of the elected shadow government and ethnic armed groups. The military has lost stable control of much of the country but holds most large towns and mounted counteroffensives in Shan State in late 2025.',
    ],
    causes: ['Kuppet mot den valgte regjeringen og tiår med konflikt mellom sentralmakten og etniske minoriteter.', 'The coup against the elected government and decades of conflict between the centre and ethnic minorities.'],
    parties: ['Militæret (Tatmadaw) og allierte militser mot Nasjonal samlingsregjering (NUG), folkeforsvarsstyrkene og etniske hærer som Arakan Army, KIA og TNLA.', 'The military (Tatmadaw) and allied militias against the National Unity Government, People’s Defence Forces and ethnic armies such as the Arakan Army, KIA and TNLA.'],
    claims: [
      fact('military', '2025-12-01', ['Militærets stabile kontroll var redusert til mellom 72 og 220 av 330 kommuner.', 'The military’s stable control had fallen to between 72 and 220 of 330 townships.'], 'wikiMyanmar'),
      fact('geo', '2025-10-02', ['MNDAA forlot Lashio etter kinesisk press, og militæret tok tilbake Kyaukme 2. oktober 2025.', 'The MNDAA left Lashio under Chinese pressure, and the military retook Kyaukme on 2 October 2025.'], 'wikiMyanmar'),
      fact('geo', '2025-07-31', ['Juntaens styringsråd ble oppløst og makten overført til Det nasjonale forsvars- og sikkerhetsrådet under Min Aung Hlaing.', 'The junta’s governing council was dissolved and power moved to the National Defence and Security Council under Min Aung Hlaing.'], 'wikiMyanmar'),
    ],
    figs: [
      fig(['Drepte siden 2021', 'Killed since 2021'], ['89 200–96 000+', '89,200–96,000+'], '2026-01-01', ['ACLED, gjengitt i artikkelen.', 'ACLED, as cited in the article.'], 'wikiMyanmar'),
      fig(['Internt fordrevne', 'Internally displaced'], ['3,48 millioner', '3.48 million'], '2024-12-20', ['FN-tall. Eldre enn øvrige tall i posten.', 'UN figure. Older than the other figures in this record.'], 'wikiMyanmar'),
      fig(['Flyktet til nabolandene', 'Fled to neighbouring countries'], ['ca. 299 000', 'about 299,000'], '2026-05-31', ['UNHCR, mai 2026.', 'UNHCR, May 2026.'], 'wikiMyanmar'),
    ],
    s: ['wikiList', 'wikiMyanmar'],
  },
  {
    id: 'cod', name: ['Øst-Kongo (M23)', 'Eastern DR Congo (M23)'], type: 'proxy', status: 'active', tier: 4, row: R.cod,
    at: [-1.68, 29.22], iso: ['COD', 'RWA', 'BDI', 'UGA'], start: '2022-03-27', verified: '2026-11-01',
    sum: [
      'Opprørsgruppen M23 tok Goma i januar 2025, Bukavu i februar og Uvira i desember 2025. FN-eksperter har dokumentert rwandisk støtte, som Rwanda benekter. Avtaler i Washington og Doha i 2025 har ikke stanset kampene, og Crisis Group vurderte at situasjonen ble verre i oktober 2026.',
      'The M23 rebel group took Goma in January 2025, Bukavu in February and Uvira in December 2025. UN experts have documented Rwandan support, which Rwanda denies. Agreements in Washington and Doha in 2025 have not stopped the fighting, and Crisis Group assessed that the situation deteriorated in October 2026.',
    ],
    causes: ['Etterdønninger av folkemordet i Rwanda, væpnede grupper i grenseområdene og kontroll over mineralrike områder.', 'The aftermath of the Rwandan genocide, armed groups in the borderlands, and control of mineral-rich areas.'],
    parties: ['M23 mot DR Kongos hær (FARDC), Wazalendo-militser og allierte. Rwanda anklages for å støtte M23.', 'M23 against DR Congo’s army (FARDC), Wazalendo militias and allies. Rwanda is accused of backing M23.'],
    claims: [
      assess('military', '2024-04-30', ['En FN-bestilt rapport anslo 3 000–4 000 rwandiske soldater i Øst-Kongo. Rwanda benekter støtte til M23.', 'A UN-commissioned report estimated 3,000–4,000 Rwandan troops in eastern DR Congo. Rwanda denies supporting M23.'], 'wikiM23'),
      fact('ceasefire', '2025-06-27', ['DR Kongo og Rwanda undertegnet en amerikanskmeklet fredsavtale i Washington. Kampene fortsatte.', 'DR Congo and Rwanda signed a US-mediated peace agreement in Washington. Fighting continued.'], 'wikiM23'),
      fact('ceasefire', '2025-07-19', ['DR Kongo og M23 sluttet seg til en prinsipperklæring i Doha.', 'DR Congo and M23 endorsed a declaration of principles in Doha.'], 'wikiM23'),
      fact('escalation', '2025-12-10', ['M23 tok Uvira. Minst 400 ble drept og 200 000 fordrevet, ifølge regionale myndigheter og FN.', 'M23 took Uvira. At least 400 were killed and 200,000 displaced, according to regional authorities and the UN.'], 'wikiM23'),
      assess('escalation', '2026-11-01', ['Crisis Group førte DR Kongo opp blant forverrede situasjoner i oktober 2026.', 'Crisis Group listed DR Congo among deteriorated situations in October 2026.'], 'cw1026'),
      assess('econ', '2025-12-31', ['Analytikere knytter Rwandas rolle til økonomiske interesser og mineraler.', 'Analysts link Rwanda’s role to economic and mineral interests.'], 'wikiM23'),
    ],
    figs: [
      fig(['Drepte i slaget om Goma', 'Killed in the battle for Goma'], ['nær 3 000', 'nearly 3,000'], '2025-01-31', ['FNs anslag.', 'UN estimate.'], 'wikiM23'),
      fig(['M23s styrke', 'M23 strength'], ['ca. 22 000 soldater', 'about 22,000 fighters'], '2025-10-31', ['Anslag gjengitt i artikkelen.', 'Estimate cited in the article.'], 'wikiM23'),
      fig(['Samlet antall fordrevne', 'Total displaced'], null, '2026-11-09', NA_METHOD),
    ],
    s: ['wikiList', 'wikiM23', 'cw1026'],
  },
  {
    id: 'sahel', name: ['Opprør i Sahel (Mali, Burkina Faso, Niger)', 'Sahel insurgencies (Mali, Burkina Faso, Niger)'], type: 'insurgency', status: 'active', tier: 4, row: R.sahel,
    at: [15.5, -1.5], iso: ['MLI', 'BFA', 'NER', 'BEN', 'TGO', 'DZA', 'MRT'], start: '2012-01-16', verified: '2026-04-25',
    sum: [
      'Jihadistgruppene JNIM (al-Qaida) og IS Sahel kjemper mot militærstyrene i Mali, Burkina Faso og Niger. JNIM innførte drivstoffblokade i Mali høsten 2025. 25. april 2026 startet JNIM og tuaregalliansen FLA en felles offensiv som tok tilbake Kidal og deler av Gao.',
      'The jihadist groups JNIM (al-Qaeda) and Islamic State Sahel are fighting the military governments of Mali, Burkina Faso and Niger. JNIM imposed a fuel blockade in Mali in autumn 2025. On 25 April 2026 JNIM and the Tuareg alliance FLA launched a joint offensive that retook Kidal and parts of Gao.',
    ],
    causes: ['Tuaregopprøret i 2012, svak statlig kontroll, lokale konflikter om land og jihadistisk mobilisering.', 'The 2012 Tuareg rebellion, weak state control, local land conflicts and jihadist mobilisation.'],
    parties: ['Malis, Burkina Fasos og Nigers hærer, støttet av russiske Africa Corps i Mali, mot JNIM, IS Sahel og FLA.', 'The armies of Mali, Burkina Faso and Niger, supported by Russia’s Africa Corps in Mali, against JNIM, IS Sahel and the FLA.'],
    claims: [
      fact('escalation', '2025-09-30', ['JNIM erklærte blokade av Kayes og Nioro du Sahel. I oktober 2025 ble skoler og universiteter stengt på grunn av drivstoffmangel.', 'JNIM declared a blockade of Kayes and Nioro du Sahel. In October 2025 schools and universities closed because of the fuel shortage.'], 'wikiMali'),
      fact('escalation', '2026-04-25', ['FLA og JNIM tok tilbake Kidal og deler av Gao i en felles offensiv.', 'The FLA and JNIM retook Kidal and parts of Gao in a joint offensive.'], 'wikiMali'),
      fact('military', '2025-06-30', ['Africa Corps, kontrollert av den russiske staten, ble værende i Mali etter at Wagner kunngjorde uttrekning i juni 2025.', 'Africa Corps, controlled by the Russian state, stayed in Mali after Wagner announced its exit in June 2025.'], 'wikiMali'),
      fact('geo', '2025-01-29', ['Mali, Burkina Faso og Niger forlot ECOWAS og har dannet Alliansen av Sahel-stater med gjensidig forsvarspakt.', 'Mali, Burkina Faso and Niger left ECOWAS and formed the Alliance of Sahel States with a mutual defence pact.'], 'wAes'),
    ],
    figs: [fig(['Samlede tap og fordrevne', 'Total casualties and displaced'], null, '2026-11-09', ['Kilden gir ingen samlet oversikt. Radens årstall står under Intensitet.', 'The source gives no comprehensive totals. Row figures are shown under Intensity.'], 'wikiMali')],
    s: ['wikiList', 'wikiMali'],
  },
  {
    id: 'som', name: ['Somalia (al-Shabaab)', 'Somalia (al-Shabaab)'], type: 'insurgency', status: 'active', tier: 4, row: R.som,
    at: [3.0, 45.0], iso: ['SOM', 'KEN', 'ETH'], start: '2006-12-01', verified: '2026-11-09',
    sum: [
      'Somalias føderale regjering og allierte styrker kjemper mot al-Shabaab. Referanselisten fører også IS i Puntland og krisen mellom føderale myndigheter og Jubaland under samme konflikt.',
      'Somalia’s federal government and allied forces are fighting al-Shabaab. The reference list also places Islamic State in Puntland and the federal–Jubaland crisis under the same conflict.',
    ],
    causes: ['Statssammenbruddet i 1991, klanrivalisering og jihadistisk opprør.', 'State collapse in 1991, clan rivalry and jihadist insurgency.'],
    parties: ['Føderale styrker, delstatsstyrker og en AU-ledet støttestyrke mot al-Shabaab og IS Somalia.', 'Federal forces, state forces and an AU-led support mission against al-Shabaab and IS Somalia.'],
    claims: [],
    figs: [fig(['Detaljerte tall', 'Detailed figures'], null, '2026-11-09', NA_METHOD)],
    s: ['wikiList'],
  },
  {
    id: 'mex', name: ['Kartellvolden i Mexico', 'Mexico cartel violence'], type: 'nonstate', status: 'active', tier: 4, row: R.mex,
    at: [24.5, -104.0], iso: ['MEX'], start: '2006-12-11', verified: '2026-11-09',
    sum: [
      'Vold mellom narkotikakarteller og mellom kartellene og staten. Referanselisten fører dette som væpnet konflikt ut fra dødstall. Organisert kriminell vold skiller seg fra krig mellom politiske parter.',
      'Violence among drug cartels and between cartels and the state. The reference list counts it as an armed conflict on the basis of deaths. Organised criminal violence differs from war between political parties.',
    ],
    causes: ['Kontroll over smuglerruter og lokale markeder, og statens militariserte svar siden 2006.', 'Control of trafficking routes and local markets, and the state’s militarised response since 2006.'],
    parties: ['Meksikanske sikkerhetsstyrker og rivaliserende karteller.', 'Mexican security forces and rival cartels.'],
    claims: [],
    figs: [fig(['Detaljerte tall', 'Detailed figures'], null, '2026-11-09', NA_METHOD)],
    s: ['wikiList'],
  },

  // ════════════════ Tier 3 rows ════════════════
  {
    id: 'yem', name: ['Jemen og houthienes krig mot Saudi-Arabia', 'Yemen and the Houthi–Saudi war'], type: 'civil', status: 'active', tier: 3, row: R.yem,
    at: [15.0, 44.3], iso: ['YEM', 'SAU', 'ARE'], start: '2014-09-16', verified: '2026-11-01',
    sum: [
      'Houthiene kontrollerer Sanaa og det meste av Nord-Jemen. Etter at separatistrådet STC ble oppløst i januar 2026, blusset krigen opp igjen. Houthiene erklærte 20. juli blokade av saudiske havner og skip i Bab el-Mandeb, og i september tok de Mokha, Perim og Hanish-øyene og dermed hele Rødehavskysten. I oktober utvidet de angrepene mot Saudi-Arabia.',
      'The Houthis control Sanaa and most of northern Yemen. After the separatist STC was dissolved in January 2026 the war flared again. On 20 July the Houthis declared a blockade of Saudi ports and ships in Bab el-Mandeb, and in September they took Mokha, Perim and the Hanish Islands, and with them the whole Red Sea coast. In October they widened attacks on Saudi Arabia.',
    ],
    causes: ['Houthienes maktovertakelse i 2014, den saudiskledede intervensjonen fra 2015 og regional rivalisering mellom Saudi-Arabia og Iran.', 'The Houthi takeover in 2014, the Saudi-led intervention from 2015, and regional rivalry between Saudi Arabia and Iran.'],
    parties: ['Houthiene (Ansar Allah) mot presidentrådet (PLC) støttet av Saudi-Arabia. Iran regnes som houthienes støttespiller. Emiratene trakk seg ut i desember 2025.', 'The Houthis (Ansar Allah) against the Presidential Leadership Council backed by Saudi Arabia. Iran is widely seen as the Houthis’ backer. The UAE withdrew in December 2025.'],
    claims: [
      fact('escalation', '2026-07-20', ['Houthiene erklærte blokade av saudiske havner og skip i Bab el-Mandeb. Saudi-Arabia bombet havnen i Hodeidah 24. juli.', 'The Houthis declared a blockade of Saudi ports and ships in Bab el-Mandeb. Saudi Arabia bombed Hodeidah port on 24 July.'], 'wikiYemen'),
      fact('escalation', '2026-09-11', ['Houthiene tok Mokha og deretter Perim og Hanish-øyene.', 'The Houthis took Mokha and then Perim and the Hanish Islands.'], 'wikiYemen'),
      assess('escalation', '2026-11-01', ['Houthiene utvidet angrepene mot Saudi-Arabia mens kampene med regjeringsstyrkene tiltok på flere fronter.', 'The Houthis widened attacks on Saudi Arabia as fighting with government forces surged on several fronts.'], 'cw1026'),
      fact('econ', '2026-08-31', ['Houthi-angrep traff saudiske tankskip og Aramco-anlegg i Jizan og Najran i august.', 'Houthi strikes hit Saudi tankers and Aramco facilities in Jizan and Najran in August.'], 'wikiYemen'),
      fact('geo', '2025-12-30', ['Presidentrådet sa opp forsvarspakten med Emiratene, som trakk ut sine siste styrker.', 'The Presidential Leadership Council cancelled its defence pact with the UAE, which withdrew its remaining forces.'], 'wikiYemen'),
    ],
    figs: [
      fig(['Drepte totalt', 'Total killed'], ['over 150 000', 'over 150,000'], '2026-11-09', ['FN-tall gjengitt i artikkelen uten dato. Anslag som tar med sult og sykdom er høyere.', 'UN figure cited in the article without a date. Estimates including hunger and disease are higher.'], 'wikiYemen'),
    ],
    s: ['wikiList', 'wikiYemen', 'cw1026', 'acss'],
  },
  {
    id: 'eth', name: ['Etiopia: ny krig i Tigray', 'Ethiopia: renewed war in Tigray'], type: 'civil', status: 'active', tier: 3, row: R.eth,
    at: [13.5, 39.5], iso: ['ETH', 'ERI'], start: '2020-11-03', verified: '2026-10-23',
    sum: [
      'Tigray-krigen 2020–2022 endte med Pretoria-avtalen. I 2026 brøt konflikten ut igjen: Tigray anklaget føderale styrker for offensiv 1. august, og 23. september gikk TPLF til angrep i Afar og Amhara i allianse med seks andre væpnede grupper. I oktober pågikk kamper i sentrale Tigray. Samtidig fortsetter Fano-opprøret i Amhara.',
      'The 2020–2022 Tigray war ended with the Pretoria agreement. In 2026 the conflict resumed: Tigray accused federal forces of an offensive on 1 August, and on 23 September the TPLF attacked in Afar and Amhara in alliance with six other armed groups. Fighting continued in central Tigray in October. The Fano insurgency in Amhara also continues.',
    ],
    causes: ['Maktkamp mellom føderale myndigheter og TPLF, uavklart status for Vest-Tigray, og etnisk baserte opprør.', 'A power struggle between the federal government and the TPLF, the unresolved status of Western Tigray, and ethnically based insurgencies.'],
    parties: ['Etiopias føderale hær (ENDF) og Amhara-styrker mot TPLF/TDF og allierte grupper.', 'Ethiopia’s federal army (ENDF) and Amhara forces against the TPLF/TDF and allied groups.'],
    claims: [
      fact('ceasefire', '2022-11-02', ['Pretoria-avtalen om opphør av fiendtligheter ble undertegnet med Den afrikanske union som mekler. Eritrea var ikke part.', 'The Pretoria cessation of hostilities agreement was signed with the African Union mediating. Eritrea was not a party.'], 'wikiTigray'),
      fact('escalation', '2026-09-23', ['TPLF tok kontroll over flyplasser i Tigray og angrep føderale stillinger i Afar og Amhara.', 'The TPLF seized airports in Tigray and attacked federal positions in Afar and Amhara.'], 'ajEth'),
      fact('escalation', '2026-10-23', ['Føderale styrker trakk seg sørover fra flere steder ved grensen til Eritrea under en motoffensiv fra Tigray-styrkene.', 'Federal forces withdrew south from several localities near the Eritrean border during a Tigrayan counteroffensive.'], 'ctpEth'),
      fact('geo', '2026-10-01', ['Etiopia utviste ti eritreiske diplomater og stengte ambassaden i Asmara. Eritrea brøt de diplomatiske forbindelsene.', 'Ethiopia expelled ten Eritrean diplomats and closed its embassy in Asmara. Eritrea severed diplomatic relations.'], 'cw1026'),
    ],
    figs: [
      fig(['Drepte i Tigray-krigen 2020–2022', 'Killed in the 2020–2022 Tigray war'], ['100 000+ (UCDP) til ca. 600 000 (AUs mekler)', '100,000+ (UCDP) to about 600,000 (AU mediator)'], '2022-11-03', ['Svært ulike anslag. Ghent-universitetet anslår 162 000–378 000.', 'Widely differing estimates. Ghent University estimates 162,000–378,000.'], 'wikiTigray'),
      fig(['Tap i 2026', 'Losses in 2026'], null, '2026-11-09', NA_METHOD),
    ],
    s: ['wikiList', 'wikiTigray', 'ajEth', 'ctpEth', 'cw1026'],
  },
  {
    id: 'afgpak', name: ['Krigen mellom Afghanistan og Pakistan 2026', '2026 Afghanistan–Pakistan war'], type: 'interstate', status: 'active', tier: 3, row: R.afg,
    at: [33.6, 70.2], iso: ['AFG', 'PAK'], start: '2026-02-21', verified: '2026-05-03',
    sum: [
      'Pakistanske luftangrep i Nangarhar, Paktika og Khost i slutten av februar 2026 utløste åpen konflikt. Pakistan sier målet er militante grupper Taliban-styret gir tilhold. En midlertidig våpenhvile gjaldt 19.–24. mars. 3. mai sa Pakistan at ingen våpenhvile var i kraft, og Crisis Group varslet konfliktrisiko for begge land i oktober.',
      'Pakistani air strikes in Nangarhar, Paktika and Khost in late February 2026 set off open conflict. Pakistan says it targets militant groups sheltered by the Taliban authorities. A temporary ceasefire held on 19–24 March. On 3 May Pakistan said no ceasefire was in place, and Crisis Group issued conflict risk alerts for both countries in October.',
    ],
    causes: ['Pakistans anklager om at Taliban-styret huser pakistanske Taliban (TTP), og den omstridte Durand-linjen.', 'Pakistan’s charge that the Taliban authorities harbour the Pakistani Taliban (TTP), and the disputed Durand Line.'],
    parties: ['Pakistan mot Taliban-styret i Afghanistan.', 'Pakistan against the Taliban authorities in Afghanistan.'],
    claims: [
      fact('ceasefire', '2026-03-24', ['Pakistan innførte en pause i operasjonene fra 19. til 24. mars i forbindelse med id.', 'Pakistan paused operations from 19 to 24 March for Eid.'], 'pak0325'),
      fact('escalation', '2026-05-03', ['Pakistan opplyste at ingen midlertidig våpenhvile var i kraft.', 'Pakistan said no temporary ceasefire was in place.'], 'pak0503'),
      risk('escalation', '2026-10-01', ['Crisis Group utstedte konfliktvarsel for Afghanistan og Pakistan for oktober 2026.', 'Crisis Group issued conflict risk alerts for Afghanistan and Pakistan for October 2026.'], 'cwSep'),
    ],
    figs: [fig(['Tap og fordrevne', 'Casualties and displaced'], null, '2026-11-09', ['Ikke hentet inn fra primærkilde. Sist kontrollerte status er fra 3. mai 2026.', 'Not collected from a primary source. Status was last checked for 3 May 2026.'])],
    s: ['wikiList', 'pak0325', 'pak0503', 'cwSep'],
  },
  {
    id: 'ven', name: ['Venezuela og USAs militæroperasjon', 'Venezuela and the US military operation'], type: 'interstate', status: 'active', tier: 3, row: R.ven,
    at: [10.5, -66.9], iso: ['VEN', 'USA', 'COL'], start: '2025-09-01', verified: '2026-09-30',
    sum: [
      'USA startet 1. september 2025 angrep på båter landet hevder smugler narkotika. 3. januar 2026 angrep amerikanske styrker Caracas og pågrep president Nicolás Maduro, som ble ført til New York. Delcy Rodríguez ble tatt i ed som president. Operasjonen er senere utvidet til Ecuador og omorganisert.',
      'On 1 September 2025 the United States began strikes on boats it alleges carry drugs. On 3 January 2026 US forces struck Caracas and captured President Nicolás Maduro, who was taken to New York. Delcy Rodríguez was sworn in as president. The operation has since expanded to Ecuador and been reorganised.',
    ],
    causes: ['USAs anklager om statlig narkotikahandel, striden om Maduros legitimitet og amerikansk press for maktskifte.', 'US allegations of state-linked drug trafficking, the dispute over Maduro’s legitimacy, and US pressure for a change of power.'],
    parties: ['USA og samarbeidsland mot nettverk USA betegner som narkoterrorister. Venezuelas stilling er omstridt etter pågripelsen av Maduro.', 'The United States and partner countries against networks the US labels narco-terrorists. Venezuela’s position is contested since Maduro’s capture.'],
    claims: [
      fact('escalation', '2026-01-03', ['Amerikanske styrker angrep Caracas og pågrep Maduro og hans kone. Minst 32 cubanere, 23 venezuelanske soldater og 2 sivile ble drept, ifølge BBC.', 'US forces struck Caracas and captured Maduro and his wife. At least 32 Cubans, 23 Venezuelan soldiers and 2 civilians were killed, according to the BBC.'], 'wikiSpear'),
      assess('geo', '2026-09-30', ['FNs spesialrapportør mener det er rimelig grunn til å tro at 68 angrep med 223 drepte utgjør forbrytelser mot menneskeheten.', 'A UN Special Rapporteur said there were reasonable grounds to believe that 68 attacks killing 223 people amounted to crimes against humanity.'], 'wikiSpear'),
      fact('military', '2026-08-06', ['USAs sørkommando kunngjorde en ny felles innsatsstyrke for den vestlige halvkule som skal avløse operasjonen.', 'US Southern Command announced a new joint task force for the Western Hemisphere to replace the operation.'], 'wikiSpear'),
    ],
    figs: [fig(['Drepte i angrep på båter', 'Killed in strikes on boats'], ['minst 234', 'at least 234'], '2026-09-30', ['Opptelling gjengitt i artikkelen.', 'Count given in the article.'], 'wikiSpear')],
    s: ['wikiList', 'wikiSpear'],
  },
  {
    id: 'syr', name: ['Syria etter Assad', 'Syria after Assad'], type: 'civil', status: 'active', tier: 3, row: R.syr,
    at: [34.8, 38.0], iso: ['SYR', 'TUR', 'ISR', 'IRQ'], start: '2011-03-15', verified: '2026-11-09',
    sum: [
      'Assad-regimet falt 8. desember 2024 etter nesten 14 års borgerkrig. Referanselisten fører fortsatt vold under overgangsstyret: sammenstøt i kystområdene, drusisk opprør, israelske angrep og kamp mot IS.',
      'The Assad government fell on 8 December 2024 after almost 14 years of civil war. The reference list records continuing violence under the transitional authorities: clashes in the coastal region, a Druze insurgency, Israeli strikes and the fight against Islamic State.',
    ],
    causes: ['Opprøret i 2011, sekteriske skillelinjer og utenlandsk intervensjon.', 'The 2011 uprising, sectarian divides and foreign intervention.'],
    parties: ['Overgangsregjeringen mot ulike væpnede grupper. Tyrkia og Israel opererer militært i landet.', 'The transitional government against various armed groups. Turkey and Israel operate militarily in the country.'],
    claims: [fact('geo', '2025-05-31', ['EU og USA opphevet i 2025 de fleste økonomiske sanksjonene mot Syria.', 'The EU and the United States lifted most economic sanctions on Syria in 2025.'], 'euSanc', 'ofac')],
    figs: [fig(['Detaljerte tall for 2026', 'Detailed 2026 figures'], null, '2026-11-09', NA_METHOD)],
    s: ['wikiList'],
  },
  {
    id: 'hti', name: ['Gjengkrigen i Haiti', 'Haiti gang conflict'], type: 'nonstate', status: 'active', tier: 3, row: R.hti,
    at: [18.55, -72.34], iso: ['HTI'], start: '2020-06-01', verified: '2026-11-01',
    sum: [
      'Gjengkoalisjonen Viv Ansanm kontrollerte i 2025 om lag 80 % av hovedstadsområdet. En internasjonal politistyrke ledet av Kenya har vært utplassert siden juni 2024. Crisis Group vurderte at situasjonen ble verre i oktober 2026 og varsler økt risiko i november.',
      'In 2025 the Viv Ansanm gang coalition controlled about 80% of the capital area. A Kenya-led international police mission has been deployed since June 2024. Crisis Group assessed that the situation deteriorated in October 2026 and warns of higher risk in November.',
    ],
    causes: ['Statssammenbrudd etter drapet på presidenten i 2021, og gjengenes kontroll over havner og veier.', 'State collapse after the president’s assassination in 2021, and gang control of ports and roads.'],
    parties: ['Haitis politi og hær og den internasjonale styrken mot gjengkoalisjonen Viv Ansanm. Borgervern deltar også.', 'Haiti’s police and army and the international mission against the Viv Ansanm gang coalition. Vigilante groups also take part.'],
    claims: [assess('escalation', '2026-11-01', ['Haiti står på Crisis Groups liste over forverrede situasjoner i oktober og konfliktvarsler for november 2026.', 'Haiti is on Crisis Group’s list of deteriorated situations for October and conflict risk alerts for November 2026.'], 'cw1026')],
    figs: [fig(['Fordrevne', 'Displaced'], ['1,3 millioner', '1.3 million'], '2025-06-11', ['FN-tall. Eldre enn radens øvrige opplysninger.', 'UN figure. Older than the rest of this record.'], 'wikiHaiti')],
    s: ['wikiList', 'wikiHaiti', 'cw1026'],
  },
  brief('nga', ['Nigeria: Boko Haram, banditter og lokale konflikter', 'Nigeria: Boko Haram, banditry and communal conflicts'], 'insurgency', 3, R.nga, [11.8, 13.2], ['NGA', 'NER', 'TCD', 'CMR'], '2009-07-26',
    ['Jihadistopprør i nordøst (Boko Haram og ISWAP), væpnede bander i nordvest, konflikter mellom gjetere og bønder og separatistvold i sørøst.', 'Jihadist insurgency in the north-east (Boko Haram and ISWAP), armed banditry in the north-west, herder–farmer conflicts and separatist violence in the south-east.']),
  brief('col', ['Colombia: væpnede grupper og Catatumbo', 'Colombia: armed groups and Catatumbo'], 'insurgency', 3, R.col, [8.3, -73.0], ['COL', 'VEN', 'ECU'], '1964-05-27',
    ['ELN, FARC-utbrytere og kriminelle grupper kjemper om territorium, blant annet i Catatumbo ved grensen til Venezuela. Colombia sluttet seg i august 2026 til USAs operasjon mot narkotikanettverk.', 'The ELN, FARC dissidents and criminal groups fight over territory, including in Catatumbo on the Venezuelan border. Colombia joined the US operation against trafficking networks in August 2026.'], ['wikiSpear']),
  brief('ecu', ['Ecuador: narkotikakrigen', 'Ecuador: drug war'], 'nonstate', 3, R.ecu, [-2.2, -79.9], ['ECU'], '2024-01-09',
    ['Staten erklærte i januar 2024 intern væpnet konflikt mot kriminelle grupper. Fra 6. mars 2026 deltar USA i bombing av gruppen Comandos de la Frontera.', 'In January 2024 the state declared an internal armed conflict against criminal groups. Since 6 March 2026 the United States has taken part in bombing the Comandos de la Frontera group.'], ['wikiSpear']),
  brief('cmr', ['Kamerun: den engelskspråklige krisen og Boko Haram', 'Cameroon: Anglophone crisis and Boko Haram'], 'insurgency', 3, R.cmr, [5.96, 10.15], ['CMR', 'NGA'], '2017-09-09',
    ['Separatister i de engelskspråklige regionene kjemper mot staten, og Boko Haram angriper i nord.', 'Separatists in the English-speaking regions are fighting the state, and Boko Haram attacks in the far north.']),
  brief('caf', ['Den sentralafrikanske republikk', 'Central African Republic'], 'civil', 3, R.caf, [6.5, 21.5], ['CAF'], '2012-12-10',
    ['Regjeringen og allierte styrker kjemper mot en rekke opprørsgrupper. Dødstallene falt fra 2025 til 2026 ifølge referanselisten.', 'The government and allied forces are fighting a range of rebel groups. Deaths fell from 2025 to 2026 according to the reference list.']),

  // ════════════════ Tier 2 rows ════════════════
  {
    id: 'kas', name: ['India–Pakistan (Kashmir)', 'India–Pakistan (Kashmir)'], type: 'border', status: 'ceasefire', tier: 2, row: R.kas,
    at: [34.0, 74.8], iso: ['IND', 'PAK'], start: '1947-10-22', verified: '2026-11-09',
    sum: [
      'Etter terrorangrepet i Pahalgam 22. april 2025 utvekslet India og Pakistan missil- og luftangrep 7.–10. mai 2025, de to atommaktenes alvorligste militære sammenstøt på flere tiår. En våpenhvile ble kunngjort 10. mai 2025.',
      'After the Pahalgam attack of 22 April 2025, India and Pakistan exchanged missile and air strikes on 7–10 May 2025, the most serious military clash between the two nuclear powers in decades. A ceasefire was announced on 10 May 2025.',
    ],
    causes: ['Striden om Kashmir siden delingen i 1947 og angrep fra militante grupper.', 'The dispute over Kashmir since partition in 1947 and attacks by militant groups.'],
    parties: ['India og Pakistan, samt militante grupper i Jammu og Kashmir.', 'India and Pakistan, and militant groups in Jammu and Kashmir.'],
    claims: [fact('ceasefire', '2025-05-10', ['India og Pakistan kunngjorde våpenhvile etter fire dager med angrep.', 'India and Pakistan announced a ceasefire after four days of strikes.'], 'ucdp', 'wikiList')],
    figs: [fig(['Detaljerte tall', 'Detailed figures'], null, '2026-11-09', NA_METHOD)],
    s: ['wikiList', 'ucdp'],
  },
  brief('irq', ['Irak: IS-opprør og militser', 'Iraq: IS insurgency and militias'], 'insurgency', 2, R.irq, [34.5, 43.5], ['IRQ'], '2003-03-20',
    ['Rester av IS angriper fortsatt. Under Iran-krigen i 2026 angrep iranskstøttede militser amerikanske mål, og USA bombet militsbaser.', 'Islamic State remnants still attack. During the 2026 Iran war, Iran-backed militias attacked US sites and the US struck militia bases.'], ['wikiIran']),
  brief('lby', ['Libya', 'Libya'], 'civil', 2, R.lby, [32.0, 15.0], ['LBY'], '2011-02-15',
    ['Landet er delt mellom rivaliserende regjeringer i Tripoli og i øst, med periodiske sammenstøt mellom militser.', 'The country is split between rival governments in Tripoli and the east, with periodic militia clashes.']),
  brief('moz', ['Mosambik: Cabo Delgado', 'Mozambique: Cabo Delgado'], 'insurgency', 2, R.moz, [-12.3, 40.2], ['MOZ', 'TZA'], '2017-10-05',
    ['IS-tilknyttet opprør i den gassrike provinsen Cabo Delgado. Rwandiske styrker støtter Mosambiks hær.', 'An Islamic State-linked insurgency in the gas-rich province of Cabo Delgado. Rwandan forces support Mozambique’s army.']),
  brief('phl', ['Filippinene: kommunistopprør og IS-grupper', 'Philippines: communist and IS-linked insurgencies'], 'insurgency', 2, R.phl, [7.5, 124.5], ['PHL'], '1969-03-29',
    ['Det kommunistiske NPA-opprøret og IS-tilknyttede grupper på Mindanao.', 'The communist NPA rebellion and Islamic State-linked groups in Mindanao.']),
  brief('pap', ['Indonesia: Papua', 'Indonesia: Papua'], 'insurgency', 2, R.pap, [-4.0, 138.5], ['IDN'], '1962-10-01',
    ['Væpnede separatister kjemper mot indonesiske sikkerhetsstyrker i Papua-provinsene.', 'Armed separatists are fighting Indonesian security forces in the Papua provinces.']),

  // ════════════════ Tier 1 rows ════════════════
  brief('wsa', ['Vest-Sahara', 'Western Sahara'], 'territorial', 1, R.wsa, [25.0, -13.0], ['MAR', 'ESH', 'DZA'], '1975-10-30',
    ['Polisario erklærte våpenhvilen fra 1991 for avsluttet i 2020. Territoriets status er omstridt: Marokko kontrollerer det meste, mens Polisario krever selvstendighet.', 'Polisario declared the 1991 ceasefire over in 2020. The territory’s status is disputed: Morocco controls most of it, while Polisario seeks independence.']),
  brief('sth', ['Sør-Thailand', 'Southern Thailand'], 'insurgency', 1, R.sth, [6.5, 101.3], ['THA'], '2004-01-04',
    ['Malay-muslimske separatister har drevet et lavintensivt opprør i de sørligste provinsene siden 2004.', 'Malay-Muslim separatists have waged a low-intensity insurgency in the southernmost provinces since 2004.']),

  // ════════════════ Ceasefires and peace processes ════════════════
  {
    id: 'thakhm', name: ['Thailand–Kambodsja', 'Thailand–Cambodia'], type: 'border', status: 'ceasefire', tier: null,
    at: [14.4, 104.0], iso: ['THA', 'KHM'], start: '2025-05-28', verified: '2026-05-31',
    sum: [
      'Grensestriden utløste kamper 24.–28. juli 2025 og på nytt 7.–14. desember 2025, med thailandske luftangrep. En fredsavtale ble undertegnet i Kuala Lumpur 26. oktober 2025, men suspendert av Thailand i november. Ny våpenhvile trådte i kraft 27. desember 2025 og gjaldt fortsatt i mai 2026.',
      'The border dispute led to fighting on 24–28 July 2025 and again on 7–14 December 2025, including Thai air strikes. A peace accord was signed in Kuala Lumpur on 26 October 2025 but suspended by Thailand in November. A new ceasefire took effect on 27 December 2025 and still held in May 2026.',
    ],
    causes: ['Uavklart grenselinje fra kolonitiden, blant annet rundt tempelområder.', 'An unsettled colonial-era boundary, including around temple sites.'],
    parties: ['Thailand og Kambodsja. Malaysia og USA har meklet.', 'Thailand and Cambodia. Malaysia and the United States have mediated.'],
    claims: [
      fact('ceasefire', '2025-12-27', ['Ny våpenhvile trådte i kraft med 72 timers overvåkingsperiode.', 'A new ceasefire took effect with a 72-hour monitoring period.'], 'wikiThaiKhm'),
      assess('geo', '2026-10-13', ['Crisis Groups EU Watch List for høsten 2026 omtaler grensestriden som en av fem prioriterte situasjoner.', 'Crisis Group’s autumn 2026 EU Watch List covers the border dispute as one of five priority situations.'], 'cw1026'),
    ],
    figs: [
      fig(['Fordrevne sivile', 'Civilians displaced'], ['over 200 000', 'more than 200,000'], '2025-12-31', ['Oppgitt i artikkelens sammendrag.', 'As stated in the article summary.'], 'wikiThaiKhm'),
      fig(['Drepte thailandske soldater', 'Thai soldiers killed'], ['42', '42'], '2025-12-31', ['Thailands egne tall. Kambodsjas tall er omstridt.', 'Thailand’s own figures. Cambodia’s figures are disputed.'], 'wikiThaiKhm'),
    ],
    s: ['wikiThaiKhm', 'cw1026'],
  },
  {
    id: 'armaze', name: ['Armenia–Aserbajdsjan', 'Armenia–Azerbaijan'], type: 'territorial', status: 'ceasefire', tier: 1, row: R.nk,
    at: [40.0, 46.0], iso: ['ARM', 'AZE'], start: '1988-02-20', verified: '2026-11-09',
    sum: [
      'Etter krigen i 2020 og Aserbajdsjans overtakelse av Nagorno-Karabakh i september 2023 paraferte partene en fredsavtale i Washington 8. august 2025. Referanselisten fører svært få dødsfall i 2025 og 2026.',
      'After the 2020 war and Azerbaijan’s takeover of Nagorno-Karabakh in September 2023, the parties initialled a peace agreement in Washington on 8 August 2025. The reference list records very few deaths in 2025 and 2026.',
    ],
    causes: ['Striden om Nagorno-Karabakh siden Sovjetunionens oppløsning.', 'The dispute over Nagorno-Karabakh since the breakup of the Soviet Union.'],
    parties: ['Armenia og Aserbajdsjan.', 'Armenia and Azerbaijan.'],
    claims: [fact('ceasefire', '2025-08-08', ['Lederne paraferte teksten til en fredsavtale i Washington.', 'The leaders initialled the text of a peace agreement in Washington.'], 'ucdp', 'wikiList')],
    figs: [],
    s: ['wikiList', 'ucdp'],
  },

  // ════════════════ Flashpoints (no confirmed active warfare) ════════════════
  {
    id: 'taiwan', name: ['Taiwanstredet', 'Taiwan Strait'], type: 'territorial', status: 'flashpoint', tier: null,
    at: [24.3, 119.6], iso: ['TWN', 'CHN', 'USA'], start: '1949-12-07', verified: '2026-11-01',
    sum: [
      'Kina gjør krav på Taiwan og gjennomfører jevnlig militærøvelser rundt øya. Det pågår ingen bekreftet væpnet kamp. Taiwans status er omstridt: øya styres som Republikken Kina, mens Folkerepublikken regner den som en provins.',
      'China claims Taiwan and regularly holds military exercises around the island. There is no confirmed armed fighting. Taiwan’s status is disputed: it is governed as the Republic of China, while the People’s Republic regards it as a province.',
    ],
    causes: ['Den uavsluttede kinesiske borgerkrigen og stormaktsrivalisering mellom Kina og USA.', 'The unfinished Chinese civil war and great-power rivalry between China and the United States.'],
    parties: ['Kina og Taiwan. USA har ingen formell forsvarsavtale med Taiwan, men leverer våpen etter Taiwan Relations Act.', 'China and Taiwan. The United States has no formal defence treaty with Taiwan but supplies arms under the Taiwan Relations Act.'],
    claims: [risk('econ', '2026-11-09', ['En krise i stredet ville berøre en av verdens viktigste skipsleder og halvlederproduksjonen på Taiwan. Ingen forstyrrelse er observert.', 'A crisis in the strait would affect one of the world’s main shipping lanes and semiconductor production in Taiwan. No disruption has been observed.'], 'cw1026')],
    figs: [],
    s: ['cw1026'],
  },
  {
    id: 'korea', name: ['Koreahalvøya', 'Korean Peninsula'], type: 'interstate', status: 'flashpoint', tier: null,
    at: [38.0, 127.0], iso: ['PRK', 'KOR', 'USA'], start: '1950-06-25', verified: '2026-10-28',
    sum: [
      'Koreakrigen endte med våpenstillstand i 1953, ikke fredsavtale. Spenningen ved grensen økte etter en landminehendelse i september 2026, og Nord-Korea gjennomførte flere missiltester i oktober.',
      'The Korean War ended with an armistice in 1953, not a peace treaty. Border tension rose after a landmine incident in September 2026, and North Korea carried out several missile tests in October.',
    ],
    causes: ['Delingen av halvøya, Nord-Koreas atomvåpenprogram og fraværet av fredsavtale.', 'The division of the peninsula, North Korea’s nuclear weapons programme and the absence of a peace treaty.'],
    parties: ['Nord-Korea mot Sør-Korea og USA. Nord-Korea har forsvarsavtaler med Kina og Russland.', 'North Korea against South Korea and the United States. North Korea has defence treaties with China and Russia.'],
    claims: [fact('escalation', '2026-10-28', ['Nord-Korea testet i oktober blant annet en hypersonisk rakett, to ubåtavfyrte kryssermissiler og rundt ti kortdistanseraketter. Sør-Korea testet sin første egenutviklede hypersoniske rakett.', 'In October North Korea tested, among others, a hypersonic missile, two submarine-launched cruise missiles and about ten short-range ballistic missiles. South Korea tested its first domestically developed hypersonic missile.'], 'cwAsia')],
    figs: [],
    s: ['cwAsia'],
  },
  {
    id: 'scs', name: ['Sør-Kinahavet', 'South China Sea'], type: 'territorial', status: 'flashpoint', tier: null,
    at: [10.5, 115.0], iso: ['CHN', 'PHL', 'VNM', 'MYS', 'BRN', 'TWN'], start: '1974-01-19', verified: '2026-11-01',
    sum: [
      'Kina, Filippinene, Vietnam, Malaysia, Brunei og Taiwan har overlappende krav. En voldgiftsdomstol avviste i 2016 grunnlaget for Kinas krav. Kina godtar ikke avgjørelsen. Kravene framstilles her som omstridte.',
      'China, the Philippines, Vietnam, Malaysia, Brunei and Taiwan hold overlapping claims. An arbitral tribunal rejected the basis of China’s claims in 2016. China does not accept the ruling. Claims are presented here as disputed.',
    ],
    causes: ['Overlappende krav på øyer, rev og havområder, fiskeri og energiressurser.', 'Overlapping claims to islands, reefs and waters, fisheries and energy resources.'],
    parties: ['Kina og de andre kravstatene. USA har forsvarsavtale med Filippinene.', 'China and the other claimant states. The United States has a defence treaty with the Philippines.'],
    claims: [],
    figs: [],
    s: ['cw1026'],
  },
  {
    id: 'ecs', name: ['Østkinahavet (Kina–Japan)', 'East China Sea (China–Japan)'], type: 'territorial', status: 'flashpoint', tier: null,
    at: [25.75, 123.5], iso: ['CHN', 'JPN'], start: '2012-09-11', verified: '2026-10-27',
    sum: [
      'Kina og Japan strides om Senkaku-/Diaoyu-øyene, som Japan administrerer. Per 27. oktober 2026 hadde Japan registrert 94 kinesiske fartøyer i den tilstøtende sonen, fire av dem i territorialfarvannet.',
      'China and Japan dispute the Senkaku/Diaoyu Islands, which Japan administers. As of 27 October 2026 Japan had detected 94 Chinese vessels in the contiguous zone, four of them in the territorial sea.',
    ],
    causes: ['Suverenitetsstrid om øyene og et diplomatisk brudd mellom Beijing og Tokyo.', 'A sovereignty dispute over the islands and a diplomatic rift between Beijing and Tokyo.'],
    parties: ['Kina og Japan. USA har forsvarsavtale med Japan.', 'China and Japan. The United States has a defence treaty with Japan.'],
    claims: [fact('escalation', '2026-10-14', ['Japan opplyste 14. oktober at landet hadde levert diplomatiske protester til Kina og Russland.', 'Japan said on 14 October that it had lodged diplomatic protests with China and Russia.'], 'cwAsia')],
    figs: [],
    s: ['cwAsia'],
  },
  {
    id: 'etheri', name: ['Etiopia–Eritrea', 'Ethiopia–Eritrea'], type: 'interstate', status: 'flashpoint', tier: null,
    at: [13.0, 42.7], iso: ['ETH', 'ERI'], start: '2026-10-01', verified: '2026-11-01',
    sum: [
      'Etiopia anklager Eritrea for å støtte TPLF-opprøret. Etiopia utviste ti eritreiske diplomater 1. oktober 2026, og Eritrea brøt de diplomatiske forbindelsene. Statsminister Abiy gjentok kravet om adgang til Rødehavet. Eritrea frykter et forsøk på å ta havnebyen Assab.',
      'Ethiopia accuses Eritrea of backing the TPLF insurgency. Ethiopia expelled ten Eritrean diplomats on 1 October 2026 and Eritrea severed diplomatic relations. Prime Minister Abiy restated his demand for access to the Red Sea. Eritrea fears an attempt to seize the port of Assab.',
    ],
    causes: ['Etiopias ønske om havtilgang og Eritreas rolle i Tigray.', 'Ethiopia’s wish for sea access and Eritrea’s role in Tigray.'],
    parties: ['Etiopia og Eritrea.', 'Ethiopia and Eritrea.'],
    claims: [risk('escalation', '2026-10-01', ['Crisis Group utstedte konfliktvarsel for Eritrea og Etiopia for oktober 2026.', 'Crisis Group issued conflict risk alerts for Eritrea and Ethiopia for October 2026.'], 'cwSep')],
    figs: [],
    s: ['cw1026', 'cwSep'],
  },

  // ════════════════ Ended conflicts (for the historical timeline) ════════════════
  ended('afg01', ['Krigen i Afghanistan 2001–2021', 'War in Afghanistan 2001–2021'], 'interstate', [34.5, 69.2], ['AFG', 'USA'], '2001-10-07', '2021-08-30',
    ['USA-ledet invasjon etter 11. september 2001. Taliban tok tilbake makten i august 2021 da de internasjonale styrkene trakk seg ut.', 'US-led invasion after 11 September 2001. The Taliban retook power in August 2021 as international forces withdrew.']),
  ended('irq03', ['Irak-krigen 2003–2011', 'Iraq War 2003–2011'], 'interstate', [33.3, 44.4], ['IRQ', 'USA', 'GBR'], '2003-03-20', '2011-12-18',
    ['USA-ledet invasjon som styrtet Saddam Hussein, fulgt av opprør og sekterisk borgerkrig.', 'US-led invasion that toppled Saddam Hussein, followed by insurgency and sectarian civil war.']),
  ended('isis', ['Krigen mot IS i Irak og Syria', 'War against Islamic State in Iraq and Syria'], 'insurgency', [35.5, 41.0], ['IRQ', 'SYR'], '2014-06-10', '2019-03-23',
    ['IS erobret Mosul i juni 2014 og mistet sitt siste territorium i Baghuz i mars 2019.', 'Islamic State captured Mosul in June 2014 and lost its last territory at Baghuz in March 2019.']),
  ended('lka', ['Borgerkrigen på Sri Lanka', 'Sri Lankan civil war'], 'civil', [9.0, 80.5], ['LKA'], '1983-07-23', '2009-05-18',
    ['Krigen mellom staten og De tamilske tigrene endte med tigrenes nederlag i mai 2009.', 'The war between the state and the Tamil Tigers ended with the Tigers’ defeat in May 2009.']),
  ended('drc2', ['Den andre Kongo-krigen', 'Second Congo War'], 'interstate', [-2.5, 26.0], ['COD', 'RWA', 'UGA', 'AGO', 'ZWE'], '1998-08-02', '2003-07-18',
    ['Regional krig med flere afrikanske stater involvert. Den endte formelt med en overgangsregjering i 2003.', 'A regional war involving several African states. It formally ended with a transitional government in 2003.']),
  ended('lbn06', ['Libanon-krigen 2006', '2006 Lebanon war'], 'interstate', [33.2, 35.4], ['LBN', 'ISR'], '2006-07-12', '2006-08-14',
    ['34 dagers krig mellom Israel og Hizbollah, avsluttet med FN-resolusjon 1701.', 'A 34-day war between Israel and Hezbollah, ended by UN Security Council Resolution 1701.']),
  ended('geo08', ['Krigen mellom Russland og Georgia', 'Russo-Georgian war'], 'interstate', [42.2, 44.0], ['GEO', 'RUS'], '2008-08-07', '2008-08-12',
    ['Fem dagers krig om Sør-Ossetia og Abkhasia.', 'A five-day war over South Ossetia and Abkhazia.']),
  ended('che1', ['Den f\u00f8rste tsjetsjenske krigen', 'First Chechen War'], 'separatist', [43.3, 45.7], ['RUS'], '1994-12-11', '1996-08-31',
    ['Russisk forsøk på å gjenvinne kontroll over den utbryterrepublikken Tsjetsjenia, avsluttet med Khasavyurt-avtalen.', 'A Russian attempt to regain control of the breakaway republic of Chechnya, ended by the Khasavyurt accord.']),
  ended('che2', ['Den andre tsjetsjenske krigen', 'Second Chechen War'], 'separatist', [43.3, 45.7], ['RUS'], '1999-08-26', '2009-04-16',
    ['Russland gjenopprettet f\u00f8deral kontroll over Tsjetsjenia. Et islamistisk, anti-russisk oppr\u00f8r fortsatte i Nord-Kaukasus etter at kampene avtok.', 'Russia re-established federal control over Chechnya. An Islamist, anti-Russian insurgency continued in the North Caucasus after the fighting subsided.']),
  ended('nk20', ['Den andre krigen om Nagorno-Karabakh', 'Second Nagorno-Karabakh war'], 'interstate', [39.8, 46.75], ['ARM', 'AZE'], '2020-09-27', '2020-11-10',
    ['44 dagers krig som endte med russiskmeklet våpenhvile og aserbajdsjanske landevinninger.', 'A 44-day war that ended with a Russian-brokered ceasefire and Azerbaijani territorial gains.']),
];

/** Short record for conflicts where this snapshot holds only the reference-list row. */
function brief(id: string, name: L, type: Conflict['type'], tier: Conflict['tier'], row: Conflict['row'], at: [number, number], iso: string[], start: string, sum: L, extra: string[] = []): Conflict {
  return {
    id, name, type, status: 'active', tier, row, at, iso, start, verified: '2026-11-09', sum,
    causes: ['Ikke beskrevet i dette øyeblikksbildet.', 'Not described in this snapshot.'],
    parties: ['Se sammendraget og kildene.', 'See the summary and sources.'],
    claims: [],
    figs: [fig(['Detaljerte tall', 'Detailed figures'], null, '2026-11-09', NA_METHOD)],
    s: ['wikiList', ...extra],
  };
}

function ended(id: string, name: L, type: Conflict['type'], at: [number, number], iso: string[], start: string, end: string, sum: L): Conflict {
  return {
    id, name, type, status: 'ended', tier: null, at, iso, start, end, verified: end, sum,
    causes: ['Se UCDPs konfliktleksikon.', 'See the UCDP Conflict Encyclopedia.'],
    parties: ['Se UCDPs konfliktleksikon.', 'See the UCDP Conflict Encyclopedia.'],
    claims: [], figs: [], s: ['ucdp'],
  };
}
