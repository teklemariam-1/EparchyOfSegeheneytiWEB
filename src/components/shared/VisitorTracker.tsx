'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Fires anonymous, aggregate-only visit pings.
 *
 * - One ping per navigation carrying only the pathname (page-view counters).
 * - The first ping of a browser session additionally lets the server count
 *   session-level buckets (country / device class / traffic source /
 *   language). The referrer is sent once so the server can pick a coarse
 *   source bucket; the raw value is never stored.
 *
 * A sessionStorage flag is the only thing kept on the device.
 */
export function VisitorTracker() {
  const pathname = usePathname()
  const lastTracked = useRef<string | null>(null)

  useEffect(() => {
    if (!pathname || pathname === lastTracked.current) return
    lastTracked.current = pathname

    let isNewSession = false
    try {
      if (!sessionStorage.getItem('visit-tracked')) {
        sessionStorage.setItem('visit-tracked', '1')
        isNewSession = true
      }
    } catch {
      // Private mode without storage — count the page view only, never the
      // session, so nothing is double-counted.
    }

    const payload: Record<string, unknown> = { path: pathname }
    if (isNewSession) {
      payload.session = true
      payload.ref = document.referrer || ''
    }

    // Best-effort; ignore any failure.
    void fetch('/api/track', {
      method: 'POST',
      keepalive: true,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {})
  }, [pathname])

  return null
}

export default VisitorTracker
