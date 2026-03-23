import Link from 'next/link'
import Image from 'next/image'
import { MainNav } from './MainNav'
import { MobileMenu } from './MobileMenu'

/**
 * Site-wide header — server component.
 * In production, this will fetch the Header global from Payload.
 * For now it uses a static config to unblock frontend development.
 */
export async function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 bg-white shadow-nav border-b border-charcoal-100">
      {/* Announcement bar — rendered when active */}
      {/* <AnnouncementBar /> */}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 shrink-0 focus-visible:ring-2 focus-visible:ring-maroon-700 rounded-lg"
          >
            {/* Replace with actual logo image once assets are added */}
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-maroon-800">
              <span className="text-white text-xs font-bold leading-none">✝</span>
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-maroon-900 leading-tight font-serif">
                Eparchy of Segeneyti
              </p>
              <p className="text-xs text-charcoal-500 leading-tight">Catholic Diocese · Eritrea</p>
            </div>
          </Link>

          {/* Desktop nav */}
          <MainNav />

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Language switcher placeholder */}
            <button
              type="button"
              className="hidden sm:inline-flex items-center rounded-md px-2.5 py-1.5 text-xs font-medium text-charcoal-600 hover:bg-charcoal-50 transition-colors"
              aria-label="Switch language"
            >
              EN / ትግ
            </button>

            {/* Mobile menu toggle */}
            <MobileMenu />
          </div>
        </div>
      </div>
    </header>
  )
}
