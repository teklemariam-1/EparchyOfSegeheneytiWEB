'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

/**
 * Re-renders the completion page while a card payment is still `pending`.
 *
 * The donor arrives from Stripe a moment before — or occasionally after — the
 * webhook does, so the page can legitimately show "confirming" for a few
 * seconds. This refreshes the server component a handful of times and then
 * stops: if the webhook has not landed after ~40 seconds, something needs staff
 * attention and an infinite poll would only hide that behind a spinner.
 */

const ATTEMPTS = 8
const INTERVAL_MS = 5000

export function ConfirmingPoller() {
  const router = useRouter()
  const t = useTranslations('donate')
  const [attempts, setAttempts] = useState(0)

  useEffect(() => {
    if (attempts >= ATTEMPTS) return
    const timer = setTimeout(() => {
      setAttempts((n) => n + 1)
      router.refresh()
    }, INTERVAL_MS)
    return () => clearTimeout(timer)
  }, [attempts, router])

  return (
    <button
      type="button"
      onClick={() => router.refresh()}
      className="rounded-lg border border-charcoal-200 px-4 py-2 text-sm font-medium text-charcoal-700 hover:border-maroon-300"
    >
      {t('checkAgain')}
    </button>
  )
}
