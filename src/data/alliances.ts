import type { Membership, Org, Relation, SanctionRegime } from '../types';

const m = (from: number, ...iso: string[]): Membership[] => iso.map((i) => ({ iso: i, from }));

/**
 * Organisations with dated membership, so the timeline shows who belonged in a given year.
 * `kind` separates binding mutual-defence pacts from security cooperation and from
 * economic or political bodies. Economic membership is never drawn as a military alliance.
 */
export const ORGS: Org[] = [
  {
    id: 'nato', short: 'NATO', name: ['NATO', 'NATO'], kind: 'defense', color: '#4D8CFF', founded: 1949,
    note: ['Bindende gjensidig forsvarsforpliktelse etter artikkel 5 i Atlanterhavspakten.', 'Binding mutual-defence commitment under Article 5 of the North Atlantic Treaty.'],
    members: [
      ...m(1949, 'BEL', 'CAN', 'DNK', 'FRA', 'ISL', 'ITA', 'LUX', 'NLD', 'NOR', 'PRT', 'GBR', 'USA'),
      ...m(1952, 'GRC', 'TUR'), ...m(1955, 'DEU'), ...m(1982, 'ESP'), ...m(1999, 'CZE', 'HUN', 'POL'),
      ...m(2004, 'BGR', 'EST', 'LVA', 'LTU', 'ROU', 'SVK', 'SVN'), ...m(2009, 'ALB', 'HRV'),
      ...m(2017, 'MNE'), ...m(2020, 'MKD'), ...m(2023, 'FIN'), ...m(2024, 'SWE'),
    ],
    s: ['nato'],
  },
  {
    id: 'eu', short: 'EU', name: ['Den europeiske union', 'European Union'], kind: 'economic', color: '#F5C84B', founded: 1958,
    note: ['Politisk og økonomisk union. Artikkel 42.7 har en bistandsklausul, men EU er ikke en militærallianse.', 'Political and economic union. Article 42.7 contains a mutual assistance clause, but the EU is not a military alliance.'],
    members: [
      ...m(1958, 'BEL', 'FRA', 'DEU', 'ITA', 'LUX', 'NLD'), ...m(1973, 'DNK', 'IRL'), { iso: 'GBR', from: 1973, to: 2020 },
      ...m(1981, 'GRC'), ...m(1986, 'ESP', 'PRT'), ...m(1995, 'AUT', 'FIN', 'SWE'),
      ...m(2004, 'CYP', 'CZE', 'EST', 'HUN', 'LVA', 'LTU', 'MLT', 'POL', 'SVK', 'SVN'), ...m(2007, 'BGR', 'ROU'), ...m(2013, 'HRV'),
    ],
    s: ['eu'],
  },
  {
    id: 'un', short: 'FN / UN', name: ['De forente nasjoner', 'United Nations'], kind: 'universal', color: '#9FB3C8', founded: 1945,
    note: ['193 medlemsland. Nesten universelt medlemskap, derfor ikke tegnet som eget lag. Palestina og Vatikanstaten er observatørstater. Taiwan og Kosovo er ikke medlemmer.', '193 member states. Membership is near-universal, so it is not drawn as a layer. Palestine and the Holy See are observer states. Taiwan and Kosovo are not members.'],
    members: [],
    s: ['un'],
  },
  {
    id: 'brics', short: 'BRICS', name: ['BRICS', 'BRICS'], kind: 'economic', color: '#FF9B42', founded: 2009,
    note: ['Økonomisk og diplomatisk samarbeid uten forsvarsforpliktelser. Saudi-Arabia er invitert, men har ikke bekreftet medlemskap.', 'Economic and diplomatic cooperation with no defence commitments. Saudi Arabia has been invited but has not confirmed membership.'],
    members: [...m(2009, 'BRA', 'RUS', 'IND', 'CHN'), ...m(2011, 'ZAF'), ...m(2024, 'EGY', 'ETH', 'IRN', 'ARE'), ...m(2025, 'IDN')],
    s: ['wBrics'],
  },
  {
    id: 'asean', short: 'ASEAN', name: ['ASEAN', 'ASEAN'], kind: 'economic', color: '#2DD4BF', founded: 1967,
    note: ['Regionalt politisk og økonomisk samarbeid i Sørøst-Asia. Ingen gjensidig forsvarsforpliktelse.', 'Regional political and economic cooperation in South-East Asia. No mutual-defence commitment.'],
    members: [...m(1967, 'IDN', 'MYS', 'PHL', 'SGP', 'THA'), ...m(1984, 'BRN'), ...m(1995, 'VNM'), ...m(1997, 'LAO', 'MMR'), ...m(1999, 'KHM'), ...m(2025, 'TLS')],
    s: ['asean'],
  },
  {
    id: 'au', short: 'AU', name: ['Den afrikanske union', 'African Union'], kind: 'political', color: '#7BD389', founded: 2002,
    note: ['Kontinental organisasjon med 55 medlemmer, inkludert Den saharawiske republikk, hvis status er omstridt. Midlertidige suspensjoner etter kupp er ikke sporet her.', 'Continental body with 55 members, including the Sahrawi Republic, whose status is disputed. Temporary suspensions after coups are not tracked here.'],
    members: [
      ...m(2002, 'DZA', 'AGO', 'BEN', 'BWA', 'BFA', 'BDI', 'CMR', 'CPV', 'CAF', 'TCD', 'COM', 'COG', 'COD', 'CIV', 'DJI', 'EGY', 'GNQ', 'ERI', 'SWZ', 'ETH', 'GAB', 'GMB', 'GHA', 'GIN', 'GNB', 'KEN', 'LSO', 'LBR', 'LBY', 'MDG', 'MWI', 'MLI', 'MRT', 'MUS', 'MOZ', 'NAM', 'NER', 'NGA', 'RWA', 'STP', 'SEN', 'SYC', 'SLE', 'SOM', 'ZAF', 'SDN', 'TGO', 'TUN', 'UGA', 'TZA', 'ZMB', 'ZWE', 'ESH'),
      ...m(2011, 'SSD'), ...m(2017, 'MAR'),
    ],
    s: ['au'],
  },
  {
    id: 'sco', short: 'SCO', name: ['Shanghai-samarbeidsorganisasjonen', 'Shanghai Cooperation Organisation'], kind: 'security', color: '#C084FC', founded: 2001,
    note: ['Sikkerhetspolitisk og økonomisk samarbeid. Ingen gjensidig forsvarsforpliktelse.', 'Security and economic cooperation. No mutual-defence commitment.'],
    members: [...m(2001, 'CHN', 'RUS', 'KAZ', 'KGZ', 'TJK', 'UZB'), ...m(2017, 'IND', 'PAK'), ...m(2023, 'IRN'), ...m(2024, 'BLR')],
    s: ['sco'],
  },
  {
    id: 'csto', short: 'CSTO', name: ['Organisasjonen for kollektiv sikkerhet', 'Collective Security Treaty Organization'], kind: 'defense', color: '#F472B6', founded: 1994,
    note: ['Gjensidig forsvarsforpliktelse etter artikkel 4. Armenia frøs sin deltakelse i 2024, men er formelt medlem.', 'Mutual-defence commitment under Article 4. Armenia froze its participation in 2024 but formally remains a member.'],
    members: [...m(1994, 'RUS', 'BLR', 'ARM', 'KAZ', 'KGZ', 'TJK'), { iso: 'UZB', from: 2006, to: 2012 }],
    s: ['wCsto'],
  },
  {
    id: 'gcc', short: 'GCC', name: ['Golfrådet', 'Gulf Cooperation Council'], kind: 'political', color: '#A3E635', founded: 1981,
    note: ['Politisk og økonomisk samarbeid mellom seks Golfstater, med en felles forsvarsavtale fra 2000.', 'Political and economic cooperation among six Gulf states, with a joint defence agreement from 2000.'],
    members: m(1981, 'SAU', 'ARE', 'QAT', 'KWT', 'BHR', 'OMN'),
    s: ['wGcc'],
  },
  {
    id: 'aes', short: 'AES', name: ['Alliansen av Sahel-stater', 'Alliance of Sahel States'], kind: 'defense', color: '#F59E0B', founded: 2023,
    note: ['Gjensidig forsvarspakt (Liptako-Gourma-charteret, 16. september 2023). Konføderasjon fra juli 2024. Medlemmene forlot ECOWAS 29. januar 2025.', 'Mutual defence pact (Liptako-Gourma Charter, 16 September 2023). A confederation since July 2024. The members left ECOWAS on 29 January 2025.'],
    members: m(2023, 'MLI', 'BFA', 'NER'),
    s: ['wAes'],
  },
  {
    id: 'aukus', short: 'AUKUS', name: ['AUKUS', 'AUKUS'], kind: 'security', color: '#60A5FA', founded: 2021,
    note: ['Sikkerhetspartnerskap om ubåter og forsvarsteknologi. Ikke en gjensidig forsvarspakt.', 'A security partnership on submarines and defence technology. Not a mutual-defence pact.'],
    members: m(2021, 'AUS', 'GBR', 'USA'),
    s: ['wAukus'],
  },
];

