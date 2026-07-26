import { describe, it, expect } from 'vitest'
import { canPayByCard, resolveDonationConfig, type RawDonationSettings } from '../settings'

const base: RawDonationSettings = {
  enabled: true,
  provider: 'both',
  defaultCurrency: 'ERN',
  currencies: [{ code: 'ERN' }, { code: 'USD' }, { code: 'EUR' }],
  stripeCurrencies: [{ code: 'USD' }, { code: 'EUR' }],
  presetAmounts: [{ amount: 100 }, { amount: 500 }],
  publicTransferDetails: { accountHolder: 'Eparchy of Segeneyti', accountNumber: '0123456789' },
}

describe('resolveDonationConfig — payment methods', () => {
  it('offers both methods when configured and Stripe is keyed', () => {
    expect(resolveDonationConfig(base, true).methods).toEqual(['manual', 'stripe'])
  })

  it('lists manual first, because it is the method that works for everyone', () => {
    expect(resolveDonationConfig(base, true).methods[0]).toBe('manual')
  })

  it('drops the card option when the server has no Stripe key', () => {
    // A deploy without STRIPE_SECRET_KEY must not send donors to a checkout
    // that cannot be created.
    expect(resolveDonationConfig(base, false).methods).toEqual(['manual'])
  })

  it('falls back to manual rather than leaving no way to give', () => {
    const cardOnly = { ...base, provider: 'stripe' }
    expect(resolveDonationConfig(cardOnly, false).methods).toEqual(['manual'])
  })

  it('honours a manual-only setting', () => {
    expect(resolveDonationConfig({ ...base, provider: 'manual' }, true).methods).toEqual(['manual'])
  })
})

describe('resolveDonationConfig — currencies', () => {
  it('marks only the Stripe-chargeable currencies as card-capable', () => {
    const config = resolveDonationConfig(base, true)
    const byCode = Object.fromEntries(config.currencies.map((c) => [c.code, c.card]))
    expect(byCode).toEqual({ ERN: false, USD: true, EUR: true })
  })

  it('never marks ERN card-capable even if staff list it under Stripe', () => {
    // Stripe cannot charge in Nakfa at all; an ERN entry in the card list is a
    // configuration mistake and is dropped rather than offered.
    const config = resolveDonationConfig(
      { ...base, stripeCurrencies: [{ code: 'ERN' }, { code: 'USD' }] },
      true,
    )
    expect(config.currencies.find((c) => c.code === 'ERN')?.card).toBe(false)
    expect(config.currencies.find((c) => c.code === 'USD')?.card).toBe(true)
  })

  it('falls back to USD when no card currency is configured', () => {
    const config = resolveDonationConfig({ ...base, stripeCurrencies: [] }, true)
    expect(config.currencies.find((c) => c.code === 'USD')?.card).toBe(true)
  })

  it('always offers the default currency even when staff forgot to list it', () => {
    const config = resolveDonationConfig({ ...base, currencies: [{ code: 'USD' }] }, true)
    expect(config.currencies.map((c) => c.code)).toContain('ERN')
  })

  it('adds a card currency staff left out of the main list', () => {
    const config = resolveDonationConfig(
      { ...base, currencies: [{ code: 'ERN' }], stripeCurrencies: [{ code: 'GBP' }] },
      true,
    )
    expect(config.currencies.find((c) => c.code === 'GBP')?.card).toBe(true)
  })

  it('de-duplicates and normalises codes', () => {
    const config = resolveDonationConfig(
      { ...base, currencies: [{ code: 'usd' }, { code: 'USD' }, { code: ' ' }] },
      true,
    )
    expect(config.currencies.filter((c) => c.code === 'USD')).toHaveLength(1)
  })
})

describe('canPayByCard', () => {
  it('is true only for a card-capable currency with the method available', () => {
    const config = resolveDonationConfig(base, true)
    expect(canPayByCard(config, 'USD')).toBe(true)
    expect(canPayByCard(config, 'usd')).toBe(true)
    expect(canPayByCard(config, 'ERN')).toBe(false)
    expect(canPayByCard(config, 'JPY')).toBe(false)
  })

  it('is false for every currency when cards are off', () => {
    const config = resolveDonationConfig(base, false)
    expect(canPayByCard(config, 'USD')).toBe(false)
  })
})

describe('resolveDonationConfig — manual transfer readiness', () => {
  it('reports details as publishable when an account number exists', () => {
    expect(resolveDonationConfig(base, true).hasTransferDetails).toBe(true)
  })

  it('reports them missing when staff have published nothing', () => {
    // This is the case the old flow handled silently: a donor submitted, and
    // was shown an empty panel with no way to pay.
    const config = resolveDonationConfig({ ...base, publicTransferDetails: {} }, true)
    expect(config.hasTransferDetails).toBe(false)
  })

  it('accepts free-text instructions alone as sufficient', () => {
    const config = resolveDonationConfig(
      { ...base, publicTransferDetails: {}, manualInstructions: 'Pay at the chancery office.' },
      true,
    )
    expect(config.hasTransferDetails).toBe(true)
  })

  it('treats whitespace-only fields as empty', () => {
    const config = resolveDonationConfig(
      { ...base, publicTransferDetails: { accountNumber: '   ' }, manualInstructions: '  ' },
      true,
    )
    expect(config.hasTransferDetails).toBe(false)
  })
})

describe('resolveDonationConfig — miscellaneous', () => {
  it('defaults the manual-first country list to Eritrea', () => {
    expect(resolveDonationConfig(base, true).preferManualCountries).toEqual(['ER'])
  })

  it('parses a configured country list', () => {
    const config = resolveDonationConfig({ ...base, preferManualForCountries: 'er, et ,sd' }, true)
    expect(config.preferManualCountries).toEqual(['ER', 'ET', 'SD'])
  })

  it('drops non-positive preset amounts', () => {
    const config = resolveDonationConfig(
      { ...base, presetAmounts: [{ amount: 100 }, { amount: 0 }, { amount: null }] },
      true,
    )
    expect(config.presetAmounts).toEqual([100])
  })

  it('reports disabled when the master switch is off', () => {
    expect(resolveDonationConfig({ ...base, enabled: false }, true).enabled).toBe(false)
    expect(resolveDonationConfig(null, true).enabled).toBe(false)
  })
})
