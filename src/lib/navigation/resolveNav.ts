import type { NavigationGlobal } from '@/lib/payload/queries'

/**
 * Turns the admin-managed Navigation global into the shapes the header
 * components render, falling back to the built-in structure when the global
 * has never been filled in.
 *
 * Kept pure (no Payload, no next-intl imports) so it can be unit-tested and
 * reused by both the server MainNav and the client MobileMenu (via props).
 */

export interface NavChild {
  label: string
  href: string
  newTab?: boolean
  description?: string
}

export interface NavItem {
  label: string
  href: string
  newTab?: boolean
  children?: NavChild[]
}

export interface MobileNavItem {
  label: string
  href: string
  newTab?: boolean
  highlight?: boolean
}

export type NavTranslate = (key: string) => string

/** The structure the site shipped with — used until admins edit the global. */
export function defaultMainNav(t: NavTranslate): NavItem[] {
  return [
    { label: t('home'), href: '/' },
    {
      label: t('about'),
      href: '/about',
      children: [
        { label: t('aboutEparchy'), href: '/about' },
        { label: t('bishop'), href: '/bishop' },
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
}

/** Curated flat list used by the mobile drawer when the global is empty. */
export function defaultMobileNav(t: NavTranslate): MobileNavItem[] {
  return [
    { label: t('home'), href: '/' },
    { label: t('about'), href: '/about' },
    { label: t('bishop'), href: '/bishop' },
    { label: t('vicariates'), href: '/vicariates' },
    { label: t('parishes'), href: '/parishes' },
    { label: t('news'), href: '/news' },
    { label: t('events'), href: '/events' },
    { label: t('ministries'), href: '/ministries' },
    { label: t('youthCouncil'), href: '/offices/youth-council' },
    { label: t('catechists'), href: '/ministries#catechists' },
    { label: t('bishopMessages'), href: '/bishop-messages' },
    { label: t('apps'), href: '/apps' },
    { label: t('popeMessages'), href: '/pope-messages' },
    { label: t('geezCalendar'), href: '/geez-calendar' },
    { label: t('publications'), href: '/publications' },
    { label: t('media'), href: '/media' },
    { label: t('contact'), href: '/contact' },
  ]
}

function hasItems(global: NavigationGlobal | null | undefined): boolean {
  return Boolean(global?.mainNav && global.mainNav.length > 0)
}

/**
 * Desktop nav items: the admin-managed global when it has content, the
 * built-in defaults otherwise. Items with children render as dropdowns; a
 * parent's own `url` is optional (dropdown-only parents leave it blank).
 */
export function resolveMainNav(
  global: NavigationGlobal | null | undefined,
  t: NavTranslate,
): NavItem[] {
  if (!hasItems(global)) return defaultMainNav(t)

  return (global!.mainNav ?? [])
    .filter((item) => item.label && (item.url || (item.children?.length ?? 0) > 0))
    .map((item) => ({
      label: item.label,
      href: item.url || '#',
      newTab: item.openInNewTab || undefined,
      children:
        item.children && item.children.length > 0
          ? item.children
              .filter((c) => c.label && c.url)
              .map((c) => ({
                label: c.label,
                href: c.url,
                newTab: c.openInNewTab || undefined,
                description: c.description || undefined,
              }))
          : undefined,
    }))
}

/**
 * Mobile drawer items: the main nav flattened (parents first, then their
 * children), plus any admin-defined mobile-only links appended at the end.
 * Duplicate hrefs are dropped so a parent that repeats its first child (e.g.
 * "Ministries" → "All Ministries") doesn't render twice.
 */
export function resolveMobileNav(
  global: NavigationGlobal | null | undefined,
  t: NavTranslate,
): MobileNavItem[] {
  const extras: MobileNavItem[] = (global?.mobileExtra ?? [])
    .filter((e) => e.label && e.url)
    .map((e) => ({
      label: e.label,
      href: e.url,
      highlight: e.highlight || undefined,
    }))

  if (!hasItems(global)) {
    return dedupeByHref([...defaultMobileNav(t), ...extras])
  }

  const flat: MobileNavItem[] = []
  for (const item of global!.mainNav ?? []) {
    if (item.label && item.url) flat.push({ label: item.label, href: item.url, newTab: item.openInNewTab || undefined })
    for (const c of item.children ?? []) {
      if (c.label && c.url) flat.push({ label: c.label, href: c.url, newTab: c.openInNewTab || undefined })
    }
  }
  return dedupeByHref([...flat, ...extras])
}

function dedupeByHref(items: MobileNavItem[]): MobileNavItem[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    if (seen.has(item.href)) return false
    seen.add(item.href)
    return true
  })
}
