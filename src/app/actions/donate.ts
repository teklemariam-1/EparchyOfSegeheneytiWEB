'use server'

import { redirect } from 'next/navigation'
import { getPayload } from '@/lib/payload/client'
import { guardFormSubmission, type FormRejectionKey } from '@/lib/security/formGuard'
import { resolveDonationConfig, type PaymentMethod } from '@/lib/donations/settings'
import { parseDonation, errorMessageKey } from '@/lib/donations/submission'
import { reserveReference } from '@/lib/donations/reference'
import { sendDonorReceipt, sendEparchyNotification } from '@/lib/donations/receipts'
import { getStripe, isStripeConfigured, type DonationMetadata } from '@/lib/donations/stripe'

export interface DonateFormState {
  ok: boolean
  message: string
  /** Key into the `forms` catalogue, when the message is a translatable rejection. */
  messageKey?: FormRejectionKey
  /** Key into `donate.errors`, when the message is a validation rejection. */
  errorKey?: string
  /** Interpolated into the error message where it needs a number (min/max). */
  errorValue?: number
  /** Present after a manual pledge, so the page can show what to transfer. */
  pledge?: {
    id: string
    reference: string
    amountMinor: number
    currency: string
    frequency: 'one-time' | 'monthly'
    name: string
  }
}

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').trim().replace(/\/$/, '')
}

/**
 * Handle a donation from the public donate form, by either method.
 *
 * ── Manual transfer ────────────────────────────────────────────────────────
 * Records a `pending` pledge with a server-generated reference code, emails the
 * donor that code together with the transfer details, and notifies the Eparchy.
 * The gift is explicitly NOT treated as received — the treasurer marks it
 * succeeded when the transfer lands, matching on the reference.
 *
 * ── Card ───────────────────────────────────────────────────────────────────
 * Records a `pending` donation, creates a Stripe Checkout Session for an amount
 * **computed here from settings**, and redirects the browser to Stripe's hosted
 * page. Nothing about the price comes from the submitted form beyond a
 * candidate value that `parseDonation` re-derives and bounds. The record is
 * promoted to `succeeded` only by the verified webhook — never by this action,
 * and never by the page the donor returns to.
 *
 * No public REST write: this trusted server action persists with overrideAccess,
 * matching the contact/newsletter pattern.
 */
