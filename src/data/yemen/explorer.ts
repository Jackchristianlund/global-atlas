import type { L } from '../../types';

/**
 * Yemen: the reference geography the regional explorer adds.
 *
 * Ports and cities to orient by, and what Bab el-Mandeb connects. None of
 * this is an assessment of control. Where a place carries a control record,
 * it is one of the curated PLACES in data/territory.ts and is linked from
 * here by `place`; everything else is geography only, and the explorer says
 * so.
 */
export interface YemenSite {
  id: string;
  name: string;
  /** [lat, lng] */
  at: [number, number];
  kind: 'port' | 'city' | 'strait';
  /** A curated place with its own dated control record, where there is one. */
  place?: string;
  note?: L;
  s: string[];
}

export const YEMEN_SITES: YemenSite[] = [
  // ── Ports ──
  { id: 'ys-aden', name: 'Aden', at: [12.78, 45.01], kind: 'port', place: 'p-aden', s: ['nePlaces'],
    note: ['Dyphavn ved Adenbukta og regjeringens sete.', 'Deep-water port on the Gulf of Aden and the seat of the government.'] },
  { id: 'ys-hodeidah', name: 'Al Hudaydah', at: [14.80, 42.95], kind: 'port', place: 'p-hodeidah', s: ['nePlaces'],
    note: ['Jemens største havn ved Rødehavet.', 'Yemen’s largest Red Sea port.'] },
  { id: 'ys-salif', name: 'As-Salif', at: [15.2833, 42.6833], kind: 'port', s: ['wikiSalif'],
    note: ['Tørrlasthavn nord for Hudaydah. Omfattet av Stockholmsavtalen fra 2018, sammen med Hudaydah og Ras Isa.', 'Dry-bulk port north of Hudaydah. Covered by the 2018 Stockholm Agreement, together with Hudaydah and Ras Isa.'] },
  { id: 'ys-rasisa', name: 'Ras Isa', at: [15.1442, 42.6078], kind: 'port', s: ['logRasIsa'],
    note: ['Oljeterminal ved Rødehavet, endepunkt for rørledningen fra Marib.', 'Red Sea oil terminal, the end of the pipeline from Marib.'] },
  { id: 'ys-mokha', name: 'Mokha', at: [13.32, 43.25], kind: 'port', place: 'p-mokha', s: ['ajYemenMaps'],
    note: ['Havneby ved Bab el-Mandeb.', 'Port town at Bab el-Mandeb.'] },
  { id: 'ys-mukalla', name: 'Al Mukalla', at: [14.54, 49.13], kind: 'port', place: 'p-mukalla', s: ['nePlaces'],
    note: ['Hovedhavnen i Hadhramaut ved Arabiahavet.', 'The main port of Hadhramaut on the Arabian Sea.'] },
  { id: 'ys-shihr', name: 'Ash Shihr', at: [14.759, 49.609], kind: 'port', s: ['nePlaces'] },
  // ── Cities ──
  { id: 'ys-sanaa', name: 'Sanaa', at: [15.357, 44.205], kind: 'city', place: 'p-sanaa', s: ['nePlaces'] },
  { id: 'ys-taiz', name: 'Taiz', at: [13.606, 44.037], kind: 'city', place: 'p-taiz', s: ['nePlaces'] },
  { id: 'ys-marib', name: 'Marib', at: [15.421, 45.334], kind: 'city', place: 'p-marib', s: ['nePlaces'] },
  { id: 'ys-ibb', name: 'Ibb', at: [13.976, 44.171], kind: 'city', s: ['nePlaces'] },
  { id: 'ys-dhamar', name: 'Dhamar', at: [14.557, 44.387], kind: 'city', s: ['nePlaces'] },
  { id: 'ys-hajjah', name: 'Hajjah', at: [15.692, 43.602], kind: 'city', s: ['nePlaces'] },
  { id: 'ys-saada', name: 'Saada', at: [16.94, 43.85], kind: 'city', s: ['nePlaces'] },
  { id: 'ys-bayda', name: 'Al Bayda', at: [13.979, 45.574], kind: 'city', s: ['nePlaces'] },
  { id: 'ys-ataq', name: 'Ataq', at: [14.55, 46.8], kind: 'city', s: ['nePlaces'] },
  { id: 'ys-seiyun', name: 'Seiyun', at: [15.943, 48.787], kind: 'city', s: ['nePlaces'] },
  { id: 'ys-ghaydah', name: 'Al Ghaydah', at: [16.239, 52.164], kind: 'city', s: ['nePlaces'] },
  { id: 'ys-lahij', name: 'Lahij', at: [13.058, 44.884], kind: 'city', s: ['nePlaces'] },
  { id: 'ys-hadibu', name: 'Hadibu (Socotra)', at: [12.652, 54.024], kind: 'city', s: ['nePlaces'] },
];

/** Bab el-Mandeb, framed so the strait and both coasts are in view. */
export const BAB_EL_MANDEB = { at: [12.6, 43.35] as [number, number], bbox: [42.2, 11.6, 44.6, 13.8] as [number, number, number, number] };

/** Yemen with its islands, for framing. */
export const YEMEN_BBOX: [number, number, number, number] = [41.8, 12.0, 54.6, 19.0];
/** The Red Sea from Suez to the Gulf of Aden, for the shipping view. */
export const RED_SEA_BBOX: [number, number, number, number] = [32.0, 11.0, 51.5, 30.5];
/** Ukraine, for framing. */
export const UKRAINE_BBOX: [number, number, number, number] = [22.1, 44.3, 40.3, 52.4];
