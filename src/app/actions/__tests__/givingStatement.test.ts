import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * The statement email carries personal financial history, so the properties
 * worth pinning are: the response never reveals whether an address has
 * donations, and the mail goes only to that address — never to a third party,
 * never onto the page.
 */

const find = vi.fn(async () => ({ docs: [] as unknown[] }))
const sendEmail = vi.fn(async () => undefined)
const guardFormSubmission = vi.fn(async () => ({ ok: true }) as any)

vi.mock('@/lib/payload/client', () => ({
  getPayload: vi.fn(async () => ({ find, sendEmail })),
}))
vi.mock('@/lib/security/formGuard', () => ({
  guardFormSubmission: (...args: unknown[]) => guardFormSubmission(...args),
  // A silent accept now leaves a server-side trace; the mock only has to exist.
  reportSuspicious: () => {},
}))

const { requestGivingStatement } = await import('../givingStatement')

function form(fields: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [k, v] of Object.entries(fields)) fd.set(k, v)
  return fd
}

const YEAR = String(new Date().getUTCFullYear())
const VALID = { email: 'donor@example.org', year: YEAR }

const DONATION = {
  status: 'succeeded',
  amountMinor: 5000,
  currency: 'EUR',
  reference: 'SEG-1',
  donorName: 'Tesfay',
  submittedAt: `${YEAR}-03-01T00:00:00.000Z`,
}

beforeEach(() => {
  find.mockReset().mockResolvedValue({ docs: [] })
  sendEmail.mockClear()
  guardFormSubmission.mockClear().mockResolvedValue({ ok: true } as any)
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('enumeration safety', () => {
  it('answers identically whether the address has donations or none', async () => {
    const empty = await requestGivingStatement({ ok: false, message: '' }, form(VALID))

    find.mockResolvedValue({ docs: [DONATION] })
    const full = await requestGivingStatement({ ok: false, message: '' }, form(VALID))

    expect(empty).toEqual(full)
    expect(empty.ok).toBe(true)
  })

  it('answers identically even when the lookup throws', async () => {
    const normal = await requestGivingStatement({ ok: false, message: '' }, form(VALID))
    find.mockRejectedValue(new Error('db down'))
    const failed = await requestGivingStatement({ ok: false, message: '' }, form(VALID))
    expect(failed).toEqual(normal)
  })

  it('sends the statement only to the address itself', async () => {
    find.mockResolvedValue({ docs: [DONATION] })
    await requestGivingStatement({ ok: false, message: '' }, form(VALID))
    expect(sendEmail).toHaveBeenCalledTimes(1)
    expect((sendEmail.mock.calls[0]![0] as any).to).toBe('donor@example.org')
  })

  it('sends nothing when there is nothing to send', async () => {
    await requestGivingStatement({ ok: false, message: '' }, form(VALID))
    expect(sendEmail).not.toHaveBeenCalled()
  })
})

describe('abuse protection', () => {
  it('goes through the shared guard under its own action name', async () => {
    await requestGivingStatement({ ok: false, message: '' }, form(VALID))
    expect(guardFormSubmission).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'giving-statement', limit: 2 }),
    )
  })

  it('honeypot answers with the same generic success', async () => {
    const result = await requestGivingStatement(
      { ok: false, message: '' },
      form({ ...VALID, company: 'Acme' }),
    )
    expect(result.ok).toBe(true)
    expect(find).not.toHaveBeenCalled()
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('does not look up anything when the guard rejects', async () => {
    guardFormSubmission.mockResolvedValue({
      ok: false, silent: false, messageKey: 'rateLimited', message: 'slow down',
    } as any)
    const result = await requestGivingStatement({ ok: false, message: '' }, form(VALID))
    expect(result.ok).toBe(false)
    expect(find).not.toHaveBeenCalled()
  })
})

describe('input validation', () => {
  it.each([
    ['bad email', { email: 'not-an-email', year: YEAR }],
    ['missing email', { email: '', year: YEAR }],
    ['pre-system year', { email: 'a@b.c', year: '2019' }],
    ['future year', { email: 'a@b.c', year: String(Number(YEAR) + 1) }],
    ['non-numeric year', { email: 'a@b.c', year: 'abcd' }],
  ])('rejects %s before touching the database', async (_label, fields) => {
    const result = await requestGivingStatement({ ok: false, message: '' }, form(fields))
    expect(result.ok).toBe(false)
    expect(find).not.toHaveBeenCalled()
  })
})

describe('what the email contains', () => {
  it('carries the year, the donor name, and the escaped statement', async () => {
    find.mockResolvedValue({ docs: [{ ...DONATION, donorName: 'Tesfay <b>G</b>' }] })
    await requestGivingStatement({ ok: false, message: '' }, form(VALID))
    const sent = sendEmail.mock.calls[0]![0] as any
    expect(sent.subject).toContain(YEAR)
    expect(sent.html).toContain('Tesfay')
    expect(sent.html).not.toContain('<b>G</b>')
  })
})
