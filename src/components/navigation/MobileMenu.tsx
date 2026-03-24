'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

export function MobileMenu() {
  const t = useTranslations('nav')
  const ta = useTranslations('a11y')

  const MOBILE_NAV = [
    { label: t('home'), href: '/' },
    { label: t('about'), href: '/about' },
    { label: t('bishop'), href: '/about/bishop' },
    { label: t('parishes'), href: '/parishes' },
    { label: t('news'), href: '/news' },
    { label: t('events'), href: '/events' },
    { label: t('ministries'), href: '/ministries' },
    { label: t('youthCouncil'), href: '/ministries/youth-council' },
    { label: t('catechists'), href: '/ministries/catechists' },
    { label: t('bishopMessages'), href: '/bishop-messages' },
    { label: t('popeMessages'), href: '/pope-messages' },
    { label: t('geezCalendar'), href: '/geez-calendar' },
    { label: t('publications'), href: '/publications' },
    { label: t('media'), href: '/media' },
    { label: t('contact'), href: '/contact' },
  ]

  const [open, setOpen] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)
  const openBtnRef = useRef<HTMLButtonElement>(null)

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        openBtnRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open])

  // Focus trap inside the drawer
  useEffect(() => {
    if (!open || !drawerRef.current) return
    const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    first?.focus()

    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus() }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus() }
      }
    }
    document.addEventListener('keydown', trap)
    return () => document.removeEventListener('keydown', trap)
  }, [open])

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <div className="lg:hidden">
      <button
        ref={openBtnRef}
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center rounded-md p-2 text-charcoal-600 hover:bg-charcoal-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon-700"
        aria-label={ta('openMenu')}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer */}
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label={ta('mobileNavigation')}
            className="fixed inset-y-0 right-0 z-50 w-72 bg-white shadow-xl flex flex-col overflow-y-auto"
          >
            <div className="flex items-center justify-between px-4 py-4 border-b border-charcoal-100">
              <span className="font-serif font-bold text-maroon-900 text-base">
                Eparchy of Segeneyti
              </span>
              <button
                type="button"
                onClick={() => { setOpen(false); openBtnRef.current?.focus() }}
                className="rounded-md p-1.5 text-charcoal-500 hover:bg-charcoal-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon-700"
                aria-label={ta('closeMenu')}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav className="flex-1 px-2 py-4 space-y-0.5" aria-label={ta('mobileNavigation')}>
              {MOBILE_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-4 py-2.5 text-sm font-medium text-charcoal-700 hover:bg-parchment hover:text-maroon-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-maroon-700"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="border-t border-charcoal-100 px-4 py-4">
              <p className="text-xs text-charcoal-400 text-center">
                Catholic Eparchy of Segeneyti · Eritrea
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
