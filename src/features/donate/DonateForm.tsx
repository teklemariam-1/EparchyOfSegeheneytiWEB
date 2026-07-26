'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { useTranslations } from 'next-intl'
import { submitDonation, type DonateFormState } from '@/app/actions/donate'
import { FormProtection } from '@/components/shared/FormProtection'

const initialState: DonateFormState = { ok: false, message: '' }

export interface DonateFormConfig {
  presetAmounts: number[]
  defaultCurrency: string
  currencies: Array<{ code: string; label?: string }>
  allowCustomAmount: boolean
  allowRecurring: boolean
  minAmount?: number
  maxAmount?: number
  locale: string
}

const inputClass =
  'w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm text-charcoal-900 placeholder-charcoal-400 focus:border-maroon-400 focus:outline-none focus:ring-2 focus:ring-maroon-200 transition'

function SubmitButton() {
  const { pending } = useFormStatus()
  const t = useTranslations('donate')
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-maroon-800 px-6 py-3 text-sm font-semibold text-white hover:bg-maroon-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      aria-busy={pending}
    >
      {pending ? t('submitting') : t('donateButton')}
    </button>
  )
}

export function DonateForm({ config }: { config: DonateFormConfig }) {
  const t = useTranslations('donate')
  // Abuse-guard rejections arrive as a catalogue key so they can be shown in
  // the visitor's language.
  const tForms = useTranslations('forms')
  const [state, formAction] = useActionState(submitDonation, initialState)

  const currencyOptions =
    config.currencies.length > 0
      ? config.currencies
      : [{ code: config.defaultCurrency, label: config.defaultCurrency }]

  const [amount, setAmount] = useState<string>(
    config.presetAmounts[0] ? String(config.presetAmounts[0]) : '',
  )
  const [currency, setCurrency] = useState(config.defaultCurrency)

  if (state.ok) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 px-6 py-8 text-center">
        <svg className="mx-auto h-10 w-10 text-green-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="font-serif text-lg font-semibold text-green-800 mb-1">{t('successTitle')}</p>
        <p className="text-sm text-green-700">{state.message}</p>
        {state.receipt && (
          <p className="mt-3 text-sm text-green-800 font-medium">
            {state.receipt.amount.toLocaleString()} {state.receipt.currency}
            {state.receipt.frequency === 'monthly' ? ` · ${t('monthly')}` : ''}
          </p>
        )}
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-5" aria-label={t('title')} noValidate>
      <input type="hidden" name="locale" value={config.locale} />

      {/* Honeypot */}
      <div className="absolute -left-[9999px] w-px h-px overflow-hidden" aria-hidden="true">
        <label htmlFor="company">Company (leave empty)</label>
        <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {/* Signed render timestamp + Turnstile widget (when staff enable it). */}
      <FormProtection />

      {state.message && !state.ok && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.messageKey ? tForms(state.messageKey) : state.message}
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
              step="any"
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

      {/* Frequency */}
      {config.allowRecurring && (
        <div>
          <span className="block text-sm font-medium text-charcoal-700 mb-2">{t('frequency')}</span>
          <div className="flex gap-4">
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="radio" name="frequency" value="one-time" defaultChecked className="accent-maroon-700" />
              {t('oneTime')}
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="radio" name="frequency" value="monthly" className="accent-maroon-700" />
              {t('monthly')}
            </label>
          </div>
        </div>
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

      <SubmitButton />
    </form>
  )
}
