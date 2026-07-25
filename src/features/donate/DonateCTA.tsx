import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { getDonationSettings } from '@/lib/payload/queries'

/**
 * Reusable "Donate" call-to-action. Renders nothing when donations are disabled,
 * so it can be dropped into the header, footer, or any section unconditionally.
 */
export async function DonateCTA({
  locale = 'en',
  variant = 'button',
  className = '',
}: {
  locale?: string
  variant?: 'button' | 'link'
  className?: string
}) {
  const [settings, t] = await Promise.all([getDonationSettings(locale), getTranslations('donate')])
  if (settings.enabled !== true) return null

  if (variant === 'link') {
    return (
      <Link href="/donate" className={`font-medium text-maroon-700 hover:underline ${className}`}>
        {t('donateButton')}
      </Link>
    )
  }

  return (
    <Link
      href="/donate"
      className={`inline-flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-charcoal-900 hover:bg-gold-400 transition-colors ${className}`}
    >
      <span aria-hidden="true">♥</span>
      {t('donateButton')}
    </Link>
  )
}
