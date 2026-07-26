'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Drop-in abuse protection for the public forms.
 *
 * Renders two things:
 *  - a hidden, server-signed render timestamp (the submission-timing check), and
 *  - the Cloudflare Turnstile widget, but only when staff have switched it on
 *    in site-settings.
 *
 * Both come from /api/form-token on mount rather than from props, because the
 * public pages are cached: a token baked into the HTML would be shared by every
 * visitor served that cache entry.
 *
 * Degrades quietly. If the fetch fails, the form still submits — the server
 * treats a missing token as "unknown", not as "reject", so a network blip or an
 * ad-blocker never stops someone contacting the eparchy. The honeypot and rate
 * limit still apply.
 */

interface TurnstileApi {
  render: (el: HTMLElement, options: { sitekey: string; callback?: (token: string) => void }) => string
  remove: (id: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

function loadTurnstileScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.turnstile) return Promise.resolve()

  const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`)
  if (existing) {
    return new Promise((resolve) => existing.addEventListener('load', () => resolve(), { once: true }))
  }

  return new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.defer = true
    script.addEventListener('load', () => resolve(), { once: true })
    // A failed load resolves too: the server side fails open when Cloudflare is
    // unreachable, so the form must stay usable rather than wait forever.
    script.addEventListener('error', () => resolve(), { once: true })
    document.head.appendChild(script)
  })
}

export function FormProtection() {
  const [token, setToken] = useState<string>('')
  const [siteKey, setSiteKey] = useState<string | null>(null)
  const widgetRef = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const res = await fetch('/api/form-token', { cache: 'no-store' })
        if (!res.ok) return
        const data = (await res.json()) as {
          token?: string
          turnstile?: { enabled?: boolean; siteKey?: string | null }
        }
        if (cancelled) return
        if (data.token) setToken(data.token)
        if (data.turnstile?.enabled && data.turnstile.siteKey) setSiteKey(data.turnstile.siteKey)
      } catch {
        // Protection is best-effort; the form remains submittable.
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!siteKey || !widgetRef.current || widgetId.current) return
    let cancelled = false

    void (async () => {
      await loadTurnstileScript()
      if (cancelled || !window.turnstile || !widgetRef.current || widgetId.current) return
      // Explicit rendering: the container only exists after this component has
      // mounted, so the script's automatic scan would have already missed it.
      widgetId.current = window.turnstile.render(widgetRef.current, { sitekey: siteKey })
    })()

    return () => {
      cancelled = true
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current)
        widgetId.current = null
      }
    }
  }, [siteKey])

  return (
    <>
      <input type="hidden" name="formToken" value={token} readOnly />
      {siteKey ? <div ref={widgetRef} className="my-4" /> : null}
    </>
  )
}

export default FormProtection
