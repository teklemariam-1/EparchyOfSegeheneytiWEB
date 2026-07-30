/**
 * Sending one published article to the confirmed subscriber list.
 *
 * This is the missing half of the newsletter: the double-opt-in signup,
 * confirmation and unsubscribe have existed for weeks, and nothing could ever
 * SEND to the list they built.
 *
 * ── The properties that matter ───────────────────────────────────────────────
 *  - IDEMPOTENT PER ARTICLE. A row in newsletter-sends means "already went";
 *    a second click or an impatient refresh refuses rather than re-mailing
 *    the whole list. There is deliberately no force flag — resending to
 *    everyone should be a rare enough act to require deleting nothing and
 *    instead asking a developer, not a button press.
 *  - CONFIRMED RECIPIENTS ONLY. Pending and unsubscribed rows are never
 *    mailed; the double-opt-in promise holds.
 *  - EVERY EMAIL CARRIES ITS OWN UNSUBSCRIBE LINK, built from the recipient's
 *    stable token. Both a legal requirement in most of the diaspora's
 *    countries and the thing that keeps the eparchy off spam blocklists.
 *  - ONE BAD ADDRESS NEVER STOPS THE REST. Per-recipient try/catch; failures
 *    are counted and logged, the loop continues.
 */

export interface SendResult {
  ok: boolean
  reason?: 'not-found' | 'not-published' | 'already-sent' | 'no-subscribers'
  sentAt?: string
  recipientCount?: number
  failureCount?: number
}

interface PayloadLike {
  findByID: (args: { collection: string; id: string | number; depth?: number; overrideAccess?: boolean }) => Promise<unknown>
  find: (args: Record<string, unknown>) => Promise<{ docs: unknown[] }>
  create: (args: Record<string, unknown>) => Promise<unknown>
  sendEmail: (args: { to: string; subject: string; html: string; text: string }) => Promise<unknown>
  logger?: { error?: (msg: string) => void; info?: (msg: string) => void }
}

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://eparchy-of-segeheneyti-web.vercel.app').replace(/\/$/, '')

function esc(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export async function sendArticleToSubscribers(
  payload: PayloadLike,
  options: { newsId: string | number; actorId?: string | number },
): Promise<SendResult> {
  const { newsId, actorId } = options

  interface Article {
    id: string | number
    title?: string
    excerpt?: string
    slug?: string
    _status?: string
  }
  let article: Article | null
  try {
    article = (await payload.findByID({
      collection: 'news',
      id: newsId,
      depth: 0,
      overrideAccess: true,
    })) as Article | null
  } catch {
    article = null
  }
  if (!article) return { ok: false, reason: 'not-found' }

  // Drafts stay drafts: mailing an unpublished article would leak it and link
  // every subscriber to a page that 404s (or soft-404s) for them.
  if (article._status !== 'published') return { ok: false, reason: 'not-published' }

  // The dedupe guard. One row per article, ever.
  const previous = await payload.find({
    collection: 'newsletter-sends',
    where: { news: { equals: newsId } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const existing = previous.docs[0] as { sentAt?: string } | undefined
  if (existing) return { ok: false, reason: 'already-sent', sentAt: existing.sentAt }

  const subscribers = await payload.find({
    collection: 'subscribers',
    where: { status: { equals: 'confirmed' } },
    limit: 1000,
    depth: 0,
    overrideAccess: true,
  })
  const recipients = subscribers.docs as { email?: string; unsubscribeToken?: string }[]
  if (recipients.length === 0) return { ok: false, reason: 'no-subscribers' }

  const title = article.title ?? 'News from the Eparchy'
  const articleUrl = `${SITE_URL}/news/${article.slug ?? ''}`
  const subject = `${title} — Eparchy of Segheneyti`

  let sent = 0
  let failed = 0
  for (const recipient of recipients) {
    if (!recipient.email) continue
    const unsubscribeUrl = `${SITE_URL}/api/newsletter/unsubscribe?token=${encodeURIComponent(recipient.unsubscribeToken ?? '')}`
    try {
      await payload.sendEmail({
        to: recipient.email,
        subject,
        html: `
          <div style="max-width:600px;margin:0 auto;font-family:Georgia,serif;color:#222">
            <h1 style="color:#911e1e;font-size:20px">${esc(title)}</h1>
            ${article.excerpt ? `<p style="font-size:15px;line-height:1.6">${esc(article.excerpt)}</p>` : ''}
            <p><a href="${articleUrl}" style="color:#911e1e;font-weight:bold">Read the full article →</a></p>
            <hr style="border:none;border-top:1px solid #ddd;margin:24px 0" />
            <p style="font-size:12px;color:#666">
              You are receiving this because you subscribed to news from the
              Catholic Eparchy of Segheneyti.
              <a href="${unsubscribeUrl}" style="color:#666">Unsubscribe</a>
            </p>
          </div>
        `,
        text: `${title}\n\n${article.excerpt ?? ''}\n\nRead the full article: ${articleUrl}\n\nUnsubscribe: ${unsubscribeUrl}`,
      })
      sent += 1
    } catch (err) {
      failed += 1
      payload.logger?.error?.(`[newsletter] send failed for one recipient: ${String(err)}`)
    }
  }

  const sentAt = new Date().toISOString()
  await payload.create({
    collection: 'newsletter-sends',
    overrideAccess: true,
    data: {
      news: newsId,
      subject,
      sentAt,
      sentBy: actorId ?? undefined,
      recipientCount: sent,
      failureCount: failed,
    },
  })

  payload.logger?.info?.(`[newsletter] "${title}" sent to ${sent} subscriber(s), ${failed} failure(s)`)
  return { ok: true, sentAt, recipientCount: sent, failureCount: failed }
}
