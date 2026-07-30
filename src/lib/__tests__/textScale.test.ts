import { describe, it, expect } from 'vitest'
import { parseTextScale, scaleKeyFor, TEXT_SCALES, TEXT_SCALE_COOKIE } from '../textScale'

/**
 * The cookie value ends up inside an inline `style` attribute rendered by the
 * server layout, so the parser is a security boundary: only the three known
 * multipliers may pass, whatever a crafted cookie carries.
 */

describe('parseTextScale', () => {
  it('accepts exactly the offered multipliers', () => {
    for (const { value } of TEXT_SCALES) {
      expect(parseTextScale(value)).toBe(value)
    }
  })

  it.each([
    ['an absent cookie', undefined],
    ['an empty string', ''],
    ['an arbitrary number', '2.5'],
    ['a huge value', '9999'],
    ['a negative value', '-1'],
    ['an expression', 'calc(1rem)'],
    ['an injection attempt', '1; background:url(evil)'],
    ['a word', 'large'],
  ])('falls back to 1 for %s', (_label, value) => {
    expect(parseTextScale(value as string | undefined)).toBe('1')
  })
})

describe('scaleKeyFor', () => {
  it('maps each stored value to its button', () => {
    expect(scaleKeyFor('1')).toBe('normal')
    expect(scaleKeyFor('1.125')).toBe('large')
    expect(scaleKeyFor('1.25')).toBe('larger')
  })

  it('marks Normal for anything unknown, matching the fallback', () => {
    expect(scaleKeyFor(undefined)).toBe('normal')
    expect(scaleKeyFor('nonsense')).toBe('normal')
  })
})

describe('the cookie name', () => {
  it('is stable — changing it silently resets every reader to Normal', () => {
    expect(TEXT_SCALE_COOKIE).toBe('text-scale')
  })
})
