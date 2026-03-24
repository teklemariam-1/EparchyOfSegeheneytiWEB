'use client'

import { useState } from 'react'
import Link from 'next/link'

const MOBILE_NAV = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Bishop', href: '/about/bishop' },
  { label: 'Parishes', href: '/parishes' },
  { label: 'News', href: '/news' },
  { label: 'Events', href: '/events' },
  { label: 'Ministries', href: '/ministries' },
  { label: 'Youth Council', href: '/ministries/youth-council' },
  { label: 'Catechists', href: '/ministries/catechists' },
  { label: "Bishop's Messages", href: '/bishop-messages' },
  { label: 'Pope Messages', href: '/pope-messages' },
  { label: "Ge'ez Calendar", href: '/geez-calendar' },
  { label: 'Publications', href: '/publications' },
  { label: 'Media', href: '/media' },
  { label: 'Contact', href: '/contact' },
]

export function MobileMenu() {
  const [open, setOpen] = useState(false)

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center justify-center rounded-md p-2 text-charcoal-600 hover:bg-charcoal-100 transition-colors"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          {open ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          )}
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
          <div className="fixed inset-y-0 right-0 z-50 w-72 bg-white shadow-xl flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-4 border-b border-charcoal-100">
              <span className="font-serif font-bold text-maroon-900 text-base">
                Eparchy of Segeneyti
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 text-charcoal-500 hover:bg-charcoal-100"
                aria-label="Close menu"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav className="flex-1 px-2 py-4 space-y-0.5" aria-label="Mobile navigation">
              {MOBILE_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-4 py-2.5 text-sm font-medium text-charcoal-700 hover:bg-parchment hover:text-maroon-800 transition-colors"
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
