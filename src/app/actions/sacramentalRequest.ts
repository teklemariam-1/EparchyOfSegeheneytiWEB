'use server'

import { getPayload } from '@/lib/payload/client'
import { guardFormSubmission, type FormRejectionKey } from '@/lib/security/formGuard'

export interface SacramentalRequestState {
  ok: boolean
  message: string
  /** Key into the `forms` catalogue, when the message is a translatable rejection. */
  messageKey?: FormRejectionKey
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Caps that bound a hostile payload without truncating an honest answer. */
const MAX_LEN = {
  name: 160,
  email: 254,
  phone: 40,
  parish: 160,
  date: 120,
  relationship: 120,
  purpose: 2000,
}

/** The sacraments a request may name. Anything else is rejected, not coerced. */
const SACRAMENTS = new Set([
  'baptism',
  'confirmation',
  'first-communion',
  'marriage',
  'freedom-to-marry',
  'other',
])

function sanitize(value: unknown): string {
  return String(value ?? '').trim()
}

const SUCCESS_MESSAGE =
  'Your request has been received. The chancery will contact you by email, usually within a few days.'

/**
 * Records a request for a sacramental certificate.
 *
 * Mirrors the contact/newsletter/donate actions deliberately: the collection
 * slug is hardcoded, `data` is assembled from explicitly named fields, and
 * nothing from the form is spread into the document. That is what stops a
 * crafted submission setting `status: 'completed'` or writing to a different
 * collection.
 *
 * Abuse protection is the shared `guardFormSubmission` — honeypot, signed
 * timing token, per-client rate limit, and Turnstile when staff enable it. This
 * form is a more attractive target than most, because every submission causes a
 * human to go and search a paper register.
 */
export async function submitSacramentalRequest(
  _prev: SacramentalRequestState,
  formData: FormData,
): Promise<SacramentalRequestState> {
  // Honeypot: silently accept so an automated sender learns nothing.
  if (sanitize(formData.get('company'))) {
    return { ok: true, message: SUCCESS_MESSAGE }
  }

  const guard = await guardFormSubmission({
    action: 'sacramental-request',
    // Tighter than contact (5/10min): each of these costs staff time in a
    // physical archive, so the ceiling is lower.
    limit: 3,
    windowSeconds: 900,
    formData,
  })
  if (!guard.ok) {
    return guard.silent
      ? { ok: true, message: SUCCESS_MESSAGE }
      : { ok: false, message: guard.message, messageKey: guard.messageKey }
  }

  const sacrament = sanitize(formData.get('sacrament'))
  const subjectName = sanitize(formData.get('subjectName'))
  const requesterName = sanitize(formData.get('requesterName'))
  const requesterEmail = sanitize(formData.get('requesterEmail'))
  const requesterPhone = sanitize(formData.get('requesterPhone'))
  const parish = sanitize(formData.get('parish'))
  const approximateDate = sanitize(formData.get('approximateDate'))
  const fatherName = sanitize(formData.get('fatherName'))
  const motherName = sanitize(formData.get('motherName'))
  const relationship = sanitize(formData.get('relationship'))
  const purpose = sanitize(formData.get('purpose'))

  if (!SACRAMENTS.has(sacrament)) {
    return { ok: false, message: 'Please choose which record you need.' }
  }
  if (!subjectName || subjectName.length > MAX_LEN.name) {
    return { ok: false, message: 'Please give the full name of the person the record is about.' }
  }
  if (!requesterName || requesterName.length > MAX_LEN.name) {
    return { ok: false, message: 'Please give your name.' }
  }
  if (!requesterEmail || !EMAIL_RE.test(requesterEmail) || requesterEmail.length > MAX_LEN.email) {
    return { ok: false, message: 'Please give a valid email address — this is how the chancery will reply.' }
  }
  if (purpose.length > MAX_LEN.purpose) {
    return { ok: false, message: 'Your explanation is too long.' }
  }

  try {
    const payload = await getPayload()
    await payload.create({
      collection: 'sacramental-requests',
      // Trusted server context. status/submittedAt are set by the collection's
      // beforeChange hook, never from this input.
      overrideAccess: true,
      data: {
        sacrament,
        subjectName,
        requesterName,
        requesterEmail,
        requesterPhone: requesterPhone.slice(0, MAX_LEN.phone) || undefined,
        parish: parish.slice(0, MAX_LEN.parish) || undefined,
        approximateDate: approximateDate.slice(0, MAX_LEN.date) || undefined,
        fatherName: fatherName.slice(0, MAX_LEN.name) || undefined,
        motherName: motherName.slice(0, MAX_LEN.name) || undefined,
        relationship: relationship.slice(0, MAX_LEN.relationship) || undefined,
        purpose: purpose || undefined,
      } as never,
    })

    // Acknowledgement. Best-effort: a mail failure must never lose a request
    // that someone needs for a wedding.
    try {
      await payload.sendEmail({
        to: requesterEmail,
        subject: 'We have your request — Eparchy of Segheneyti',
        html: `
          <p>Dear ${requesterName},</p>
          <p>We have received your request for a record concerning <strong>${subjectName}</strong>.</p>
          <p>The chancery will look for it and reply to this address. Records held only in handwritten parish registers can take longer to find, so please allow a little time before following up.</p>
          <p>— Catholic Eparchy of Segheneyti</p>
        `,
        text: `Dear ${requesterName}, we have received your request for a record concerning ${subjectName}. The chancery will reply to this address. — Catholic Eparchy of Segheneyti`,
      })
    } catch (mailErr) {
      console.error('[sacramental-request] acknowledgement email failed', mailErr)
    }

    return { ok: true, message: SUCCESS_MESSAGE }
  } catch (err) {
    console.error('[sacramental-request] submission error', err)
    return {
      ok: false,
      message: 'Sorry, we could not record your request. Please try again later.',
    }
  }
}
