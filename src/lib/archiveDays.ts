/**
 * The days ISW's open archive has a clean, dated snapshot of assessed Russian
 * control for in 2026: every day of May. Kept apart from controlHistory.ts so
 * the panel can list them without loading the clipping library.
 */
export const ARCHIVE_DAYS: string[] = Array.from({ length: 31 }, (_, i) => `2026-05-${String(i + 1).padStart(2, '0')}`);
