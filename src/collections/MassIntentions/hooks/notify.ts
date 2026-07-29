import type { CollectionAfterChangeHook } from 'payload'

/**
 * The email answering the requester's only real question: when?
 *
 * Someone who asked for a Mass on a parent's anniversary is holding a date in
 * their mind. `scheduled` is the notification that matters; `celebrated`
 * closes the loop for a family far away who could not be there; `declined`
 * invites them to talk to the chancery rather than leaving silence.
 *
 * Same failure policy as every notification hook here: email never rethrows,
 * because losing a staff member's status change to a dead SMTP host is worse
 * than a missed email.
 */

interface IntentionDoc {
  status?: string
  scheduledFor?: string | null
  forWhom?: string
  parish?: string | null
  requesterEmail?: string
  requesterName?: string
}

/** DD/MM/YYYY in UTC — dayOnly dates must not drift a day in the reader's zone. */
function fmtDate(iso: string | null | undefined): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  const dd = String(d.getUTCDate()).padStart(2, '0')
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${d.getUTCFullYear()}`
}

function messageFor(doc: IntentionDoc): { subject: string; body: string } | null {
  const date = fmtDate(doc.scheduledFor)
  const where = doc.parish ? ` at ${doc.parish}` : ''

  switch (doc.status) {
    case 'scheduled':
      return {
        subject: 'Your Mass intention has been scheduled — Eparchy of Segheneyti',
        body: date
          ? `The Mass for <strong>${doc.forWhom ?? 'your intention'}</strong> will be offered${where} on <strong>${date}</strong>.`
          : // Staff moved the status without setting the date. Say something
            // true rather than inventing a date or sending nothing.
            `The Mass for <strong>${doc.forWhom ?? 'your intention'}</strong> has been scheduled${where}. The chancery will confirm the date shortly.`,
      }
    case 'celebrated':
      return {
        subject: 'The Mass for your intention has been offered — Eparchy of Segheneyti',
        body: `The Mass for <strong>${doc.forWhom ?? 'your intention'}</strong> was offered${where}${date ? ` on ${date}` : ''}. Be assured of the prayers of the Eparchy.`,
      }
    case 'declined':
      return {
        subject: 'About your Mass intention — Eparchy of Segheneyti',
        body: 'We were not able to arrange this intention as requested. Please reply to this message and the chancery will discuss it with you.',
      }
    default:
      // `new` is covered by the submission acknowledgement.
      return null
  }
}

export const notifyRequesterOnStatusChange: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  operation,
  req,
}) => {
  const current = doc as IntentionDoc
  const previous = previousDoc as IntentionDoc | undefined

  // A genuine transition only — editing staff notes must not re-announce the
  // Mass. A date change on an ALREADY-scheduled intention does re-send, on
  // purpose: a moved Mass is exactly what the family needs to hear about.
  if (operation !== 'update') return doc
  const statusChanged = previous && previous.status !== current.status
  const dateMovedWhileScheduled =
    current.status === 'scheduled' && previous && previous.scheduledFor !== current.scheduledFor
  if (!statusChanged && !dateMovedWhileScheduled) return doc

  const message = messageFor(current)
  if (!message || !current.requesterEmail) return doc

  try {
    await req.payload.sendEmail({
      to: current.requesterEmail,
      subject: message.subject,
      html: `
        <p>Dear ${current.requesterName ?? 'friend'},</p>
        <p>${message.body}</p>
        <p>— Catholic Eparchy of Segheneyti</p>
      `,
      text: `Dear ${current.requesterName ?? 'friend'},\n\n${message.body.replace(/<[^>]+>/g, '')}\n\n— Catholic Eparchy of Segheneyti`,
    })
  } catch (err) {
    req.payload.logger?.error?.(
      `[mass-intentions] status email failed for ${(doc as { id?: unknown }).id}: ${String(err)}`,
    )
  }

  return doc
}
