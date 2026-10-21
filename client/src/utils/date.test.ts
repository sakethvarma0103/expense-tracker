import { describe, expect, it } from 'vitest'
import {
  currentIstMonth,
  formatDayHeading,
  formatMonth,
  formatMonthShort,
  formatTime,
  istInputsToIso,
  istParts,
  shiftMonth,
} from './date'

// All helpers use Asia/Kolkata explicitly, so results don't depend on the machine's timezone
describe('India-time date helpers', () => {
  it('reads the India-time date and time of an instant', () => {
    expect(istParts('2026-03-31T18:00:00Z')).toEqual({ date: '2026-03-31', time: '23:30' })
    expect(istParts('2026-03-31T18:30:00Z').date).toBe('2026-04-01')
  })

  it('turns India-time inputs into a UTC instant and back', () => {
    expect(istInputsToIso('2026-03-31', '23:30')).toBe('2026-03-31T18:00:00.000Z')
    expect(istParts(istInputsToIso('2026-10-21', '08:05'))).toEqual({ date: '2026-10-21', time: '08:05' })
  })

  it('shifts and formats months', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12')
    expect(shiftMonth('2026-12', 1)).toBe('2027-01')
    expect(formatMonth('2026-10')).toBe('October 2026')
    expect(formatMonthShort('2026-10')).toBe('Oct')
    expect(currentIstMonth()).toMatch(/^\d{4}-\d{2}$/)
  })

  it('labels days and times', () => {
    expect(formatDayHeading(istParts(new Date()).date)).toBe('Today')
    expect(formatDayHeading('2025-12-25')).toBe('Thu, 25 Dec, 2025')
    expect(formatTime('2026-10-05T14:45:00Z')).toBe('8:15 pm')
  })
})
