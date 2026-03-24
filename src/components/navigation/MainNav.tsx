import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

interface NavItem {
  label: string
  href: string
  children?: { label: string; href: string }[]
}

/**
 * Desktop primary navigation.
 * Hover-activated dropdown menus for items with children.
 */
export async function MainNav() {
  const [t, ta] = await Promise.all([
    getTranslations('nav'),
    getTranslations('a11y'),
  ])

  const NAV_ITEMS: NavItem[] = [
    { label: t('home'), href: '/' },
    {
      label: t('about'),
      href: '/about',
      children: [
        { label: t('aboutEparchy'), href: '/about' },
        { label: t('bishop'), href: '/about/bishop' },
        { label: t('history'), href: '/about/history' },
      ],
    },
    { label: t('parishes'), href: '/parishes' },
    { label: t('news'), href: '/news' },
    { label: t('events'), href: '/events' },
    {
      label: t('ministries'),
      href: '/ministries',
      children: [
        { label: t('allMinistries'), href: '/ministries' },
        { label: t('youthCouncil'), href: '/ministries/youth-council' },
        { label: t('catechists'), href: '/ministries/catechists' },
        { label: t('childrenMinistry'), href: '/ministries/children' },
        { label: t('smallChristianCommunity'), href: '/ministries/small-christian-community' },
        { label: t('priestsMinistries'), href: '/ministries/priests-and-ministries' },
      ],
    },
    {
      label: t('resources'),
      href: '/publications',
      children: [
        { label: t('bishopMessages'), href: '/bishop-messages' },
        { label: t('popeMessages'), href: '/pope-messages' },
        { label: t('geezCalendar'), href: '/geez-calendar' },
        { label: t('publications'), href: '/publications' },
        { label: t('magazines'), href: '/publications/magazines' },
        { label: t('archives'), href: '/publications/archives' },
      ],
    },
    {
      label: t('media'),
      href: '/media',
      children: [
        { label: t('gallery'), href: '/media/gallery' },
        { label: t('videos'), href: '/media/videos' },
      ],
    },
    { label: t('contact'), href: '/contact' },
  ]

  return (
    <nav className="hidden lg:flex items-center gap-0.5" aria-label={ta('mainNavigation')}>
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
