'use client'

import { useState } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'

/**
 * "Send to subscribers" in the News edit sidebar.
 *
 * Posts to the admin send endpoint with the session cookie; permission is
 * enforced server-side (subscribers.manage), so for anyone else the call
 * simply returns 403 and the message says so.
 *
 * The send library refuses a second send of the same article, so the worst a
 * double click can do is show "already sent" — but the confirm() is still here,
 * because mailing every subscriber deserves one deliberate yes.
 */
export function SendNewsletterButton() {
  const { id } = useDocumentInfo()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  if (!id) return null // unsaved document — nothing to send yet

  async function send() {
    if (!window.confirm('Email this article to every confirmed subscriber?')) return
    setBusy(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/newsletter/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ newsId: id }),
      })
      const data = (await res.json()) as {
        ok?: boolean
        reason?: string
        sentAt?: string
        recipientCount?: number
        failureCount?: number
        error?: string
      }
      if (data.ok) {
        setMessage(
          `Sent to ${data.recipientCount} subscriber(s)` +
            (data.failureCount ? `, ${data.failureCount} failed — see server log.` : '.'),
        )
      } else if (data.reason === 'already-sent') {
        setMessage(`Already sent${data.sentAt ? ` on ${new Date(data.sentAt).toLocaleDateString()}` : ''} — an article goes to the list only once.`)
      } else if (data.reason === 'not-published') {
        setMessage('Publish the article first — drafts are never mailed.')
      } else if (data.reason === 'no-subscribers') {
        setMessage('There are no confirmed subscribers yet.')
      } else {
        setMessage(data.error ?? 'Send failed.')
      }
    } catch {
      setMessage('Send failed — check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ marginBottom: '1rem' }}>
      <button
        type="button"
        onClick={send}
        disabled={busy}
        style={{
          width: '100%',
          padding: '0.5rem 0.75rem',
          borderRadius: 4,
          border: '1px solid var(--theme-elevation-150)',
          background: 'var(--theme-elevation-50)',
          cursor: busy ? 'wait' : 'pointer',
          fontSize: '0.8125rem',
        }}
      >
        {busy ? 'Sending…' : '✉ Send to subscribers'}
      </button>
      {message && (
        <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--theme-elevation-600)' }}>
          {message}
        </p>
      )}
    </div>
  )
}
