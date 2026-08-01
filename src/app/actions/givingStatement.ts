'use server'

import { getPayload } from '@/lib/payload/client'
import { guardFormSubmission, reportSuspicious, type FormRejectionKey } from '@/lib/security/formGuard'
import { buildStatement, renderStatementHtml, type DonationRow } from '@/lib/donations/statement'

export interface GivingStatementState {
  ok: boolean
  message: string
  messageKey?: FormRejectionKey
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Donor self-service: "email me my statement for <year>".
 *
 * ── Enumeration safety ───────────────────────────────────────────────────────
 * The response is identical whether the address has donations, has none, or has
 * never been seen — the same rule the newsletter follows. The statement itself
 * goes only TO the address in question, so the only person who can learn a
 * giving history is the person who reads that inbox.
 *
 * ── Rate limit ───────────────────────────────────────────────────────────────
 * Tighter than any other form (2 per 15 minutes): this endpoint sends mail to an
 * attacker-chosen address, and unlike the newsletter the mail carries personal
 * financial history. The guard's honeypot, timing token and optional Turnstile
 * apply on top.
 */
export async function requestGivingStatement(
  _prev: GivingStatementState,
  formData: FormData,
): Promise<GivingStatementState> {
  const generic = {
    ok: true,
    message:
      'If donations were recorded for that address in that year, a statement is on its way to it.',
  }

  // Honeypot — silent fake success, so a bot learns nothing.
  if (String(formData.get('company') ?? '').trim()) {
    reportSuspicious('giving-statement', 'honeypot')
    return generic
  }

  const guard = await guardFormSubmission({
    action: 'giving-statement',
    limit: 2,
    windowSeconds: 900,
    formData,
  })
  if (!guard.ok) {
    return guard.silent
      ? generic
      : { ok: false, message: guard.message, messageKey: guard.messageKey }
  }

  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const yearRaw = String(formData.get('year') ?? '').trim()
  const year = /^\d{4}$/.test(yearRaw) ? Number(yearRaw) : NaN

  if (!email || !EMAIL_RE.test(email) || email.length > 254) {
    return { ok: false, message: 'Please enter a valid email address.' }
  }
  // Statements exist for completed years and the running one; anything else is
  // a typo, not a request.
  const thisYear = new Date().getUTCFullYear()
  if (Number.isNaN(year) || year < 2020 || year > thisYear) {
    return { ok: false, message: 'Please choose a valid year.' }
  }

  try {
    const payload = await getPayload()
    const result = await payload.find({
      collection: 'donations',
      where: {
        donorEmail: { equals: email },
        status: { equals: 'succeeded' },
        submittedAt: {
          greater_than_equal: new Date(Date.UTC(year, 0, 1)).toISOString(),
          less_than: new Date(Date.UTC(year + 1, 0, 1)).toISOString(),
        },
      },
      limit: 1000,
      depth: 0,
      overrideAccess: true,
    })

    const rows = result.docs as unknown as (DonationRow & { donorName?: string })[]
    const statement = buildStatement(rows, year)

    // Nothing to send — but say exactly what we say when there is, so the form
    // cannot be used to probe who has donated.
    if (statement.gifts.length === 0) return generic

    const html = renderStatementHtml({
      statement,
      donorName: rows[0]?.donorName ?? email,
      organizationName: 'Catholic Eparchy of Segheneyti',
      issuedAt: new Date().toISOString(),
    })

    await payload.sendEmail({
      to: email,
      subject: `Your ${year} giving statement — Eparchy of Segheneyti`,
      html,
      text: `Your ${year} giving statement from the Catholic Eparchy of Segheneyti is attached above in the HTML version of this message. If you cannot read it, reply and the chancery will send a copy.`,
    })

    return generic
  } catch (err) {
    console.error('[giving-statement] request failed', err)
    // Still generic: an internal error must not become a different response
    // for addresses that do have donations.
    return generic
  }
}
