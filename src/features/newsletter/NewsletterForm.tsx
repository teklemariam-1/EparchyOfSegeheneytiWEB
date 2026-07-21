'use client'

import { useActionState } from 'react'
import { subscribeToNewsletter, type NewsletterState } from '@/app/actions/newsletter'

const initialState: NewsletterState = { ok: false, message: '' }

interface NewsletterFormProps {
  heading?: string
  placeholder?: string
  locale?: string
}

/**
 * Newsletter signup, shown in the footer. Submits to a server action that
 * creates a pending subscriber and emails a confirmation link (double opt-in).
 */
export function NewsletterForm({ heading, placeholder, locale = 'en' }: NewsletterFormProps) {
  const [state, formAction, pending] = useActionState(subscribeToNewsletter, initialState)

  return (
    <div>
      {heading && (
        <h3 className="text-sm font-bold text-white font-serif mb-2">{heading}</h3>
      )}
      <p className="text-xs text-charcoal-400 mb-3 leading-relaxed">
        News, events and messages from the Eparchy, straight to your inbox. Confirm via the link we
        email you; unsubscribe anytime.
      </p>

      {state.message ? (
        <p
          className={`text-xs rounded-md px-3 py-2 ${
            state.ok ? 'bg-green-900/40 text-green-200' : 'bg-maroon-900/50 text-gold-200'
          }`}
          role={state.ok ? 'status' : 'alert'}
        >
          {state.message}
        </p>
      ) : null}

      {!state.ok && (
        <form action={formAction} className="mt-2 flex flex-col gap-2">
          <input type="hidden" name="locale" value={locale} />
          {/* Honeypot — visually hidden, off-screen. */}
          <div className="absolute -left-[9999px] w-px h-px overflow-hidden" aria-hidden="true">
            <label htmlFor="nl-company">Company (leave empty)</label>
            <input id="nl-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
          </div>
          <label htmlFor="nl-email" className="sr-only">
            Email address
          </label>
          <input
            id="nl-email"
            name="email"
            type="email"
            required
            placeholder={placeholder ?? 'Your email address'}
            className="rounded-md bg-maroon-950/60 border border-maroon-800 px-3 py-2 text-sm text-white placeholder:text-charcoal-400 focus:outline-none focus:ring-2 focus:ring-gold-500"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-gold-500 px-3 py-2 text-sm font-semibold text-charcoal-900 hover:bg-gold-400 transition-colors disabled:opacity-60"
          >
            {pending ? 'Subscribing…' : 'Subscribe'}
          </button>
        </form>
      )}
    </div>
  )
}

export default NewsletterForm
