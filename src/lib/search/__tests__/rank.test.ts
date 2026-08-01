import { describe, it, expect } from 'vitest'
import { scoreResult, rankResults } from '../rank'

const NOW = Date.UTC(2026, 6, 31)
const score = (r: Parameters<typeof scoreResult>[0], q: string, dated = false) =>
  scoreResult(r, q, { dated, now: NOW })

describe('relevance beats source collection', () => {
  it('ranks a parish whose name is the query above an article mentioning it', () => {
    const parish = score({ title: 'St Mary Parish' }, 'St Mary Parish')
    const article = score(
      { title: 'Christmas at the cathedral', excerpt: 'Held at St Mary Parish this year.' },
      'St Mary Parish',
      true,
    )
    expect(parish).toBeGreaterThan(article)
  })

  it('orders title match above body match', () => {
    expect(score({ title: 'Ordination day' }, 'ordination')).toBeGreaterThan(
      score({ title: 'Parish notice', excerpt: 'about the ordination' }, 'ordination'),
    )
  })

  it('orders exact above prefix above word above substring', () => {
    const exact = score({ title: 'mass' }, 'mass')
    const prefix = score({ title: 'mass times for advent' }, 'mass')
    const word = score({ title: 'sunday mass times' }, 'mass')
    const inside = score({ title: 'christmassy notes' }, 'mass')
    expect(exact).toBeGreaterThan(prefix)
    expect(prefix).toBeGreaterThan(word)
    expect(word).toBeGreaterThan(inside)
  })

  it('scores a non-match as zero', () => {
    expect(score({ title: 'Something else' }, 'ordination')).toBe(0)
  })
})

describe('recency is a tiebreaker, never a promoter', () => {
  it('lifts the newer of two equally relevant dated results', () => {
    const recent = score({ title: 'Pastoral letter', date: '2026-07-01' }, 'pastoral letter', true)
    const old = score({ title: 'Pastoral letter', date: '2019-01-01' }, 'pastoral letter', true)
    expect(recent).toBeGreaterThan(old)
  })

  it('cannot lift a body match above a title match', () => {
    const freshBody = score(
      { title: 'Unrelated', excerpt: 'mentions ordination', date: '2026-07-31' },
      'ordination',
      true,
    )
    const ancientTitle = score({ title: 'Ordination', date: '1990-01-01' }, 'ordination', true)
    expect(ancientTitle).toBeGreaterThan(freshBody)
  })

  it('ignores dates for things where recency means nothing', () => {
    const withDate = score({ title: 'St Mary', date: '2026-07-31' }, 'st mary', false)
    const without = score({ title: 'St Mary' }, 'st mary', false)
    expect(withDate).toBe(without)
  })

  it('treats an upcoming event as current rather than penalising it', () => {
    const future = score({ title: 'Feast day', date: '2026-12-25' }, 'feast day', true)
    const today = score({ title: 'Feast day', date: '2026-07-31' }, 'feast day', true)
    expect(future).toBeCloseTo(today, 5)
  })
})

describe('Ge’ez spelling does not change relevance', () => {
  it('treats a title spelled the other way as an exact match', () => {
    const other = score({ title: 'ሠገነይቲ' }, 'ሰገነይቲ')
    const same = score({ title: 'ሰገነይቲ' }, 'ሰገነይቲ')
    expect(other).toBe(same)
  })
})

describe('rankResults', () => {
  it('sorts best first', () => {
    const ranked = rankResults([
      { type: 'news', slug: 'a', title: 'A', score: 10 },
      { type: 'news', slug: 'b', title: 'B', score: 900 },
      { type: 'news', slug: 'c', title: 'C', score: 100 },
    ])
    expect(ranked.map((r) => r.slug)).toEqual(['b', 'c', 'a'])
  })

  it('is stable for equal scores, so repeating a search does not reshuffle', () => {
    const input = [
      { type: 'news' as const, slug: 'b', title: 'Beta', score: 100 },
      { type: 'news' as const, slug: 'a', title: 'Alpha', score: 100 },
    ]
    expect(rankResults(input).map((r) => r.slug)).toEqual(['a', 'b'])
    expect(rankResults(input).map((r) => r.slug)).toEqual(rankResults(input).map((r) => r.slug))
  })

  it('does not mutate its input', () => {
    const input = [
      { type: 'news' as const, slug: 'a', title: 'A', score: 1 },
      { type: 'news' as const, slug: 'b', title: 'B', score: 2 },
    ]
    rankResults(input)
    expect(input.map((r) => r.slug)).toEqual(['a', 'b'])
  })
})
