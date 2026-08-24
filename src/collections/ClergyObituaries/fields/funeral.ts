import type { Field } from 'payload'
import { lexicalFromText } from '../../../lib/payload/lexical'

/**
 * Tabs ስነ-ስርዓት ቀብሪ and ቀወምቲ ጽሑፋት — the funeral report and the fixed
 * liturgical texts. Everything in the fixed-texts tab is prefilled: these are
 * the unchanging formulas of the genre, kept editable for the rare occasion
 * the chancery words one differently.
 */
export const funeralTab: Field[] = [
  {
    type: 'row',
    fields: [
      {
        name: 'funeralDate',
        type: 'date',
        label: 'ዕለተ ቀብሪ / Date of funeral',
        required: true,
      },
      {
        name: 'presidingBishop',
        type: 'text',
        label: 'መራሒ ስነ-ስርዓት / Presiding bishop',
        required: true,
        defaultValue: 'ብጹዕ ኣቡነ ፍቕረማርያም ሓጎስ ጳጳስ ሰበኻ ሰገነይቲ',
      },
    ],
  },
  {
    name: 'funeralDescription',
    type: 'richText',
    label: 'መግለጺ ስነ-ስርዓት / Description',
    localized: true,
    defaultValue: lexicalFromText(
      'ዓበይቲ ካህናት ብጾቶምን ነኣሽቱ ካህናት ደቆምን ኩሎም ውሉደ ክህነት፡ ካህናትን ደናግልን ምእመናንን ቤተሰብን ኣብ ዝተሳተፍዎ',
    ),
  },
  {
    type: 'row',
    fields: [
      {
        name: 'burialChurch',
        type: 'text',
        label: 'ቤተክርስትያን ቀብሪ / Burial church',
        required: true,
        admin: { description: 'ንኣብነት፦ ደብረ መድሓኔ ዓለም' },
      },
      {
        name: 'burialTown',
        type: 'text',
        label: 'ከተማ / Town',
        required: true,
        admin: { description: 'ንኣብነት፦ ዓዲቀይሕ' },
      },
    ],
  },
]

export const fixedTextsTab: Field[] = [
  {
    name: 'openingVerse',
    type: 'group',
    label: 'መኽፈቲ ጥቕሲ / Opening verse',
    fields: [
      {
        type: 'row',
        fields: [
          { name: 'reference', type: 'text', label: 'ሓበሬታ / Reference', defaultValue: 'ምሳሌ 10፥7' },
          {
            name: 'text',
            type: 'text',
            label: 'ጽሑፍ / Text',
            defaultValue: 'ሕያዎት ሰባት ብሕያውነቶም ይዝከሩ',
          },
        ],
      },
    ],
  },
  {
    name: 'ordinationHymn',
    type: 'group',
    label: 'መዝሙር ዕለተ ክህነት / Ordination-day hymn',
    fields: [
      {
        name: 'geez',
        type: 'textarea',
        label: 'ግዕዝ / Ge’ez',
        defaultValue:
          'ለካህናቲከ እግዚኦ ለካህናቲከ እለ ኣሥመሩከ፡ ትቤሎሙ ባኡ ጽርሐ መቅደስከ ኅበ ይኅድር ኃይለ ስብሐቲከ',
      },
      {
        name: 'tigrinya',
        type: 'textarea',
        label: 'ትግርኛ / Tigrinya',
        defaultValue:
          'ኦ ጎይታ ነቶም ዘሐጎስኻ ኣገልገልቲ ካህናትካ፡ ናብቲ ሓይልኻን ክብርኻን ዝሓድረሉ ኣደራሽ መቕደስካ እትዉ ኢኻ ትብሎም',
      },
    ],
  },
  {
    name: 'acknowledgements',
    type: 'richText',
    label: 'ምስጋና / Acknowledgements',
    localized: true,
    defaultValue: lexicalFromText(
      'ንኹሉኹም ኣብዚ ቀብሪ ኣቦና ዝተሳተፍኩም፡ ሕሰም ኣይትርከቡ የቐንየልና እናበልና ብስም ሰበኻ ሰገነይትን ቤተሰብን የቐንየልና ንብል።',
    ),
  },
  {
    name: 'condolencePrayer',
    type: 'richText',
    label: 'ጸሎት ጽንዓት / Condolence prayer',
    localized: true,
    defaultValue: lexicalFromText(
      'ንሰበኻ ከምኦም ዝበሉ ሕያዎትን ቅዱሳትን ካህናት ይልኣኸልና፡ ንቤተሰብ ከኣ ጽንዓት ይሃብ ንብል።',
    ),
  },
  {
    type: 'row',
    fields: [
      {
        name: 'mourningClosed',
        type: 'checkbox',
        label: 'ሓዘን ተዓጽዩ / Mourning closed',
        defaultValue: true,
      },
      {
        name: 'mourningClosedText',
        type: 'text',
        label: 'ቃል ምዕጻው ሓዘን / Closing formula',
        defaultValue: 'ሰበኻ ከኣ ሓዘንና ኣብዚ ከምዝዓጸና ንሕብር።',
        admin: { condition: (data) => Boolean(data?.mourningClosed) },
      },
    ],
  },
]
