'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

/**
 * Unread-contact-messages badge, shown above the admin nav.
 *
 * New form submissions land with status "new" and were easy to miss. This polls
 * the count of unread messages and surfaces it as a badge linking straight to
 * the filtered list, so a fresh message is obvious the moment an editor is in
 * the panel.
 */
export function ContactInboxBadge() {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    let active = true

    async function poll() {
      try {
        const res = await fetch(
          '/api/contact-submissions?where[status][equals]=new&limit=0&depth=0',
          { credentials: 'include' },
        )
        if (!res.ok) return
        const data = await res.json()
        if (active) setCount(typeof data.totalDocs === 'number' ? data.totalDocs : 0)
      } catch {
        // A failed poll should never break the admin nav; try again next tick.
      }
    }

    poll()
    const id = setInterval(poll, 30_000)
    return () => {
      active = false
      clearInterval(id)
    }
  }, [])

  if (!count || count < 1) return null

  return (
    <Link
      href="/admin/collections/contact-submissions?where[or][0][and][0][status][equals]=new"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        margin: '0 0 12px',
        padding: '8px 12px',
        borderRadius: 6,
        background: 'var(--theme-error-500, #b3261e)',
        color: '#fff',
        fontSize: 13,
        fontWeight: 600,
        textDecoration: 'none',
      }}
    >
      <span>
        {count} new message{count === 1 ? '' : 's'}
      </span>
      <span
        aria-hidden="true"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: 20,
          height: 20,
          padding: '0 6px',
          borderRadius: 999,
          background: 'rgba(255,255,255,0.25)',
          fontSize: 12,
        }}
      >
        {count}
      </span>
    </Link>
  )
}

export default ContactInboxBadge
