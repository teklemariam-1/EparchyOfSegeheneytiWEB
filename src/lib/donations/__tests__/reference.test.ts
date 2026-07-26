import { describe, it, expect, vi } from 'vitest'
import { generateReference, isValidReference, normalizeReference, reserveReference } from '../reference'

describe('generateReference', () => {
  it('produces a SEG-XXXXXX code', () => {
    expect(generateReference()).toMatch(/^SEG-[A-Z0-9]{6}$/)
  })

  it('never uses characters that get misread on a bank slip', () => {
    // I/1, O/0, S/5, Z/2 and U/V are the pairs people transcribe wrongly, and a
    // mistyped reference is an unreconcilable transfer.
    const codes = Array.from({ length: 400 }, () => generateReference().slice(4)).join('')
    expect(codes).not.toMatch(/[IOSUZ0125]/)
  })

  it('does not repeat within a large sample', () => {
    const codes = new Set(Array.from({ length: 2000 }, generateReference))
    expect(codes.size).toBe(2000)
  })
})

describe('isValidReference', () => {
  it('accepts what generateReference makes', () => {
    expect(isValidReference(generateReference())).toBe(true)
  })

  it('rejects malformed values', () => {
    expect(isValidReference('SEG-12345')).toBe(false)
    expect(isValidReference('seg-ABCDEF')).toBe(false)
    expect(isValidReference('ABC-DEFGHJ')).toBe(false)
    expect(isValidReference('SEG-ABCDEI')).toBe(false) // I is excluded
    expect(isValidReference(null)).toBe(false)
    expect(isValidReference(42)).toBe(false)
  })
})

describe('normalizeReference', () => {
  it('accepts the forms a donor or a bank statement actually produces', () => {
    const code = 'SEG-4KQ7HP'
    expect(normalizeReference('seg 4kq7hp')).toBe(code)
    expect(normalizeReference('SEG4KQ7HP')).toBe(code)
    expect(normalizeReference('  seg-4kq7hp  ')).toBe(code)
    expect(normalizeReference('SEG/4KQ7HP')).toBe(code)
  })

  it('returns null for anything that cannot be one of our codes', () => {
    expect(normalizeReference('INV-123456')).toBeNull()
    expect(normalizeReference('SEG-123')).toBeNull()
    expect(normalizeReference('SEG-ABCDEI')).toBeNull() // excluded letter
    expect(normalizeReference(undefined)).toBeNull()
    expect(normalizeReference('')).toBeNull()
  })
})

describe('reserveReference', () => {
  it('returns a code no donation already holds', async () => {
    const find = vi.fn().mockResolvedValue({ totalDocs: 0 })
    const code = await reserveReference({ find })
    expect(isValidReference(code)).toBe(true)
    expect(find).toHaveBeenCalledTimes(1)
  })

  it('retries past a collision', async () => {
    const find = vi
      .fn()
      .mockResolvedValueOnce({ totalDocs: 1 })
      .mockResolvedValueOnce({ totalDocs: 1 })
      .mockResolvedValue({ totalDocs: 0 })
    const code = await reserveReference({ find })
    expect(isValidReference(code)).toBe(true)
    expect(find).toHaveBeenCalledTimes(3)
  })

  it('still returns a code when the lookup fails, rather than losing the donation', async () => {
    const find = vi.fn().mockRejectedValue(new Error('db down'))
    const code = await reserveReference({ find })
    expect(isValidReference(code)).toBe(true)
  })

  it('gives up after the attempt limit instead of looping forever', async () => {
    const find = vi.fn().mockResolvedValue({ totalDocs: 1 })
    const code = await reserveReference({ find }, 3)
    expect(isValidReference(code)).toBe(true)
    expect(find).toHaveBeenCalledTimes(3)
  })
})
