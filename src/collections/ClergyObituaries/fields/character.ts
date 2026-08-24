import type { Field } from 'payload'
import { lexicalFromText } from '../../../lib/payload/lexical'

/**
 * Tabs ግዜ ዕረፍቲ and ጠባይን መንፈሳውነትን — retirement and the character section.
 * The character texts are prefilled with the standard verses and formulas of
 * the genre; the virtues list is the one part written fresh for each priest.
 */
export const retirementTab: Field[] = [
  {
    type: 'row',
    fields: [
      { name: 'retirementYear', type: 'number', label: 'ዓመተ ዕረፍቲ ስራሕ / Year of retirement' },
      { name: 'retirementPlace', type: 'text', label: 'ቦታ / Place' },
    ],
  },
  {
    name: 'retirementDescription',
    type: 'richText',
    label: 'ኣገልግሎት ግዜ ዕረፍቲ / Retirement ministry',
    localized: true,
  },
]

export const characterTab: Field[] = [
  {
    name: 'characterVerse',
    type: 'group',
    label: 'ጥቕሲ / Verse',
    fields: [
      {
        type: 'row',
        fields: [
          { name: 'reference', type: 'text', label: 'ሓበሬታ / Reference', defaultValue: 'ምሳሌ 14፥14' },
          {
            name: 'text',
            type: 'text',
            label: 'ጽሑፍ / Text',
            defaultValue: 'ሕያዎት ሰባት ከም ግብሮም ዓስቦም ክስዕቦም እዩ',
          },
        ],
      },
    ],
  },
  {
    name: 'characterSummary',
    type: 'richText',
    label: 'ሓጺር መግለጺ / Summary',
    localized: true,
    defaultValue: lexicalFromText(
      'ብሕጽር ዝበለ እተን ብጹዓን ነዳያን ዝብላ 8ተ ብጽዕነታት ኣብ ሕይወቶም ዘንጸባርቓ ኢየን።',
    ),
  },
  {
    name: 'virtues',
    type: 'array',
    label: 'ግብረ ሠናያት / Virtues',
    localized: true,
    required: true,
    minRows: 1,
    admin: {
      description:
        'ንኣብነት፦ ብሓቂ ለዋህ ኣቦ፡ ቦቕባቕ ኣቦ፡ ምልክት ሕያውነትን ትሕትናን፡ ምስ ኩሉ ብሰላም ዝነብሩ',
    },
    fields: [{ name: 'text', type: 'text', required: true }],
  },
  {
    name: 'scriptureReflections',
    type: 'array',
    label: 'ጥቕስታት ቅዱስ መጽሓፍ / Scripture reflections',
    defaultValue: [
      {
        reference: 'ዮሓ 12፥26',
        text: 'እቲ ዘገልግለኒ ዘበለ፡ ኣብቲ ኣነ ዘለኹዎ ክህሉ ኢዩ',
      },
      {
        reference: 'ራእ 14፥13',
        text: 'እቶም ካብ ሕጂ ብጐይታ ዚሞቱ ብፁዓን እዮም፥ እወ፥ ግብሮም ኪስዕቦም እዩ እሞ ካብ ጻዕሮም ኬዕርፉ እዮም',
      },
    ],
    fields: [
      { name: 'reference', type: 'text', label: 'ሓበሬታ / Reference', required: true },
      { name: 'text', type: 'textarea', label: 'ጽሑፍ / Text', required: true },
    ],
  },
  {
    name: 'hopeStatement',
    type: 'richText',
    label: 'ቃል ተስፋ / Statement of hope',
    localized: true,
    defaultValue: lexicalFromText(
      'ናይቶም ለዋሃት ሰባት ዓስቢ፡ ርስቲ ቅዱሳን፡ ሰማያዊ ሓጎስ፡ ዓይኒ ዘይረኣየቶ፡ እዝኒ ዘይሰማዓቶ፡ ልቢ ዘይሓለኖ ሰማያዊ ዓስቢ ከም ዝስዕቦም እምነትናን ተስፋናን ኢዩ።',
    ),
  },
]
