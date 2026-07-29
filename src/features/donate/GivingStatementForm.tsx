'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { useTranslations } from 'next-intl'
import { FormProtection } from '@/components/shared/FormProtection'
import {
  requestGivingStatement,
  type GivingStatementState,
} from '@/app/actions/givingStatement'

const initialState: GivingStatementState = { ok: false, message: '' }

/**
 * "Email me my annual statement." Kept deliberately small — email, year, send.
 * The statement goes to the donor's own inbox, never onto the page, so nothing
 * about anyone's giving is ever displayed here.
 */
/**
 * Must be a child of the <form>: useFormStatus reads the status of the nearest
 * enclosing form, and reports permanently-idle when called beside it instead.
 */
function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="rounded-lg bg-maroon-800 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-maroon-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
    </button>
  )
}

export function GivingStatementForm() {
  const t = useTranslations('donate')
  const tForms = useTranslations('forms')
  const [state, formAction] = useActionState(requestGivingStatement, initialState)

  // Completed years plus the running one, newest first. 2020 predates the
  // system; nothing exists to send before it.
  const thisYear = new Date().getUTCFullYear()
  const years = Array.from({ length: thisYear - 2020 + 1 }, (_, i) => thisYear - i)

  if (state.ok && state.message) {
    return (
      <div role="status" className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
        {t('statementSent')}
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-3" aria-label={t('statementTitle')} noValidate>
      <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor="gs-company">Company (leave empty)</label>
        <input id="gs-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <FormProtection />

      {state.message && !state.ok && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.messageKey ? tForms(state.messageKey) : state.message}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label htmlFor="gs-email" className="mb-1 block text-sm font-medium text-charcoal-700">
            {t('statementEmail')}
          </label>
          <input
            id="gs-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            maxLength={254}
            className="w-full rounded-lg border border-charcoal-200 px-3 py-2 text-sm focus:border-maroon-400 focus:outline-none focus:ring-2 focus:ring-maroon-200"
          />
        </div>
        <div>
          <label htmlFor="gs-year" className="mb-1 block text-sm font-medium text-charcoal-700">
            {t('statementYear')}
          </label>
          <select
            id="gs-year"
            name="year"
            defaultValue={String(thisYear - 1 >= 2020 ? thisYear - 1 : thisYear)}
            className="rounded-lg border border-charcoal-200 px-3 py-2 text-sm focus:border-maroon-400 focus:outline-none focus:ring-2 focus:ring-maroon-200"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      <SubmitButton label={t('statementRequest')} pendingLabel={t('statementSending')} />

      <p className="text-xs text-charcoal-500">{t('statementPrivacy')}</p>
    </form>
  )
}
