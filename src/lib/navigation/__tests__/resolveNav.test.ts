import { describe, it, expect } from 'vitest'
import {
  resolveMainNav,
  resolveMobileNav,
  defaultMainNav,
  defaultMobileNav,
} from '../resolveNav'
import type { NavigationGlobal } from '@/lib/payload/queries'

const t = (key: string) => key

const populated: NavigationGlobal = {
  mainNav: [
    { label: 'Home', url: '/' },
    {
      label: 'Faith',
      children: [
        { label: 'Pope', url: '/pope-messages', description: 'Papal documents' },
        { label: 'Bishop', url: '/bishop-messages' },
      ],
    },
    { label: 'Live Stream', url: 'https://youtube.com/@eparchy', openInNewTab: true },
    // Broken rows admins can produce: no label, or neither url nor children.
    { label: '', url: '/ghost' },
    { label: 'Empty parent' },
  ],
  mobileExtra: [{ label: 'Give', url: '/donate', highlight: true }],
}

describe('resolveMainNav', () => {
  it('falls back to the built-in structure when the global is empty', () => {
    expect(resolveMainNav({}, t)).toEqual(defaultMainNav(t))
    expect(resolveMainNav(undefined, t)).toEqual(defaultMainNav(t))
    expect(resolveMainNav({ mainNav: [] }, t)).toEqual(defaultMainNav(t))
  })

  it('maps admin items, dropping rows without a label or destination', () => {
    const items = resolveMainNav(populated, t)
    expect(items.map((i) => i.label)).toEqual(['Home', 'Faith', 'Live Stream'])
  })

  it('maps dropdown children with url→href, description and newTab', () => {
    const faith = resolveMainNav(populated, t)[1]
    expect(faith.children).toEqual([
      { label: 'Pope', href: '/pope-messages', newTab: undefined, description: 'Papal documents' },
      { label: 'Bishop', href: '/bishop-messages', newTab: undefined, description: undefined },
    ])
  })

  it('preserves admin ordering', () => {
    const reordered: NavigationGlobal = {
      mainNav: [
        { label: 'B', url: '/b' },
        { label: 'A', url: '/a' },
      ],
    }
    expect(resolveMainNav(reordered, t).map((i) => i.label)).toEqual(['B', 'A'])
  })

  it('marks external links to open in a new tab', () => {
    const live = resolveMainNav(populated, t)[2]
    expect(live.newTab).toBe(true)
  })
})

describe('resolveMobileNav', () => {
  it('falls back to the built-in flat list when the global is empty', () => {
    expect(resolveMobileNav({}, t)).toEqual(defaultMobileNav(t))
  })

  it('flattens parents and children and appends mobile-only extras', () => {
    const items = resolveMobileNav(populated, t)
    expect(items.map((i) => i.href)).toEqual([
      '/',
      '/pope-messages',
      '/bishop-messages',
      'https://youtube.com/@eparchy',
      '/donate',
    ])
    expect(items[items.length - 1].highlight).toBe(true)
  })

  it('appends extras even when the main nav is empty (fallback mode)', () => {
    const items = resolveMobileNav({ mobileExtra: [{ label: 'Give', url: '/donate' }] }, t)
    expect(items[items.length - 1]).toEqual({ label: 'Give', href: '/donate', highlight: undefined })
  })

  it('dedupes repeated hrefs (parent repeating its first child)', () => {
    const g: NavigationGlobal = {
      mainNav: [
        {
          label: 'Ministries',
          url: '/ministries',
          children: [{ label: 'All Ministries', url: '/ministries' }],
        },
      ],
    }
    const items = resolveMobileNav(g, t)
    expect(items).toHaveLength(1)
    expect(items[0].label).toBe('Ministries')
  })
})
