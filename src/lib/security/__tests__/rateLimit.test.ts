import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/**
 * The limiter is the only thing standing between a scripted client and
 * unlimited login attempts, so the behaviour that matters most is what it does
 * when the STORE fails — the auth endpoints must refuse, the analytics
 * endpoints must not.
 *
 * The Postgres upsert itself is exercised against a real database rather than
 * mocked here; these tests cover the decision logic around it.
 */

const execute = vi.fn()

vi.mock('../../payload/client', () => ({
  getPayload: vi.fn(async () => ({ db: { drizzle: { execute } } })),
}))

// The tagged-template `sql` helper is irrelevant to the decisions under test.
vi.mock('@payloadcms/db-postgres', () => ({
  sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({ strings, values }),
}))

const { consume } = await import('../rateLimit')

/** The upsert returns the running count for the window. */
function returnsCount(count: number) {
  execute.mockResolvedValueOnce({ rows: [{ count: String(count) }] })
}

beforeEach(() => {
  execute.mockReset()
  // Keep the opportunistic sweep out of the assertions.
  vi.spyOn(Math, 'random').mockReturnValue(0.99)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('counting', () => {
  it('allows a request inside the budget', async () => {
    returnsCount(1)
    const result = await consume('track:abc', { limit: 5, windowSeconds: 60, failOpen: true })
    expect(result.allowed).toBe(true)
    expect(result.count).toBe(1)
    expect(result.remaining).toBe(4)
    expect(result.degraded).toBe(false)
  })

  it('allows the request that exactly reaches the limit', async () => {
    returnsCount(5)
    const result = await consume('track:abc', { limit: 5, windowSeconds: 60, failOpen: true })
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(0)
  })

  it('refuses the one after it', async () => {
    returnsCount(6)
    const result = await consume('track:abc', { limit: 5, windowSeconds: 60, failOpen: true })
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('parses the count as a number — Drizzle returns numerics as strings', async () => {
    returnsCount(11)
    const result = await consume('auth:login:abc', { limit: 10, windowSeconds: 600, failOpen: false })
    // A string comparison would make '11' <= 10 false by luck but '9' <= 10 true
    // by accident; assert the type, not just the verdict.
    expect(typeof result.count).toBe('number')
    expect(result.allowed).toBe(false)
  })

  it('reports seconds until the window ends', async () => {
    returnsCount(1)
    const result = await consume('track:abc', { limit: 5, windowSeconds: 60, failOpen: true })
    expect(result.retryAfterSeconds).toBeGreaterThan(0)
    expect(result.retryAfterSeconds).toBeLessThanOrEqual(60)
  })
})

describe('when the store is unavailable', () => {
  beforeEach(() => {
    // Silence the expected console noise from the failure path.
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('FAILS CLOSED for auth — a database outage must not become an unlimited brute-force window', async () => {
    execute.mockRejectedValueOnce(new Error('connection refused'))
    const result = await consume('auth:login:abc', { limit: 10, windowSeconds: 600, failOpen: false })
    expect(result.allowed).toBe(false)
    expect(result.degraded).toBe(true)
    expect(result.remaining).toBe(0)
  })

  it('FAILS OPEN for analytics — a counter must never break a page view', async () => {
    execute.mockRejectedValueOnce(new Error('connection refused'))
    const result = await consume('track:abc', { limit: 60, windowSeconds: 60, failOpen: true })
    expect(result.allowed).toBe(true)
    expect(result.degraded).toBe(true)
  })

  it('still reports a retry window when degraded', async () => {
    execute.mockRejectedValueOnce(new Error('down'))
    const result = await consume('auth:login:abc', { limit: 10, windowSeconds: 600, failOpen: false })
    expect(result.retryAfterSeconds).toBeGreaterThan(0)
  })

  it('never throws — callers sit on request paths that must not fail', async () => {
    execute.mockRejectedValueOnce(new Error('boom'))
    await expect(
      consume('form:contact:abc', { limit: 5, windowSeconds: 600, failOpen: true }),
    ).resolves.toBeDefined()
  })
})

describe('windowing', () => {
  it('places calls in the same fixed window for the same bucket', async () => {
    returnsCount(1)
    await consume('track:abc', { limit: 5, windowSeconds: 3600, failOpen: true })
    const first = execute.mock.calls[0]![0] as { values: unknown[] }

    returnsCount(2)
    await consume('track:abc', { limit: 5, windowSeconds: 3600, failOpen: true })
    const second = execute.mock.calls[1]![0] as { values: unknown[] }

    // Same bucket and same window boundary → same row, so the count accumulates.
    expect(second.values[0]).toBe(first.values[0])
    expect(second.values[1]).toBe(first.values[1])
  })

  it('separates different actions for the same client', async () => {
    returnsCount(1)
    await consume('auth:login:abc', { limit: 10, windowSeconds: 600, failOpen: false })
    returnsCount(1)
    await consume('form:contact:abc', { limit: 5, windowSeconds: 600, failOpen: true })

    const first = execute.mock.calls[0]![0] as { values: unknown[] }
    const second = execute.mock.calls[1]![0] as { values: unknown[] }
    expect(first.values[0]).not.toBe(second.values[0])
  })
})
