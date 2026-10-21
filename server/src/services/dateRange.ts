export const APP_TIMEZONE = 'Asia/Kolkata';

// Asia/Kolkata is UTC+05:30 all year (India has no daylight saving)
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

export const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

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
