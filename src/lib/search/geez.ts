/**
 * Ge'ez spelling variance, for search.
 *
 * Tigrinya writes several distinct historical consonants that are pronounced
 * identically today, so the same word is spelled more than one way by different
 * writers — and neither spelling is a mistake. This eparchy's own name is the
 * example that matters most: ሠገነይቲ and ሰገነይቲ are both correct, and a visitor
 * will type whichever they learned. A search that treats them as different
 * strings tells that visitor we have nothing about their own diocese.
 *
 * The families below are the ones that actually collide in Tigrinya:
 *
 *   ሀ / ሐ / ኀ   the h sounds
 *   ሠ / ሰ        the s sounds  ← the eparchy's name
 *   አ / ዐ        the glottal series (so ኣ and ዓ, which are that series' 4th
 *                vowel, are matched to each other)
 *   ጸ / ፀ        the ts sounds
 *
 * Ethiopic is laid out in rows of eight: a base consonant followed by its
 * vowel forms. Two consonants in the same family therefore differ by a fixed
 * offset for EVERY vowel, which is why this maps by row position rather than
 * listing all ~60 characters by hand. Case folding is irrelevant here — Ge'ez
 * has no case at all.
 *
 * Latin text passes through untouched, so an English query behaves exactly as
 * it did before.
 */

/** Row starts of consonants that are pronounced alike. First entry is canonical. */
const FAMILIES: number[][] = [
  [0x1200, 0x1210, 0x1280], // ሀ ሐ ኀ
  [0x1220, 0x1230], // ሠ ሰ
  [0x12a0, 0x12d0], // አ ዐ  (covers ኣ / ዓ at offset 3)
  [0x1338, 0x1340], // ጸ ፀ
]

/** Vowel forms per consonant row. Rows are 8 wide; the 8th is rare but real. */
const ROW_WIDTH = 8

function familyOf(code: number): { family: number[]; offset: number } | null {
  for (const family of FAMILIES) {
    for (const base of family) {
      if (code >= base && code < base + ROW_WIDTH) {
        return { family, offset: code - base }
      }
    }
  }
  return null
}

/**
 * Fold a string onto one spelling per sound.
 *
 * Used for comparing and ranking, never for display: the canonical form is an
 * arbitrary pick between two equally correct spellings, and showing it back to
 * a reader would look like we had corrected them.
 */
export function normalizeGeez(input: string): string {
  let out = ''
  for (const char of input) {
    const code = char.codePointAt(0)!
    const match = familyOf(code)
    out += match ? String.fromCodePoint(match.family[0]! + match.offset) : char
  }
  return out
}

/**
 * Every spelling of a term that a writer might reasonably have used.
 *
 * Query EXPANSION rather than index-side normalization, deliberately. Folding
 * the stored text instead would mean either a shadow column kept in sync by
 * hooks, or an expression index that the query builder has no way to target.
 * Each variant here is an ordinary substring match, which needs no schema
 * change and no second copy of the content to fall out of date.
 *
 * The cost is combinatorial, so it is capped — and the cap is low because
 * MEASURED cost is high. Ge'ez cannot use the trigram index at all on this
 * database (see docs/search.md: Postgres classifies no Ethiopic character as
 * alphanumeric, so pg_trgm extracts zero trigrams from it), which means every
 * variant is another predicate evaluated against every row of a sequential
 * scan. On a 50,000-row table one variant measured 15ms and six measured 84ms.
 *
 * Four is the compromise. One ambiguous letter — the ሰ/ሠ of the eparchy's own
 * name, and by far the common case — costs two variants. Two ambiguous letters
 * cost four. Past that the term is searched exactly as typed: fewer results,
 * but fast, and the reader can spell it the other way if they need to.
 */
export function geezVariants(term: string, max = 4): string[] {
  const chars = [...term]

  // Cheap exit for the overwhelmingly common case: no ambiguous letters at all,
  // including every Latin query.
  const ambiguous = chars.filter((c) => {
    const match = familyOf(c.codePointAt(0)!)
    return match !== null && match.family.length > 1
  })
  if (ambiguous.length === 0) return [term]

  // Reject the explosion before building it.
  let total = 1
  for (const char of chars) {
    const match = familyOf(char.codePointAt(0)!)
    if (match) total *= match.family.length
    if (total > max) return [term]
  }

  let variants: string[] = ['']
  for (const char of chars) {
    const match = familyOf(char.codePointAt(0)!)
    if (!match || match.family.length === 1) {
      variants = variants.map((v) => v + char)
      continue
    }
    const alternatives = match.family.map((base) => String.fromCodePoint(base + match.offset))
    variants = variants.flatMap((v) => alternatives.map((a) => v + a))
  }

  // The term as typed goes first: it is what the reader believes they wrote.
  return [term, ...variants.filter((v) => v !== term)]
}
