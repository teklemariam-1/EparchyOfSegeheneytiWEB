/**
 * Helpers for the Ge'ez liturgical calendar UI.
 */

import type { GeezMonth } from './constants/geezMonths'

/** 1–30 as Ge'ez numerals (፩ … ፴). */
export function toGeezNumeral(n: number): string {
  if (!Number.isInteger(n) || n < 1 || n > 30) return String(n)
  const tens = ['', '፲', '፳', '፴']
  const units = ['', '፩', '፪', '፫', '፬', '፭', '፮', '፯', '፰', '፱']
  return tens[Math.floor(n / 10)]! + units[n % 10]!
}

/** Weekday index (0 = Sunday) for an ISO yyyy-mm-dd date. */
export function weekdayOf(iso: string): number {
  return new Date(`${iso}T00:00:00Z`).getUTCDay()
}

/**
 * Fixed-date seasons of the Ge'ez liturgical year. Only windows that are the
 * same every year are included — movable seasons (Great Lent, Eastertide,
 * the Apostles' fast) are intentionally omitted rather than guessed.
 */
export interface FixedSeason {
  from: { month: GeezMonth; day: number }
  to: { month: GeezMonth; day: number }
  ti: string
  en: string
  /** True for fasting windows (used by the fasting calendar feed). */
  fast?: boolean
}

export const FIXED_SEASONS: FixedSeason[] = [
  { from: { month: 'meskerem', day: 1 }, to: { month: 'meskerem', day: 16 }, ti: 'ዘመነ ቅዱስ ዮሓንስ', en: 'Season of the New Year' },
  { from: { month: 'meskerem', day: 17 }, to: { month: 'meskerem', day: 17 }, ti: 'በዓለ መስቀል', en: 'Feast of the Cross (Meskel)' },
  { from: { month: 'hidar', day: 15 }, to: { month: 'tahsas', day: 28 }, ti: 'ጾመ ልደት', en: 'Advent Fast', fast: true },
  { from: { month: 'tahsas', day: 29 }, to: { month: 'tir', day: 10 }, ti: 'ዘመነ ልደት', en: 'Christmastide' },
  { from: { month: 'tir', day: 11 }, to: { month: 'tir', day: 12 }, ti: 'በዓለ ጥምቀት', en: 'Epiphany (Timket)' },
  { from: { month: 'nehase', day: 1 }, to: { month: 'nehase', day: 16 }, ti: 'ጾመ ፍልሰታ', en: 'Assumption Fast (Filseta)', fast: true },
]

const MONTH_INDEX: Record<string, number> = {
  meskerem: 0, tikimit: 1, hidar: 2, tahsas: 3, tir: 4, yekatit: 5,
  megabit: 6, miyazia: 7, ginbot: 8, sene: 9, hamle: 10, nehase: 11, paguemen: 12,
}

/** Fixed liturgical season for a Ge'ez date, or null when none applies
 *  (movable seasons are never guessed). */
export function fixedSeasonOf(month: string, day: number): { ti: string; en: string } | null {
  const pos = MONTH_INDEX[month] === undefined ? null : MONTH_INDEX[month]! * 30 + day
  if (pos === null) return null
  for (const s of FIXED_SEASONS) {
    const from = MONTH_INDEX[s.from.month]! * 30 + s.from.day
    const to = MONTH_INDEX[s.to.month]! * 30 + s.to.day
    if (pos >= from && pos <= to) return { ti: s.ti, en: s.en }
  }
  return null
}

/** Whole days from `fromIso` to `toIso` (both yyyy-mm-dd). */
export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((Date.parse(`${toIso}T00:00:00Z`) - Date.parse(`${fromIso}T00:00:00Z`)) / 86_400_000)
}

/**
 * Days in ጳጉሜን for an E.C. year: 6 in Ethiopic leap years (year % 4 === 3,
 * e.g. 2015, 2019 E.C.), otherwise 5. Total year length is 360 + this.
 */
export function paguemenDaysIn(geezYear: number): 5 | 6 {
  return geezYear % 4 === 3 ? 6 : 5
}
