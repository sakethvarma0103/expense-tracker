import { describe, expect, it } from 'vitest';
import { daysOfMonth, istMonthRange, shiftMonth } from '../src/services/dateRange';

describe('India-time month helpers', () => {
  it('maps a month to its UTC range in India time', () => {
    const { start, end } = istMonthRange('2026-03');
    expect(start.toISOString()).toBe('2026-02-28T18:30:00.000Z');
    expect(end.toISOString()).toBe('2026-03-31T18:30:00.000Z');
    expect(istMonthRange('2026-12').end.toISOString()).toBe('2026-12-31T18:30:00.000Z');
    expect(() => istMonthRange('2026-13')).toThrow();
  });

  it('shifts months across years', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(shiftMonth('2026-03', -5)).toBe('2025-10');
  });

  it('lists the days of a month, including leap years', () => {
    expect(daysOfMonth('2026-02')).toHaveLength(28);
    expect(daysOfMonth('2028-02')).toHaveLength(29);
    expect(daysOfMonth('2026-10').at(-1)).toBe('2026-10-31');
  });
});
