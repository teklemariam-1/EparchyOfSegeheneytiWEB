'use client'

import { useMemo, useState } from 'react'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { useTranslations } from 'next-intl'
import { submitDonation, type DonateFormState } from '@/app/actions/donate'
import { FormProtection } from '@/components/shared/FormProtection'
import { TransferInstructions, type TransferDetailsView } from './TransferInstructions'
import { formatAmount } from '@/lib/donations/amounts'

const initialState: DonateFormState = { ok: false, message: '' }

export interface DonateFormConfig {
  presetAmounts: number[]
  defaultCurrency: string
  /** `card` marks the currencies Stripe can actually charge in. */
  currencies: Array<{ code: string; label?: string; card: boolean }>
  allowCustomAmount: boolean
  allowRecurring: boolean
  minAmount?: number
  maxAmount?: number
  locale: string
  /** Methods available, already ordered for this visitor by the page. */
  methods: Array<'manual' | 'stripe'>
  transferDetails: TransferDetailsView
  /** Which entity receives card gifts, when that is not the Eparchy itself. */
  stripeAccountNotice?: string
  /** True when the server is running against Stripe test keys. */
  stripeTestMode?: boolean
}

const inputClass =
  'w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm text-charcoal-900 placeholder-charcoal-400 focus:border-maroon-400 focus:outline-none focus:ring-2 focus:ring-maroon-200 transition'

function SubmitButton({ method }: { method: 'manual' | 'stripe' }) {
  const { pending } = useFormStatus()
  const t = useTranslations('donate')
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-maroon-800 px-6 py-3 text-sm font-semibold text-white hover:bg-maroon-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      aria-busy={pending}
    >
      {pending
        ? method === 'stripe'
          ? t('redirecting')
          : t('submitting')
        : method === 'stripe'
          ? t('continueToCard')
          : t('donateButton')}
    </button>
  )
}

