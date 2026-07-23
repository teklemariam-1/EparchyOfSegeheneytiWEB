'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * "Dashboard" item at the top of the admin sidebar — a quick way back to the
 * main dashboard from anywhere in the panel. Highlighted when active.
 */
export function DashboardNavLink() {
  const pathname = usePathname()
  const active = pathname === '/admin' || pathname === '/admin/'

  return (
    <Link
      href="/admin"
      aria-current={active ? 'page' : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        margin: '0 0 16px',
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
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
      Dashboard
    </Link>
  )
}

export default DashboardNavLink
