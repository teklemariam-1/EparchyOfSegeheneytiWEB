import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Same properties as the sacramental-request action, pinned for the same
 * reason: a crafted submission must not decide WHAT is written, and abuse
 * protection is the shared guard rather than something bespoke.
 */

const create = vi.fn(async () => ({ id: 1 }))
const sendEmail = vi.fn(async () => undefined)
const guardFormSubmission = vi.fn(async () => ({ ok: true }) as any)

vi.mock('@/lib/payload/client', () => ({
  getPayload: vi.fn(async () => ({ create, sendEmail })),
}))
vi.mock('@/lib/security/formGuard', () => ({
  guardFormSubmission: (...args: unknown[]) => guardFormSubmission(...args),
}))

const { submitMassIntention } = await import('../massIntention')

function form(fields: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [k, v] of Object.entries(fields)) fd.set(k, v)
  return fd
}

const VALID = {
  intentionType: 'repose',
  forWhom: 'the repose of the soul of Berhane',
  requesterName: 'Selam',
  requesterEmail: 'selam@example.org',
}

beforeEach(() => {
  create.mockClear()
  sendEmail.mockClear()
  guardFormSubmission.mockClear().mockResolvedValue({ ok: true } as any)
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('what reaches the database', () => {
  it('writes to mass-intentions and nowhere else', async () => {
    await submitMassIntention({ ok: false, message: '' }, form(VALID))
    expect((create.mock.calls[0]![0] as any).collection).toBe('mass-intentions')
  })

  it('ignores injected server-controlled fields', async () => {
    await submitMassIntention(
      { ok: false, message: '' },
      form({ ...VALID, status: 'scheduled', scheduledFor: '2026-01-01', staffNotes: 'x' }),
    )
    const data = (create.mock.calls[0]![0] as any).data
    expect(data.status).toBeUndefined()
    expect(data.scheduledFor).toBeUndefined()
    expect(data.staffNotes).toBeUndefined()
  })

  it('rejects an invented intention type rather than storing it', async () => {
    const result = await submitMassIntention(
      { ok: false, message: '' },
      form({ ...VALID, intentionType: 'coronation' }),
    )
    expect(result.ok).toBe(false)
    expect(create).not.toHaveBeenCalled()
  })
})

describe('abuse protection', () => {
  it('uses the shared guard under its own action name', async () => {
    await submitMassIntention({ ok: false, message: '' }, form(VALID))
    expect(guardFormSubmission).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'mass-intention', limit: 3 }),
    )
  })

  it('honeypot silently pretends success', async () => {
    const result = await submitMassIntention(
      { ok: false, message: '' },
      form({ ...VALID, company: 'Acme' }),
    )
    expect(result.ok).toBe(true)
    expect(create).not.toHaveBeenCalled()
  })
})

describe('validation', () => {
  it.each([
    ['no forWhom', { ...VALID, forWhom: '' }],
    ['no requester name', { ...VALID, requesterName: '' }],
    ['bad email', { ...VALID, requesterEmail: 'nope' }],
  ])('refuses %s before writing', async (_label, fields) => {
    const result = await submitMassIntention({ ok: false, message: '' }, form(fields))
    expect(result.ok).toBe(false)
    expect(create).not.toHaveBeenCalled()
  })
})

describe('acknowledgement', () => {
  it('emails the requester, naming the intention', async () => {
    await submitMassIntention({ ok: false, message: '' }, form(VALID))
    const sent = sendEmail.mock.calls[0]![0] as any
    expect(sent.to).toBe('selam@example.org')
    expect(sent.html).toContain('Berhane')
  })

  it('a dead mail server never loses the intention', async () => {
    sendEmail.mockRejectedValueOnce(new Error('SMTP down'))
    const result = await submitMassIntention({ ok: false, message: '' }, form(VALID))
    expect(result.ok).toBe(true)
    expect(create).toHaveBeenCalledTimes(1)
  })
})
