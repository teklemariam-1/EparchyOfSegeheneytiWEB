'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { useTranslations } from 'next-intl'
import { submitContactForm, type ContactFormState } from '@/app/actions/contact'
import { FormProtection } from '@/components/shared/FormProtection'

// Value stays the stable English label (so stored submissions are consistent
// across locales); only the displayed text is translated.
const SUBJECTS = [
  { value: 'General Enquiry', key: 'general' },
  { value: 'Parish Information', key: 'parish' },
  { value: 'Sacramental Request', key: 'sacrament' },
  { value: 'Vocations', key: 'vocations' },
  { value: 'Schools & Education', key: 'schools' },
  { value: 'Media & Press', key: 'media' },
  { value: 'Other', key: 'other' },
] as const

const initialState: ContactFormState = { ok: false, message: '' }

function SubmitButton() {
  const { pending } = useFormStatus()
  const t = useTranslations('contact')
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-maroon-800 px-6 py-3 text-sm font-semibold text-white hover:bg-maroon-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      aria-busy={pending}
    >
      {pending ? t('sending') : t('send')}
    </button>
  )
}

/**
 * `privacyNotice` is passed in from the server page rather than read here,
 * because this is a client component and the message catalogues are resolved
 * server-side. It must be shown before submission, not after: people are
 * entitled to know their question may be published before they write it.
 */
export function ContactForm({ privacyNotice }: { privacyNotice?: string }) {
  const t = useTranslations('contact')
  // Rejections from the shared abuse guard come back as a catalogue key so they
  // can be shown in the visitor's language; everything else is already-composed
  // text from the action.
  const tForms = useTranslations('forms')
  const [state, formAction] = useActionState(submitContactForm, initialState)
  const errorText = state.messageKey ? tForms(state.messageKey) : state.message

  if (state.ok) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 px-6 py-8 text-center">
        <svg className="mx-auto h-10 w-10 text-green-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="font-serif text-lg font-semibold text-green-800 mb-1">{t('successTitle')}</p>
        <p className="text-sm text-green-700">{state.message}</p>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-5" aria-label={t('title')} noValidate>
      {/* Honeypot — hidden from humans, tempting to bots. Real users leave it empty. */}
      <div className="absolute -left-[9999px] w-px h-px overflow-hidden" aria-hidden="true">
        <label htmlFor="company">Company (leave this field empty)</label>
        <input
          id="company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {/* Signed render timestamp + Turnstile widget (when staff enable it). */}
      <FormProtection />

      {/* Error banner */}
      {state.message && !state.ok && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {errorText}
        </div>
      )}

      {/* Name row */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-charcoal-700 mb-1">
            {t('firstName')} <span className="text-red-500" aria-hidden>*</span>
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            autoComplete="given-name"
            required
            maxLength={60}
            className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm text-charcoal-900 placeholder-charcoal-400 focus:border-maroon-400 focus:outline-none focus:ring-2 focus:ring-maroon-200 transition"
            placeholder={t('firstNamePlaceholder')}
          />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-charcoal-700 mb-1">
            {t('lastName')} <span className="text-red-500" aria-hidden>*</span>
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            autoComplete="family-name"
            required
            maxLength={60}
            className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm text-charcoal-900 placeholder-charcoal-400 focus:border-maroon-400 focus:outline-none focus:ring-2 focus:ring-maroon-200 transition"
            placeholder={t('lastNamePlaceholder')}
          />
        </div>
      </div>

      {/* Email & phone */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-charcoal-700 mb-1">
            {t('email')} <span className="text-red-500" aria-hidden>*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm text-charcoal-900 placeholder-charcoal-400 focus:border-maroon-400 focus:outline-none focus:ring-2 focus:ring-maroon-200 transition"
            placeholder={t('emailPlaceholder')}
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-charcoal-700 mb-1">
            {t('phone')}
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            maxLength={30}
            className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm text-charcoal-900 placeholder-charcoal-400 focus:border-maroon-400 focus:outline-none focus:ring-2 focus:ring-maroon-200 transition"
            placeholder={t('phonePlaceholder')}
          />
        </div>
      </div>

      {/* Subject */}
      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-charcoal-700 mb-1">
          {t('subject')} <span className="text-red-500" aria-hidden>*</span>
        </label>
        <select
          id="subject"
          name="subject"
          required
          className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm text-charcoal-900 focus:border-maroon-400 focus:outline-none focus:ring-2 focus:ring-maroon-200 transition"
        >
          <option value="">{t('selectSubject')}</option>
          {SUBJECTS.map((s) => (
            <option key={s.key} value={s.value}>{t(`subjects.${s.key}`)}</option>
          ))}
        </select>
      </div>

      {/* Message */}
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-charcoal-700 mb-1">
          {t('message')} <span className="text-red-500" aria-hidden>*</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={6}
          required
          maxLength={4000}
          className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2.5 text-sm text-charcoal-900 placeholder-charcoal-400 focus:border-maroon-400 focus:outline-none focus:ring-2 focus:ring-maroon-200 transition resize-none"
          placeholder={t('messagePlaceholder')}
        />
      </div>

      {privacyNotice && (
        <p className="text-xs text-charcoal-500 leading-relaxed">{privacyNotice}</p>
      )}

      <SubmitButton />

      <p className="text-xs text-charcoal-400 text-center">
        {t('responseNotice')}
      </p>
    </form>
  )
}
