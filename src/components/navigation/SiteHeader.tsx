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

            {/* Settings */}
            <Link
              href="/settings"
              aria-label="Settings"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-charcoal-500 hover:bg-charcoal-50 hover:text-maroon-800 transition-colors focus-visible:ring-2 focus-visible:ring-maroon-700"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            </Link>

            {/* Mobile menu toggle */}
            <MobileMenu />
          </div>
        </div>
      </div>
    </header>
  )
}
