'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { useTranslations } from 'next-intl'
import { FormProtection } from '@/components/shared/FormProtection'
import { submitMassIntention, type MassIntentionState } from '@/app/actions/massIntention'

const initialState: MassIntentionState = { ok: false, message: '' }

/** Stable English slugs; only labels are translated — same pattern as every form here. */
const INTENTION_TYPES = ['repose', 'anniversary', 'healing', 'thanksgiving', 'special'] as const

/** Must be a child of the <form> — useFormStatus reads the nearest enclosing form. */
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

export function MassIntentionForm() {
  const t = useTranslations('massIntentions')
  const tForms = useTranslations('forms')
  const [state, formAction] = useActionState(submitMassIntention, initialState)

  if (state.ok) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 px-6 py-8 text-center">
        <p className="mb-1 font-serif text-lg font-semibold text-green-800">{t('successTitle')}</p>
        <p className="mb-4 text-sm text-green-700">{state.message}</p>
        {/* The customary offering, uncoupled from the request on purpose —
            see the collection's doc comment. */}
        <a href="/donate" className="text-sm font-semibold text-maroon-700 underline hover:text-maroon-900">
          {t('offeringLink')}
        </a>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-5" aria-label={t('title')} noValidate>
      <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor="mi-company">Company (leave empty)</label>
        <input id="mi-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <FormProtection />

      {state.message && !state.ok && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.messageKey ? tForms(state.messageKey) : state.message}
        </div>
      )}

      <div>
        <label htmlFor="intentionType" className="mb-1 block text-sm font-medium text-charcoal-700">
          {t('intentionType')} <span className="text-red-500" aria-hidden>*</span>
        </label>
        <select id="intentionType" name="intentionType" required className={inputClass} defaultValue="">
          <option value="" disabled>
            {t('choosePlaceholder')}
          </option>
          {INTENTION_TYPES.map((value) => (
            <option key={value} value={value}>
              {t(`types.${value}`)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="forWhom" className="mb-1 block text-sm font-medium text-charcoal-700">
          {t('forWhom')} <span className="text-red-500" aria-hidden>*</span>
        </label>
        <input
          id="forWhom"
          name="forWhom"
          type="text"
          required
          maxLength={160}
          placeholder={t('forWhomPlaceholder')}
          className={inputClass}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="mi-parish" className="mb-1 block text-sm font-medium text-charcoal-700">
            {t('parish')}
          </label>
          <input id="mi-parish" name="parish" type="text" maxLength={160} className={inputClass} />
        </div>
        <div>
          <label htmlFor="preferredDate" className="mb-1 block text-sm font-medium text-charcoal-700">
            {t('preferredDate')}
          </label>
          {/* Free text on purpose: "the Sunday nearest 12 March" and "the 40th
              day" are real answers a date picker cannot hold. */}
          <input
            id="preferredDate"
            name="preferredDate"
            type="text"
            maxLength={120}
            placeholder={t('preferredDatePlaceholder')}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="mi-details" className="mb-1 block text-sm font-medium text-charcoal-700">
          {t('details')}
        </label>
        <textarea id="mi-details" name="details" rows={3} maxLength={2000} className={inputClass} />
      </div>

      <fieldset className="space-y-4 rounded-lg border border-charcoal-100 p-4">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-charcoal-500">
          {t('aboutYou')}
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="mi-name" className="mb-1 block text-sm font-medium text-charcoal-700">
              {t('yourName')} <span className="text-red-500" aria-hidden>*</span>
            </label>
            <input id="mi-name" name="requesterName" type="text" required maxLength={160} className={inputClass} />
          </div>
          <div>
            <label htmlFor="mi-email" className="mb-1 block text-sm font-medium text-charcoal-700">
              {t('yourEmail')} <span className="text-red-500" aria-hidden>*</span>
            </label>
            <input
              id="mi-email"
              name="requesterEmail"
              type="email"
              required
              autoComplete="email"
              maxLength={254}
              className={inputClass}
            />
          </div>
        </div>
        <div className="sm:w-1/2">
          <label htmlFor="mi-phone" className="mb-1 block text-sm font-medium text-charcoal-700">
            {t('yourPhone')}
          </label>
          <input id="mi-phone" name="requesterPhone" type="tel" maxLength={40} className={inputClass} />
        </div>
      </fieldset>

      <p className="text-xs text-charcoal-500">{t('privacyNote')}</p>

      <SubmitButton label={t('submit')} pendingLabel={t('submitting')} />
    </form>
  )
}
