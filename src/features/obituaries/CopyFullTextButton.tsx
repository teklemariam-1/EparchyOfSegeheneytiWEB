'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

/**
 * «ምሉእ ጽሑፍ ቅዳሕ» — copies the composer's full plain-text document, so the
 * chancery (and mourners) can paste the whole ታሪኽ ሕይወት into WhatsApp or a
 * printed program. The text is composed on the server and passed down; this
 * island only touches the clipboard.
 */
export function CopyFullTextButton({ text }: { text: string }) {
  const t = useTranslations('obituaries')
  const [copied, setCopied] = useState(false)

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        } catch {
          // Clipboard unavailable (http, old browser) — leave the button as-is.
        }
      }}
      className="flex h-9 items-center gap-1.5 rounded-full border border-charcoal-200 px-3 text-xs font-medium text-charcoal-500 transition-colors hover:border-maroon-400 hover:bg-maroon-50 hover:text-maroon-800 print:hidden"
    >
      <span aria-hidden="true">⧉</span>
      {copied ? t('copied') : t('copyFullText')}
    </button>
  )
}
