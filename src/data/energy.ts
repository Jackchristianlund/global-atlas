import type { Claim, EnergySite, L, Route } from '../types';

const c = (kind: Claim['kind'], d: string, t: L, ...s: string[]): Claim => ({ cat: 'econ', kind, t, d, s });
const SCHEMATIC: L = ['Skjematisk trasé mellom endepunktene. Ikke eksakt geometri.', 'Schematic line between the end points. Not exact geometry.'];

/** Major pipelines, drawn schematically. Status statements carry their own date and source. */
export const PIPELINES: Route[] = [
  { id: 'p-eastwest', kind: 'pipeline', name: ['East-West (Petroline), Saudi-Arabia', 'East-West (Petroline), Saudi Arabia'], via: [], note: SCHEMATIC, s: ['eia', 'steo'],
    pts: [[25.93, 49.68], [24.6, 45.0], [24.09, 38.06]],
    status: c('fact', '2026-08-11', ['Kapasitet 5 millioner fat per dag, midlertidig utvidet til 7 i 2019. Brukes i 2026 til å sende råolje til Yanbu utenom Hormuz.', 'Capacity 5 million barrels a day, temporarily expanded to 7 in 2019. Used in 2026 to move crude to Yanbu, bypassing Hormuz.'], 'eia', 'steo') },
  { id: 'p-fujairah', kind: 'pipeline', name: ['Habshan–Fujairah, De forente arabiske emirater', 'Habshan–Fujairah, United Arab Emirates'], via: [], note: SCHEMATIC, s: ['eia'],
    pts: [[23.75, 53.7], [24.4, 55.3], [25.12, 56.34]],
    status: c('fact', '2024-06-25', ['Kapasitet 1,5 millioner fat per dag til Fujairah utenfor Hormuzstredet.', 'Capacity 1.5 million barrels a day to Fujairah, outside the Strait of Hormuz.'], 'eia') },
  { id: 'p-sumed', kind: 'pipeline', name: ['SUMED, Egypt', 'SUMED, Egypt'], via: [], note: SCHEMATIC, s: ['eia'],
    pts: [[29.6, 32.35], [30.2, 31.0], [31.15, 29.85]],
    status: c('fact', '2026-08-11', ['Fører råolje fra Rødehavet til Middelhavet. EIA peker på den som et begrenset alternativ for saudisk olje.', 'Carries crude from the Red Sea to the Mediterranean. The EIA notes it as a limited alternative for Saudi oil.'], 'steo') },
  { id: 'p-nordstream', kind: 'pipeline', name: ['Nord Stream 1 og 2', 'Nord Stream 1 and 2'], via: [], note: SCHEMATIC, s: ['wNord'],
    pts: [[60.55, 28.1], [59.6, 23.5], [57.5, 19.5], [55.3, 15.6], [54.14, 13.64]],
    status: c('fact', '2022-09-26', ['Tre av fire rør ble ødelagt av eksplosjoner 26. september 2022. Ute av drift.', 'Three of four lines were destroyed by explosions on 26 September 2022. Out of service.'], 'wNord') },
  { id: 'p-ukraine', kind: 'pipeline', name: ['Gasstransitt gjennom Ukraina', 'Gas transit through Ukraine'], via: [], note: SCHEMATIC, s: ['euGas'],
    pts: [[51.3, 35.3], [50.0, 30.5], [48.6, 22.3]],
    status: c('fact', '2025-01-01', ['Transitten av russisk gass stanset da avtalen utløp 1. januar 2025.', 'Transit of Russian gas stopped when the contract expired on 1 January 2025.'], 'euGas') },
  { id: 'p-druzhba', kind: 'pipeline', name: ['Druzjba (olje)', 'Druzhba (oil)'], via: [], note: SCHEMATIC, s: ['wDruzhba'],
    pts: [[53.2, 50.2], [52.4, 31.0], [52.1, 23.7], [52.5, 19.7]] },
  { id: 'p-turkstream', kind: 'pipeline', name: ['TurkStream', 'TurkStream'], via: [], note: SCHEMATIC, s: ['wTurk'],
    pts: [[44.9, 37.3], [43.0, 33.0], [41.6, 28.1]] },
  { id: 'p-pos', kind: 'pipeline', name: ['Power of Siberia', 'Power of Siberia'], via: [], note: SCHEMATIC, s: ['wPoS'],
    pts: [[60.0, 113.0], [56.0, 124.5], [50.3, 127.5]],
    status: c('fact', '2019-12-02', ['Leverer russisk gass til Kina siden desember 2019.', 'Has delivered Russian gas to China since December 2019.'], 'wPoS') },
  { id: 'p-btc', kind: 'pipeline', name: ['Baku–Tbilisi–Ceyhan', 'Baku–Tbilisi–Ceyhan'], via: [], note: SCHEMATIC, s: ['wBTC'],
    pts: [[40.2, 49.6], [41.6, 44.9], [39.9, 41.3], [36.88, 35.93]] },
  { id: 'p-cpc', kind: 'pipeline', name: ['Caspian Pipeline Consortium', 'Caspian Pipeline Consortium'], via: [], note: SCHEMATIC, s: ['wCPC'],
    pts: [[46.1, 53.4], [46.3, 48.0], [45.3, 40.5], [44.68, 37.65]] },
  { id: 'p-langeled', kind: 'pipeline', name: ['Langeled (Norge–Storbritannia)', 'Langeled (Norway–United Kingdom)'], via: [], note: SCHEMATIC, s: ['wLangeled', 'norPet'],
    pts: [[62.85, 6.95], [58.4, 1.9], [53.65, 0.1]],
    status: c('fact', '2025-01-01', ['Norge har vært EUs største leverandør av rørgass siden 2022.', 'Norway has been the EU’s largest supplier of pipeline gas since 2022.'], 'euGas') },
];

