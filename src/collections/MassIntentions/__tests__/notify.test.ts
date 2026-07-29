import { describe, it, expect, vi, beforeEach } from 'vitest'
import { notifyRequesterOnStatusChange } from '../hooks/notify'

/**
 * The email is the product: it answers "when will the Mass be offered?" for
 * someone who cannot be there. Worth pinning: the date reaches the email, a
 * MOVED Mass re-notifies, and staff edits that change nothing announce nothing.
 */

const sendEmail = vi.fn(async () => undefined)
const logger = { error: vi.fn() }
const req = () => ({ payload: { sendEmail, logger } }) as any

const base = {
  id: 3,
  requesterEmail: 'family@example.org',
  requesterName: 'Selam',
  forWhom: 'the repose of the soul of Berhane',
  parish: 'Kidane Mehret',
  scheduledFor: '2026-09-12T00:00:00.000Z',
}

beforeEach(() => {
  sendEmail.mockReset()
  logger.error.mockReset()
})

describe('scheduling', () => {
  it('emails the date and the parish when the Mass is scheduled', async () => {
    await notifyRequesterOnStatusChange({
      doc: { ...base, status: 'scheduled' },
      previousDoc: { ...base, status: 'new', scheduledFor: null },
      operation: 'update',
      req: req(),
    } as any)
    const sent = sendEmail.mock.calls[0]![0] as any
    expect(sent.to).toBe('family@example.org')
    expect(sent.html).toContain('12/09/2026')
    expect(sent.html).toContain('Kidane Mehret')
    expect(sent.html).toContain('Berhane')
  })

  it('re-notifies when an already-scheduled Mass is MOVED to a new date', async () => {
    // A moved Mass is exactly what the family needs to hear about.
    await notifyRequesterOnStatusChange({
      doc: { ...base, status: 'scheduled', scheduledFor: '2026-09-19T00:00:00.000Z' },
      previousDoc: { ...base, status: 'scheduled', scheduledFor: '2026-09-12T00:00:00.000Z' },
      operation: 'update',
      req: req(),
    } as any)
    expect(sendEmail).toHaveBeenCalledTimes(1)
    expect((sendEmail.mock.calls[0]![0] as any).html).toContain('19/09/2026')
  })

  it('says something true when staff schedule without setting the date', async () => {
    await notifyRequesterOnStatusChange({
      doc: { ...base, status: 'scheduled', scheduledFor: null },
      previousDoc: { ...base, status: 'new', scheduledFor: null },
      operation: 'update',
      req: req(),
    } as any)
    const sent = sendEmail.mock.calls[0]![0] as any
    expect(sent.html).toContain('confirm the date shortly')
    // It must not invent or format a nonexistent date.
    expect(sent.html).not.toMatch(/\d{2}\/\d{2}\/\d{4}/)
  })

  it('renders the dayOnly date in UTC so it cannot drift a day', async () => {
    await notifyRequesterOnStatusChange({
      doc: { ...base, status: 'scheduled', scheduledFor: '2026-09-12T00:00:00.000Z' },
      previousDoc: { ...base, status: 'new' },
      operation: 'update',
      req: req(),
    } as any)
    expect((sendEmail.mock.calls[0]![0] as any).html).toContain('12/09/2026')
  })
})

describe('silence where silence is right', () => {
  it('editing staff notes on a scheduled intention does not re-announce', async () => {
    await notifyRequesterOnStatusChange({
      doc: { ...base, status: 'scheduled', staffNotes: 'stipend received' },
      previousDoc: { ...base, status: 'scheduled' },
      operation: 'update',
      req: req(),
    } as any)
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('creation sends nothing — the acknowledgement email already covered it', async () => {
    await notifyRequesterOnStatusChange({
      doc: { ...base, status: 'new' },
      operation: 'create',
      req: req(),
    } as any)
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('no email address, no attempt', async () => {
    await notifyRequesterOnStatusChange({
      doc: { ...base, requesterEmail: undefined, status: 'celebrated' },
      previousDoc: { ...base, status: 'scheduled' },
      operation: 'update',
      req: req(),
    } as any)
    expect(sendEmail).not.toHaveBeenCalled()
  })
})

describe('closing the loop', () => {
  it('celebrated tells the family the Mass was offered', async () => {
    await notifyRequesterOnStatusChange({
      doc: { ...base, status: 'celebrated' },
      previousDoc: { ...base, status: 'scheduled' },
      operation: 'update',
      req: req(),
    } as any)
    expect((sendEmail.mock.calls[0]![0] as any).html).toContain('was offered')
  })

  it('a dead mail server never rolls back the status change', async () => {
    sendEmail.mockRejectedValueOnce(new Error('SMTP unreachable'))
    await expect(
      notifyRequesterOnStatusChange({
        doc: { ...base, status: 'celebrated' },
        previousDoc: { ...base, status: 'scheduled' },
        operation: 'update',
        req: req(),
      } as any),
    ).resolves.toBeTruthy()
    expect(logger.error).toHaveBeenCalled()
  })
})
