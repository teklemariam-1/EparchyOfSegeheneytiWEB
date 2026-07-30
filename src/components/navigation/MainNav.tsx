import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'
import { NavDropdown } from './NavDropdown'
import { getNavigationGlobal } from '@/lib/payload/queries'
import { resolveMainNav } from '@/lib/navigation/resolveNav'

/**
 * Desktop primary navigation. Dropdown items use the client NavDropdown, which
 * is operable by mouse, touch and keyboard (the old CSS-hover menu could not be
 * opened without a pointer).
 *
 * Items come from the admin-managed Navigation global (add / reorder / relabel
 * without a deploy); until an admin fills it in, the built-in structure in
 * resolveNav renders instead, so an empty global never blanks the header.
 */
export async function MainNav() {
  const [t, ta, locale] = await Promise.all([
    getTranslations('nav'),
    getTranslations('a11y'),
    getLocale(),
  ])

  const global = await getNavigationGlobal(locale)
  const items = resolveMainNav(global, t)

  return (
    <nav className="hidden lg:flex items-center gap-0.5" aria-label={ta('mainNavigation')}>
      {items.map((item) =>
        item.children ? (
          <NavDropdown key={`${item.label}-${item.href}`} label={item.label} items={item.children} />
        ) : (
          <Link
            key={`${item.label}-${item.href}`}
            href={item.href}
            {...(item.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            className="px-3 py-2 text-sm font-medium text-charcoal-700 hover:text-maroon-800 rounded-md hover:bg-charcoal-50 transition-colors"
          >
            {item.label}
          </Link>
        ),
      )}
    </nav>
  )
}
