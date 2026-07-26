import { describe, it, expect } from 'vitest'
import {
  currencyExponent,
  formatAmount,
  isStripeSupportedCurrency,
  normalizeCurrency,
  resolveAmount,
  toMajorUnits,
  toMinorUnits,
} from '../amounts'

describe('currencyExponent', () => {
  it('knows the zero-decimal currencies', () => {
    // ¥100 is 100, not 10000. Getting this wrong charges 100× the gift.
    expect(currencyExponent('JPY')).toBe(0)
    expect(currencyExponent('KRW')).toBe(0)
    expect(currencyExponent('XOF')).toBe(0)
  })

  it('knows the three-decimal currencies', () => {
    expect(currencyExponent('KWD')).toBe(3)
    expect(currencyExponent('BHD')).toBe(3)
  })

  it('defaults to two decimals, case-insensitively', () => {
    expect(currencyExponent('usd')).toBe(2)
    expect(currencyExponent('ERN')).toBe(2)
    expect(currencyExponent('ZZZ')).toBe(2)
  })
})

describe('toMinorUnits', () => {
  it('converts ordinary amounts', () => {
    expect(toMinorUnits(50, 'USD')).toBe(5000)
    expect(toMinorUnits('12.34', 'EUR')).toBe(1234)
    expect(toMinorUnits(1, 'ERN')).toBe(100)
  })

  it('does not multiply zero-decimal currencies', () => {
    expect(toMinorUnits(1000, 'JPY')).toBe(1000)
    expect(toMinorUnits('500', 'KRW')).toBe(500)
  })

  it('rounds on the digits, not through a float multiply', () => {
    // Both of the obvious implementations get these wrong and undercharge:
    // 1.005 * 100 === 100.49999999999999, and (1.005).toFixed(2) === '1.00'.
    expect(toMinorUnits(1.005, 'USD')).toBe(101)
    expect(toMinorUnits('1.005', 'USD')).toBe(101)
    expect(toMinorUnits(8.115, 'USD')).toBe(812)
    expect(toMinorUnits('8.115', 'USD')).toBe(812)
    expect(toMinorUnits(0.1 + 0.2, 'USD')).toBe(30)
    expect(toMinorUnits('0.005', 'USD')).toBe(1)
  })

  it('does not round a whole gift up or down', () => {
    expect(toMinorUnits('100', 'USD')).toBe(10000)
    expect(toMinorUnits('100.00', 'USD')).toBe(10000)
    expect(toMinorUnits('0.99', 'USD')).toBe(99)
  })

  it('rounds three-decimal currencies to a multiple of ten, as Stripe requires', () => {
    expect(toMinorUnits(1.234, 'KWD') as number).toBe(1230)
    expect((toMinorUnits(1.236, 'KWD') as number) % 10).toBe(0)
  })

  it('rejects anything that is not a positive finite amount', () => {
    expect(toMinorUnits(0, 'USD')).toBeNull()
    expect(toMinorUnits(-5, 'USD')).toBeNull()
    expect(toMinorUnits(Number.NaN, 'USD')).toBeNull()
    expect(toMinorUnits(Number.POSITIVE_INFINITY, 'USD')).toBeNull()
    expect(toMinorUnits('abc', 'USD')).toBeNull()
    expect(toMinorUnits('', 'USD')).toBeNull()
    // Rounds to zero minor units — not a gift.
    expect(toMinorUnits(0.001, 'USD')).toBeNull()
  })
})

describe('toMajorUnits', () => {
  it('round-trips', () => {
    expect(toMajorUnits(5000, 'USD')).toBe(50)
    expect(toMajorUnits(1000, 'JPY')).toBe(1000)
    expect(toMajorUnits(1230, 'KWD')).toBe(1.23)
  })
})

describe('formatAmount', () => {
  it('formats with the currency', () => {
    expect(formatAmount(5000, 'USD', 'en')).toContain('50')
    expect(formatAmount(5000, 'USD', 'en')).toMatch(/\$|USD/)
  })

  it('falls back rather than throwing on a malformed currency code', () => {
    // A receipt that throws is a receipt the donor never gets. Intl accepts any
    // well-formed 3-letter code, so the fallback is for genuinely bad input.
    expect(formatAmount(5000, 'US', 'en')).toBe('50.00 US')
    expect(formatAmount(5000, '', 'en')).toBe('50.00 ')
  })

  it('formats an unknown but well-formed code using the code itself', () => {
    expect(formatAmount(5000, 'ZZZ', 'en')).toContain('ZZZ')
    expect(formatAmount(5000, 'ZZZ', 'en')).toContain('50.00')
  })
})

describe('isStripeSupportedCurrency', () => {
  it('rejects ERN — the reason manual transfer cannot be removed', () => {
    expect(isStripeSupportedCurrency('ERN')).toBe(false)
  })

  it('accepts the currencies the diaspora would give in', () => {
    expect(isStripeSupportedCurrency('USD')).toBe(true)
    expect(isStripeSupportedCurrency('eur')).toBe(true)
    expect(isStripeSupportedCurrency('GBP')).toBe(true)
  })
})

describe('normalizeCurrency', () => {
  it('uppercases and trims', () => {
    expect(normalizeCurrency('  usd ')).toBe('USD')
    expect(normalizeCurrency(null)).toBe('')
  })
})

describe('resolveAmount', () => {
  it('returns the integer to charge plus a display value', () => {
    const result = resolveAmount('25.50', 'USD', {})
    expect(result).toEqual({ ok: true, minor: 2550, major: 25.5 })
  })

  it('enforces the configured minimum in minor units', () => {
    expect(resolveAmount('4.99', 'USD', { minAmount: 5 })).toEqual({
      ok: false,
      reason: 'below-min',
      limit: 5,
    })
    expect(resolveAmount('5', 'USD', { minAmount: 5 }).ok).toBe(true)
  })

  it('enforces the configured maximum', () => {
    expect(resolveAmount('1000.01', 'USD', { maxAmount: 1000 })).toEqual({
      ok: false,
      reason: 'above-max',
      limit: 1000,
    })
    expect(resolveAmount('1000', 'USD', { maxAmount: 1000 }).ok).toBe(true)
  })

  it('treats a falsy max as no cap', () => {
    expect(resolveAmount('999999', 'USD', { maxAmount: 0 }).ok).toBe(true)
    expect(resolveAmount('999999', 'USD', { maxAmount: null }).ok).toBe(true)
  })

  it('rejects junk without producing a zero-value donation', () => {
    expect(resolveAmount('not a number', 'USD', {})).toEqual({ ok: false, reason: 'invalid' })
    expect(resolveAmount('-10', 'USD', {})).toEqual({ ok: false, reason: 'invalid' })
  })
})
