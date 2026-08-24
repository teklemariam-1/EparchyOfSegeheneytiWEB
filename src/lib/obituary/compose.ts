import type { ClergyObituary } from '@/types/payload-types'
import { lexicalToPlainText } from '@/lib/payload/lexical'

/**
 * Assembles the full ታሪኽ ሕይወት document from a ClergyObituary's structured
 * fields, in the fixed order of the genre. Pure on purpose — no Payload
 * imports — so the same function serves the detail page, the copy-full-text
 * button, and the unit tests.
 *
 * A section whose required data is missing is omitted entirely; nothing here
 * ever emits a placeholder into liturgical prose.
 */

export interface ObituarySection {
  id: string
  heading?: string
  body: string
}

export interface ComposedObituary {
  sections: ObituarySection[]
  /** Plain text of the whole document, sections joined with blank lines. */
  fullText: string
}

export type ObituaryLocale = 'ti' | 'en'

/**
 * Tigrinya names of the GREGORIAN months, as the genre writes them
 * («ብ15 የካቲት 1979» = 15 February 1979; the ፈ suffix marks ፈረንጂ dates).
 */
const GREGORIAN_MONTHS_TI = [
  'ጥሪ', 'የካቲት', 'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰነ',
  'ሓምለ', 'ነሓሰ', 'መስከረም', 'ጥቅምቲ', 'ሕዳር', 'ታሕሳስ',
] as const

const GREGORIAN_MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const

