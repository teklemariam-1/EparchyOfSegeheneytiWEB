import { describe, it, expect } from 'vitest'
import { normalizeGeez, geezVariants } from '../geez'

/**
 * The eparchy's own name is the case that has to work: ሠገነይቲ and ሰገነይቲ are
 * both correct spellings and visitors use both.
 */

describe('normalizeGeez', () => {
  it('folds the two spellings of the eparchy name together', () => {
    expect(normalizeGeez('ሠገነይቲ')).toBe(normalizeGeez('ሰገነይቲ'))
  })

  it('folds the h family across all three consonants', () => {
    expect(normalizeGeez('ሐ')).toBe(normalizeGeez('ሀ'))
    expect(normalizeGeez('ኀ')).toBe(normalizeGeez('ሀ'))
  })

  it('folds ኣ and ዓ, which are the same vowel of paired consonants', () => {
    expect(normalizeGeez('ኣስመራ')).toBe(normalizeGeez('ዓስመራ'))
  })

  it('folds ጸ and ፀ', () => {
    expect(normalizeGeez('ጸሎት')).toBe(normalizeGeez('ፀሎት'))
  })

  it('preserves vowel distinctions — folding sounds, not collapsing words', () => {
    // ሰ (sä) and ሱ (su) are different vowels and must stay different.
    expect(normalizeGeez('ሰ')).not.toBe(normalizeGeez('ሱ'))
  })

  it('leaves Latin text exactly as it was', () => {
    expect(normalizeGeez('Segheneyti')).toBe('Segheneyti')
    expect(normalizeGeez('')).toBe('')
  })
})

describe('geezVariants', () => {
  it('offers both spellings of the eparchy name from either input', () => {
    const fromOne = geezVariants('ሠገነይቲ')
    expect(fromOne).toContain('ሠገነይቲ')
    expect(fromOne).toContain('ሰገነይቲ')

    const fromOther = geezVariants('ሰገነይቲ')
    expect(fromOther).toContain('ሠገነይቲ')
    expect(fromOther).toContain('ሰገነይቲ')
  })

  it('puts the term as typed first', () => {
    expect(geezVariants('ሰገነይቲ')[0]).toBe('ሰገነይቲ')
  })

  it('returns a Latin query untouched, as a single variant', () => {
    expect(geezVariants('Segheneyti')).toEqual(['Segheneyti'])
  })

  it('never returns duplicates', () => {
    const variants = geezVariants('ሰላም')
    expect(new Set(variants).size).toBe(variants.length)
  })

  it('refuses to explode: past the cap it searches the term as typed', () => {
    // Three h-family letters would be 27 variants on their own.
    const many = geezVariants('ሀሐኀ')
    expect(many).toEqual(['ሀሐኀ'])
  })

  it('respects a caller-supplied cap', () => {
    expect(geezVariants('ሰሰ', 2)).toEqual(['ሰሰ'])
    expect(geezVariants('ሰሰ', 99).length).toBe(4)
  })

  it('every variant folds back to the same normalized form', () => {
    for (const variant of geezVariants('ሠገነይቲ')) {
      expect(normalizeGeez(variant)).toBe(normalizeGeez('ሠገነይቲ'))
    }
  })
})
