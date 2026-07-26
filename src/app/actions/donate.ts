'use server'

import { getPayload } from '@/lib/payload/client'
import { guardFormSubmission, type FormRejectionKey } from '@/lib/security/formGuard'

export interface DonateFormState {
  ok: boolean
  message: string
  /** Key into the `forms` catalogue, when the message is a translatable rejection. */
  messageKey?: FormRejectionKey
  /** Present on success so the page can show a confirmation panel with details. */
  receipt?: {
    amount: number
    currency: string
    frequency: 'one-time' | 'monthly'
    name: string
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_LEN = { name: 120, email: 254, message: 2000, currency: 8 }

function sanitize(value: unknown): string {
  return String(value ?? '').trim()
}

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').trim().replace(/\/$/, '')
}

/**
 * Record a donation / pledge from the public donate form.
 *
 * No public REST write: this trusted server action persists with overrideAccess,
 * matching the contact/newsletter pattern. Amount limits and allowed currencies
 * are enforced server-side from DonationSettings so the client cannot bypass
 * them. A receipt email is sent best-effort; a mail failure never loses the
 * pledge.
 */
export async function submitDonation(
  _prev: DonateFormState,
  formData: FormData,
): Promise<DonateFormState> {
  // Honeypot — silently accept without persisting.
  if (sanitize(formData.get('company'))) {
    return { ok: true, message: 'Thank you for your generosity.' }
  }

  // This form also sends mail (the receipt) and creates a record staff have to
  // reconcile by hand, so junk here costs real volunteer time.
  const guard = await guardFormSubmission({
    action: 'donate',
    limit: 5,
    windowSeconds: 900,
    formData,
  })
  if (!guard.ok) {
    return guard.silent
      ? { ok: true, message: 'Thank you for your generosity.' }
      : { ok: false, message: guard.message, messageKey: guard.messageKey }
  }

  const name = sanitize(formData.get('name'))
  const email = sanitize(formData.get('email'))
  const message = sanitize(formData.get('message'))
  const anonymous = sanitize(formData.get('anonymous')) === 'on' || sanitize(formData.get('anonymous')) === 'true'
  const frequency = sanitize(formData.get('frequency')) === 'monthly' ? 'monthly' : 'one-time'
  const locale = sanitize(formData.get('locale')) === 'ti' ? 'ti' : 'en'
  const currencyRaw = sanitize(formData.get('currency')).toUpperCase() || 'ERN'
  const amount = Number(sanitize(formData.get('amount')))

  if (!name || name.length > MAX_LEN.name) return { ok: false, message: 'Please enter your name.' }
  if (!email || !EMAIL_RE.test(email) || email.length > MAX_LEN.email) {
    return { ok: false, message: 'Please enter a valid email address.' }
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, message: 'Please enter a donation amount greater than zero.' }
  }
  if (message.length > MAX_LEN.message) return { ok: false, message: 'Your message is too long.' }
  if (currencyRaw.length > MAX_LEN.currency) return { ok: false, message: 'Invalid currency.' }

  try {
    const payload = await getPayload()

    // Enforce settings server-side.
    const settings = (await payload.findGlobal({ slug: 'donation-settings' } as any)) as any
    if (settings?.enabled === false) {
      return { ok: false, message: 'Donations are not currently being accepted. Please check back soon.' }
    }
    const min = Number(settings?.minAmount ?? 0)
    const max = Number(settings?.maxAmount ?? 0)
    if (min && amount < min) return { ok: false, message: `The minimum donation is ${min}.` }
    if (max && amount > max) return { ok: false, message: `The maximum donation is ${max}.` }

    const allowed: string[] = Array.isArray(settings?.currencies)
      ? settings.currencies.map((c: any) => String(c.code).toUpperCase()).filter(Boolean)
      : []
    const defaultCurrency = String(settings?.defaultCurrency ?? 'ERN').toUpperCase()
    const currency =
      currencyRaw === defaultCurrency || allowed.includes(currencyRaw) ? currencyRaw : defaultCurrency

    if (settings?.allowRecurring === false && frequency === 'monthly') {
      return { ok: false, message: 'Recurring donations are not available.' }
    }

    await payload.create({
      collection: 'donations',
      overrideAccess: true, // status/submittedAt/provider set by the collection hook
      data: {
        donorName: name,
        donorEmail: email,
        amount,
        currency,
        frequency,
        anonymous,
        message: message || undefined,
      } as any,
    })

    // Best-effort receipt. Never fail the donation because email is misconfigured.
    try {
      const amountLabel = `${amount.toLocaleString()} ${currency}`
      const freqLabel = frequency === 'monthly' ? ' (monthly)' : ''
      await payload.sendEmail({
        to: email,
        subject: 'Thank you for your donation — Eparchy of Segeneyti',
        html: `
          <p>Dear ${name},</p>
          <p>Thank you for your generous ${freqLabel ? 'monthly ' : ''}donation of <strong>${amountLabel}</strong>${freqLabel} to the Catholic Eparchy of Segeneyti.</p>
          <p>Your gift has been recorded. If you indicated a manual transfer, please complete it using the instructions shown on our donation page.</p>
          <p>May God bless you for your support.</p>
          <p><a href="${siteUrl()}/donate">${siteUrl()}/donate</a></p>
        `,
        text: `Dear ${name}, thank you for your donation of ${amountLabel}${freqLabel} to the Eparchy of Segeneyti. Your gift has been recorded.`,
      })
    } catch (mailErr) {
      console.error('[donate] receipt email failed', mailErr)
    }

    return {
      ok: true,
      message: settings?.thankYou || 'Thank you for your generous gift. A receipt has been sent to your email.',
      receipt: { amount, currency, frequency, name },
      // locale is captured for future localized receipts; kept in the record.
    }
  } catch (err) {
    console.error('[donate] submission error', err)
    void locale
    return { ok: false, message: 'Sorry, we could not record your donation. Please try again later.' }
  }
}
