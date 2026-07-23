import { describe, it, expect } from 'vitest'
import { toGeezNumeral, weekdayOf, fixedSeasonOf, daysBetween } from '../geez-liturgical'

describe('toGeezNumeral', () => {
  it('renders 1-30 correctly', () => {
    expect(toGeezNumeral(1)).toBe('፩')
    expect(toGeezNumeral(9)).toBe('፱')
    expect(toGeezNumeral(10)).toBe('፲')
    expect(toGeezNumeral(11)).toBe('፲፩')
    expect(toGeezNumeral(24)).toBe('፳፬')
    expect(toGeezNumeral(30)).toBe('፴')
  })
  it('falls back to plain digits outside 1-30', () => {
    expect(toGeezNumeral(0)).toBe('0')
    expect(toGeezNumeral(31)).toBe('31')
  })
})

describe('weekdayOf', () => {
  it('matches known weekdays', () => {
    expect(weekdayOf('2025-09-11')).toBe(4) // Ge'ez new year 2018 was a Thursday
    expect(weekdayOf('2026-07-26')).toBe(0) // a Sunday
  })
})

describe('fixedSeasonOf', () => {
  it('resolves fixed seasons', () => {
    expect(fixedSeasonOf('meskerem', 17)?.en).toContain('Meskel')
    expect(fixedSeasonOf('hidar', 20)?.ti).toBe('ጾመ ልደት')
    expect(fixedSeasonOf('tahsas', 29)?.ti).toBe('ዘመነ ልደት')
    expect(fixedSeasonOf('tir', 5)?.ti).toBe('ዘመነ ልደት')
    expect(fixedSeasonOf('nehase', 10)?.ti).toBe('ጾመ ፍልሰታ')
  })
  it('never guesses movable seasons', () => {
    expect(fixedSeasonOf('megabit', 15)).toBeNull() // typically Lent, but movable
    expect(fixedSeasonOf('ginbot', 10)).toBeNull()
  })
})

describe('daysBetween', () => {
  it('computes whole-day differences', () => {
    expect(daysBetween('2026-07-22', '2026-07-22')).toBe(0)
    expect(daysBetween('2026-07-22', '2026-07-27')).toBe(5)
    expect(daysBetween('2026-08-30', '2026-09-01')).toBe(2)
  })
})
