import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/**
 * User enumeration is the property under test: an attacker must not be able to
 * tell a real admin address from a fake one, by response body OR by timing.
 * Payload already returns an identical body for both, so timing is the leak
 * this guard closes.
 */

const consume = vi.fn()
const captureMessage = vi.fn()
const writeAudit = vi.fn(async () => {})

vi.mock('../rateLimit', () => ({ consume: (...args: unknown[]) => consume(...args) }))
vi.mock('@sentry/nextjs', () => ({ captureMessage: (...args: unknown[]) => captureMessage(...args) }))
vi.mock('../../permissions/audit', () => ({ writeAudit: (...args: unknown[]) => writeAudit(...args) }))
vi.mock('../../payload/client', () => ({ getPayload: vi.fn(async () => ({})) }))

const { withAuthProtection, authActionFor } = await import('../authGuard')

const allowed = { allowed: true, count: 1, remaining: 9, retryAfterSeconds: 60, degraded: false }
const blocked = { allowed: false, count: 11, remaining: 0, retryAfterSeconds: 300, degraded: false }

function post(url: string, body: unknown = { email: 'a@b.c', password: 'x' }): Request {
  return new Request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'user-agent': 'Mozilla/5.0' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  consume.mockReset()
  captureMessage.mockReset()
  writeAudit.mockReset()
  consume.mockResolvedValue(allowed)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('authActionFor', () => {
  it.each([
    ['/api/users/login', 'login'],
    ['/api/users/forgot-password', 'forgot-password'],
    ['/api/users/reset-password', 'reset-password'],
    ['/api/users/login/', 'login'],
  ])('recognizes %s', (path, expected) => {
    expect(authActionFor(path, 'POST')).toBe(expected)
  })

  it.each(['/api/news', '/api/users', '/api/users/me', '/api/track'])(
    'leaves %s alone',
    (path) => {
      expect(authActionFor(path, 'POST')).toBeNull()
    },
  )

  it('ignores non-POST requests', () => {
    expect(authActionFor('/api/users/login', 'GET')).toBeNull()
  })
})

describe('non-auth requests', () => {
  it('pass through without touching the limiter', async () => {
    const inner = vi.fn(async () => new Response('ok'))
    const handler = withAuthProtection(inner)
    const res = await handler(post('https://site.test/api/news'), {})

    expect(await res.text()).toBe('ok')
    expect(consume).not.toHaveBeenCalled()
  })
})

describe('enumeration safety', () => {
  it('takes the same minimum time whether the account exists or not', async () => {
    // Payload answers instantly for an unknown address and slowly for a real
    // one (bcrypt). Both must land on the same floor.
    const fast = withAuthProtection(async () => new Response('{}', { status: 401 }))
    const slow = withAuthProtection(async () => {
      await new Promise((r) => setTimeout(r, 120))
      return new Response('{}', { status: 401 })
    })

    const t0 = Date.now()
    await fast(post('https://site.test/api/users/login'), {})
    const fastMs = Date.now() - t0

    const t1 = Date.now()
    await slow(post('https://site.test/api/users/login'), {})
    const slowMs = Date.now() - t1

    expect(fastMs).toBeGreaterThanOrEqual(590)
    expect(slowMs).toBeGreaterThanOrEqual(590)
    // The difference must be far below what is measurable over a network.
    expect(Math.abs(slowMs - fastMs)).toBeLessThan(100)
  })

  it('holds forgot-password to the same floor', async () => {
    const handler = withAuthProtection(async () => new Response('{}', { status: 200 }))
    const start = Date.now()
    await handler(post('https://site.test/api/users/forgot-password', { email: 'nobody@example.com' }), {})
    expect(Date.now() - start).toBeGreaterThanOrEqual(590)
  })

  it('does not delay ordinary API traffic', async () => {
    const handler = withAuthProtection(async () => new Response('ok'))
    const start = Date.now()
    await handler(post('https://site.test/api/news'), {})
    expect(Date.now() - start).toBeLessThan(200)
  })

  it('returns a body that says nothing about the account', async () => {
    consume.mockResolvedValue(blocked)
    const handler = withAuthProtection(async () => new Response('{}', { status: 401 }))
    const res = await handler(post('https://site.test/api/users/login'), {})
    const text = await res.text()

    expect(res.status).toBe(429)
    expect(text).not.toMatch(/exist|found|unknown|valid/i)
    expect(text).toContain('Too many attempts')
  })
})

describe('rate limiting', () => {
  it('fails CLOSED — auth is never served on an unavailable counter', async () => {
    const handler = withAuthProtection(async () => new Response('ok'))
    await handler(post('https://site.test/api/users/login'), {})

    expect(consume).toHaveBeenCalledWith(
      expect.stringContaining('auth:login:'),
      expect.objectContaining({ failOpen: false }),
    )
  })

  it('never puts a raw address in the bucket key', async () => {
    const handler = withAuthProtection(async () => new Response('ok'))
    await handler(post('https://site.test/api/users/login'), {})

    const bucket = consume.mock.calls[0]![0] as string
    expect(bucket).not.toMatch(/\d+\.\d+\.\d+\.\d+/)
    expect(bucket).not.toContain('a@b.c')
  })

  it('sends Retry-After when it refuses', async () => {
    consume.mockResolvedValue(blocked)
    const handler = withAuthProtection(async () => new Response('ok'))
    const res = await handler(post('https://site.test/api/users/login'), {})
    expect(res.headers.get('retry-after')).toBe('300')
  })

  it('does not call the wrapped handler once blocked', async () => {
    consume.mockResolvedValue(blocked)
    const inner = vi.fn(async () => new Response('ok'))
    await withAuthProtection(inner)(post('https://site.test/api/users/login'), {})
    expect(inner).not.toHaveBeenCalled()
  })
})

describe('failure logging', () => {
  it('records a failed login without persisting a raw IP', async () => {
    const handler = withAuthProtection(async () => new Response('{}', { status: 401 }))
    await handler(post('https://site.test/api/users/login', { email: 'admin@eparchy.org' }), {})
    // Logging is fire-and-forget; let the microtask queue drain.
    await new Promise((r) => setTimeout(r, 50))

    expect(writeAudit).toHaveBeenCalled()
    const entry = writeAudit.mock.calls[0]![1] as { action: string; summary: string }
    expect(entry.action).toBe('auth.login-failed')
    expect(entry.summary).toContain('admin@eparchy.org')
    expect(entry.summary).not.toMatch(/\d+\.\d+\.\d+\.\d+/)
  })

  it('stays silent on a successful login', async () => {
    const handler = withAuthProtection(async () => new Response('{}', { status: 200 }))
    await handler(post('https://site.test/api/users/login'), {})
    await new Promise((r) => setTimeout(r, 50))
    expect(writeAudit).not.toHaveBeenCalled()
  })

  it('leaves the body readable for the wrapped handler', async () => {
    // The guard reads the email from a clone; consuming the original stream
    // would make every login fail with an empty body.
    const inner = vi.fn(async (req: Request) => {
      const body = (await req.json()) as { email?: string }
      expect(body.email).toBe('admin@eparchy.org')
      return new Response('{}', { status: 401 })
    })
    await withAuthProtection(inner)(
      post('https://site.test/api/users/login', { email: 'admin@eparchy.org' }),
      {},
    )
    expect(inner).toHaveBeenCalled()
  })
})
