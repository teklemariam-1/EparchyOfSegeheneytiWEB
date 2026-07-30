'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { TEXT_SCALE_COOKIE, TEXT_SCALES, scaleKeyFor, type TextScaleKey } from '@/lib/textScale'

/**
 * The reader text-size choice on /settings.
 *
 * Writes the cookie and re-renders on the SERVER — the same pattern as the
 * news view toggle — so the layout puts the chosen size into the first byte of
 * HTML on every later visit. No client-side style mutation, no flash of the
 * wrong size, nothing new to hydrate.
 *
 * The three sample "A"s are sized literally at their scale factors: showing is
 * better than telling for the reader this exists for, who may not comfortably
 * read a small label explaining small text.
 */
const ONE_YEAR = 60 * 60 * 24 * 365

/** Font size of the sample letter on each button, in rem, at its own scale. */
const SAMPLE_REM: Record<TextScaleKey, string> = {
  normal: '1rem',
  large: '1.125rem',
  larger: '1.25rem',
}

export function TextSizeControl({ current }: { current: string | undefined }) {
  const t = useTranslations('settings')
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const activeKey = scaleKeyFor(current)

  function choose(value: string, key: TextScaleKey) {
    if (key === activeKey) return
    document.cookie = `${TEXT_SCALE_COOKIE}=${value}; path=/; max-age=${ONE_YEAR}; SameSite=Lax`
    startTransition(() => router.refresh())
  }

  return (
    <div
      role="group"
      aria-label={t('textSize')}
      className={cn('inline-flex items-center gap-1 rounded-lg border border-charcoal-200 bg-white p-1', pending && 'opacity-60')}
    >
      {TEXT_SCALES.map(({ key, value }) => {
        const active = key === activeKey
        return (
          <button
            key={key}
            type="button"
            onClick={() => choose(value, key)}
            aria-pressed={active}
            className={cn(
              'inline-flex min-w-[3.5rem] flex-col items-center rounded-md px-3 py-1.5 transition-colors',
              active ? 'bg-maroon-800 text-white' : 'text-charcoal-600 hover:bg-parchment hover:text-maroon-800',
            )}
          >
            <span aria-hidden="true" className="font-serif leading-none" style={{ fontSize: SAMPLE_REM[key] }}>
              A
            </span>
            <span className="mt-0.5 text-[10px] font-medium">{t(`textSize_${key}`)}</span>
          </button>
        )
      })}
    </div>
  )
}
