import Link from 'next/link'

interface NavItem {
  label: string
  href: string
  children?: { label: string; href: string }[]
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/' },
  {
    label: 'About',
    href: '/about',
    children: [
      { label: 'About the Eparchy', href: '/about' },
      { label: 'Bishop', href: '/about/bishop' },
      { label: 'History', href: '/about/history' },
    ],
  },
  { label: 'Parishes', href: '/parishes' },
  { label: 'News', href: '/news' },
  { label: 'Events', href: '/events' },
  {
    label: 'Ministries',
    href: '/ministries',
    children: [
      { label: 'All Ministries', href: '/ministries' },
      { label: 'Youth Council', href: '/ministries/youth-council' },
      { label: 'Catechists', href: '/ministries/catechists' },
      { label: "Children's Ministry", href: '/ministries/children' },
      { label: 'Small Christian Community', href: '/ministries/small-christian-community' },
      { label: 'Priests & Ministries', href: '/ministries/priests-and-ministries' },
    ],
  },
  {
    label: 'Resources',
    href: '/publications',
    children: [
      { label: 'Pope Messages', href: '/pope-messages' },
      { label: "Ge'ez Calendar", href: '/geez-calendar' },
      { label: 'Publications', href: '/publications' },
      { label: 'Magazines', href: '/publications/magazines' },
      { label: 'Archives', href: '/publications/archives' },
    ],
  },
  {
    label: 'Media',
    href: '/media',
    children: [
      { label: 'Gallery', href: '/media/gallery' },
      { label: 'Videos', href: '/media/videos' },
    ],
  },
  { label: 'Contact', href: '/contact' },
]

/**
 * Desktop primary navigation.
 * Hover-activated dropdown menus for items with children.
 */
export function MainNav() {
  return (
    <nav className="hidden lg:flex items-center gap-0.5" aria-label="Main navigation">
      {NAV_ITEMS.map((item) =>
        item.children ? (
          <div key={item.href} className="relative group">
            <button
              type="button"
              className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-charcoal-700 hover:text-maroon-800 rounded-md hover:bg-charcoal-50 transition-colors"
              aria-haspopup="true"
            >
              {item.label}
              <svg
                className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100 transition-transform group-hover:rotate-180"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown */}
            <div className="absolute left-0 top-full mt-1 w-52 rounded-xl bg-white shadow-lg border border-charcoal-100 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
              {item.children.map((child) => (
                <Link
                  key={child.href}
                  href={child.href}
                  className="block px-4 py-2 text-sm text-charcoal-700 hover:bg-parchment hover:text-maroon-800 transition-colors"
                >
                  {child.label}
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <Link
            key={item.href}
            href={item.href}
            className="px-3 py-2 text-sm font-medium text-charcoal-700 hover:text-maroon-800 rounded-md hover:bg-charcoal-50 transition-colors"
          >
            {item.label}
          </Link>
        ),
      )}
    </nav>
  )
}
