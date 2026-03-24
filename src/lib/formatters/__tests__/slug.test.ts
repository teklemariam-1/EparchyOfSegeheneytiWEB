import { describe, it, expect } from 'vitest'
import { slugify, isValidSlug, buildGeezCalendarSlug } from '../slug'

// ─── slugify ─────────────────────────────────────────────────────────────────

describe('slugify', () => {
  it('converts a string to lowercase', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('replaces spaces with hyphens', () => {
    expect(slugify('Catholic Eparchy')).toBe('catholic-eparchy')
  })

  it('removes apostrophes and other special characters', () => {
    expect(slugify("Bishop's Message")).toBe('bishops-message')
  })

  it('trims leading and trailing hyphens', () => {
    expect(slugify('-hello-')).toBe('hello')
  })

  it('collapses multiple spaces/hyphens into one hyphen', () => {
    expect(slugify('hello  world')).toBe('hello-world')
    expect(slugify('hello--world')).toBe('hello-world')
  })

  it('returns an empty string for empty input', () => {
    expect(slugify('')).toBe('')
  })

  it('trims surrounding whitespace', () => {
    expect(slugify('  eparchy  ')).toBe('eparchy')
  })
})

// ─── isValidSlug ─────────────────────────────────────────────────────────────

describe('isValidSlug', () => {
  it('returns true for a single lowercase word', () => {
    expect(isValidSlug('news')).toBe(true)
  })

  it('returns true for a hyphenated slug', () => {
    expect(isValidSlug('bishop-messages')).toBe(true)
  })

  it('returns true for a slug with numbers', () => {
    expect(isValidSlug('synod-2026')).toBe(true)
  })

  it('returns false for strings with uppercase letters', () => {
    expect(isValidSlug('Hello-World')).toBe(false)
  })

  it('returns false for strings with spaces', () => {
    expect(isValidSlug('hello world')).toBe(false)
  })

  it('returns false for strings with double hyphens', () => {
    expect(isValidSlug('hello--world')).toBe(false)
  })

  it('returns false for strings with a leading hyphen', () => {
    expect(isValidSlug('-hello')).toBe(false)
  })

  it('returns false for strings with a trailing hyphen', () => {
    expect(isValidSlug('hello-')).toBe(false)
  })

  it('returns false for an empty string', () => {
    expect(isValidSlug('')).toBe(false)
  })
})

// ─── buildGeezCalendarSlug ────────────────────────────────────────────────────

describe('buildGeezCalendarSlug', () => {
  it('zero-pads a single-digit day', () => {
    expect(buildGeezCalendarSlug(2018, 'meskerem', 1)).toBe('2018-meskerem-01')
  })

  it('does not pad a two-digit day', () => {
    expect(buildGeezCalendarSlug(2018, 'tikimt', 15)).toBe('2018-tikimt-15')
  })

  it('uses the month slug as provided (no transformation)', () => {
    expect(buildGeezCalendarSlug(2018, 'hidar', 5)).toBe('2018-hidar-05')
  })
})
