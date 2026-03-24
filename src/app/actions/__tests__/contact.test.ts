import { describe, it, expect, vi, beforeEach } from 'vitest'
import { submitContactForm } from '../contact'

// Mock Payload client before importing the action to prevent real DB calls
vi.mock('@/lib/payload/client', () => ({
  getPayload: vi.fn(),
}))

import { getPayload } from '@/lib/payload/client'

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeFormData(fields: Record<string, string>): FormData {
  const fd = new FormData()
  Object.entries(fields).forEach(([key, value]) => fd.set(key, value))
  return fd
}

const INITIAL_STATE = { ok: false, message: '' }

const VALID = {
  firstName: 'Tesfai',
  lastName: 'Haile',
  email: 'tesfai@example.com',
  subject: 'General Enquiry',
  message: 'This is a detailed test message with more than ten characters.',
}

// ─── tests ────────────────────────────────────────────────────────────────────

describe('submitContactForm', () => {
  const mockCreate = vi.fn().mockResolvedValue({ id: '1' })

  beforeEach(() => {
    vi.mocked(getPayload).mockResolvedValue({ create: mockCreate } as any)
    mockCreate.mockClear()
  })

  // ── happy path ──────────────────────────────────────────────────────────────

  it('returns ok:true and a thank-you message on valid submission', async () => {
    const result = await submitContactForm(INITIAL_STATE, makeFormData(VALID))
    expect(result.ok).toBe(true)
    expect(result.message).toMatch(/thank you/i)
  })

  it('calls payload.create with the correct collection and data', async () => {
    await submitContactForm(INITIAL_STATE, makeFormData(VALID))
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'contact-submissions',
        data: expect.objectContaining({
          email: VALID.email,
          subject: VALID.subject,
        }),
      }),
    )
  })

  it('combines firstName + lastName into a single name field', async () => {
    await submitContactForm(INITIAL_STATE, makeFormData(VALID))
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: 'Tesfai Haile' }),
      }),
    )
  })

  it('omits phone when it is not provided', async () => {
    const { phone: _p, ...noPhone } = VALID as typeof VALID & { phone?: string }
    await submitContactForm(INITIAL_STATE, makeFormData(noPhone))
    const [callArgs] = mockCreate.mock.calls
    expect(callArgs[0].data.phone).toBeUndefined()
  })

  // ── validation errors ───────────────────────────────────────────────────────

  it('returns error when firstName is empty', async () => {
    const r = await submitContactForm(
      INITIAL_STATE,
      makeFormData({ ...VALID, firstName: '' }),
    )
    expect(r.ok).toBe(false)
    expect(r.message).toMatch(/name/i)
  })

  it('returns error when lastName is empty', async () => {
    const r = await submitContactForm(
      INITIAL_STATE,
      makeFormData({ ...VALID, lastName: '' }),
    )
    expect(r.ok).toBe(false)
    expect(r.message).toMatch(/name/i)
  })

  it('returns error for a missing email', async () => {
    const r = await submitContactForm(
      INITIAL_STATE,
      makeFormData({ ...VALID, email: '' }),
    )
    expect(r.ok).toBe(false)
    expect(r.message).toMatch(/email/i)
  })

  it('returns error for an invalid email format', async () => {
    const r = await submitContactForm(
      INITIAL_STATE,
      makeFormData({ ...VALID, email: 'not-an-email' }),
    )
    expect(r.ok).toBe(false)
    expect(r.message).toMatch(/email/i)
  })

  it('returns error when subject is empty', async () => {
    const r = await submitContactForm(
      INITIAL_STATE,
      makeFormData({ ...VALID, subject: '' }),
    )
    expect(r.ok).toBe(false)
    expect(r.message).toMatch(/subject/i)
  })

  it('returns error when message is shorter than 10 characters', async () => {
    const r = await submitContactForm(
      INITIAL_STATE,
      makeFormData({ ...VALID, message: 'short' }),
    )
    expect(r.ok).toBe(false)
    expect(r.message).toMatch(/message/i)
  })

  it('does not call payload.create when validation fails', async () => {
    await submitContactForm(
      INITIAL_STATE,
      makeFormData({ ...VALID, email: 'bad' }),
    )
    expect(mockCreate).not.toHaveBeenCalled()
  })

  // ── payload error handling ──────────────────────────────────────────────────

  it('returns ok:false and an error message if payload.create throws', async () => {
    vi.mocked(getPayload).mockResolvedValue({
      create: vi.fn().mockRejectedValue(new Error('DB connection failed')),
    } as any)
    const r = await submitContactForm(INITIAL_STATE, makeFormData(VALID))
    expect(r.ok).toBe(false)
    expect(r.message).toMatch(/problem/i)
  })

  // ── length limits ──────────────────────────────────────────────────────────

  it('returns error when the combined name exceeds 120 characters', async () => {
    const longName = 'A'.repeat(61)
    const r = await submitContactForm(
      INITIAL_STATE,
      makeFormData({ ...VALID, firstName: longName, lastName: longName }),
    )
    expect(r.ok).toBe(false)
    expect(r.message).toMatch(/name/i)
  })

  it('returns error when the message exceeds 4000 characters', async () => {
    const r = await submitContactForm(
      INITIAL_STATE,
      makeFormData({ ...VALID, message: 'x'.repeat(4001) }),
    )
    expect(r.ok).toBe(false)
    expect(r.message).toMatch(/message/i)
  })
})
