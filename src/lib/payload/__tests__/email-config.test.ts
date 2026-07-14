import { describe, it, expect, beforeEach, afterEach } from 'vitest'

describe('validateEmailConfig', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    delete process.env.RESEND_API_KEY
    delete process.env.SMTP_HOST
    delete process.env.SMTP_PORT
    delete process.env.SMTP_USER
    delete process.env.SMTP_PASS
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  async function loadValidator() {
    // Dynamic import to pick up env changes
    const mod = await import('../email')
    return mod.validateEmailConfig
  }

  it('returns log mode and warns in production when no transport is configured', async () => {
    const origNodeEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'

    const validate = await loadValidator()
    const result = validate()

    expect(result.mode).toBe('log')
    expect(result.warnings.length).toBeGreaterThan(0)
    expect(result.warnings[0]).toMatch(/no email transport/i)

    process.env.NODE_ENV = origNodeEnv
  })

  it('returns resend mode with no warnings when RESEND_API_KEY is set', async () => {
    process.env.RESEND_API_KEY = 'test_key'

    const validate = await loadValidator()
    const result = validate()

    expect(result.mode).toBe('resend')
    expect(result.warnings).toHaveLength(0)
  })

  it('warns when SMTP_HOST is set but credentials are missing', async () => {
    process.env.SMTP_HOST = 'smtp.example.com'
    // Deliberately not setting SMTP_USER / SMTP_PASS

    const validate = await loadValidator()
    const result = validate()

    expect(result.mode).toBe('smtp')
    expect(result.warnings.some((w: string) => w.includes('SMTP_USER'))).toBe(true)
  })

  it('returns smtp mode with no warnings when fully configured', async () => {
    process.env.SMTP_HOST = 'smtp.example.com'
    process.env.SMTP_USER = 'user'
    process.env.SMTP_PASS = 'pass'

    const validate = await loadValidator()
    const result = validate()

    expect(result.mode).toBe('smtp')
    expect(result.warnings).toHaveLength(0)
  })
})
