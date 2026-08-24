import { describe, expect, it } from 'vitest'
import type { ClergyObituary } from '@/types/payload-types'
import { composeObituary, formatObituaryDate } from '../compose'
import { fixtureUkbagebriel } from './fixture'

function compose(overrides: Partial<ClergyObituary> = {}) {
  return composeObituary({ ...fixtureUkbagebriel, ...overrides }, 'ti')
}

function section(result: ReturnType<typeof composeObituary>, id: string) {
  return result.sections.find((s) => s.id === id)
}

describe('formatObituaryDate', () => {
  it('renders Gregorian dates with Tigrinya month names', () => {
    expect(formatObituaryDate('1931-05-27', 'ti')).toBe('27 ግንቦት 1931')
    expect(formatObituaryDate('1992-09-11', 'ti')).toBe('11 መስከረም 1992')
  })

  it('renders English month names for the en locale and "" for garbage', () => {
    expect(formatObituaryDate('1931-05-27', 'en')).toBe('27 May 1931')
    expect(formatObituaryDate('not-a-date', 'ti')).toBe('')
  })
})

describe('composeObituary', () => {
  it('renders every section in canonical order for the full fixture', () => {
    const result = compose()
    expect(result.sections.map((s) => s.id)).toEqual([
      'verse', 'opening', 'hymn', 'birth', 'marriage', 'ordination',
      'fullCommunion', 'assignments', 'character', 'funeral', 'closing',
    ])
  })

  it('omits the marriage section for unmarried clergy', () => {
    const result = compose({ isMarried: false })
    expect(section(result, 'marriage')).toBeUndefined()
    expect(result.fullText).not.toContain('ቃል ኪዳን')
  })

  it('writes ነፍስሄርት before the spouse only when she predeceased', () => {
    const widowed = compose()
    expect(section(widowed, 'marriage')!.body).toContain('ምስ ክብርቲ ነፍስሄርት ወ/ሮ ግደይ ካሕሳይ')

    const surviving = compose({
      marriage: { ...fixtureUkbagebriel.marriage, spouseDeceased: false },
    })
    expect(section(surviving, 'marriage')!.body).toContain('ምስ ክብርቲ ወ/ሮ ግደይ ካሕሳይ')
    expect(section(surviving, 'marriage')!.body).not.toContain('ነፍስሄርት')
  })

  it('includes the full-communion block for an orthodox-ordained priest', () => {
    const body = section(compose(), 'fullCommunion')!.body
    expect(body).toBe(
      'ካብዚ ቀጺሎም ብ1977ፈ ብፍቓድ ብጹዕ ኣቡነ ኣብርሃ ፍራንሱዋ ናብ ካቶሊካዊት ቤተክርስትያን ኣትዮም።',
    )
  })

  it('omits the full-communion block for a catholic-ordained priest even when data is present', () => {
    const result = compose({
      ordination: { ...fixtureUkbagebriel.ordination, church: 'catholic' },
    })
    expect(section(result, 'fullCommunion')).toBeUndefined()
  })

  it('orders assignments by sortDate regardless of input order', () => {
    const shuffled = [...fixtureUkbagebriel.assignments].reverse()
    const body = section(compose({ assignments: shuffled }), 'assignments')!.body
    const lines = body.split('\n')
    expect(lines[0]).toContain('ካብ 1978-1979')
    expect(lines[lines.length - 1]).toContain('ብ2010ፈ')
    expect(body.indexOf('ብ11 መስከረም 1992ፈ')).toBeLessThan(body.indexOf('ብ20 መስከረም 1993ፈ'))
  })

  it('uses sentenceOverride verbatim in place of the generated sentence', () => {
    const override = 'ኣብዚ እዋን እዚ ፍሉይ ተልእኾ ተዋሂብዎም ኣገልጊሎም።'
    const assignments = [
      { ...fixtureUkbagebriel.assignments[0]!, sentenceOverride: override },
      ...fixtureUkbagebriel.assignments.slice(1),
    ]
    const body = section(compose({ assignments }), 'assignments')!.body
    expect(body).toContain(override)
    expect(body).not.toContain('ከም ምክትል ቆሞስ')
  })

  it('appends each achievement as its own sentence after the assignment', () => {
    const body = section(compose(), 'assignments')!.body
    expect(body).toContain(
      'ብ1985 ከም ቆሞስ ኮይኖም ኣብ ደብረ መድሓኔ ዓለም (በራቒት ንእሽቶ) ኣገልጊሎም። ብ1987 ነዛ ንእሽቶን ንጸሎት ምችእትን ቤተክርስትያን ክሃንጹ ጀሚሮም ብረዲኤት መድሓኔ ዓለም ዛዚሞማ።',
    )
  })

  it('drops the parenthesised place when an assignment has none', () => {
    const body = section(compose(), 'assignments')!.body
    expect(body).toContain('ካብ 1984-1985 ከም ኣገልጋሊ ኮይኖም ኣብ ድግሳ ማርያም ጽዮን ኣገልጊሎም።')
    expect(body).not.toContain('()')
  })

  it('omits empty optional sections cleanly', () => {
    const result = compose({
      isMarried: false,
      marriage: undefined,
      retirementDescription: null,
      characterVerse: undefined,
      characterSummary: null,
      virtues: [],
      scriptureReflections: [],
      hopeStatement: null,
      acknowledgements: null,
      condolencePrayer: null,
      mourningClosed: false,
    })
    const ids = result.sections.map((s) => s.id)
    expect(ids).not.toContain('marriage')
    expect(ids).not.toContain('retirement')
    expect(ids).not.toContain('character')
    expect(ids).not.toContain('closing')
    expect(result.fullText).not.toContain('undefined')
    expect(result.fullText).not.toContain('null')
    expect(result.fullText).not.toMatch(/\n\n\n/)
  })

  it('includes the mourning-closed formula only when the box is ticked', () => {
    expect(section(compose(), 'closing')!.body).toContain('ሓዘንና ኣብዚ ከምዝዓጸና')
    expect(section(compose({ mourningClosed: false }), 'closing')!.body).not.toContain(
      'ሓዘንና ኣብዚ ከምዝዓጸና',
    )
  })

  it('heads the character section with the honorific and first name', () => {
    expect(section(compose(), 'character')!.heading).toBe('ፍሉይ መለልዪ ባህሪ ቀሺ ዑቕባገብርኤል')
  })

  it('composes the funeral report with description, town and church', () => {
    expect(section(compose(), 'funeral')!.body).toBe(
      'ሎሚ ዕለት 15 ነሓሰ 2026ፈ ብጹዕ ኣቡነ ፍቕረማርያም ሓጎስ ጳጳስ ሰበኻ ሰገነይቲ፡ ' +
        'ዓበይቲ ካህናት ብጾቶምን ነኣሽቱ ካህናት ደቆምን ኩሎም ውሉደ ክህነት፡ ካህናትን ደናግልን ምእመናንን ቤተሰብን ኣብ ዝተሳተፍዎ ' +
        'ስነ-ስርዓት ቀብሮም ኣብ ዓዲቀይሕ ደብረ መድሓኔ ዓለም ሓመድ ኣዳም ለቢሶም ብኽብሪ ተፈጺሙ ኣሎ።',
    )
  })

  it('matches the full-text snapshot for the fixture', () => {
    expect(compose().fullText).toMatchSnapshot()
  })
})
