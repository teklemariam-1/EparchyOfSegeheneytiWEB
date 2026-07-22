/**
 * Converts the Android app's Ge'ez liturgical calendar JSON
 * (gxawieCalander.json) into clean seed data for the
 * geez-calendar-days collection.
 *
 * Usage:
 *   node scripts/convert-geez-calendar.mjs <input.json> [output.json]
 *
 * Normalisations applied:
 *  - Tigrinya month names → canonical month values (see src/lib/constants/geezMonths.ts)
 *  - Ge'ez numerals (፩…፴) or Arabic digits in the date string → day number
 *  - Ge'ez year extracted from the date string (falls back to the year most
 *    entries carry)
 *  - "DD-MM-YY" Gregorian dates → ISO "20YY-MM-DD" (stray suffixes like
 *    "ፈረንጂ" are ignored)
 */

import fs from 'node:fs'
import path from 'node:path'

const MONTH_MAP = {
  'መስከረም': 'meskerem',
  'ጥቅምቲ': 'tikimit',
  'ሕዳር': 'hidar',
  'ታሕሳስ': 'tahsas',
  'ጥሪ': 'tir',
  'የካቲት': 'yekatit',
  'መጋቢት': 'megabit',
  'ሚያዝያ': 'miyazia',
  'ግንቦት': 'ginbot',
  'ሰነ': 'sene',
  'ሓምለ': 'hamle',
  'ሐምለ': 'hamle',
  'ነሓሰ': 'nehase',
  'ጳጉሜን': 'paguemen',
  'ነጳጉሜን': 'paguemen',
}

const GEEZ_DIGITS = { '፩': 1, '፪': 2, '፫': 3, '፬': 4, '፭': 5, '፮': 6, '፯': 7, '፰': 8, '፱': 9, '፲': 10, '፳': 20, '፴': 30 }

function parseDay(dateStr) {
  const arabic = dateStr.match(/(?:^|\s)(\d{1,2})(?:\s|$)/)
  if (arabic) return Number(arabic[1])
  let total = 0
  for (const ch of dateStr) {
    if (GEEZ_DIGITS[ch]) total += GEEZ_DIGITS[ch]
    else if (total > 0) break
  }
  return total
}

function parseYear(dateStr, fallback) {
  const m = dateStr.match(/20\d{2}/)
  return m ? Number(m[0]) : fallback
}

function parseGregorian(str) {
  const m = (str ?? '').match(/(\d{2})-(\d{2})-(\d{2})/)
  if (!m) return null
  return `20${m[3]}-${m[2]}-${m[1]}`
}

const [, , input, output = 'src/migrations/data/geez-calendar-days.json'] = process.argv
if (!input) {
  console.error('Usage: node scripts/convert-geez-calendar.mjs <input.json> [output.json]')
  process.exit(1)
}

const raw = JSON.parse(fs.readFileSync(input, 'utf8'))
const source = raw.liturgical_calendar
if (!Array.isArray(source)) throw new Error('Expected top-level "liturgical_calendar" array')

// Most-common year = fallback for entries whose date string omits it (Paguemen).
const yearCounts = {}
for (const e of source) {
  const m = (e.date ?? '').match(/20\d{2}/)
  if (m) yearCounts[m[0]] = (yearCounts[m[0]] ?? 0) + 1
}
const fallbackYear = Number(Object.entries(yearCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0)
if (!fallbackYear) throw new Error('Could not infer the Geʼez year from the data')

/** 1–30 as Ge'ez numerals, for rebuilding broken date labels. */
function toGeezNumeral(n) {
  const tens = { 0: '', 1: '፲', 2: '፳', 3: '፴' }
  const units = ['', '፩', '፪', '፫', '፬', '፭', '፮', '፯', '፰', '፱']
  return tens[Math.floor(n / 10)] + units[n % 10]
}

const rows = []
const errors = []
let prev = null

// The file is one entry per consecutive day, so the first entry's Gregorian
// date anchors the whole sequence. Individual gregorian_date values contain
// sporadic typos (wrong year/month digit, one duplicate) — the sequence wins.
const baseGreg = parseGregorian(source[0]?.gregorian_date)
if (!baseGreg) throw new Error('First entry has no parsable gregorian_date to anchor the sequence')
const baseMs = Date.parse(`${baseGreg}T00:00:00Z`)
const isoAt = (i) => new Date(baseMs + i * 86_400_000).toISOString().slice(0, 10)

source.forEach((e, i) => {
  const month = MONTH_MAP[(e.month ?? '').trim()]
  if (!month) errors.push(`#${i}: unknown month "${e.month}"`)

  const gregorianDate = isoAt(i)
  const parsedGreg = parseGregorian(e.gregorian_date)
  if (parsedGreg !== gregorianDate) {
    console.warn(`#${i}: gregorian "${e.gregorian_date}" != sequence ${gregorianDate} -> using sequence`)
  }

  // The entries run strictly day-by-day, so the position within the month is
  // authoritative. The parsed numeral is only a cross-check — the source data
  // contains a couple of typos (e.g. "፲፴" for ፴) and one missing label.
  const day = prev && prev.month === month ? prev.day + 1 : 1
  const parsed = parseDay(e.date ?? '')
  const geezYear = parseYear(e.date ?? '', fallbackYear)
  if (day > 30) errors.push(`#${i}: month "${e.month}" overflows 30 days`)

  let geezLabel = (e.date ?? '').replace(/ግ$/, '').trim()
  if (parsed !== day || !geezLabel) {
    const rebuilt = `${toGeezNumeral(day)} ${(e.month ?? '').trim()} ${geezYear}`.trim()
    console.warn(`#${i}: label "${e.date}" parsed as day ${parsed}, sequence says ${day} -> using "${rebuilt}"`)
    geezLabel = rebuilt
  }

  const row = {
    geezLabel,
    month,
    day,
    geezYear,
    gregorianDate,
    readings: (e.readings ?? '').trim(),
    antiphon: (e.antiphon ?? '').trim(),
    deceasedClergy: (e.deceased_clergy ?? '').trim(),
    events: (e.events ?? '').trim(),
  }
  rows.push(row)
  prev = row
})

if (errors.length) {
  console.error('Conversion errors:\n' + errors.join('\n'))
  process.exit(1)
}

// Sanity: no duplicate (month, day) pairs.
const seen = new Set()
for (const r of rows) {
  const key = `${r.month}-${r.day}`
  if (seen.has(key)) console.warn(`duplicate geez date: ${key} (${r.geezLabel})`)
  seen.add(key)
}

fs.mkdirSync(path.dirname(output), { recursive: true })
fs.writeFileSync(output, JSON.stringify(rows, null, 2) + '\n', 'utf8')
console.log(`Wrote ${rows.length} days to ${output} (year ${fallbackYear} E.C.)`)
