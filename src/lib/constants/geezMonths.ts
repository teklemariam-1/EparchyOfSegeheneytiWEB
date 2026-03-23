/**
 * Ge'ez (Ethiopic) calendar constants.
 *
 * The Ge'ez calendar has 13 months: 12 months of 30 days each,
 * plus Paguemen (ጳጉሜን), the intercalary month of 5 or 6 days.
 */

export const GEEZ_MONTHS = [
  'meskerem',
  'tikimit',
  'hidar',
  'tahsas',
  'tir',
  'yekatit',
  'megabit',
  'miyazia',
  'ginbot',
  'sene',
  'hamle',
  'nehase',
  'paguemen',
] as const

export type GeezMonth = (typeof GEEZ_MONTHS)[number]

export const GEEZ_MONTH_LABELS: Record<GeezMonth, { en: string; ti: string }> = {
  meskerem: { en: 'Meskerem', ti: 'መስከረም' },
  tikimit:  { en: 'Tikimit',  ti: 'ጥቅምቲ' },
  hidar:    { en: 'Hidar',    ti: 'ሕዳር' },
  tahsas:   { en: 'Tahsas',   ti: 'ታሕሳስ' },
  tir:      { en: 'Tir',      ti: 'ጥሪ' },
  yekatit:  { en: 'Yekatit',  ti: 'የካቲት' },
  megabit:  { en: 'Megabit',  ti: 'መጋቢት' },
  miyazia:  { en: 'Miyazia',  ti: 'ሚያዝያ' },
  ginbot:   { en: 'Ginbot',   ti: 'ግንቦት' },
  sene:     { en: 'Sene',     ti: 'ሰነ' },
  hamle:    { en: 'Hamle',    ti: 'ሐምለ' },
  nehase:   { en: 'Nehase',   ti: 'ነሓሰ' },
  paguemen: { en: 'Paguemen', ti: 'ጳጉሜን' },
}

export const FASTING_SEASONS = [
  'none',
  'advent',
  'lent',
  'apostles-fast',
  'assumption-fast',
  'nineveh-fast',
  'every-wednesday-friday',
] as const

export type FastingSeason = (typeof FASTING_SEASONS)[number]

export const FEAST_RANKS = [
  'solemnity',
  'feast',
  'memorial',
  'optional-memorial',
  'ferial',
] as const

export type FeastRank = (typeof FEAST_RANKS)[number]

export const LITURGICAL_COLORS = [
  'white',
  'red',
  'green',
  'violet',
  'gold',
  'black',
] as const

export type LiturgicalColor = (typeof LITURGICAL_COLORS)[number]
