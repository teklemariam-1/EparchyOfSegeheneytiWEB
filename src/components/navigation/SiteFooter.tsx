import Link from 'next/link'

const FOOTER_COLUMNS = [
  {
    heading: 'About',
    links: [
      { label: 'About the Eparchy', href: '/about' },
      { label: 'Bishop', href: '/about/bishop' },
      { label: 'History', href: '/about/history' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    heading: 'Ministries',
    links: [
      { label: 'Youth Council', href: '/ministries/youth-council' },
      { label: 'Catechists', href: '/ministries/catechists' },
      { label: "Children's Ministry", href: '/ministries/children' },
      { label: 'Small Christian Community', href: '/ministries/small-christian-community' },
      { label: 'Priests & Ministries', href: '/ministries/priests-and-ministries' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'Pope Messages', href: '/pope-messages' },
      { label: "Ge'ez Calendar", href: '/geez-calendar' },
      { label: 'Magazines', href: '/publications/magazines' },
      { label: 'Archives', href: '/publications/archives' },
      { label: 'Schools', href: '/institutions/schools' },
      { label: 'Clinics', href: '/institutions/clinics' },
    ],
  },
  {
    heading: 'Media',
    links: [
      { label: 'Photo Gallery', href: '/media/gallery' },
      { label: 'Videos', href: '/media/videos' },
      { label: 'News', href: '/news' },
      { label: 'Events', href: '/events' },
      { label: 'Parishes', href: '/parishes' },
    ],
  },
]

/**
 * Site-wide footer — server component.
 */
export async function SiteFooter() {
  const year = new Date().getFullYear()

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
            {/* Social links placeholder */}
            <div className="flex gap-2">
              {['Facebook', 'YouTube', 'Telegram'].map((soc) => (
                <a
                  key={soc}
                  href="#"
                  className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-maroon-900 text-charcoal-400 hover:text-gold-400 hover:bg-maroon-800 transition-colors text-xs font-medium"
                  aria-label={soc}
                >
                  {soc[0]}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.heading}>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-gold-400 mb-4">
                {col.heading}
              </h3>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
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
          <p>© {year} Catholic Eparchy of Segeneyti. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/about/contact" className="hover:text-charcoal-300 transition-colors">
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
