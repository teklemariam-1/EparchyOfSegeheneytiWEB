import { describe, it, expect, vi, beforeEach } from 'vitest'
import { notifyRequesterOnStatusChange } from '../hooks/notify'

/**
 * Someone waiting on a baptism certificate for a wedding abroad cannot see
 * inside the chancery, so a status change is worth an email. The risks are
 * sending the wrong one, sending it twice, or losing a staff member's edit
 * because a mail server was down.
 */

const sendEmail = vi.fn(async () => undefined)
const logger = { error: vi.fn() }
const req = () => ({ payload: { sendEmail, logger } }) as any

const base = {
  id: 7,
  requesterEmail: 'requester@example.org',
  requesterName: 'Tesfay',
  subjectName: 'Mariam Tesfay',
  sacrament: 'baptism',
}

beforeEach(() => {
  sendEmail.mockReset()
  logger.error.mockReset()
})

describe('which transitions email the requester', () => {
  it.each(['completed', 'declined', 'waiting'])('emails on %s', async (status) => {
    await notifyRequesterOnStatusChange({
      doc: { ...base, status },
      previousDoc: { ...base, status: 'new' },
      operation: 'update',
      req: req(),
    } as any)
    expect(sendEmail).toHaveBeenCalledTimes(1)
  })

  it('stays silent on in-progress, which tells the requester nothing useful', async () => {
    await notifyRequesterOnStatusChange({
      doc: { ...base, status: 'in-progress' },
      previousDoc: { ...base, status: 'new' },
      operation: 'update',
      req: req(),
    } as any)
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('does not email when the status did not change', async () => {
    // Editing staff notes must not re-send "your record is ready".
    await notifyRequesterOnStatusChange({
      doc: { ...base, status: 'completed', staffNotes: 'found in register 12' },
      previousDoc: { ...base, status: 'completed' },
      operation: 'update',
      req: req(),
    } as any)
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('does not email on create — the submission acknowledgement already did', async () => {
    await notifyRequesterOnStatusChange({
      doc: { ...base, status: 'new' },
      operation: 'create',
      req: req(),
    } as any)
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('does nothing when there is no email address to reply to', async () => {
    await notifyRequesterOnStatusChange({
      doc: { ...base, requesterEmail: undefined, status: 'completed' },
      previousDoc: { ...base, status: 'new' },
      operation: 'update',
      req: req(),
    } as any)
    expect(sendEmail).not.toHaveBeenCalled()
  })
})

describe('what the email contains', () => {
  it('addresses the requester and names the record', async () => {
    await notifyRequesterOnStatusChange({
      doc: { ...base, status: 'completed' },
      previousDoc: { ...base, status: 'new' },
      operation: 'update',
      req: req(),
    } as any)
    const sent = sendEmail.mock.calls[0]![0] as any
    expect(sent.to).toBe('requester@example.org')
    expect(sent.html).toContain('Tesfay')
    expect(sent.html).toContain('Mariam Tesfay')
  })

  it('never leaks staff notes to the requester', async () => {
    await notifyRequesterOnStatusChange({
      doc: { ...base, status: 'declined', staffNotes: 'register destroyed in 1998 fire' },
      previousDoc: { ...base, status: 'new' },
      operation: 'update',
      req: req(),
    } as any)
    const sent = sendEmail.mock.calls[0]![0] as any
    expect(JSON.stringify(sent)).not.toContain('1998 fire')
  })
})

describe('failure policy', () => {
  it('never rethrows — a dead mail server must not roll back the status change', async () => {
    sendEmail.mockRejectedValueOnce(new Error('SMTP unreachable'))
    await expect(
      notifyRequesterOnStatusChange({
        doc: { ...base, status: 'completed' },
        previousDoc: { ...base, status: 'new' },
        operation: 'update',
        req: req(),
      } as any),
    ).resolves.toBeTruthy()
    expect(logger.error).toHaveBeenCalled()
  })
})
