import type { Field } from 'payload'
import { lexicalFromText } from '../../../lib/payload/lexical'

/**
 * Tab ዕረፍቲ — the death itself and the announcement paragraph. The paragraph
 * default carries ⟨…⟩ placeholders the editor replaces; the ወቕቲ hint under it
 * (see components/admin/obituaries/SeasonHint) names the liturgical season of
 * the death date but never writes into the text — the editor does.
 */
// «ሠናይ ገድሊ» carries guillemets, not ASCII quotes: a `"` inside a prefilled
// richText default ends up unescaped inside the migration's jsonb DEFAULT
// literal (Payload codegen does not re-escape it), which is invalid JSON and
// broke `payload migrate` in CI.
export const OPENING_PARAGRAPH_DEFAULT =
  'ሎሚ ኣብ ⟨ዘመነ/ወቕቲ⟩፡ … ነዞም ኣብዛ ምድሪ’ዚኣ ብ«ሠናይ ገድሊ» ዝተጋደሉ፡ ልኡኽ እግዚኣብሔር ዝኾኑ፡ ኣቦና ⟨መዓርግን ስምን⟩ ካብዛ ታህዋኽን ሸበድበድን ዝመልኣ ምድሪ፡ ኣብ መበል ⟨ዕድመ⟩ ዕድመኦም ነፋንዎም ኣሎና።'

export const deathTab: Field[] = [
  {
    type: 'row',
    fields: [
      {
        name: 'deathDate',
        type: 'date',
        label: 'ዕለተ ዕረፍቲ / Date of death',
        required: true,
        validate: (value: unknown, { data }: { data: unknown }) => {
          if (typeof value !== 'string' || !value) return true // `required` reports the empty case
          const birth = (data as { birthDate?: unknown } | undefined)?.birthDate
          if (typeof birth === 'string' && birth && new Date(value) < new Date(birth)) {
            return 'ዕለተ ዕረፍቲ ቅድሚ ዕለተ ልደት ክኸውን ኣይክእልን። / The date of death cannot be before the date of birth.'
          }
          return true
        },
      },
      {
        name: 'ageAtDeath',
        type: 'number',
        label: 'ዕድመ / Age',
        admin: { description: 'ባዕሉ ይሕሰብ፣ ምቕያር ይከኣል' },
      },
      {
        name: 'placeOfDeath',
        type: 'text',
        label: 'ቦታ ዕረፍቲ / Place of death',
      },
    ],
  },
  {
    name: 'openingParagraph',
    type: 'richText',
    label: 'መፋነዊ ሓረግ / Opening paragraph',
    localized: true,
    required: true,
    defaultValue: lexicalFromText(OPENING_PARAGRAPH_DEFAULT),
    admin: {
      components: {
        Description: '@/components/admin/obituaries/SeasonHint#SeasonHint',
      },
    },
  },
]
