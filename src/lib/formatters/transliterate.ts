import { slugify } from './slug'

/**
 * Practical Ge'ez-script (Ethiopic) → Latin transliteration, for slugs only.
 *
 * `slugify` strips Ethiopic characters entirely (see its own caveat), which
 * left every Tigrinya-titled document needing a hand-typed slug. This closes
 * that gap for collections whose titles are personal names — it is a readable
 * romanization, not a scholarly one: ejectives lose their marks, ሠ/ሰ both
 * become "s", ጸ/ፀ both "ts". That is exactly what a URL wants.
 *
 * The Ethiopic block is arranged in families of 8 code points — one consonant
 * in eight vowel orders — so the mapping is a family table plus a vowel table
 * rather than 350 individual characters.
 */

/** Consonant per 8-codepoint family, from U+1200 upward. '' = vowel carrier (አ, ዐ). */
const FAMILIES = [
  'h',  // ሀ U+1200
  'l',  // ለ U+1208
  'h',  // ሐ U+1210
  'm',  // መ U+1218
  's',  // ሠ U+1220
  'r',  // ረ U+1228
  's',  // ሰ U+1230
  'sh', // ሸ U+1238
  'q',  // ቀ U+1240
  'qw', // ቈ U+1248 (labialized)
  'q',  // ቐ U+1250
  'qw', // ቘ U+1258
  'b',  // በ U+1260
  'v',  // ቨ U+1268
  't',  // ተ U+1270
  'ch', // ቸ U+1278
  'h',  // ኀ U+1280
  'hw', // ኈ U+1288
  'n',  // ነ U+1290
  'ny', // ኘ U+1298
  '',   // አ U+12A0 — vowel carrier
  'k',  // ከ U+12A8
  'kw', // ኰ U+12B0
  'k',  // ኸ U+12B8
  'kw', // ዀ U+12C0
  'w',  // ወ U+12C8
  '',   // ዐ U+12D0 — vowel carrier
  'z',  // ዘ U+12D8
  'zh', // ዠ U+12E0
  'y',  // የ U+12E8
  'd',  // ደ U+12F0
  'd',  // ዸ U+12F8
  'j',  // ጀ U+1300
  'g',  // ገ U+1308
  'gw', // ጐ U+1310
  'g',  // ጘ U+1318
  't',  // ጠ U+1320
  'ch', // ጨ U+1328
  'p',  // ጰ U+1330
  'ts', // ጸ U+1338
  'ts', // ፀ U+1340
  'f',  // ፈ U+1348
  'p',  // ፐ U+1350
] as const

/**
 * Vowel per order within a family. The 6th order (sadis) is the bare
 * consonant — ት is "t", which is what makes ወልደማርያም come out "weldemaryam"
 * rather than "weledemareyame".
 */
const VOWELS = ['e', 'u', 'i', 'a', 'ie', '', 'o', 'we'] as const

const ETHIOPIC_START = 0x1200

/**
 * Romanize the Ethiopic characters of `text`; everything else passes through.
 * A vowel-carrier's bare 6th order (እ, ዕ) becomes "i" so it never vanishes
 * from inside a name.
 */
export function transliterateGeez(text: string): string {
  let out = ''
  for (const ch of text) {
    const cp = ch.codePointAt(0)!
    const offset = cp - ETHIOPIC_START
    const family = Math.floor(offset / 8)
    if (offset < 0 || family >= FAMILIES.length) {
      // Ethiopic punctuation (። ፡ …), numerals, and all non-Ethiopic text:
      // keep word boundaries, drop the rest — slugify cleans up after us.
      out += cp >= 0x1360 && cp <= 0x137f ? ' ' : ch
      continue
    }
    const consonant = FAMILIES[family]!
    const vowel = VOWELS[offset % 8]!
    out += consonant === '' && vowel === '' ? 'i' : consonant + vowel
  }
  return out
}

/** Slug from possibly-Ge'ez text: transliterate, then the standard slugify. */
export function slugifyGeez(text: string): string {
  return slugify(transliterateGeez(text))
}
