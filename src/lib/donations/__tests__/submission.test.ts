import { describe, it, expect } from 'vitest'
import { errorMessageKey, parseDonation } from '../submission'
import { resolveDonationConfig, type RawDonationSettings } from '../settings'

const settings: RawDonationSettings = {
  enabled: true,
  provider: 'both',
  defaultCurrency: 'ERN',
  currencies: [{ code: 'ERN' }, { code: 'USD' }],
  stripeCurrencies: [{ code: 'USD' }],
  minAmount: 5,
  maxAmount: 10000,
  allowRecurring: true,
  publicTransferDetails: { accountNumber: '0123456789' },
}

const config = resolveDonationConfig(settings, true)

function form(fields: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [k, v] of Object.entries(fields)) fd.set(k, v)
  return fd
}

const valid = {
  name: 'Tesfay Ghebre',
  email: 'tesfay@example.com',
  amount: '50',
  currency: 'USD',
  frequency: 'one-time',
  locale: 'ti',
}

describe('parseDonation — happy path', () => {
  it('produces an integer minor amount and keeps the donor fields', () => {
    const result = parseDonation(form(valid), config, 'stripe')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value).toMatchObject({
      name: 'Tesfay Ghebre',
      email: 'tesfay@example.com',
      currency: 'USD',
      amountMinor: 5000,
      amount: 50,
      locale: 'ti',
      method: 'stripe',
    })
  })

  it('reads the anonymous flag from either encoding', () => {
    expect((parseDonation(form({ ...valid, anonymous: 'on' }), config, 'manual') as any).value.anonymous).toBe(true)
    expect((parseDonation(form({ ...valid, anonymous: 'true' }), config, 'manual') as any).value.anonymous).toBe(true)
    expect((parseDonation(form(valid), config, 'manual') as any).value.anonymous).toBe(false)
  })

  it('falls back to English for an unknown locale', () => {
    const result = parseDonation(form({ ...valid, locale: 'fr' }), config, 'manual')
    expect((result as any).value.locale).toBe('en')
  })
})

describe('parseDonation — the browser does not decide the price', () => {
  it('enforces the configured minimum regardless of what was posted', () => {
    const result = parseDonation(form({ ...valid, amount: '1' }), config, 'manual')
    expect(result).toEqual({ ok: false, error: { field: 'amount', code: 'below-min', limit: 5 } })
  })

  it('enforces the configured maximum', () => {
    const result = parseDonation(form({ ...valid, amount: '99999' }), config, 'manual')
    expect(result).toEqual({ ok: false, error: { field: 'amount', code: 'above-max', limit: 10000 } })
  })

  it('rejects a negative or zero amount rather than recording a null gift', () => {
    expect(parseDonation(form({ ...valid, amount: '-100' }), config, 'manual').ok).toBe(false)
    expect(parseDonation(form({ ...valid, amount: '0' }), config, 'manual').ok).toBe(false)
  })

  it('ignores any extra fields a crafted POST might add', () => {
    const result = parseDonation(
      form({ ...valid, amountMinor: '1', status: 'succeeded', provider: 'stripe', reference: 'SEG-AAAAAA' }),
      config,
      'manual',
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    // Derived from `amount` alone; the posted amountMinor is not consulted.
    expect(result.value.amountMinor).toBe(5000)
    expect(result.value).not.toHaveProperty('status')
    expect(result.value).not.toHaveProperty('reference')
  })

  it('falls back to the default currency for one that is not offered', () => {
    const result = parseDonation(form({ ...valid, currency: 'BTC' }), config, 'manual')
    expect((result as any).value.currency).toBe('ERN')
  })
})

describe('parseDonation — method rules', () => {
  it('refuses a card payment in a currency Stripe cannot charge', () => {
    const result = parseDonation(form({ ...valid, currency: 'ERN' }), config, 'stripe')
    expect(result).toEqual({ ok: false, error: { field: 'method', code: 'currency-not-supported' } })
  })

  it('allows the same gift by manual transfer', () => {
    expect(parseDonation(form({ ...valid, currency: 'ERN' }), config, 'manual').ok).toBe(true)
  })

  it('refuses a method that is not offered', () => {
    const manualOnly = resolveDonationConfig({ ...settings, provider: 'manual' }, true)
    expect(parseDonation(form(valid), manualOnly, 'stripe')).toEqual({
      ok: false,
      error: { field: 'method', code: 'unavailable' },
    })
  })

  it('refuses a monthly card gift, because Stripe Billing is not wired up', () => {
    // Taking one payment and calling it monthly would be a lie to the donor.
    const result = parseDonation(form({ ...valid, frequency: 'monthly' }), config, 'stripe')
    expect(result).toEqual({ ok: false, error: { field: 'frequency', code: 'unavailable' } })
  })

  it('allows a monthly manual pledge', () => {
    const result = parseDonation(form({ ...valid, frequency: 'monthly' }), config, 'manual')
    expect((result as any).value.frequency).toBe('monthly')
  })

  it('refuses monthly when recurring is switched off', () => {
    const noRecurring = resolveDonationConfig({ ...settings, allowRecurring: false }, true)
    expect(parseDonation(form({ ...valid, frequency: 'monthly' }), noRecurring, 'manual').ok).toBe(false)
  })
})

describe('parseDonation — donor field validation', () => {
  it('requires a name', () => {
    expect(parseDonation(form({ ...valid, name: '  ' }), config, 'manual')).toEqual({
      ok: false,
      error: { field: 'name', code: 'required' },
    })
  })

  it('requires a plausible email', () => {
    for (const email of ['', 'nope', 'a@b', 'a b@c.com']) {
      expect(parseDonation(form({ ...valid, email }), config, 'manual').ok).toBe(false)
    }
  })

  it('caps the message length', () => {
    const result = parseDonation(form({ ...valid, message: 'x'.repeat(2001) }), config, 'manual')
    expect(result).toEqual({ ok: false, error: { field: 'message', code: 'too-long' } })
  })

  it('refuses everything when donations are disabled', () => {
    const off = resolveDonationConfig({ ...settings, enabled: false }, true)
    expect(parseDonation(form(valid), off, 'manual')).toEqual({
      ok: false,
      error: { field: 'form', code: 'disabled' },
    })
  })
})

describe('errorMessageKey', () => {
  it('maps every rejection to a catalogue key', () => {
    expect(errorMessageKey({ field: 'name', code: 'required' })).toBe('nameRequired')
    expect(errorMessageKey({ field: 'amount', code: 'below-min', limit: 5 })).toBe('amountBelowMin')
    expect(errorMessageKey({ field: 'amount', code: 'above-max', limit: 5 })).toBe('amountAboveMax')
    expect(errorMessageKey({ field: 'amount', code: 'invalid' })).toBe('amountInvalid')
    expect(errorMessageKey({ field: 'method', code: 'currency-not-supported' })).toBe('cardCurrencyUnsupported')
    expect(errorMessageKey({ field: 'method', code: 'unavailable' })).toBe('methodUnavailable')
    expect(errorMessageKey({ field: 'form', code: 'disabled' })).toBe('donationsDisabled')
  })
})
