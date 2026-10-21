// Dates are stored as UTC instants; the app shows and groups them in India time.

export const APP_TIMEZONE = 'Asia/Kolkata'
// Asia/Kolkata is UTC+05:30 all year (no daylight saving)
const IST_OFFSET = '+05:30'

const partsFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: APP_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

/** India-time calendar date ("2026-10-21") and time ("20:15") of an instant */
export function istParts(value: Date | string): { date: string; time: string } {
  const parts: Record<string, string> = {}
  for (const { type, value: v } of partsFormatter.formatToParts(new Date(value))) parts[type] = v
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` }
}

/** Date + time typed in India time -> ISO instant for the API */
export function istInputsToIso(date: string, time: string): string {
  return new Date(`${date}T${time || '00:00'}:00${IST_OFFSET}`).toISOString()
}

/** "2026-10" for the current month in India */
export function currentIstMonth(): string {
  return istParts(new Date()).date.slice(0, 7)
}

/** shiftMonth("2026-01", -1) -> "2025-12" */
export function shiftMonth(month: string, delta: number): string {
  const d = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1 + delta, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

/** "2026-10" -> "October 2026" */
export function formatMonth(month: string): string {
  const d = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1, 1))
  return new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d)
}

/** "2026-10" -> "Oct" */
export function formatMonthShort(month: string): string {
  const d = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1, 1))
  return new Intl.DateTimeFormat('en-IN', { month: 'short', timeZone: 'UTC' }).format(d)
}

/** "2026-10-16" -> "16 Oct" */
export function formatDayShort(day: string): string {
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(
    new Date(`${day}T00:00:00Z`),
  )
}

/** "2026-10-21" -> "Today" / "Yesterday" / "Tue, 14 Oct" (adds the year if not this year) */
export function formatDayHeading(day: string): string {
  const today = istParts(new Date()).date
  if (day === today) return 'Today'
  const yesterday = istParts(new Date(Date.now() - 24 * 60 * 60 * 1000)).date
  if (day === yesterday) return 'Yesterday'
  const d = new Date(`${day}T00:00:00Z`)
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: day.slice(0, 4) === today.slice(0, 4) ? undefined : 'numeric',
    timeZone: 'UTC',
  }).format(d)
}

const timeFormatter = new Intl.DateTimeFormat('en-IN', {
  hour: 'numeric',
  minute: '2-digit',
  timeZone: APP_TIMEZONE,
})

/** ISO instant -> "8:15 pm" in India time */
export function formatTime(iso: string): string {
  return timeFormatter.format(new Date(iso))
}
