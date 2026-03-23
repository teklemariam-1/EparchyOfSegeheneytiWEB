/**
 * Navigation types used by Header global and MainNav components.
 */

export interface NavLink {
  label: string
  href: string
  openInNewTab?: boolean
}

export interface NavGroup {
  label: string
  href: string
  children?: NavLink[]
}

export type NavItem = NavLink | NavGroup

export function isNavGroup(item: NavItem): item is NavGroup {
  return 'children' in item && Array.isArray((item as NavGroup).children)
}
