'use server'

import { getPayload } from '@/lib/payload/client'

export interface ContactFormState {
  ok: boolean
  message: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_LEN = { name: 120, email: 254, phone: 30, subject: 200, message: 4000 }

function sanitize(value: unknown): string {
  return String(value ?? '').trim()
}

export async function submitContactForm(
  _prev: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
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
      data: {
        name,
        email,
        phone: phone || undefined,
        subject,
        message,
        status: 'new',
      } as any,
    })

    return {
      ok: true,
      message:
        'Thank you for your message. We will get back to you as soon as possible.',
    }
  } catch (err) {
    console.error('[contact-form] submission error', err)
    return {
      ok: false,
      message: 'Sorry, there was a problem sending your message. Please try again later.',
    }
  }
}