export const ENERGY_SITES: EnergySite[] = [
  { id: 'e-raslaffan', name: 'Ras Laffan', kind: 'lng', at: [25.9, 51.55], iso: 'QAT', note: ['Qatars LNG-eksportanlegg. All eksport går gjennom Hormuzstredet.', 'Qatar’s LNG export complex. All exports pass through the Strait of Hormuz.'], s: ['eia', 'wikiIran'],
    status: c('fact', '2026-03-18', ['Truffet av iransk angrep 18. mars 2026. Stansen bidro til høyere priser.', 'Hit by an Iranian strike on 18 March 2026. The shutdown pushed prices higher.'], 'wikiIran') },
  { id: 'e-southpars', name: 'South Pars', kind: 'gasfield', at: [27.5, 52.6], iso: 'IRN', note: ['Verdens største gassfelt, delt med Qatar (North Field).', 'The world’s largest gas field, shared with Qatar (North Field).'], s: ['wikiIran'],
    status: c('fact', '2026-03-18', ['Angrepet av Israel 18. mars 2026.', 'Struck by Israel on 18 March 2026.'], 'wikiIran') },
  { id: 'e-rastanura', name: 'Ras Tanura', kind: 'oil', at: [26.65, 50.17], iso: 'SAU', note: ['Saudi-Arabias største oljeeksportterminal i Persiabukta.', 'Saudi Arabia’s largest oil export terminal in the Persian Gulf.'], s: ['eia'] },
  { id: 'e-yanbu', name: 'Yanbu', kind: 'oil', at: [24.09, 38.06], iso: 'SAU', note: ['Endepunkt for East-West-rørledningen ved Rødehavet.', 'Red Sea terminus of the East-West pipeline.'], s: ['eia', 'lli0806'],
    status: c('fact', '2026-08-06', ['Supertankere laster her for å unngå Hormuz. Houthiene har erklært blokade av saudiske Rødehavshavner.', 'Supertankers load here to avoid Hormuz. The Houthis have declared a blockade of Saudi Red Sea ports.'], 'lli0806') },
  { id: 'e-fujairah', name: 'Fujairah', kind: 'oil', at: [25.12, 56.34], iso: 'ARE', note: ['Oljeterminal og bunkringshavn utenfor Hormuzstredet.', 'Oil terminal and bunkering port outside the Strait of Hormuz.'], s: ['eia'] },
  { id: 'e-kharg', name: 'Kharg', kind: 'oil', at: [29.24, 50.32], iso: 'IRN', note: ['Irans viktigste oljeeksportterminal.', 'Iran’s main oil export terminal.'], s: ['uani1104'],
    status: c('fact', '2026-11-04', ['USAs blokade begrenser Irans oljeeksport kraftig.', 'The US blockade severely constrains Iran’s oil exports.'], 'uani1104') },
  { id: 'e-sabine', name: 'Sabine Pass', kind: 'lng', at: [29.73, -93.87], iso: 'USA', note: ['Stort LNG-eksportanlegg ved Mexicogolfen.', 'A major LNG export plant on the US Gulf Coast.'], s: ['euGas'] },
  { id: 'e-melkoya', name: 'Hammerfest LNG (Melkøya)', kind: 'lng', at: [70.69, 23.6], iso: 'NOR', note: ['Norges LNG-anlegg, forsynt fra Snøhvit-feltet i Barentshavet.', 'Norway’s LNG plant, fed by the Snøhvit field in the Barents Sea.'], s: ['norPet'] },
  { id: 'e-nyhamna', name: 'Nyhamna', kind: 'gasfield', at: [62.85, 6.95], iso: 'NOR', note: ['Prosessanlegg for gass fra Ormen Lange og startpunkt for Langeled.', 'Gas processing plant for Ormen Lange and the starting point of Langeled.'], s: ['norPet'] },
  { id: 'e-novorossiysk', name: 'Novorossijsk', kind: 'oil', at: [44.68, 37.8], iso: 'RUS', note: ['Russlands største oljehavn ved Svartehavet og endepunkt for CPC-rørledningen.', 'Russia’s largest Black Sea oil port and the terminus of the CPC pipeline.'], s: ['wCPC'] },
  { id: 'e-ceyhan', name: 'Ceyhan', kind: 'oil', at: [36.88, 35.93], iso: 'TUR', note: ['Oljeterminal ved Middelhavet og endepunkt for BTC-rørledningen.', 'Mediterranean oil terminal and the terminus of the BTC pipeline.'], s: ['wBTC'] },
  { id: 'e-rotterdam', name: 'Rotterdam', kind: 'port', at: [51.95, 4.05], iso: 'NLD', note: ['Europas største havn.', 'Europe’s largest port.'], s: ['eia'] },
  { id: 'e-singapore', name: 'Singapore', kind: 'port', at: [1.26, 103.8], iso: 'SGP', note: ['Omlastings- og bunkringshavn ved Malakkastredet.', 'Transhipment and bunkering hub on the Strait of Malacca.'], s: ['eia'] },
];