/** Bilateral treaties and strategic partnerships. `defense` = treaty with a mutual-assistance clause. */
export const RELATIONS: Relation[] = [
  { id: 'us-jp', a: 'USA', b: 'JPN', type: 'defense', since: '1960-01-19', name: ['Sikkerhetsavtalen mellom USA og Japan', 'US–Japan Security Treaty'], note: ['Artikkel 5 forplikter USA til å forsvare territorier under japansk administrasjon.', 'Article 5 commits the US to defend territories under Japanese administration.'], s: ['wTreaties'] },
  { id: 'us-kr', a: 'USA', b: 'KOR', type: 'defense', since: '1953-10-01', name: ['Forsvarsavtalen mellom USA og Sør-Korea', 'US–ROK Mutual Defense Treaty'], note: ['Undertegnet etter våpenstillstanden i Koreakrigen.', 'Signed after the Korean War armistice.'], s: ['wTreaties'] },
  { id: 'us-ph', a: 'USA', b: 'PHL', type: 'defense', since: '1951-08-30', name: ['Forsvarsavtalen mellom USA og Filippinene', 'US–Philippines Mutual Defense Treaty'], note: ['Gjelder væpnet angrep i Stillehavsområdet.', 'Covers armed attack in the Pacific area.'], s: ['wTreaties'] },
  { id: 'us-au', a: 'USA', b: 'AUS', type: 'defense', since: '1951-09-01', name: ['ANZUS', 'ANZUS'], note: ['USA suspenderte forpliktelsene overfor New Zealand i 1986.', 'The US suspended its obligations to New Zealand in 1986.'], s: ['wTreaties'] },
  { id: 'cn-kp', a: 'CHN', b: 'PRK', type: 'defense', since: '1961-07-11', name: ['Vennskapsavtalen mellom Kina og Nord-Korea', 'Sino–North Korean Treaty of Friendship'], note: ['Inneholder en klausul om gjensidig militær bistand.', 'Contains a mutual military assistance clause.'], s: ['wTreaties'] },
  { id: 'ru-kp', a: 'RUS', b: 'PRK', type: 'defense', since: '2024-06-19', name: ['Strategisk partnerskapsavtale Russland–Nord-Korea', 'Russia–North Korea Comprehensive Strategic Partnership Treaty'], note: ['Inneholder en klausul om gjensidig bistand ved angrep.', 'Contains a mutual assistance clause in case of attack.'], s: ['wTreaties'] },
  { id: 'sa-pk', a: 'SAU', b: 'PAK', type: 'defense', since: '2025-09-17', name: ['Strategisk forsvarsavtale Saudi-Arabia–Pakistan', 'Saudi–Pakistani Strategic Mutual Defense Agreement'], note: ['Angrep på den ene regnes som angrep på begge.', 'An attack on one is treated as an attack on both.'], s: ['wTreaties'] },
  { id: 'ru-by', a: 'RUS', b: 'BLR', type: 'defense', since: '1999-12-08', name: ['Unionsstaten Russland–Belarus', 'Union State of Russia and Belarus'], note: ['Tett militær integrasjon. Belarus var oppmarsjområde for invasjonen i 2022.', 'Close military integration. Belarus was a staging area for the 2022 invasion.'], s: ['wTreaties', 'wikiUkr'] },
  { id: 'ru-ir', a: 'RUS', b: 'IRN', type: 'partnership', since: '2025-01-17', name: ['Strategisk partnerskapsavtale Russland–Iran', 'Russia–Iran Comprehensive Strategic Partnership Treaty'], note: ['Ingen klausul om gjensidig forsvar.', 'No mutual-defence clause.'], s: ['wTreaties'] },
  { id: 'us-il', a: 'USA', b: 'ISR', type: 'partnership', since: '1987-01-01', name: ['Militært partnerskap USA–Israel', 'US–Israel military partnership'], note: ['Ingen formell forsvarstraktat. Israel har status som viktig alliert utenfor NATO. Landene førte felles luftkrig mot Iran i 2026.', 'No formal defence treaty. Israel is a major non-NATO ally. The two fought a joint air war against Iran in 2026.'], s: ['wikiIran'] },
  { id: 'ru-ge', a: 'RUS', b: 'GEO', type: 'dispute', since: '2008-08-26', name: ['Bruddet mellom Russland og Georgia', 'Rupture between Russia and Georgia'], note: ['Russland anerkjente Abkhasia og S\u00f8r-Ossetia 26. august 2008 og har holdt styrker der siden. Georgia omtaler omr\u00e5dene som okkuperte og krever uttrekning. Baseavtalene fra 2010 ble ratifisert i 2011 og l\u00f8per i 49 \u00e5r.', 'Russia recognised Abkhazia and South Ossetia on 26 August 2008 and has kept forces there since. Georgia describes the territories as occupied and demands withdrawal. The 2010 basing agreements were ratified in 2011 and run for 49 years.'], s: ['warWatchGeo', 'riaBases', 'topGeo'] },
  { id: 'us-tw', a: 'USA', b: 'TWN', type: 'partnership', since: '1979-04-10', name: ['Taiwan Relations Act', 'Taiwan Relations Act'], note: ['Amerikansk lov om våpensalg til Taiwan. Ingen forsvarsforpliktelse.', 'US law providing for arms sales to Taiwan. No defence commitment.'], s: ['wTreaties'] },
];