export function DonateForm({ config }: { config: DonateFormConfig }) {
  const t = useTranslations('donate')
  // Abuse-guard rejections arrive as a catalogue key so they can be shown in
  // the visitor's language.
  const tForms = useTranslations('forms')
  const tErrors = useTranslations('donate.errors')
  const [state, formAction] = useActionState(submitDonation, initialState)

  const currencyOptions =
    config.currencies.length > 0
      ? config.currencies
      : [{ code: config.defaultCurrency, label: config.defaultCurrency, card: false }]

  const [amount, setAmount] = useState<string>(
    config.presetAmounts[0] ? String(config.presetAmounts[0]) : '',
  )
  const [currency, setCurrency] = useState(config.defaultCurrency)
  // The page orders `methods` for this visitor — the first entry is the
  // default, which for in-country visitors is manual transfer.
  const [method, setMethod] = useState<'manual' | 'stripe'>(config.methods[0] ?? 'manual')
  const [frequency, setFrequency] = useState<'one-time' | 'monthly'>('one-time')

  const cardCurrencies = useMemo(
    () => currencyOptions.filter((c) => c.card).map((c) => c.code),
    [currencyOptions],
  )
  const cardAvailableHere = cardCurrencies.includes(currency)
  // Cards cannot be charged in ERN, and recurring giving is manual-only until
  // Stripe Billing is switched on. Rather than letting the donor fill in the
  // whole form and be rejected, the card option is disabled with the reason.
  const cardDisabledReason = !cardAvailableHere
    ? t('cardNotForCurrency', { currency, currencies: cardCurrencies.join(', ') || '—' })
    : frequency === 'monthly'
      ? tErrors('recurringUnavailable')
      : null

  // Keep the selection legal when the donor changes currency or frequency.
  const effectiveMethod: 'manual' | 'stripe' =
    method === 'stripe' && cardDisabledReason ? 'manual' : method

  // ── Manual pledge recorded: show what to actually do next ──────────────────
  if (state.ok && state.pledge) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-6 py-5">
          <p className="font-serif text-lg font-semibold text-amber-900 mb-1">{t('pledgeTitle')}</p>
          <p className="text-sm text-amber-900/90">
            {t('pledgeIntro', {
              amount: formatAmount(state.pledge.amountMinor, state.pledge.currency, config.locale),
            })}
          </p>
        </div>

        <TransferInstructions
          reference={state.pledge.reference}
          amountMinor={state.pledge.amountMinor}
          currency={state.pledge.currency}
          details={config.transferDetails}
          locale={config.locale}
          emailed
        />

        <div className="flex flex-wrap gap-3 print:hidden">
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-lg border border-charcoal-200 px-4 py-2 text-sm font-medium text-charcoal-700 hover:border-maroon-300"
          >
            {t('printPage')}
          </button>
        </div>
      </div>
    )
  }

  // The honeypot and the silent abuse guard return ok with no pledge — keep the
  // old neutral confirmation so a bot learns nothing from the difference.
  if (state.ok && !state.pledge) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 px-6 py-8 text-center">
        <p className="font-serif text-lg font-semibold text-green-800 mb-1">{t('successTitle')}</p>
        <p className="text-sm text-green-700">{state.message || t('successMessage')}</p>
      </div>
    )
  }

  const errorText = state.errorKey
    ? tErrors(state.errorKey as never, state.errorValue != null ? { value: state.errorValue } : undefined)
    : state.messageKey
      ? tForms(state.messageKey)
      : state.message

  return (
    <form action={formAction} className="space-y-6" aria-label={t('title')} noValidate>
      <input type="hidden" name="locale" value={config.locale} />
      {/* The server re-validates this against settings — it is a request, not a
          decision. */}
      <input type="hidden" name="method" value={effectiveMethod} />

      {/* Honeypot */}
      <div className="absolute -left-[9999px] w-px h-px overflow-hidden" aria-hidden="true">
        <label htmlFor="company">Company (leave empty)</label>
        <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {/* Signed render timestamp + Turnstile widget (when staff enable it). */}
      <FormProtection />

      {errorText && !state.ok && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {errorText}
        </div>
      )}

      {/* Amount */}
      <fieldset>
        <legend className="block text-sm font-medium text-charcoal-700 mb-2">
          {t('amount')} <span className="text-red-500" aria-hidden>*</span>
        </legend>
        {config.presetAmounts.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {config.presetAmounts.map((preset) => {
              const active = amount === String(preset)
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(String(preset))}
                  className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                    active
                      ? 'border-maroon-600 bg-maroon-50 text-maroon-800'
                      : 'border-charcoal-200 bg-white text-charcoal-700 hover:border-maroon-300'
                  }`}
                  aria-pressed={active}
                >
                  {preset.toLocaleString()}
                </button>
              )
            })}
          </div>
        )}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="amount" className="sr-only">
              {config.allowCustomAmount ? t('customAmount') : t('amount')}
            </label>
            <input
              id="amount"
              name="amount"
              type="number"
              inputMode="decimal"
              min={config.minAmount ?? 1}
              max={config.maxAmount || undefined}
              // Two decimal places, not `any`: a gift is money, not a
              // measurement. The server rounds to the currency's minor unit
              // regardless, but the control should not invite 12.00499.
              step="0.01"
              required
              readOnly={!config.allowCustomAmount}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={inputClass}
              placeholder={t('customAmount')}
            />
          </div>
          <div>
            <label htmlFor="currency" className="sr-only">
              {t('currency')}
            </label>
            <select
              id="currency"
              name="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className={inputClass}
            >
              {currencyOptions.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label ? `${c.code} — ${c.label}` : c.code}
                </option>
              ))}
            </select>
          </div>
        </div>
      </fieldset>

      {/* Frequency — manual only until Stripe Billing is enabled. */}
      {config.allowRecurring && (
        <div>
          <span className="block text-sm font-medium text-charcoal-700 mb-2">{t('frequency')}</span>
          <div className="flex gap-4">
            {(['one-time', 'monthly'] as const).map((value) => (
              <label key={value} className="inline-flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="frequency"
                  value={value}
                  checked={frequency === value}
                  onChange={() => setFrequency(value)}
                  className="accent-maroon-700"
                />
                {value === 'monthly' ? t('monthly') : t('oneTime')}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Payment method — both offered side by side, ordered by the page. */}
      {config.methods.length > 1 && (
        <fieldset>
          <legend className="block text-sm font-medium text-charcoal-700 mb-2">{t('methodTitle')}</legend>
          <div className="grid sm:grid-cols-2 gap-3">
            {config.methods.map((option) => {
              const disabled = option === 'stripe' && Boolean(cardDisabledReason)
              const active = effectiveMethod === option
              return (
                <label
                  key={option}
                  className={`flex flex-col gap-1 rounded-lg border px-4 py-3 transition ${
                    active ? 'border-maroon-600 bg-maroon-50' : 'border-charcoal-200 bg-white hover:border-maroon-300'
                  } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                >
                  <span className="flex items-center gap-2 text-sm font-semibold text-charcoal-900">
                    <input
                      type="radio"
                      name="methodChoice"
                      value={option}
                      checked={active}
                      disabled={disabled}
                      onChange={() => setMethod(option)}
                      className="accent-maroon-700"
                    />
                    {option === 'stripe' ? t('methodCard') : t('methodManual')}
                  </span>
                  <span className="text-xs leading-relaxed text-charcoal-600">
                    {option === 'stripe' ? t('methodCardHint') : t('methodManualHint')}
                  </span>
                  {disabled && <span className="text-xs text-amber-800">{cardDisabledReason}</span>}
                </label>
              )
            })}
          </div>
          {effectiveMethod === 'stripe' && (
            <>
              <p className="mt-2 text-xs text-charcoal-500">{t('cardSecurityNote')}</p>
              {config.stripeAccountNotice && (
                <p className="mt-2 whitespace-pre-line text-xs text-charcoal-600">{config.stripeAccountNotice}</p>
              )}
              {config.stripeTestMode && (
                <p className="mt-2 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  {t('testModeNotice')}
                </p>
              )}
            </>
          )}
        </fieldset>
      )}

      {/* Donor details */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-charcoal-700 mb-1">
            {t('name')} <span className="text-red-500" aria-hidden>*</span>
          </label>
          <input id="name" name="name" type="text" autoComplete="name" required maxLength={120} className={inputClass} />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-charcoal-700 mb-1">
            {t('email')} <span className="text-red-500" aria-hidden>*</span>
          </label>
          <input id="email" name="email" type="email" autoComplete="email" required maxLength={254} className={inputClass} />
        </div>
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-charcoal-700 mb-1">
          {t('message')}
        </label>
        <textarea id="message" name="message" rows={3} maxLength={2000} className={`${inputClass} resize-none`} />
      </div>

      <label className="inline-flex items-start gap-2 text-sm text-charcoal-700">
        <input type="checkbox" name="anonymous" value="on" className="mt-0.5 accent-maroon-700" />
        <span>
          {t('anonymous')}
          <span className="block text-xs text-charcoal-500">{t('anonymousHint')}</span>
        </span>
      </label>

      <SubmitButton method={effectiveMethod} />
    </form>
  )
}
