import { describe, expect, it } from 'vitest'
import { formatINR, formatINRCompact, paiseToRupeesInput, parseRupeesToPaise } from './money'

describe('parseRupeesToPaise', () => {
  it.each([
    ['250.50', 25050],
    ['1,250.5', 125050],
    ['₹ 99', 9900],
    ['-5,000', -500000],
    ['0.1', 10],
    ['0.29', 29],
    ['12.', 1200],
    ['-0', 0],
  ])('parses %j as %i paise', (input, paise) => {
    expect(parseRupeesToPaise(input)).toBe(paise)
  })

  it.each(['', 'abc', '1.234', '1e5', '--5', '.5'])('rejects %j', (input) => {
    expect(parseRupeesToPaise(input)).toBeNull()
  })

  it('avoids floating-point drift', () => {
    // 0.29 * 100 is 28.999999999999996 in floating point
    expect(parseRupeesToPaise('0.29')).toBe(29)
    expect(parseRupeesToPaise('1.15')).toBe(115)
  })
})

describe('paiseToRupeesInput', () => {
  it.each([0, 1, 29, 25050, -500000, 123456789])('round-trips %i paise', (paise) => {
    expect(parseRupeesToPaise(paiseToRupeesInput(paise))).toBe(paise)
  })

  it('drops .00 for whole rupees', () => {
    expect(paiseToRupeesInput(100000)).toBe('1000')
    expect(paiseToRupeesInput(25050)).toBe('250.50')
  })
})

describe('formatINR', () => {
  it('uses Indian digit grouping', () => {
    expect(formatINR(25050)).toBe('₹250.50')
    expect(formatINR(12345678901)).toBe('₹12,34,56,789.01')
    expect(formatINR(-500000)).toBe('-₹5,000.00')
  })
})

describe('formatINRCompact', () => {
  it.each([
    [0, '₹0'],
    [95000, '₹950'],
    [120000, '₹1.2K'],
    [1500000, '₹15K'],
    [15000000, '₹1.5L'],
    [250000000_0, '₹2.5Cr'],
    [-5000000, '-₹50K'],
  ])('formats %i paise as %s', (paise, text) => {
    expect(formatINRCompact(paise)).toBe(text)
  })
})
