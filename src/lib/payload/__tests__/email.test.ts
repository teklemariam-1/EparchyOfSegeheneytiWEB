import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// We test the email adapter by importing the module with controlled env vars.
// The adapter is the default export of email.ts — a function that receives { payload }.

describe('buildEmailAdapter', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.resetModules()
    // Clear email-related env vars
    delete process.env.RESEND_API_KEY
    delete process.env.SMTP_HOST
    delete process.env.SMTP_PORT
    delete process.env.SMTP_SECURE
    delete process.env.SMTP_USER
    delete process.env.SMTP_PASS
    delete process.env.PAYLOAD_FROM_ADDRESS
    delete process.env.PAYLOAD_FROM_NAME
  })

  afterEach(() => {
    // Restore original env
    process.env = { ...originalEnv }
    vi.restoreAllMocks()
  })

  function makeMockPayload() {
    return {
      logger: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
      },
    }
  }

  async function loadAdapter() {
    const mod = await import('../email')
    return mod.buildEmailAdapter
  }

  // ── Transport mode selection ──────────────────────────────────────

  it('uses log mode when no RESEND_API_KEY or SMTP_HOST are set', async () => {
    const buildAdapter = await loadAdapter()
    const payload = makeMockPayload()
    const adapter = buildAdapter({ payload } as any)

    const result = await adapter.sendEmail({
      to: 'test@example.com',
      subject: 'Hello',
      text: 'Test body',
    })

    expect(result).toHaveProperty('logged', true)
    expect(payload.logger.info).toHaveBeenCalled()
  })

  it('logs a reset link when HTML contains a password reset URL', async () => {
    const buildAdapter = await loadAdapter()
    const payload = makeMockPayload()
    const adapter = buildAdapter({ payload } as any)

    await adapter.sendEmail({
      to: 'admin@example.com',
      subject: 'Reset your password',
      html: '<a href="https://segeneyti.org/admin/reset/abc123">Reset</a>',
    })

    const calls = payload.logger.info.mock.calls.map((c: unknown[]) => c[0])
    expect(calls.some((msg: string) => msg.includes('Reset link'))).toBe(true)
  })

  // ── Resend mode ──────────────────────────────────────────────────

  it('sends via Resend when RESEND_API_KEY is set', async () => {
    process.env.RESEND_API_KEY = 'test_key_123'

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ id: 'resend_abc' }), { status: 200 }),
    )

    const buildAdapter = await loadAdapter()
    const payload = makeMockPayload()
    const adapter = buildAdapter({ payload } as any)

    const result = await adapter.sendEmail({
      to: 'user@example.com',
      subject: 'Test',
      html: '<p>Hello</p>',
    })

    expect(fetchSpy).toHaveBeenCalledOnce()
    const [url, opts] = fetchSpy.mock.calls[0]
    expect(url).toBe('https://api.resend.com/emails')
    expect(JSON.parse(opts!.body as string).to).toEqual(['user@example.com'])
    expect(result).toHaveProperty('id', 'resend_abc')

    fetchSpy.mockRestore()
  })

  it('throws when Resend returns a non-OK response', async () => {
    process.env.RESEND_API_KEY = 'test_key_bad'

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Unauthorized', { status: 401 }),
    )

    const buildAdapter = await loadAdapter()
    const payload = makeMockPayload()
    const adapter = buildAdapter({ payload } as any)

    await expect(
      adapter.sendEmail({ to: 'x@y.com', subject: 'Fail' }),
    ).rejects.toThrow('Resend email send failed with status 401')

    fetchSpy.mockRestore()
  })

  // ── Validation ───────────────────────────────────────────────────

  it('throws when no recipients are provided', async () => {
    const buildAdapter = await loadAdapter()
    const adapter = buildAdapter({ payload: makeMockPayload() } as any)

    await expect(
      adapter.sendEmail({ to: '', subject: 'Oops' }),
    ).rejects.toThrow('at least one recipient')
  })

  // ── Address normalization ────────────────────────────────────────

  it('normalizes object-style addresses to strings', async () => {
    process.env.RESEND_API_KEY = 'test_key'

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ id: 'ok' }), { status: 200 }),
    )

    const buildAdapter = await loadAdapter()
    const adapter = buildAdapter({ payload: makeMockPayload() } as any)

    await adapter.sendEmail({
      to: { address: 'obj@example.com', name: 'Obj' } as any,
      subject: 'Test',
    })

    const body = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string)
    expect(body.to).toEqual(['obj@example.com'])

    fetchSpy.mockRestore()
  })

  // ── Adapter metadata ─────────────────────────────────────────────

  it('exposes correct adapter name and defaults', async () => {
    const buildAdapter = await loadAdapter()
    const adapter = buildAdapter({ payload: makeMockPayload() } as any)

    expect(adapter.name).toBe('eparchy-email')
    expect(adapter.defaultFromAddress).toBe('noreply@segeneyti.org')
    expect(adapter.defaultFromName).toBe('Eparchy of Segheneyti CMS')
  })
})
