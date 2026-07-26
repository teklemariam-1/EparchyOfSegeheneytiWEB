import { describe, it, expect } from 'vitest'
import { issueFormToken, verifyFormToken } from '../formToken'

/**
 * The timing check is only worth anything if the timestamp cannot be rewritten
 * — a bot controls every field it posts, so an unsigned hidden field would be
 * pure decoration. These tests are mostly about the signature.
 */

const SECOND = 1000
const MINUTE = 60 * SECOND

describe('a genuine submission', () => {
  it('passes once a person has had time to type', () => {
    const issued = 1_000_000
    const token = issueFormToken(issued)
    expect(verifyFormToken(token, issued + 30 * SECOND)).toBe('ok')
  })

  it('passes right at the edge of the minimum fill time', () => {
    const issued = 1_000_000
    const token = issueFormToken(issued)
    expect(verifyFormToken(token, issued + 1_500)).toBe('ok')
  })
})

describe('automated submission', () => {
  it('is rejected when it submits instantly', () => {
    const issued = 1_000_000
    const token = issueFormToken(issued)
    expect(verifyFormToken(token, issued + 200)).toBe('too-fast')
  })

  it('is rejected when it submits in the same millisecond', () => {
    const issued = 1_000_000
    expect(verifyFormToken(issueFormToken(issued), issued)).toBe('too-fast')
  })
})

describe('forgery', () => {
  it('rejects a hand-written timestamp with no signature', () => {
    expect(verifyFormToken(String(Date.now() - MINUTE))).toBe('invalid')
  })

  it('rejects a rewritten timestamp carrying someone else’s signature', () => {
    // The attack the signature exists to stop: take a valid token, backdate the
    // timestamp so the form looks slowly filled, keep the signature.
    const issued = 1_000_000
    const token = issueFormToken(issued)
    const signature = token.split('.')[1]
    const forged = `${issued - 10 * MINUTE}.${signature}`
    expect(verifyFormToken(forged, issued)).toBe('invalid')
  })

  it('rejects a made-up signature', () => {
    expect(verifyFormToken(`${Date.now() - MINUTE}.not-a-real-signature`)).toBe('invalid')
  })

  it('rejects a signature of the wrong length without throwing', () => {
    // timingSafeEqual throws on a length mismatch — the guard must check first.
    expect(() => verifyFormToken(`${Date.now() - MINUTE}.abc`)).not.toThrow()
    expect(verifyFormToken(`${Date.now() - MINUTE}.abc`)).toBe('invalid')
  })

  it('rejects a future timestamp', () => {
    // A correctly-signed token cannot be from the future unless clocks are
    // wrong or it was minted elsewhere; either way it is not a real fill.
    const issued = 1_000_000
    expect(verifyFormToken(issueFormToken(issued + 10 * MINUTE), issued)).toBe('too-fast')
  })
})

describe('malformed input', () => {
  it.each([
    [undefined, 'missing'],
    [null, 'missing'],
    ['', 'missing'],
    [42, 'missing'],
    [{}, 'missing'],
    ['no-separator', 'invalid'],
    ['.', 'invalid'],
    ['abc.def', 'invalid'],
  ])('classifies %s as %s', (input, expected) => {
    expect(verifyFormToken(input)).toBe(expected)
  })

  it('rejects a non-numeric timestamp', () => {
    expect(verifyFormToken('not-a-number.signature')).toBe('invalid')
  })
})

describe('expiry', () => {
  it('rejects a token older than two hours', () => {
    const issued = 1_000_000
    const token = issueFormToken(issued)
    expect(verifyFormToken(token, issued + 3 * 60 * MINUTE)).toBe('expired')
  })

  it('still accepts one just inside the window', () => {
    const issued = 1_000_000
    const token = issueFormToken(issued)
    expect(verifyFormToken(token, issued + 119 * MINUTE)).toBe('ok')
  })
})

describe('token shape', () => {
  it('is two dot-separated parts', () => {
    expect(issueFormToken(1_000_000).split('.')).toHaveLength(2)
  })

  it('gives different timestamps different signatures', () => {
    const a = issueFormToken(1_000_000).split('.')[1]
    const b = issueFormToken(1_000_001).split('.')[1]
    expect(a).not.toBe(b)
  })

  it('is deterministic for the same timestamp', () => {
    expect(issueFormToken(1_000_000)).toBe(issueFormToken(1_000_000))
  })
})
