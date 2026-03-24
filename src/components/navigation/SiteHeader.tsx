import Link from 'next/link'
import Image from 'next/image'
import { getLocale } from 'next-intl/server'
import { MainNav } from './MainNav'
import { MobileMenu } from './MobileMenu'
import { LanguageSwitcher } from './LanguageSwitcher'
import { getHeaderGlobal, getSiteSettings } from '@/lib/payload/queries'

const ANNOUNCEMENT_STYLES = {
  info: 'bg-maroon-800 text-white',
  warning: 'bg-gold-500 text-charcoal-900',
  success: 'bg-green-700 text-white',
} as const

export async function SiteHeader() {
  const [header, settings, locale] = await Promise.all([
    getHeaderGlobal(),
    getSiteSettings(),
    getLocale(),
  ])

  const logoLight = settings.logoLight?.url
  const announcement = header.announcement

  return (
    <header className="sticky top-0 z-50 bg-white shadow-nav border-b border-charcoal-100">
      {/* CMS-driven announcement bar */}
      {announcement?.enabled && announcement.message && (
        <div
          className={`${ANNOUNCEMENT_STYLES[announcement.style ?? 'info']} px-4 py-2 text-center text-xs sm:text-sm font-medium`}
          role="alert"
        >
          <span>{announcement.message}</span>
          {announcement.linkUrl && announcement.linkLabel && (
            <Link
              href={announcement.linkUrl}
              className="ml-3 underline underline-offset-2 font-semibold hover:opacity-80 transition-opacity"
            >
              {announcement.linkLabel} →
            </Link>
          )}
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 shrink-0 focus-visible:ring-2 focus-visible:ring-maroon-700 rounded-lg"
          >
            {logoLight ? (
              <Image src={logoLight} alt={settings.siteName ?? 'Eparchy of Segeneyti'} width={40} height={40} className="h-10 w-auto" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-maroon-800">
                <span className="text-white text-xs font-bold leading-none">✝</span>
              </div>
            )}
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-maroon-900 leading-tight font-serif">
                {settings.siteName ?? 'Eparchy of Segeneyti'}
              </p>
              <p className="text-xs text-charcoal-500 leading-tight">Catholic Diocese · Eritrea</p>
            </div>
          </Link>

          {/* Desktop nav */}
          <MainNav />

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Language switcher */}
            <LanguageSwitcher currentLocale={locale} />

            {/* Mobile menu toggle */}
            <MobileMenu />
          </div>
        </div>
      </div>
    </header>
  )
}
