'use server'

import { randomBytes } from 'crypto'
import { getPayload } from '@/lib/payload/client'
import { guardFormSubmission, type FormRejectionKey } from '@/lib/security/formGuard'

export interface NewsletterState {
  ok: boolean
  message: string
  /** Key into the `forms` catalogue, when the message is a translatable rejection. */
  messageKey?: FormRejectionKey
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function token(): string {
  return randomBytes(24).toString('hex')
}

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').trim().replace(/\/$/, '')
}

/**
 * Newsletter signup (double opt-in).
 *
 * We never reveal whether an address is already subscribed — the response is
 * identical either way, so the form cannot be used to probe who has signed up.
 * A confirmation email is sent; nothing is added to the sending list until the
 * recipient clicks its link.
 */
export async function subscribeToNewsletter(
  _prev: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  // Honeypot — a hidden field bots fill and humans never see.
  if (String(formData.get('company') ?? '').trim()) {
    return { ok: true, message: 'Please check your inbox to confirm your subscription.' }
  }

  // Tighter than the other forms because this one SENDS MAIL to an
  // attacker-chosen address: unlimited, it is a way to bomb someone's inbox
  // from our domain and burn the sending quota that carries our real email.
  const guard = await guardFormSubmission({
    action: 'newsletter',
    limit: 3,
    windowSeconds: 900,
    formData,
  })
  if (!guard.ok) {
    return guard.silent
      ? { ok: true, message: 'Please check your inbox to confirm your subscription.' }
      : { ok: false, message: guard.message, messageKey: guard.messageKey }
  }

  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const locale = String(formData.get('locale') ?? 'en') === 'ti' ? 'ti' : 'en'

  if (!email || !EMAIL_RE.test(email) || email.length > 254) {
    return { ok: false, message: 'Please enter a valid email address.' }
  }

  const generic = {
    ok: true,
    message: 'Almost there — check your inbox for a link to confirm your subscription.',
  }

  try {
    const payload = await getPayload()
    const existing = await payload.find({
      collection: 'subscribers',
      where: { email: { equals: email } },
      limit: 1,
      overrideAccess: true,
    } as any)

    const doc = existing.docs[0] as any

    // Already confirmed — say nothing that confirms that fact; just succeed.
    if (doc?.status === 'confirmed') return generic

    const confirmationToken = token()
    let unsubscribeToken = doc?.unsubscribeToken as string | undefined

    if (doc) {
      // Re-subscribe or resend confirmation for a pending/unsubscribed address.
      unsubscribeToken = unsubscribeToken || token()
      await payload.update({
        collection: 'subscribers',
        id: doc.id,
        overrideAccess: true,
        data: { status: 'pending', confirmationToken, unsubscribeToken, locale } as any,
      })
    } else {
      unsubscribeToken = token()
      await payload.create({
        collection: 'subscribers',
        overrideAccess: true,
        data: { email, status: 'pending', confirmationToken, unsubscribeToken, locale } as any,
      })
    }

    const confirmUrl = `${siteUrl()}/api/newsletter/confirm?token=${confirmationToken}`
    await payload.sendEmail({
      to: email,
      subject: 'Confirm your subscription — Eparchy of Segeneyti',
      html: `
        <p>Thank you for subscribing to updates from the Catholic Eparchy of Segeneyti.</p>
        <p>Please confirm your subscription by clicking the link below:</p>
        <p><a href="${confirmUrl}">Confirm my subscription</a></p>
        <p>If you did not request this, you can safely ignore this email.</p>
      `,
      text: `Confirm your subscription to the Eparchy of Segeneyti: ${confirmUrl}`,
    })

    return generic
  } catch (err) {
    console.error('[newsletter] subscribe error', err)
    return { ok: false, message: 'Something went wrong. Please try again later.' }
  }
}
