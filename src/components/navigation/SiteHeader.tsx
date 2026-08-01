import Link from 'next/link'
import Image from 'next/image'
import { getLocale, getTranslations } from 'next-intl/server'
import { MainNav } from './MainNav'
import { MobileMenu } from './MobileMenu'
import { LanguageSwitcher } from './LanguageSwitcher'
import { HeaderSearch } from './HeaderSearch'
import { AnnouncementBanner } from './AnnouncementBanner'
import { DonateCTA } from '@/features/donate/DonateCTA'
import { getHeaderGlobal, getSiteSettings, getNavigationGlobal } from '@/lib/payload/queries'
import { resolveMobileNav } from '@/lib/navigation/resolveNav'

export async function SiteHeader() {
  const [header, settings, locale, tc, tn] = await Promise.all([
    getHeaderGlobal(),
    getSiteSettings(),
    getLocale(),
    getTranslations('common'),
    getTranslations('nav'),
  ])
  const ts = await getTranslations('search')

  // Admin-managed navigation (falls back to the built-in structure when the
  // global is empty). MobileMenu is a client component, so the resolved list
  // is passed down as serializable props.
  const navGlobal = await getNavigationGlobal(locale)
  const mobileItems = resolveMobileNav(navGlobal, tn)

  // The Header global wins, then SiteSettings. Its own field description has
  // always claimed it "overrides the SiteSettings logo" while nothing read it,
  // so an admin uploading a header logo saw no change whatsoever.
  const logoUrl = header.logo?.url ?? settings.logo?.url ?? settings.logoDark?.url
  const logoAlt = header.logoAlt || settings.siteName || 'Eparchy of Segheneyti'
  const announcement = header.announcementBanner

  // Absent means shown. A header global saved before these fields existed must
  // keep rendering what it rendered yesterday rather than losing its buttons.
  const show = {
    search: header.actions?.showSearch !== false,
    donate: header.actions?.showDonate !== false,
    settings: header.actions?.showSettings !== false,
  }
  const utilityLinks = header.utilityLinks ?? []

  return (
    <header className="sticky top-0 z-50 bg-white shadow-nav border-b border-charcoal-100">
      {/* Utility bar. Renders only when the admin has added links — an empty
          strip of colour above the logo would be worse than no bar. */}
      {utilityLinks.length > 0 && (
        <div className="border-b border-charcoal-100 bg-parchment-50">
          <div className="mx-auto flex max-w-7xl items-center justify-end gap-4 px-4 py-1.5 sm:px-6 lg:px-8">
            {utilityLinks.map((link, i) => (
              <a
                key={i}
                href={link.url}
                className="flex items-center gap-1.5 text-xs text-charcoal-600 transition-colors hover:text-maroon-800"
              >
                <UtilityIcon name={link.icon} />
                <span>{link.label}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* CMS-driven announcement bar (client component handles dismiss) */}
      {announcement?.enabled && announcement.message && (
        <AnnouncementBanner
          message={announcement.message}
          link={announcement.link || undefined}
          style={announcement.style ?? 'info'}
          learnMoreLabel={tc('readMore')}
          dismissLabel={tc('close')}
        />
      )}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 shrink-0 focus-visible:ring-2 focus-visible:ring-maroon-700 rounded-lg"
          >
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={logoAlt}
                width={160}
                height={40}
                className="h-10 w-auto object-contain"
                priority
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-maroon-800">
                <span className="text-white text-xs font-bold leading-none">✝</span>
              </div>
            )}
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-maroon-900 leading-tight font-serif">
                {settings.siteName ?? 'Eparchy of Segheneyti'}
              </p>
              <p className="text-xs text-charcoal-500 leading-tight">Catholic Diocese · Eritrea</p>
            </div>
          </Link>

          {/* Desktop nav */}
          <MainNav />

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Search — a real GET form; the dropdown is layered on top of it */}
            {show.search && (
            <HeaderSearch
              locale={locale}
              labels={{
                placeholder: ts('placeholder'),
                srLabel: ts('srLabel'),
                open: ts('openSearch'),
                close: ts('closeSearch'),
                suggestions: ts('suggestions'),
              }}
            />
            )}

            {/* Donate CTA — hidden here, and independently silent when donations
                are switched off in Donation Settings. Both must agree to show it. */}
            {show.donate && (
              <div className="hidden sm:block">
                <DonateCTA locale={locale} />
              </div>
            )}

            {/* Language switcher */}
            <LanguageSwitcher currentLocale={locale} />

            {/* Settings */}
            {show.settings && (
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
            )}

            {/* Mobile menu toggle */}
            <MobileMenu items={mobileItems} />
          </div>
        </div>
      </div>
    </header>
  )
}

/**
 * Icons for the utility bar.
 *
 * The icon field used to be free text inviting any Lucide name, which rendered
 * nothing at all when the name was wrong — another header setting that appeared
 * to do nothing. It is now a closed list, and this maps it.
 */
function UtilityIcon({ name }: { name?: string }) {
  if (!name || name === 'none') return null

  const paths: Record<string, string> = {
    phone:
      'M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z',
    mail: 'M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75',
    location:
      'M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z',
    clock: 'M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  }

  const d = paths[name]
  if (!d) return null

  return (
    <svg
      className="h-3.5 w-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  )
}
