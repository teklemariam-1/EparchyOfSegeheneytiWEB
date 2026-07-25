'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export type AnnouncementStyle = 'info' | 'warning' | 'urgent'

const ANNOUNCEMENT_STYLES: Record<AnnouncementStyle, string> = {
  info: 'bg-maroon-800 text-white',
  warning: 'bg-gold-500 text-charcoal-900',
  urgent: 'bg-red-700 text-white',
}

/** Stable, non-crypto hash so the dismissed key changes whenever the message or
 *  link changes — editing the banner in admin re-shows it to everyone. */
function hashKey(input: string): string {
  let h = 0
  for (let i = 0; i < input.length; i += 1) {
    h = (h << 5) - h + input.charCodeAt(i)
    h |= 0
  }
  return `announcement-dismissed:${(h >>> 0).toString(36)}`
}

interface AnnouncementBannerProps {
  message: string
  link?: string
  style?: AnnouncementStyle
  /** Localized "Learn more" label + close button aria-label. */
  learnMoreLabel: string
  dismissLabel: string
}

export function AnnouncementBanner({
  message,
  link,
  style = 'info',
  learnMoreLabel,
  dismissLabel,
}: AnnouncementBannerProps) {
  const storageKey = hashKey(`${message}|${link ?? ''}`)
  // Start hidden to avoid a flash before we've checked localStorage on the client.
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      setVisible(window.localStorage.getItem(storageKey) !== '1')
    } catch {
      setVisible(true)
    }
  }, [storageKey])

  if (!visible) return null

  const dismiss = () => {
    try {
      window.localStorage.setItem(storageKey, '1')
    } catch {
      /* ignore private-mode / disabled storage */
    }
    setVisible(false)
  }

  const isExternal = !!link && /^https?:\/\//i.test(link)

  return (
    <div
      className={`${ANNOUNCEMENT_STYLES[style]} px-4 py-2 text-center text-xs sm:text-sm font-medium`}
      role="alert"
    >
      <div className="mx-auto max-w-7xl flex items-center justify-center gap-3 pr-6 relative">
        <span>{message}</span>
        {link &&
          (isExternal ? (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 font-semibold hover:opacity-80 transition-opacity whitespace-nowrap"
            >
              {learnMoreLabel} →
            </a>
          ) : (
            <Link
              href={link}
              className="underline underline-offset-2 font-semibold hover:opacity-80 transition-opacity whitespace-nowrap"
            >
              {learnMoreLabel} →
            </Link>
          ))}
        <button
          type="button"
          onClick={dismiss}
          aria-label={dismissLabel}
          className="absolute right-0 top-1/2 -translate-y-1/2 inline-flex h-6 w-6 items-center justify-center rounded hover:bg-black/10 transition-colors"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
