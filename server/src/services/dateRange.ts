export const APP_TIMEZONE = 'Asia/Kolkata';

// Asia/Kolkata is UTC+05:30 all year (India has no daylight saving)
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

export const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

/** shiftMonth("2026-01", -1) -> "2025-12" */
export function shiftMonth(month: string, delta: number): string {
  const d = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** Calendar days of a month: "2026-02" -> ["2026-02-01", ..., "2026-02-28"] */
export function daysOfMonth(month: string): string[] {
  const count = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0)).getUTCDate();
  return Array.from({ length: count }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`);
}

/**
 * UTC range [start, end) covering a calendar month in India.
 * "2026-03" -> 2026-02-28T18:30:00Z .. 2026-03-31T18:30:00Z
 */
export function istMonthRange(month: string): { start: Date; end: Date } {
  if (!MONTH_PATTERN.test(month)) {
    throw new Error(`Invalid month "${month}", expected YYYY-MM`);
  }
  const year = Number(month.slice(0, 4));
  const monthIndex = Number(month.slice(5, 7)) - 1;
  return {
    start: new Date(Date.UTC(year, monthIndex, 1) - IST_OFFSET_MS),
    end: new Date(Date.UTC(year, monthIndex + 1, 1) - IST_OFFSET_MS),
  };
}