export async function submitDonation(
  _prev: DonateFormState,
  formData: FormData,
): Promise<DonateFormState> {
  // Honeypot — silently accept without persisting.
  if (String(formData.get('company') ?? '').trim()) {
    return { ok: true, message: 'Thank you for your generosity.' }
  }

  // This form sends mail and creates a record staff have to reconcile by hand,
  // so junk here costs real volunteer time.
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

  const requestedMethod: PaymentMethod =
    String(formData.get('method') ?? 'manual') === 'stripe' ? 'stripe' : 'manual'

  // Assigned inside the try, used after it — `redirect()` signals by throwing,
  // and the catch below must not swallow that signal.
  let checkoutUrl: string | null = null
  let result: DonateFormState

  try {
    const payload = await getPayload()
    // Load settings in the donor's language: `manualInstructions` and
    // `stripeAccountNotice` are localized, and the pledge email built below
    // uses them. Without this a Tigrinya donor gets English transfer notes.
    const submittedLocale = String(formData.get('locale') ?? '') === 'ti' ? 'ti' : 'en'
    const settings = (await payload.findGlobal({
      slug: 'donation-settings',
      locale: submittedLocale,
    } as any)) as any
    const config = resolveDonationConfig(settings, isStripeConfigured())

    const parsed = parseDonation(formData, config, requestedMethod)
    if (!parsed.ok) {
      return {
        ok: false,
        message: 'Please check the form and try again.',
        errorKey: errorMessageKey(parsed.error),
        errorValue: parsed.error.field === 'amount' ? parsed.error.limit : undefined,
      }
    }
    const donation = parsed.value

    // Every donation gets a reference, card ones included: it is what a donor
    // quotes when they write asking about a gift, and what staff search on.
    const reference = await reserveReference(payload as any)

    const created = (await payload.create({
      collection: 'donations',
      overrideAccess: true,
      data: {
        donorName: donation.name,
        donorEmail: donation.email,
        amountMinor: donation.amountMinor,
        // `amount` is re-derived from amountMinor by the collection hook.
        amount: donation.amount,
        currency: donation.currency,
        frequency: donation.frequency,
        anonymous: donation.anonymous,
        locale: donation.locale,
        message: donation.message || undefined,
        reference,
        provider: donation.method,
        status: 'pending',
      } as any,
    })) as any

    const emailRecord = {
      id: created.id,
      donorName: donation.name,
      donorEmail: donation.email,
      amountMinor: donation.amountMinor,
      currency: donation.currency,
      reference,
      message: donation.message,
      locale: donation.locale,
      method: donation.method,
    }

    if (donation.method === 'stripe') {
      const stripe = getStripe()
      const metadata: DonationMetadata = {
        donationId: String(created.id),
        reference,
        locale: donation.locale,
        anonymous: donation.anonymous ? 'true' : 'false',
      }
      const returnUrl = `${siteUrl()}/donate/complete?id=${created.id}&ref=${encodeURIComponent(reference)}`

      const session = await stripe.checkout.sessions.create(
        {
          mode: 'payment',
          // Hosted Checkout: the card is entered on Stripe's own page, so no
          // card data ever touches this origin and the site stays in the
          // smallest PCI scope (SAQ-A).
          ui_mode: 'hosted_page',
          customer_email: donation.email,
          client_reference_id: reference,
          metadata,
          line_items: [
            {
              quantity: 1,
              price_data: {
                currency: donation.currency.toLowerCase(),
                // Server-computed integer. The browser cannot influence this.
                unit_amount: donation.amountMinor,
                product_data: {
                  name: 'Donation — Catholic Eparchy of Segheneyti',
                  description: `Reference ${reference}`,
                },
              },
            },
          ],
          payment_intent_data: {
            // Repeated on the PaymentIntent so `payment_intent.*` events can be
            // resolved without first re-fetching the session.
            metadata,
            ...(config.statementDescriptor ? { statement_descriptor: config.statementDescriptor } : {}),
          },
          success_url: returnUrl,
          cancel_url: `${returnUrl}&cancelled=1`,
          // Stripe expires the session after an hour; the pending row is caught
          // by the stale-donation check in the admin so it cannot sit unnoticed.
          expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
        },
        {
          // Guards a double-submit: a donor who clicks twice, or a retried
          // request, resolves to the same session rather than two charges.
          idempotencyKey: `donation-${created.id}`,
        },
      )

      await payload.update({
        collection: 'donations',
        id: created.id,
        overrideAccess: true,
        data: { stripeSessionId: session.id } as any,
      })

      if (!session.url) {
        console.error('[donate] Stripe returned a session with no URL', { id: created.id })
        return {
          ok: false,
          message: 'We could not start the card payment. Please try again.',
          errorKey: 'checkoutFailed',
        }
      }

      checkoutUrl = session.url
      result = { ok: true, message: '' }
    } else {
      // Manual pledge: tell the donor exactly how to complete it, and tell the
      // Eparchy that a transfer is expected. Both are best-effort — a mail
      // outage must not lose the pledge.
      await sendDonorReceipt(payload as any, emailRecord, 'pledge', config.transferDetails)
      await sendEparchyNotification(payload as any, emailRecord, 'pending')

      result = {
        ok: true,
        message: '',
        pledge: {
          id: String(created.id),
          reference,
          amountMinor: donation.amountMinor,
          currency: donation.currency,
          frequency: donation.frequency,
          name: donation.name,
        },
      }
    }
  } catch (err) {
    console.error('[donate] submission error', err)
    return {
      ok: false,
      message: 'Sorry, we could not record your donation. Please try again later.',
      errorKey: 'generic',
    }
  }

  // Outside the try, for the reason given above.
  if (checkoutUrl) redirect(checkoutUrl)

  return result
}
