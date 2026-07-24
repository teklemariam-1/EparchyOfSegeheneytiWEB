import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { NavDropdown } from './NavDropdown'

interface NavItem {
  label: string
  href: string
  children?: { label: string; href: string }[]
}

/**
 * Desktop primary navigation. Dropdown items use the client NavDropdown, which
 * is operable by mouse, touch and keyboard (the old CSS-hover menu could not be
 * opened without a pointer).
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
        { label: t('bishop'), href: '/about#bishop' },
        { label: t('history'), href: '/about#history' },
      ],
    },
    { label: t('vicariates'), href: '/vicariates' },
    { label: t('parishes'), href: '/parishes' },
    { label: t('news'), href: '/news' },
    { label: t('events'), href: '/events' },
    {
      label: t('ministries'),
      href: '/ministries',
      children: [
        { label: t('allMinistries'), href: '/ministries' },
        { label: t('youthCouncil'), href: '/offices/youth-council' },
        { label: t('catechists'), href: '/ministries#catechists' },
        { label: t('childrenMinistry'), href: '/ministries#children' },
        { label: t('smallChristianCommunity'), href: '/ministries#small-christian-community' },
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
        { label: t('magazines'), href: '/publications#magazines' },
        { label: t('archives'), href: '/publications#archives' },
        { label: t('apps'), href: '/apps' },
      ],
    },
    { label: t('media'), href: '/media' },
    { label: t('contact'), href: '/contact' },
  ]

  return (
    <nav className="hidden lg:flex items-center gap-0.5" aria-label={ta('mainNavigation')}>
      {NAV_ITEMS.map((item) =>
        item.children ? (
          <NavDropdown key={item.href} label={item.label} items={item.children} />
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
