import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sendArticleToSubscribers } from '../send'

/**
 * Sending mail to every subscriber is the most consequential button in the
 * admin. The properties pinned here are the ones whose failure mails real
 * people wrongly: double-sends, drafts leaking, pending addresses mailed,
 * missing unsubscribe links.
 */

const findByID = vi.fn()
const find = vi.fn()
const create = vi.fn(async () => ({}))
const sendEmail = vi.fn(async () => undefined)
const logger = { error: vi.fn(), info: vi.fn() }

const payload = { findByID, find, create, sendEmail, logger } as never

const article = { id: 7, title: 'Feast of St Michael', excerpt: 'The eparchy celebrates.', slug: 'feast', _status: 'published' }
const subscriber = (email: string, token = 'tok-' + email) => ({ email, unsubscribeToken: token, status: 'confirmed' })

/** find() responses in call order: dedupe lookup, then subscribers. */
function arrange({ prior = [] as unknown[], subs = [subscriber('a@example.org')] } = {}) {
  findByID.mockResolvedValue(article)
  find.mockReset()
  find.mockResolvedValueOnce({ docs: prior }).mockResolvedValueOnce({ docs: subs })
}

beforeEach(() => {
  findByID.mockReset()
  create.mockClear()
  sendEmail.mockReset().mockResolvedValue(undefined)
  logger.error.mockClear()
})

describe('what may be sent', () => {
  it('refuses a draft — mailing it would leak unpublished content', async () => {
    findByID.mockResolvedValue({ ...article, _status: 'draft' })
    const result = await sendArticleToSubscribers(payload, { newsId: 7 })
    expect(result).toEqual({ ok: false, reason: 'not-published' })
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('refuses a missing article', async () => {
    findByID.mockRejectedValue(new Error('not found'))
    const result = await sendArticleToSubscribers(payload, { newsId: 999 })
    expect(result.reason).toBe('not-found')
  })

  it('refuses a SECOND send of the same article — the property that matters most', async () => {
    arrange({ prior: [{ sentAt: '2026-07-30T06:00:00.000Z' }] })
    const result = await sendArticleToSubscribers(payload, { newsId: 7 })
    expect(result).toEqual({ ok: false, reason: 'already-sent', sentAt: '2026-07-30T06:00:00.000Z' })
    expect(sendEmail).not.toHaveBeenCalled()
    expect(create).not.toHaveBeenCalled()
  })

  it('refuses when nobody has confirmed — and writes no log, so it can be sent later', async () => {
    arrange({ subs: [] })
    const result = await sendArticleToSubscribers(payload, { newsId: 7 })
    expect(result.reason).toBe('no-subscribers')
    expect(create).not.toHaveBeenCalled()
  })
})

describe('who receives it', () => {
  it('queries only confirmed subscribers — double-opt-in holds at send time too', async () => {
    arrange()
    await sendArticleToSubscribers(payload, { newsId: 7 })
    const subscriberQuery = find.mock.calls[1]![0] as { where: { status: { equals: string } } }
    expect(subscriberQuery.where.status).toEqual({ equals: 'confirmed' })
  })

  it('gives every email that recipient\'s own unsubscribe link', async () => {
    arrange({ subs: [subscriber('a@example.org', 'AAA'), subscriber('b@example.org', 'BBB')] })
    await sendArticleToSubscribers(payload, { newsId: 7 })
    const [first, second] = sendEmail.mock.calls.map((c) => c[0] as { to: string; html: string })
    expect(first!.html).toContain('token=AAA')
    expect(second!.html).toContain('token=BBB')
    expect(first!.html).not.toContain('BBB')
  })
})

describe('resilience and the record', () => {
  it('one bad address never stops the rest', async () => {
    arrange({ subs: [subscriber('a@x.org'), subscriber('b@x.org'), subscriber('c@x.org')] })
    sendEmail
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('mailbox full'))
      .mockResolvedValueOnce(undefined)

    const result = await sendArticleToSubscribers(payload, { newsId: 7 })
    expect(result.ok).toBe(true)
    expect(result.recipientCount).toBe(2)
    expect(result.failureCount).toBe(1)
    expect(logger.error).toHaveBeenCalledTimes(1)
  })

  it('records the send with counts and the actor', async () => {
    arrange()
    await sendArticleToSubscribers(payload, { newsId: 7, actorId: 3 })
    const log = create.mock.calls[0]![0] as { collection: string; data: Record<string, unknown> }
    expect(log.collection).toBe('newsletter-sends')
    expect(log.data.news).toBe(7)
    expect(log.data.recipientCount).toBe(1)
    expect(log.data.sentBy).toBe(3)
  })

  it('escapes the article title in the email body', async () => {
    findByID.mockResolvedValue({ ...article, title: 'Feast <script>alert(1)</script>' })
    find.mockReset()
    find.mockResolvedValueOnce({ docs: [] }).mockResolvedValueOnce({ docs: [subscriber('a@x.org')] })
    await sendArticleToSubscribers(payload, { newsId: 7 })
    const sent = sendEmail.mock.calls[0]![0] as { html: string }
    expect(sent.html).not.toContain('<script>')
    expect(sent.html).toContain('&lt;script&gt;')
  })
})
