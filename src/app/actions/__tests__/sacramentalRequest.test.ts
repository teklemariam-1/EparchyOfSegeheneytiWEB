import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * This action writes personal data about named individuals. The property worth
 * pinning is that a crafted submission cannot decide WHAT is written — only the
 * values of fields the action names itself.
 */

const create = vi.fn(async () => ({ id: 1 }))
const sendEmail = vi.fn(async () => undefined)
const guardFormSubmission = vi.fn(async () => ({ ok: true }) as any)

vi.mock('@/lib/payload/client', () => ({
  getPayload: vi.fn(async () => ({ create, sendEmail })),
}))
vi.mock('@/lib/security/formGuard', () => ({
  guardFormSubmission: (...args: unknown[]) => guardFormSubmission(...args),
  // A silent accept now leaves a server-side trace; the mock only has to exist.
  reportSuspicious: () => {},
}))

const { submitSacramentalRequest } = await import('../sacramentalRequest')

function form(fields: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [k, v] of Object.entries(fields)) fd.set(k, v)
  return fd
}

const VALID = {
  sacrament: 'baptism',
  subjectName: 'Mariam Tesfay',
  requesterName: 'Tesfay G.',
  requesterEmail: 'tesfay@example.org',
}

beforeEach(() => {
  create.mockClear()
  sendEmail.mockClear()
  guardFormSubmission.mockClear()
  guardFormSubmission.mockResolvedValue({ ok: true } as any)
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('what reaches the database', () => {
  it('writes to the sacramental-requests collection and no other', async () => {
    await submitSacramentalRequest({ ok: false, message: '' }, form(VALID))
    expect(create).toHaveBeenCalledTimes(1)
    expect((create.mock.calls[0]![0] as any).collection).toBe('sacramental-requests')
  })

  it('ignores extra fields a crafted submission adds', async () => {
    // The whole point of naming fields explicitly rather than spreading
    // FormData: `status` and `submittedAt` are server-controlled.
    await submitSacramentalRequest(
      { ok: false, message: '' },
      form({ ...VALID, status: 'completed', submittedAt: '1999-01-01', staffNotes: 'injected' }),
    )
    const data = (create.mock.calls[0]![0] as any).data
    expect(data.status).toBeUndefined()
    expect(data.submittedAt).toBeUndefined()
    expect(data.staffNotes).toBeUndefined()
  })

  it('rejects a sacrament outside the known set rather than storing it', async () => {
    const result = await submitSacramentalRequest(
      { ok: false, message: '' },
      form({ ...VALID, sacrament: 'something-invented' }),
    )
    expect(result.ok).toBe(false)
    expect(create).not.toHaveBeenCalled()
  })
})

describe('abuse protection', () => {
  it('reuses the shared form guard rather than rolling its own', async () => {
    await submitSacramentalRequest({ ok: false, message: '' }, form(VALID))
    expect(guardFormSubmission).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'sacramental-request' }),
    )
  })

  it('accepts silently when the honeypot is filled, so a bot learns nothing', async () => {
    const result = await submitSacramentalRequest(
      { ok: false, message: '' },
      form({ ...VALID, company: 'Acme' }),
    )
    expect(result.ok).toBe(true)
    expect(create).not.toHaveBeenCalled()
  })

  it('does not write when the guard rejects', async () => {
    guardFormSubmission.mockResolvedValue({
      ok: false,
      silent: false,
      messageKey: 'rateLimited',
      message: 'slow down',
    } as any)
    const result = await submitSacramentalRequest({ ok: false, message: '' }, form(VALID))
    expect(result.ok).toBe(false)
    expect(result.messageKey).toBe('rateLimited')
    expect(create).not.toHaveBeenCalled()
  })
})

describe('validation', () => {
  it.each([
    ['no subject name', { ...VALID, subjectName: '' }],
    ['no requester name', { ...VALID, requesterName: '' }],
    ['no email', { ...VALID, requesterEmail: '' }],
    ['malformed email', { ...VALID, requesterEmail: 'not-an-email' }],
  ])('refuses when there is %s', async (_label, fields) => {
    const result = await submitSacramentalRequest({ ok: false, message: '' }, form(fields))
    expect(result.ok).toBe(false)
    expect(create).not.toHaveBeenCalled()
  })
})

describe('the acknowledgement email', () => {
  it('is sent to the requester', async () => {
    await submitSacramentalRequest({ ok: false, message: '' }, form(VALID))
    expect((sendEmail.mock.calls[0]![0] as any).to).toBe('tesfay@example.org')
  })

  it('never loses the request when mail fails', async () => {
    // Someone needs this record for a wedding. A dead SMTP host must not
    // discard it.
    sendEmail.mockRejectedValueOnce(new Error('SMTP down'))
    const result = await submitSacramentalRequest({ ok: false, message: '' }, form(VALID))
    expect(result.ok).toBe(true)
    expect(create).toHaveBeenCalledTimes(1)
  })
})
