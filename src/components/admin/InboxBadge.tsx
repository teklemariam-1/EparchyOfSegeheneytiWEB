'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

/**
 * "N waiting" badges above the admin nav.
 *
 * Three collections now receive public submissions — contact messages, Mass
 * intentions and sacramental requests — and all three land with `status: 'new'`.
 * Without a badge they are invisible until someone thinks to look, and the two
 * newer ones are worse than a missed message: a parishioner has asked for a Mass
 * to be offered, or for a baptism record, and is waiting for a reply.
 *
 * The count is fetched with `credentials: 'include'`, so Payload's own access
 * control answers it. A user without `mass-intentions.view` gets nothing back
 * and therefore no badge — the badge cannot leak the existence of records the
 * collection itself would hide.
 *
 * A failed poll renders nothing rather than an error: this sits in the nav of
 * every admin screen, and a wobbling network must not put a red box there.
 */

interface InboxBadgeProps {
  /** Payload collection slug, e.g. 'mass-intentions'. */
  collection: string
  /** Singular label, e.g. 'Mass intention'. Pluralised with a trailing "s". */
  label: string
  /** Plural override for words that do not take a plain "s". */
  labelPlural?: string
}

const POLL_MS = 30_000

export function InboxBadge({ collection, label, labelPlural }: InboxBadgeProps) {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    let active = true

    async function poll() {
      try {
        const res = await fetch(
          `/api/${collection}?where[status][equals]=new&limit=0&depth=0`,
          { credentials: 'include' },
        )
        if (!res.ok) return
        const data = await res.json()
        if (active) setCount(typeof data.totalDocs === 'number' ? data.totalDocs : 0)
      } catch {
        // Never break the admin nav; try again on the next tick.
      }
    }

    void poll()
    const id = setInterval(poll, POLL_MS)
    return () => {
      active = false
      clearInterval(id)
    }
  }, [collection])

  // Zero is not news. Rendering "0 waiting" would train staff to ignore the row
  // that matters.
  if (!count || count < 1) return null

  const word = count === 1 ? label : (labelPlural ?? `${label}s`)

  return (
    <Link
      href={`/admin/collections/${collection}?where[or][0][and][0][status][equals]=new`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        margin: '0 0 8px',
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
        {count} new {word}
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

/**
 * Payload resolves nav components by import path and passes no props, so each
 * collection needs its own zero-argument export.
 */
export function MassIntentionsBadge() {
  return <InboxBadge collection="mass-intentions" label="Mass intention" />
}

export function SacramentalRequestsBadge() {
  return <InboxBadge collection="sacramental-requests" label="sacramental request" />
}

export default InboxBadge
