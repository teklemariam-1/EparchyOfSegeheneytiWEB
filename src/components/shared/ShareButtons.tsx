'use client'

import { useState } from 'react'

/**
 * Social share row for articles: Facebook, X, WhatsApp, Telegram, email,
 * copy-link and print. Uses the current page URL at click time, so it works
 * on any article without prop drilling the absolute URL.
 */
export function ShareButtons({ title }: { title: string }) {
  const [copied, setCopied] = useState(false)

  const url = () => (typeof window !== 'undefined' ? window.location.href : '')
  const enc = () => encodeURIComponent(url())
  const encTitle = encodeURIComponent(title)

  const open = (href: string) => window.open(href, '_blank', 'noopener,noreferrer,width=640,height=540')

  const buttons: Array<{ label: string; icon: string; onClick: () => void }> = [
    { label: 'Share on Facebook', icon: 'f', onClick: () => open(`https://www.facebook.com/sharer/sharer.php?u=${enc()}`) },
    { label: 'Share on X', icon: '𝕏', onClick: () => open(`https://twitter.com/intent/tweet?url=${enc()}&text=${encTitle}`) },
    { label: 'Share on WhatsApp', icon: '✆', onClick: () => open(`https://wa.me/?text=${encTitle}%20${enc()}`) },
    { label: 'Share on Telegram', icon: '➤', onClick: () => open(`https://t.me/share/url?url=${enc()}&text=${encTitle}`) },
    { label: 'Share by email', icon: '✉', onClick: () => { window.location.href = `mailto:?subject=${encTitle}&body=${enc()}` } },
    { label: 'Print', icon: '⎙', onClick: () => window.print() },
  ]

  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden" aria-label="Share this article">
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
        {copied ? 'Copied!' : 'Copy link'}
      </button>
    </div>
  )
}

export default ShareButtons
