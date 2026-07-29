'use server'

import { getPayload } from '@/lib/payload/client'
import { guardFormSubmission, type FormRejectionKey } from '@/lib/security/formGuard'

export interface MassIntentionState {
  ok: boolean
  message: string
  messageKey?: FormRejectionKey
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const MAX_LEN = {
  name: 160,
  email: 254,
  phone: 40,
  parish: 160,
  date: 120,
  details: 2000,
}

/** The intention types the form may name. Anything else is rejected, not coerced. */
const INTENTION_TYPES = new Set(['repose', 'anniversary', 'healing', 'thanksgiving', 'special'])

function sanitize(value: unknown): string {
  return String(value ?? '').trim()
}

const SUCCESS_MESSAGE =
  'Your intention has been received. The chancery will arrange the Mass and email you the date.'

/**
 * Records a Mass intention request.
 *
 * Mirrors the sacramental-request action deliberately: hardcoded collection
 * slug, `data` assembled from explicitly named fields, nothing spread from
 * FormData — so a crafted submission cannot arrive pre-`scheduled` or write
 * staff notes. Abuse protection is the shared guard; the limit matches
 * sacramental requests (3 per 15 min) because each submission asks a priest
 * for a real celebration.
 */
export async function submitMassIntention(
  _prev: MassIntentionState,
  formData: FormData,
): Promise<MassIntentionState> {
  // Honeypot: silent fake success, so a bot learns nothing.
  if (sanitize(formData.get('company'))) {
    return { ok: true, message: SUCCESS_MESSAGE }
  }

  const guard = await guardFormSubmission({
    action: 'mass-intention',
    limit: 3,
    windowSeconds: 900,
    formData,
  })
  if (!guard.ok) {
    return guard.silent
      ? { ok: true, message: SUCCESS_MESSAGE }
      : { ok: false, message: guard.message, messageKey: guard.messageKey }
  }

  const intentionType = sanitize(formData.get('intentionType'))
  const forWhom = sanitize(formData.get('forWhom'))
  const parish = sanitize(formData.get('parish'))
  const preferredDate = sanitize(formData.get('preferredDate'))
  const details = sanitize(formData.get('details'))
  const requesterName = sanitize(formData.get('requesterName'))
  const requesterEmail = sanitize(formData.get('requesterEmail'))
  const requesterPhone = sanitize(formData.get('requesterPhone'))

  if (!INTENTION_TYPES.has(intentionType)) {
    return { ok: false, message: 'Please choose what the Mass is for.' }
  }
  if (!forWhom || forWhom.length > MAX_LEN.name) {
    return { ok: false, message: 'Please say who the Mass is for.' }
  }
  if (!requesterName || requesterName.length > MAX_LEN.name) {
    return { ok: false, message: 'Please give your name.' }
  }
  if (!requesterEmail || !EMAIL_RE.test(requesterEmail) || requesterEmail.length > MAX_LEN.email) {
    return { ok: false, message: 'Please give a valid email address — the date will be sent to it.' }
  }
  if (details.length > MAX_LEN.details) {
    return { ok: false, message: 'Your message is too long.' }
  }

  try {
    const payload = await getPayload()
    await payload.create({
      collection: 'mass-intentions',
      // Trusted server context; status/submittedAt come from the collection's
      // beforeChange hook, never from this input.
      overrideAccess: true,
      data: {
        intentionType,
        forWhom,
        parish: parish.slice(0, MAX_LEN.parish) || undefined,
        preferredDate: preferredDate.slice(0, MAX_LEN.date) || undefined,
        details: details || undefined,
        requesterName,
        requesterEmail,
        requesterPhone: requesterPhone.slice(0, MAX_LEN.phone) || undefined,
      } as never,
    })

    // Acknowledgement, best-effort — a dead mail server must not lose an
    // intention someone attached to an anniversary.
    try {
      await payload.sendEmail({
        to: requesterEmail,
        subject: 'We have received your Mass intention — Eparchy of Segheneyti',
        html: `
          <p>Dear ${requesterName},</p>
          <p>We have received your request for a Mass to be offered for <strong>${forWhom}</strong>.</p>
          <p>The chancery will arrange it with a parish and email you the date. If you wish to make an offering with your intention, you may do so at any time through the donations page.</p>
          <p>— Catholic Eparchy of Segheneyti</p>
        `,
        text: `Dear ${requesterName}, we have received your request for a Mass to be offered for ${forWhom}. The chancery will arrange it and email you the date. — Catholic Eparchy of Segheneyti`,
      })
    } catch (mailErr) {
      console.error('[mass-intention] acknowledgement email failed', mailErr)
    }

    return { ok: true, message: SUCCESS_MESSAGE }
  } catch (err) {
    console.error('[mass-intention] submission error', err)
    return { ok: false, message: 'Sorry, we could not record your intention. Please try again later.' }
  }
}
