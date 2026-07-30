'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

/**
 * Social share row for articles and events: Facebook, X, WhatsApp, Telegram,
 * email, copy-link and print. Uses the current page URL at click time, so it
 * works on any page without prop drilling the absolute URL.
 *
 * Labels come from the `common` catalogue: this renders on Tigrinya pages, and
 * the hardcoded English aria-labels were the one part of the row a
 * screen-reader user in Tigrinya would hit.
 */
export function ShareButtons({ title }: { title: string }) {
  const t = useTranslations('common')
  const [copied, setCopied] = useState(false)

  const url = () => (typeof window !== 'undefined' ? window.location.href : '')
  const enc = () => encodeURIComponent(url())
  const encTitle = encodeURIComponent(title)

  const open = (href: string) => window.open(href, '_blank', 'noopener,noreferrer,width=640,height=540')

  const buttons: Array<{ label: string; icon: string; onClick: () => void }> = [
    { label: t('shareFacebook'), icon: 'f', onClick: () => open(`https://www.facebook.com/sharer/sharer.php?u=${enc()}`) },
    { label: t('shareX'), icon: '𝕏', onClick: () => open(`https://twitter.com/intent/tweet?url=${enc()}&text=${encTitle}`) },
    { label: t('shareWhatsApp'), icon: '✆', onClick: () => open(`https://wa.me/?text=${encTitle}%20${enc()}`) },
    { label: t('shareTelegram'), icon: '➤', onClick: () => open(`https://t.me/share/url?url=${enc()}&text=${encTitle}`) },
    { label: t('shareEmail'), icon: '✉', onClick: () => { window.location.href = `mailto:?subject=${encTitle}&body=${enc()}` } },
    { label: t('sharePrint'), icon: '⎙', onClick: () => window.print() },
  ]

  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden" aria-label={t('shareThisPage')}>
      {buttons.map((b) => (
        <button
          key={b.label}
          type="button"
          onClick={b.onClick}
          aria-label={b.label}
          title={b.label}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-charcoal-200 text-sm text-charcoal-500 transition-colors hover:border-maroon-400 hover:bg-maroon-50 hover:text-maroon-800"
        >
          <span aria-hidden="true">{b.icon}</span>
        </button>
      ))}
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url())
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          } catch {
            // Clipboard unavailable — leave the button as-is.
          }
        }}
        className="flex h-9 items-center gap-1.5 rounded-full border border-charcoal-200 px-3 text-xs font-medium text-charcoal-500 transition-colors hover:border-maroon-400 hover:bg-maroon-50 hover:text-maroon-800"
      >
        <span aria-hidden="true">🔗</span>
        {copied ? t('shareCopied') : t('shareCopyLink')}
      </button>
    </div>
  )
}

export default ShareButtons