/** «27 ግንቦት 1931» / "27 May 1931"; '' when the date doesn't parse. */
export function formatObituaryDate(iso: string | null | undefined, locale: ObituaryLocale): string {
  if (typeof iso !== 'string' || !iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const months = locale === 'en' ? GREGORIAN_MONTHS_EN : GREGORIAN_MONTHS_TI
  return `${date.getUTCDate()} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()}`
}

function honorificOf(doc: ClergyObituary): string {
  return (doc.honorific === 'other' ? doc.honorificOther : doc.honorific) ?? ''
}

function has(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

type Assignment = ClergyObituary['assignments'][number]

/** Assignments in chronological order — sortDate drives it, nothing else. */
export function sortAssignments(assignments: Assignment[] | null | undefined): Assignment[] {
  return [...(assignments ?? [])].sort((a, b) => Date.parse(a.sortDate) - Date.parse(b.sortDate))
}

/**
 * The sentence group for one assignment row: the override verbatim when set,
 * otherwise «{periodDisplay} ከም {role} ኮይኖም ኣብ {parishName} ({place}) ኣገልጊሎም።»,
 * followed by each achievement as its own sentence. '' when the row lacks the
 * required pieces. Shared by the composer and the detail page's timeline so
 * the printed text and the web text cannot drift apart.
 */
export function assignmentText(row: Assignment): string {
  const parts: string[] = []
  if (has(row.sentenceOverride)) {
    parts.push(row.sentenceOverride.trim())
  } else if (has(row.periodDisplay) && has(row.parishName)) {
    const role = (row.role === 'other' ? row.roleOther : row.role) ?? ''
    const asRole = has(role) ? `ከም ${role} ኮይኖም ` : ''
    const place = has(row.place) ? ` (${row.place})` : ''
    parts.push(`${row.periodDisplay} ${asRole}ኣብ ${row.parishName}${place} ኣገልጊሎም።`)
  } else {
    return ''
  }
  for (const achievement of row.achievements ?? []) {
    if (has(achievement.text)) parts.push(achievement.text.trim())
  }
  return parts.join(' ')
}

export function composeObituary(doc: ClergyObituary, locale: ObituaryLocale): ComposedObituary {
  const sections: ObituarySection[] = []
  const date = (iso: string | null | undefined) => formatObituaryDate(iso, locale)
  const honorific = honorificOf(doc)

  // 1 — the opening verse, as an epigraph.
  if (has(doc.openingVerse?.text)) {
    const reference = has(doc.openingVerse?.reference) ? ` (${doc.openingVerse!.reference})` : ''
    sections.push({ id: 'verse', body: `«${doc.openingVerse!.text}»${reference}` })
  }

  // 2 — the announcement paragraph, written by the editor.
  const opening = lexicalToPlainText(doc.openingParagraph)
  if (opening) sections.push({ id: 'opening', body: opening })

  // 3 — the ordination-day hymn.
  if (has(doc.ordinationHymn?.geez)) {
    const lines = [
      'ኣብ ዕለተ ክህነት እንደግሞ "እግዚኣብሔር ነግሰ" ዝብል ጸሎት፡',
      `«${doc.ordinationHymn!.geez}»`,
    ]
    if (has(doc.ordinationHymn?.tigrinya)) {
      lines.push(`«${doc.ordinationHymn!.tigrinya}» እናበልና ነዝይም።`)
    }
    sections.push({ id: 'hymn', body: lines.join('\n') })
  }

  // 4 — birth.
  if (has(doc.fullName) && has(doc.birthDate) && has(doc.fatherName) && has(doc.motherName) && has(doc.birthPlace)) {
    sections.push({
      id: 'birth',
      body:
        `ክቡር ኣቦና ${honorific} ${doc.fullName} ብዕለት ${date(doc.birthDate)}ፈ ` +
        `ካብ ኣብኦም ${doc.fatherName}ን ኣዲኦም ${doc.motherName}ን ኣብ ዓዶም ${doc.birthPlace} ተወሊዶም።`,
    })
  }

  // 5 — marriage (married secular clergy only).
  if (doc.isMarried && has(doc.marriage?.marriageDate) && has(doc.marriage?.spouseName)) {
    const nefshiert = doc.marriage!.spouseDeceased ? 'ነፍስሄርት ' : ''
    sections.push({
      id: 'marriage',
      body: `ብዕለት ${date(doc.marriage!.marriageDate)}ፈ ምስ ክብርቲ ${nefshiert}${doc.marriage!.spouseName} ቃል ኪዳን ኣሲሮም።`,
    })
  }

  // 6 — priestly ordination.
  if (has(doc.ordination?.date) && has(doc.ordination?.bishop)) {
    const place = has(doc.ordination?.place) ? ` ኣብ ${doc.ordination!.place}` : ''
    sections.push({
      id: 'ordination',
      body: `ብዕለት ${date(doc.ordination!.date)} ብኢድ ${doc.ordination!.bishop}${place} መዓርገ ክህነት ተቐቢሎም።`,
    })
  }

  // 7 — reception into full communion, only for priests ordained elsewhere.
  if (
    doc.ordination?.church &&
    doc.ordination.church !== 'catholic' &&
    doc.fullCommunion?.year !== null &&
    doc.fullCommunion?.year !== undefined &&
    has(doc.fullCommunion?.authorizingBishop)
  ) {
    sections.push({
      id: 'fullCommunion',
      body:
        `ካብዚ ቀጺሎም ብ${Number(doc.fullCommunion.year)}ፈ ብፍቓድ ${doc.fullCommunion.authorizingBishop} ` +
        'ናብ ካቶሊካዊት ቤተክርስትያን ኣትዮም።',
    })
  }

  // 8 — the assignments, in sortDate order, one sentence group per row.
  const assignmentLines = sortAssignments(doc.assignments).map(assignmentText).filter(Boolean)
  if (assignmentLines.length > 0) {
    sections.push({ id: 'assignments', body: assignmentLines.join('\n') })
  }

  // 9 — retirement ministry.
  const retirement = lexicalToPlainText(doc.retirementDescription)
  if (retirement) sections.push({ id: 'retirement', body: retirement })

  // 10 — character: verse, Beatitudes summary, virtues, reflections, hope.
  {
    const lines: string[] = []
    if (has(doc.characterVerse?.text)) {
      const reference = has(doc.characterVerse?.reference) ? ` (${doc.characterVerse!.reference})` : ''
      lines.push(`${doc.characterVerse!.text}${reference}`)
    }
    const summary = lexicalToPlainText(doc.characterSummary)
    if (summary) lines.push(summary)
    for (const virtue of doc.virtues ?? []) {
      if (has(virtue.text)) lines.push(virtue.text)
    }
    for (const reflection of doc.scriptureReflections ?? []) {
      if (has(reflection.reference) && has(reflection.text)) {
        lines.push(`${reflection.reference} «${reflection.text}»`)
      }
    }
    const hope = lexicalToPlainText(doc.hopeStatement)
    if (hope) lines.push(hope)

    if (lines.length > 0) {
      const firstName = has(doc.fullName) ? doc.fullName.trim().split(/\s+/)[0] : ''
      const named = [honorific, firstName].filter(Boolean).join(' ')
      sections.push({
        id: 'character',
        heading: named ? `ፍሉይ መለልዪ ባህሪ ${named}` : 'ፍሉይ መለልዪ ባህሪ',
        body: lines.join('\n'),
      })
    }
  }

  // 11 — the funeral report.
  if (has(doc.funeralDate) && has(doc.presidingBishop) && has(doc.burialChurch) && has(doc.burialTown)) {
    const description = lexicalToPlainText(doc.funeralDescription)
    const attended = description ? `${description.replace(/\n+/g, ' ')} ` : ''
    sections.push({
      id: 'funeral',
      body:
        `ሎሚ ዕለት ${date(doc.funeralDate)}ፈ ${doc.presidingBishop}፡ ${attended}` +
        `ስነ-ስርዓት ቀብሮም ኣብ ${doc.burialTown} ${doc.burialChurch} ሓመድ ኣዳም ለቢሶም ብኽብሪ ተፈጺሙ ኣሎ።`,
    })
  }

  // 12 — acknowledgements, condolence prayer, and the closing of mourning.
  {
    const lines = [
      lexicalToPlainText(doc.acknowledgements),
      lexicalToPlainText(doc.condolencePrayer),
      doc.mourningClosed && has(doc.mourningClosedText) ? doc.mourningClosedText.trim() : '',
    ].filter(Boolean)
    if (lines.length > 0) sections.push({ id: 'closing', body: lines.join('\n') })
  }

  const fullText = sections
    .map((s) => (s.heading ? `${s.heading}\n${s.body}` : s.body))
    .join('\n\n')

  return { sections, fullText }
}
