// Money is stored and sent to the server as integer paise. Rupees exist only in the UI.

const inrFormatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })

/** 25050 -> "₹250.50" */
export function formatINR(paise: number): string {
  return inrFormatter.format(paise / 100)
}

const AMOUNT_PATTERN = /^(-)?(\d+)(?:\.(\d{0,2}))?$/

/**
 * Parses user input in rupees ("1,250.5", "₹ 99", "-500") into integer paise.
 * Works on the digits directly to avoid floating-point rounding.
 * Returns null if the input isn't a valid amount with at most 2 decimal places.
 */
export function parseRupeesToPaise(input: string): number | null {
  const cleaned = input.replace(/[₹,\s]/g, '')
  const match = AMOUNT_PATTERN.exec(cleaned)
  if (!match) return null
  const [, sign, rupees = '0', fraction = ''] = match
  const paise = Number(rupees) * 100 + Number(fraction.padEnd(2, '0'))
  if (!Number.isSafeInteger(paise)) return null
  return sign && paise !== 0 ? -paise : paise
}

/** 25050 -> "250.50", -100000 -> "-1000" (for pre-filling inputs) */
export function paiseToRupeesInput(paise: number): string {
  const abs = Math.abs(paise)
  const rupees = Math.floor(abs / 100)
  const rem = abs % 100
  const value = rem === 0 ? String(rupees) : `${rupees}.${String(rem).padStart(2, '0')}`
  return paise < 0 ? `-${value}` : value
}