/** Major sanctions regimes in force or recently changed. Not a complete register. */
export const SANCTIONS: SanctionRegime[] = [
  { id: 's-rus', target: 'RUS', by: ['EU', 'USA', 'GBR', 'CAN', 'JPN', 'AUS', 'CHE', 'NOR'], since: '2014-03-17', name: ['Sanksjoner mot Russland', 'Sanctions on Russia'], note: ['Innført etter annekteringen av Krim og kraftig utvidet fra februar 2022. Norge slutter seg til EUs tiltak.', 'Imposed after the annexation of Crimea and greatly expanded from February 2022. Norway aligns with the EU measures.'], s: ['euSanc', 'ofac'] },
  { id: 's-blr', target: 'BLR', by: ['EU', 'USA', 'GBR'], since: '2020-10-02', name: ['Sanksjoner mot Belarus', 'Sanctions on Belarus'], note: ['Etter valget i 2020 og utvidet for støtten til invasjonen av Ukraina.', 'After the 2020 election, expanded over support for the invasion of Ukraine.'], s: ['euSanc', 'ofac'] },
  { id: 's-irn', target: 'IRN', by: ['UN', 'EU', 'USA', 'GBR'], since: '2025-09-28', name: ['Sanksjoner mot Iran', 'Sanctions on Iran'], note: ['FN-sanksjonene ble gjeninnført 28. september 2025 gjennom snapback-mekanismen. Amerikanske sanksjoner har vart i flere tiår.', 'UN sanctions were reimposed on 28 September 2025 through the snapback mechanism. US sanctions have applied for decades.'], s: ['unSanc', 'ofac'] },
  { id: 's-prk', target: 'PRK', by: ['UN', 'EU', 'USA', 'JPN', 'KOR'], since: '2006-10-14', name: ['Sanksjoner mot Nord-Korea', 'Sanctions on North Korea'], note: ['FNs sikkerhetsråd, resolusjon 1718 og senere, etter atomprøvesprengningene.', 'UN Security Council Resolution 1718 and successors, following the nuclear tests.'], s: ['unSanc'] },
  { id: 's-mmr', target: 'MMR', by: ['EU', 'USA', 'GBR', 'CAN'], since: '2021-02-11', name: ['Sanksjoner mot Myanmars militære', 'Sanctions on Myanmar’s military'], note: ['Innført etter kuppet 1. februar 2021.', 'Imposed after the coup of 1 February 2021.'], s: ['euSanc', 'ofac'] },
  { id: 's-ven', target: 'VEN', by: ['USA', 'EU'], since: '2017-08-24', name: ['Sanksjoner mot Venezuela', 'Sanctions on Venezuela'], note: ['Status etter pågripelsen av Maduro i januar 2026 er ikke kontrollert i dette øyeblikksbildet.', 'Status after Maduro’s capture in January 2026 has not been checked for this snapshot.'], s: ['ofac', 'euSanc'] },
  { id: 's-afg', target: 'AFG', by: ['UN'], since: '2011-06-17', name: ['FN-sanksjoner mot Taliban', 'UN sanctions on the Taliban'], note: ['Sanksjonsregimet etter resolusjon 1988 retter seg mot personer og enheter tilknyttet Taliban.', 'The Resolution 1988 regime targets individuals and entities associated with the Taliban.'], s: ['unSanc'] },
];
