import type { CollectionAfterChangeHook } from 'payload'

/**
 * Tells the requester when their request moves.
 *
 * Someone waiting on a baptism certificate for a wedding abroad has no way to
 * see inside the chancery. Silence is the thing that generates the follow-up
 * emails this collection exists to reduce, so a status change is worth a note.
 *
 * ── Which states are worth an email ──────────────────────────────────────────
 * Not all of them. `in-progress` is an internal bookkeeping move — telling
 * someone "we have started" adds an inbox item and no information. The states
 * that change what the requester should DO are the ones that send.
 *
 * ── Failure policy ───────────────────────────────────────────────────────────
 * Email is best-effort and never rethrows. Losing the request because the SMTP
 * host is unreachable would be a far worse outcome than a missed notification —
 * the record is safe in the collection either way, and staff can see it.
 */

/** Status → whether the requester hears about it, and what they are told. */
const NOTIFY_ON: Record<string, { subject: string; body: string } | undefined> = {
  'in-progress': undefined, // internal bookkeeping; no email
  new: undefined, //           the submission acknowledgement already covered this
  waiting: {
    subject: 'We need a little more information — Eparchy of Segheneyti',
    body: 'We have looked at your request and need some further detail before we can continue. Someone from the chancery will be in touch shortly. You can also reply to this message.',
  },
  completed: {
    subject: 'Your record request is ready — Eparchy of Segheneyti',
    body: 'Your request has been completed. If a document was to be posted or emailed to you, it is on its way. If you have not received it within a few days, reply to this message and we will follow up.',
  },
  declined: {
    subject: 'About your record request — Eparchy of Segheneyti',
    body: 'We were not able to fulfil your request as it stands. This is often because the record could not be located with the details provided. Please reply to this message with anything further you know — a parish name, an approximate year, or a parent\'s name — and we will look again.',
  },
}

interface RequestDoc {
  status?: string
  requesterEmail?: string
  requesterName?: string
  subjectName?: string
  sacrament?: string
}

export const notifyRequesterOnStatusChange: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  operation,
  req,
}) => {
  const current = doc as RequestDoc
  const previous = previousDoc as RequestDoc | undefined

  // Only a genuine transition. A save that touches staff notes must not
  // re-send "your record is ready".
  if (operation !== 'update') return doc
  if (!previous || previous.status === current.status) return doc

  const message = NOTIFY_ON[current.status ?? '']
  if (!message || !current.requesterEmail) return doc

  try {
    await req.payload.sendEmail({
      to: current.requesterEmail,
      subject: message.subject,
      html: `
        <p>Dear ${current.requesterName ?? 'friend'},</p>
        <p>${message.body}</p>
        <p style="color:#666">Regarding: ${current.sacrament ?? 'record'} for ${current.subjectName ?? ''}</p>
        <p>— Catholic Eparchy of Segheneyti</p>
      `,
      text: `Dear ${current.requesterName ?? 'friend'},\n\n${message.body}\n\nRegarding: ${current.sacrament ?? 'record'} for ${current.subjectName ?? ''}\n\n— Catholic Eparchy of Segheneyti`,
    })
  } catch (err) {
    // Never rethrow: the status change is already saved, and failing here would
    // roll back a staff member's work because a mail server was down.
    req.payload.logger?.error?.(
      `[sacramental-requests] status email failed for request ${(doc as { id?: unknown }).id}: ${String(err)}`,
    )
  }

  return doc
}
