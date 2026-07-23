'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/** Sidebar link to the Ge'ez New-Year import wizard (below the nav groups). */
export function CalendarImportNavLink() {
  const pathname = usePathname()
  const active = pathname?.startsWith('/admin/calendar-import') ?? false

  return (
    <Link
      href="/admin/calendar-import"
      aria-current={active ? 'page' : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        margin: '16px 0 0',
        padding: '8px 10px',
        borderRadius: 6,
        fontSize: 13,
        fontWeight: active ? 700 : 500,
        textDecoration: 'none',
        color: 'var(--theme-elevation-800)',
        background: active ? 'var(--theme-elevation-100)' : 'transparent',
        boxShadow: active ? 'inset 3px 0 0 var(--theme-elevation-800)' : 'none',
      }}
    >
      <svg
        aria-hidden="true"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <line x1="12" y1="14" x2="12" y2="18" />
        <line x1="10" y1="16" x2="14" y2="16" />
      </svg>
      New Year Import
    </Link>
  )
}

export default CalendarImportNavLink
