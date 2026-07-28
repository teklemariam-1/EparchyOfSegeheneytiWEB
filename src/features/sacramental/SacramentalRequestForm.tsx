'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { useTranslations } from 'next-intl'
import { FormProtection } from '@/components/shared/FormProtection'
import {
  submitSacramentalRequest,
  type SacramentalRequestState,
} from '@/app/actions/sacramentalRequest'

const initialState: SacramentalRequestState = { ok: false, message: '' }

/**
 * The values are stable English slugs, so a request submitted in Tigrinya and
 * one submitted in English are the same record to staff. Only the label is
 * translated — the same pattern the contact form's subjects use.
 */
const SACRAMENTS = [
  'baptism',
  'confirmation',
  'first-communion',
  'marriage',
  'freedom-to-marry',
  'other',
] as const

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="w-full rounded-lg bg-maroon-800 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-maroon-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
    </button>
  )
}

const inputClass =
  'w-full rounded-lg border border-charcoal-200 px-3 py-2 text-sm text-charcoal-900 placeholder-charcoal-400 focus:border-maroon-400 focus:outline-none focus:ring-2 focus:ring-maroon-200'

export function SacramentalRequestForm() {
  const t = useTranslations('sacramental')
  const tForms = useTranslations('forms')
  const [state, formAction] = useActionState(submitSacramentalRequest, initialState)

  if (state.ok) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 px-6 py-8 text-center">
        <p className="mb-1 font-serif text-lg font-semibold text-green-800">{t('successTitle')}</p>
        <p className="text-sm text-green-700">{state.message}</p>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-5" aria-label={t('title')} noValidate>
      {/* Honeypot — hidden from people, tempting to bots. */}
      <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor="sr-company">Company (leave empty)</label>
        <input id="sr-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <FormProtection />

      {state.message && !state.ok && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.messageKey ? tForms(state.messageKey) : state.message}
        </div>
      )}

      <div>
        <label htmlFor="sacrament" className="mb-1 block text-sm font-medium text-charcoal-700">
          {t('whichRecord')} <span className="text-red-500" aria-hidden>*</span>
        </label>
        <select id="sacrament" name="sacrament" required className={inputClass} defaultValue="">
          <option value="" disabled>
            {t('choosePlaceholder')}
          </option>
          {SACRAMENTS.map((value) => (
            <option key={value} value={value}>
              {t(`sacraments.${value}`)}
            </option>
          ))}
        </select>
      </div>

      {/* ── About the person the record concerns ───────────────────────────── */}
      <fieldset className="space-y-4 rounded-lg border border-charcoal-100 p-4">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-charcoal-500">
          {t('aboutPerson')}
        </legend>

        <div>
          <label htmlFor="subjectName" className="mb-1 block text-sm font-medium text-charcoal-700">
            {t('subjectName')} <span className="text-red-500" aria-hidden>*</span>
          </label>
          <input id="subjectName" name="subjectName" type="text" required maxLength={160} className={inputClass} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="parish" className="mb-1 block text-sm font-medium text-charcoal-700">
              {t('parish')}
            </label>
            <input id="parish" name="parish" type="text" maxLength={160} className={inputClass} />
          </div>
          <div>
            <label htmlFor="approximateDate" className="mb-1 block text-sm font-medium text-charcoal-700">
              {t('approximateDate')}
            </label>
            {/* Free text on purpose: "around Easter 1994" is a usable answer,
                and a date picker would force invented precision. */}
            <input
              id="approximateDate"
              name="approximateDate"
              type="text"
              maxLength={120}
              placeholder={t('approximateDatePlaceholder')}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="fatherName" className="mb-1 block text-sm font-medium text-charcoal-700">
              {t('fatherName')}
            </label>
            <input id="fatherName" name="fatherName" type="text" maxLength={160} className={inputClass} />
          </div>
          <div>
            <label htmlFor="motherName" className="mb-1 block text-sm font-medium text-charcoal-700">
              {t('motherName')}
            </label>
            <input id="motherName" name="motherName" type="text" maxLength={160} className={inputClass} />
          </div>
        </div>
        <p className="text-xs text-charcoal-500">{t('parentsHelp')}</p>
      </fieldset>

      {/* ── About the person asking ────────────────────────────────────────── */}
      <fieldset className="space-y-4 rounded-lg border border-charcoal-100 p-4">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-charcoal-500">
          {t('aboutYou')}
        </legend>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="requesterName" className="mb-1 block text-sm font-medium text-charcoal-700">
              {t('yourName')} <span className="text-red-500" aria-hidden>*</span>
            </label>
            <input id="requesterName" name="requesterName" type="text" required maxLength={160} className={inputClass} />
          </div>
          <div>
            <label htmlFor="requesterEmail" className="mb-1 block text-sm font-medium text-charcoal-700">
              {t('yourEmail')} <span className="text-red-500" aria-hidden>*</span>
            </label>
            <input
              id="requesterEmail"
              name="requesterEmail"
              type="email"
              required
              autoComplete="email"
              maxLength={254}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="requesterPhone" className="mb-1 block text-sm font-medium text-charcoal-700">
              {t('yourPhone')}
            </label>
            <input id="requesterPhone" name="requesterPhone" type="tel" maxLength={40} className={inputClass} />
          </div>
          <div>
            <label htmlFor="relationship" className="mb-1 block text-sm font-medium text-charcoal-700">
              {t('relationship')}
            </label>
            <input
              id="relationship"
              name="relationship"
              type="text"
              maxLength={120}
              placeholder={t('relationshipPlaceholder')}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="purpose" className="mb-1 block text-sm font-medium text-charcoal-700">
            {t('purpose')}
          </label>
          <textarea id="purpose" name="purpose" rows={3} maxLength={2000} className={inputClass} />
          <p className="mt-1 text-xs text-charcoal-500">{t('purposeHelp')}</p>
        </div>
      </fieldset>

      <p className="text-xs text-charcoal-500">{t('privacyNote')}</p>

      <SubmitButton label={t('submit')} pendingLabel={t('submitting')} />
    </form>
  )
}
