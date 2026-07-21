'use client'

import { useEffect } from 'react'

/**
 * Fires one anonymous visit ping per browser session.
 *
 * A sessionStorage flag keeps it to a single call per tab session, so the
 * server counts sessions rather than every navigation. Stores nothing locally
 * beyond that flag; the server records only country + day (see /api/track).
 */
export function VisitorTracker() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem('visit-tracked')) return
      sessionStorage.setItem('visit-tracked', '1')
    } catch {
      // Private mode without storage — just skip; not worth double-counting.
      return
    }
    // Best-effort; ignore any failure.
    void fetch('/api/track', { method: 'POST', keepalive: true }).catch(() => {})
  }, [])

  return null
}

export default VisitorTracker
