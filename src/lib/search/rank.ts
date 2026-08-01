import { normalizeGeez } from './geez'
import type { SearchResult } from './registry'

/**
 * One ordering across every kind of result.
 *
 * Before this, results were concatenated in the order the collections happened
 * to be queried — every news item, then every event — so a parish whose name
 * IS the query ranked below a news article that mentioned it in passing. The
 * source collection is not a relevance signal.
 *
 * The weights below are a judgement, and a maintainer is welcome to disagree
 * with them; what matters is that they are visible and in one place. The
 * reasoning:
 *
 *  - An exact title match is almost certainly the thing the reader wanted.
 *    Someone typing a parish's full name wants that parish, not an article.
 *  - A title that STARTS with the query beats one that merely contains it:
 *    partial typing is how people search, so prefix matches are usually the
 *    completion they had in mind.
 *  - Title beats body everywhere. A body match means "mentions", not "is".
 *  - Recency breaks ties, and only for things where recency is meaningful.
 *    News and messages go stale; a parish does not, and ranking parishes by
 *    edit date would be noise dressed as signal.
 *
 * Comparison is done on the Ge'ez-folded forms so that a title spelled ሠገነይቲ
 * counts as an exact match for a reader who typed ሰገነይቲ. Display always uses
 * the original text — the fold is for comparing, never for showing.
 */

const WEIGHT = {
  titleExact: 1000,
  titlePrefix: 500,
  titleWord: 300,
  titleContains: 200,
  bodyContains: 50,
} as const

/** Recency can reorder results within a tier, but never across one. */
const MAX_RECENCY_BONUS = 40
const RECENCY_HALF_LIFE_DAYS = 180

function recencyBonus(date: string | undefined, now: number): number {
  if (!date) return 0
  const time = new Date(date).getTime()
  if (Number.isNaN(time)) return 0

  // Future-dated entries (an upcoming event) are treated as maximally current
  // rather than being penalised for not having happened yet.
  const ageDays = Math.max(0, (now - time) / 86_400_000)
  return MAX_RECENCY_BONUS * Math.pow(0.5, ageDays / RECENCY_HALF_LIFE_DAYS)
}

/**
 * Score one result against the query.
 *
 * `dated` says whether recency means anything for this kind of thing, which the
 * caller takes from the category registry rather than guessing per result.
 */
export function scoreResult(
  result: Pick<SearchResult, 'title' | 'excerpt' | 'date'>,
  query: string,
  options: { dated?: boolean; now?: number } = {},
): number {
  const now = options.now ?? Date.now()
  const q = normalizeGeez(query.trim().toLowerCase())
  if (!q) return 0

  const title = normalizeGeez((result.title ?? '').toLowerCase())
  const body = normalizeGeez((result.excerpt ?? '').toLowerCase())

  let score = 0
  if (title === q) score = WEIGHT.titleExact
  else if (title.startsWith(q)) score = WEIGHT.titlePrefix
  // A match at a word boundary — "Mary" in "St Mary Parish" — is a real hit;
  // the same letters inside a longer word usually are not.
  else if (new RegExp(`(^|\\s)${escapeRegExp(q)}`).test(title)) score = WEIGHT.titleWord
  else if (title.includes(q)) score = WEIGHT.titleContains
  else if (body.includes(q)) score = WEIGHT.bodyContains

  if (score === 0) return 0
  if (options.dated) score += recencyBonus(result.date, now)
  return score
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Sort results best-first.
 *
 * Ties fall back to title so that two equally relevant results do not swap
 * places between identical searches — an unstable order looks like a bug to
 * anyone who searches twice.
 */
export function rankResults<T extends SearchResult>(results: T[]): T[] {
  return [...results].sort((a, b) => {
    const byScore = (b.score ?? 0) - (a.score ?? 0)
    if (byScore !== 0) return byScore
    return (a.title ?? '').localeCompare(b.title ?? '')
  })
}
