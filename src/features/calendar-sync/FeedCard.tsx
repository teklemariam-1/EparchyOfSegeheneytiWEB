'use client'

import { useState } from 'react'
import {
  webcalUrl,
  googleSubscribeUrl,
  outlookSubscribeUrl,
} from '@/lib/calendar-sync/providers'

export interface FeedCardLabels {
  copyUrl: string
  copied: string
  google: string
  apple: string
  outlook: string
  download: string
  allParishes: string
}

/**
 * One subscribable calendar on the Subscription Center page: description,
 * copyable feed URL and provider deep links. The events feed additionally
 * offers a parish filter that rewrites the URL client-side.
 */
export function FeedCard({
  title,
  description,
  baseUrl,
  parishes,
  labels,
}: {
  title: string
  description: string
  /** Absolute feed URL without filters. */
  baseUrl: string
  /** When set, show a parish picker feeding ?parish=<slug>. */
  parishes?: Array<{ slug: string; title: string }>
  labels: FeedCardLabels
}) {
  const [copied, setCopied] = useState(false)
  const [parish, setParish] = useState('')

  const url = parish ? `${baseUrl}?parish=${encodeURIComponent(parish)}` : baseUrl

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard unavailable — the URL stays selectable in the input.
    }
  }

  const pill =
    'inline-flex items-center gap-1.5 rounded-full border border-charcoal-200 px-3 py-1.5 text-xs font-medium text-charcoal-600 transition-colors hover:border-maroon-400 hover:bg-maroon-50 hover:text-maroon-800 dark:text-charcoal-200 dark:border-charcoal-600'

  return (
    <div className="card p-5 flex flex-col gap-3">
      <div>
        <h3 className="font-serif font-semibold text-charcoal-900 dark:text-white">{title}</h3>
        <p className="mt-1 text-sm text-charcoal-500 leading-relaxed dark:text-charcoal-300">
          {description}
        </p>
      </div>

      {parishes && parishes.length > 0 && (
        <select
          value={parish}
          onChange={(e) => setParish(e.target.value)}
          aria-label={labels.allParishes}
          className="w-full rounded-lg border border-charcoal-200 bg-white px-3 py-2 text-sm text-charcoal-700 dark:bg-charcoal-800 dark:text-charcoal-100 dark:border-charcoal-600"
        >
          <option value="">{labels.allParishes}</option>
          {parishes.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.title}
            </option>
          ))}
        </select>
      )}

      <div className="flex items-stretch gap-2">
        <input
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          aria-label={title}
          className="min-w-0 flex-1 rounded-lg border border-charcoal-200 bg-parchment-50 px-3 py-2 text-xs text-charcoal-600 dark:bg-charcoal-800 dark:text-charcoal-200 dark:border-charcoal-600"
        />
        <button type="button" onClick={copy} className={pill}>
          <span aria-hidden="true">🔗</span> {copied ? labels.copied : labels.copyUrl}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <a href={googleSubscribeUrl(url)} target="_blank" rel="noopener noreferrer" className={pill}>
          <span aria-hidden="true">📅</span> {labels.google}
        </a>
        <a href={webcalUrl(url)} className={pill}>
          <span aria-hidden="true"></span> {labels.apple}
        </a>
        <a
          href={outlookSubscribeUrl(url, title)}
          target="_blank"
          rel="noopener noreferrer"
          className={pill}
        >
          <span aria-hidden="true">📧</span> {labels.outlook}
        </a>
        {/* Direct .ics download — importable into Samsung Calendar and other
            phone calendars as offline device events (no account needed). */}
        <a href={url} download className={pill}>
          <span aria-hidden="true">⬇</span> {labels.download}
        </a>
      </div>
    </div>
  )
}
