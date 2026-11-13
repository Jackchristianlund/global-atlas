/**
 * Incidents involving merchant ships in the Red Sea, Gulf of Aden and Indian
 * Ocean, per month, counted from the dates in JMIC's "Complete List of
 * Merchant Vessels Incidents" (JMIC Monthly Statistics, January 2026).
 *
 * The list holds every incident type JMIC records (attacks, attempted attacks,
 * hijack, suspicious approaches), so these are incidents, not confirmed
 * attacks. It has no positions, which is why these are counts and not points.
 * Months with no row in the list are zero. The list ends with January 2026;
 * nothing later is in this series.
 */
export const JMIC_MONTHLY: { m: string; n: number }[] = [
  { m: '2023-11', n: 3 }, { m: '2023-12', n: 19 },
  { m: '2024-01', n: 11 }, { m: '2024-02', n: 13 }, { m: '2024-03', n: 7 }, { m: '2024-04', n: 6 },
  { m: '2024-05', n: 4 }, { m: '2024-06', n: 17 }, { m: '2024-07', n: 7 }, { m: '2024-08', n: 10 },
  { m: '2024-09', n: 3 }, { m: '2024-10', n: 5 }, { m: '2024-11', n: 5 }, { m: '2024-12', n: 1 },
  { m: '2025-01', n: 1 }, { m: '2025-02', n: 0 }, { m: '2025-03', n: 0 }, { m: '2025-04', n: 1 },
  { m: '2025-05', n: 0 }, { m: '2025-06', n: 0 }, { m: '2025-07', n: 3 }, { m: '2025-08', n: 1 },
  { m: '2025-09', n: 3 }, { m: '2025-10', n: 0 }, { m: '2025-11', n: 0 }, { m: '2025-12', n: 0 },
  { m: '2026-01', n: 0 },
];
