'use server'

import { getPayload } from '@/lib/payload/client'
import { guardFormSubmission, reportSuspicious, type FormRejectionKey } from '@/lib/security/formGuard'

export interface ContactFormState {
  ok: boolean
  message: string
  /** Key into the `forms` catalogue, when the message is a translatable rejection. */
  messageKey?: FormRejectionKey
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_LEN = { name: 120, email: 254, phone: 30, subject: 200, message: 4000 }

function sanitize(value: unknown): string {
  return String(value ?? '').trim()
}

const SUCCESS_MESSAGE =
  'Thank you for your message. We will get back to you as soon as possible.'

export async function submitContactForm(
  _prev: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  // Honeypot — a hidden field real users never see. If it's filled, silently
  // accept (so the bot believes it succeeded) but do not persist anything.
  const honeypot = sanitize(formData.get('company'))
  if (honeypot) {
    reportSuspicious('contact', 'honeypot')
    return { ok: true, message: SUCCESS_MESSAGE }
  }

  // Timing check, per-client rate limit, and (when staff enable it) Turnstile.
  // Runs before validation so a flood costs us one counter write, not a full
  // parse and a database round-trip.
  const guard = await guardFormSubmission({
    action: 'contact',
    limit: 5,
    windowSeconds: 600,
    formData,
  })
  if (!guard.ok) {
    // Silent failures mimic success so an automated sender learns nothing.
    return guard.silent
      ? { ok: true, message: SUCCESS_MESSAGE }
      : { ok: false, message: guard.message, messageKey: guard.messageKey }
  }

  const firstName = sanitize(formData.get('firstName'))
  const lastName = sanitize(formData.get('lastName'))
  const email = sanitize(formData.get('email'))
  const phone = sanitize(formData.get('phone'))
  const subject = sanitize(formData.get('subject'))
  const message = sanitize(formData.get('message'))

  // Basic validation
  if (!firstName || !lastName) {
    return { ok: false, message: 'Please provide your full name.' }
  }
  if (!email || !EMAIL_RE.test(email)) {
    return { ok: false, message: 'Please provide a valid email address.' }
  }
  if (!subject) {
    return { ok: false, message: 'Please select a subject.' }
  }
  if (!message || message.length < 10) {
    return { ok: false, message: 'Please write a message of at least 10 characters.' }
  }

  // Length limits (defence against oversized payloads)
  const name = `${firstName} ${lastName}`
  if (name.length > MAX_LEN.name) {
    return { ok: false, message: 'Name is too long.' }
  }
  if (email.length > MAX_LEN.email) {
    return { ok: false, message: 'Email address is too long.' }
  }
  if (phone.length > MAX_LEN.phone) {
    return { ok: false, message: 'Phone number is too long.' }
  }
  if (subject.length > MAX_LEN.subject) {
    return { ok: false, message: 'Subject is too long.' }
  }
  if (message.length > MAX_LEN.message) {
    return { ok: false, message: 'Message is too long (max 4 000 characters).' }
  }

  try {
    const payload = await getPayload()
    await payload.create({
      collection: 'contact-submissions',
      // Trusted server context: bypass field-level access (which is there to
      // lock down the *public* REST endpoint). status/submittedAt are set by
      // the collection's beforeChange hook, not by client input.
      overrideAccess: true,
      data: {
        name,
        email,
        phone: phone || undefined,
        subject,
        message,
      } as any,
    })

    return { ok: true, message: SUCCESS_MESSAGE }
  } catch (err) {
    console.error('[contact-form] submission error', err)
    return {
      ok: false,
      message: 'Sorry, there was a problem sending your message. Please try again later.',
    }
  }
}
