import Link from 'next/link'
import { getFooterGlobal } from '@/lib/payload/queries'

const DEFAULT_FOOTER_COLUMNS = [
  {
    heading: 'About',
    links: [
      { label: 'About the Eparchy', url: '/about' },
      { label: 'Bishop', url: '/about/bishop' },
      { label: 'History', url: '/about/history' },
      { label: 'Contact', url: '/contact' },
    ],
  },
  {
    heading: 'Ministries',
    links: [
      { label: 'Youth Council', url: '/ministries/youth-council' },
      { label: 'Catechists', url: '/ministries/catechists' },
      { label: "Children's Ministry", url: '/ministries/children' },
      { label: 'Small Christian Community', url: '/ministries/small-christian-community' },
      { label: 'Priests & Ministries', url: '/ministries' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: "Bishop's Messages", url: '/bishop-messages' },
      { label: 'Pope Messages', url: '/pope-messages' },
      { label: "Ge'ez Calendar", url: '/geez-calendar' },
      { label: 'Magazines', url: '/publications/magazines' },
      { label: 'Archives', url: '/publications/archives' },
      { label: 'Schools', url: '/institutions/schools' },
      { label: 'Clinics', url: '/institutions/clinics' },
    ],
  },
  {
    heading: 'Media',
    links: [
      { label: 'Photo Gallery', url: '/media/gallery' },
      { label: 'Videos', url: '/media/videos' },
      { label: 'News', url: '/news' },
      { label: 'Events', url: '/events' },
      { label: 'Parishes', url: '/parishes' },
    ],
  },
]

type SocialKey = 'facebook' | 'youtube' | 'instagram' | 'twitter'

const SOCIAL_ICONS: Record<SocialKey, { label: string; letter: string }> = {
  facebook: { label: 'Facebook', letter: 'f' },
  youtube: { label: 'YouTube', letter: 'Y' },
  instagram: { label: 'Instagram', letter: 'IG' },
  twitter: { label: 'Twitter/X', letter: 'X' },
}

export async function SiteFooter() {
  const footer = await getFooterGlobal()
  const year = new Date().getFullYear()

  const columns = footer.columns?.length ? footer.columns : DEFAULT_FOOTER_COLUMNS

  return (
    <footer className="bg-maroon-950 text-charcoal-200">
      {/* Gold top accent line */}
      <div className="h-1 bg-gradient-to-r from-gold-600 via-gold-400 to-gold-600" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-maroon-800 border border-maroon-700">
                <span className="text-gold-400 text-sm">✝</span>
              </div>
              <div>
                <p className="text-sm font-bold text-white font-serif leading-tight">
                  Eparchy of Segeneyti
                </p>
                <p className="text-xs text-charcoal-400 leading-tight">Eritrea</p>
              </div>
            </div>
            <p className="text-xs text-charcoal-400 leading-relaxed mb-4">
              Serving God&apos;s people through faith, community, and mission since our founding.
            </p>
            {/* Social links */}
            {footer.showSocialLinks !== false && (
              <div className="flex gap-2 flex-wrap">
                {footer.socialLinks ? (
                  (Object.entries(footer.socialLinks) as [SocialKey, string][])
                    .filter(([, href]) => href)
                    .map(([key, href]) => (
                      <a
                        key={key}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-maroon-900 text-charcoal-400 hover:text-gold-400 hover:bg-maroon-800 transition-colors text-xs font-medium"
                        aria-label={SOCIAL_ICONS[key]?.label ?? key}
                      >
                        {SOCIAL_ICONS[key]?.letter ?? key[0].toUpperCase()}
                      </a>
                    ))
                ) : (
                  ['Facebook', 'YouTube', 'Telegram'].map((soc) => (
                    <a
                      key={soc}
                      href="#"
                      className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-maroon-900 text-charcoal-400 hover:text-gold-400 hover:bg-maroon-800 transition-colors text-xs font-medium"
                      aria-label={soc}
                    >
                      {soc[0]}
                    </a>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.heading}>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-gold-400 mb-4">
                {col.heading}
              </h3>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.url}>
                    <Link
                      href={link.url}
                      className="text-sm text-charcoal-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-maroon-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-charcoal-500">
          <p>{footer.copyrightText ?? `© ${year} Catholic Eparchy of Segeneyti. All rights reserved.`}</p>
          <div className="flex gap-4">
            <Link href="/contact" className="hover:text-charcoal-300 transition-colors">
              Contact
            </Link>
            <span aria-hidden="true">·</span>
            <Link href="/search" className="hover:text-charcoal-300 transition-colors">
              Search
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
