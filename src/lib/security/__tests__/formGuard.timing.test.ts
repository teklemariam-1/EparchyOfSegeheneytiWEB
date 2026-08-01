import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * A fast-looking submission must NOT be thrown away.
 *
 * This used to return a silent fake success: the visitor was told "we have
 * received your request" and nothing was stored. For a Mass intention or a
 * sacramental request that means someone asked for a Mass for their dead, was
 * thanked for it, and no one ever knew.
 *
 * The threshold is measured from when the token endpoint RESPONDS, not from
 * page load, so a slow fetch shortens a real person's apparent fill time — the
 * false positive is not hypothetical. Timing is a signal to record, not a
 * verdict to act on; the rate limit and Turnstile still gate abuse.
 *
 * If someone reinstates the discard, this test fails.
 */

const consume = vi.fn(async () => ({
  allowed: true,
  count: 1,
  remaining: 9,
  retryAfterSeconds: 60,
  degraded: false,
}))

vi.mock('../rateLimit', () => ({ consume: (...a: unknown[]) => consume(...(a as [])) }))
vi.mock('../turnstile', () => ({ verifyTurnstile: async () => true }))
vi.mock('next/headers', () => ({ headers: async () => new Headers() }))
vi.mock('@sentry/nextjs', () => ({ captureMessage: vi.fn() }))

const { guardFormSubmission } = await import('../formGuard')
const { issueFormToken } = await import('../formToken')

function formWith(token: string): FormData {
  const fd = new FormData()
  fd.set('formToken', token)
  return fd
}

const run = (fd: FormData) =>
  guardFormSubmission({ action: 'mass-intention', limit: 3, windowSeconds: 900, formData: fd })

beforeEach(() => {
  consume.mockClear()
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

describe('a submission that looks too fast', () => {
  it('is ACCEPTED, not silently discarded', async () => {
    // Issued right now: well inside the "too fast" window.
    const outcome = await run(formWith(issueFormToken(Date.now())))
    expect(outcome.ok).toBe(true)
  })

  it('still passes through the rate limiter', async () => {
    await run(formWith(issueFormToken(Date.now())))
    expect(consume).toHaveBeenCalledTimes(1)
  })

  it('leaves a server-side trace, so a silent accept is never invisible', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await run(formWith(issueFormToken(Date.now())))
    expect(warn).toHaveBeenCalled()
    expect(String(warn.mock.calls[0]?.[0])).toContain('too-fast')
  })
})

describe('the other verdicts are unchanged', () => {
  it('rejects an expired form with a message a person can act on', async () => {
    const threeHoursAgo = Date.now() - 3 * 60 * 60 * 1000
    const outcome = await run(formWith(issueFormToken(threeHoursAgo)))
    expect(outcome.ok).toBe(false)
    if (!outcome.ok && 'messageKey' in outcome) {
      expect(outcome.messageKey).toBe('formExpired')
    }
  })

  it('accepts a missing token rather than punishing a cached page', async () => {
    const outcome = await run(new FormData())
    expect(outcome.ok).toBe(true)
  })
})
