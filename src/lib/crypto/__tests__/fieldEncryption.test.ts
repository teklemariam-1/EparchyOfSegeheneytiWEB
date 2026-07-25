import { describe, it, expect } from 'vitest'
import { encrypt, decrypt, isEncrypted, isMasked, mask, last4 } from '../fieldEncryption'

describe('fieldEncryption', () => {
  it('round-trips a value through encrypt/decrypt', () => {
    const plain = '1234567890123456'
    const enc = encrypt(plain)
    expect(enc).not.toContain(plain)
    expect(isEncrypted(enc)).toBe(true)
    expect(decrypt(enc)).toBe(plain)
  })

  it('produces a different ciphertext each time (random IV) but same plaintext', () => {
    const a = encrypt('secret-account')
    const b = encrypt('secret-account')
    expect(a).not.toBe(b)
    expect(decrypt(a)).toBe(decrypt(b))
  })

  it('returns non-encrypted values unchanged (tolerates plaintext)', () => {
    expect(decrypt('not-encrypted')).toBe('not-encrypted')
    expect(isEncrypted('plain')).toBe(false)
  })

  it('fails closed (empty string) on a tampered ciphertext', () => {
    const enc = encrypt('1234')
    const tampered = enc.slice(0, -4) + 'AAAA'
    expect(decrypt(tampered)).toBe('')
  })

  it('masks to the last 4 characters only', () => {
    expect(mask(encrypt('1234567890'))).toBe('••••7890')
    expect(last4(encrypt('1234567890'))).toBe('7890')
    expect(mask('')).toBe('')
  })

  it('detects a masked placeholder', () => {
    expect(isMasked('••••7890')).toBe(true)
    expect(isMasked('1234')).toBe(false)
  })
})
