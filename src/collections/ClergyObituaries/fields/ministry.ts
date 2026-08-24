import type { Field } from 'payload'

/**
 * Tab ኣገልግሎት — the chronological assignments. Historic periods are written in
 * many shapes («ካብ 1978-1979», «ብ15 የካቲት 1979», «ብ2010ፈ»), so the row carries
 * both the verbatim `periodDisplay` the reader sees and a machine `sortDate`
 * that drives ordering only — year-only periods use 1 January of that year.
 *
 * `parishName` is the verbatim historic name (many no longer match a parish
 * record); the optional `parish` relationship links the record when one exists.
 */
export const ministryTab: Field[] = [
  {
    name: 'assignments',
    type: 'array',
    label: 'ኣገልግሎታት / Assignments',
    minRows: 1,
    required: true,
    admin: {
      description:
        'በብግዜኡ ዝነበሩዎ ኣገልግሎታት፣ ብዕለት መሰርዒ (sortDate) ይሰርዑ። / Assignments in chronological order, sorted by the sort date.',
    },
    fields: [
      {
        type: 'row',
        fields: [
          {
            name: 'sortDate',
            type: 'date',
            label: 'ዕለት መሰርዒ / Sort date',
            required: true,
            admin: {
              description: 'ንምስራዕ ጥራይ፣ ዓመት ጥራይ ዝፍለጥ እንተኾይኑ 1 ጥሪ ናይታ ዓመት ይመረጽ።',
            },
          },
          {
            name: 'periodDisplay',
            type: 'text',
            label: 'እዋን ከም ዝንበብ / Period as it should read',
            required: true,
            admin: { description: 'ንኣብነት፦ «ካብ 1978-1979»፡ «ብ15 የካቲት 1979»፡ «ብ2010ፈ»' },
          },
        ],
      },
      {
        type: 'row',
        fields: [
          {
            name: 'role',
            type: 'select',
            label: 'መዝነት / Role',
            options: [
              { label: 'ምክትል ቆሞስ', value: 'ምክትል ቆሞስ' },
              { label: 'ቆሞስ', value: 'ቆሞስ' },
              { label: 'ኣገልጋሊ', value: 'ኣገልጋሊ' },
              { label: 'ንዕረፍቲ', value: 'ንዕረፍቲ' },
              { label: 'ካልእ / Other', value: 'other' },
            ],
          },
          {
            name: 'roleOther',
            type: 'text',
            label: 'ካልእ መዝነት / Other role',
            admin: { condition: (_data, siblingData) => siblingData?.role === 'other' },
          },
        ],
      },
      {
        type: 'row',
        fields: [
          {
            name: 'parishName',
            type: 'text',
            label: 'ስም ቤተክርስትያን / Parish as written',
            required: true,
            admin: { description: 'ንኣብነት፦ ደብረ መድሓኔ ዓለም' },
          },
          {
            name: 'place',
            type: 'text',
            label: 'ቦታ / Place',
            admin: { description: 'ንኣብነት፦ በራቒት ንእሽቶ' },
          },
        ],
      },
      {
        name: 'parish',
        type: 'relationship',
        relationTo: 'parishes',
        label: 'መዝገብ ቁምስና / Parish record',
        admin: {
          description: 'ኣማራጺ፣ እታ ቁምስና ኣብ መዝገብ እንተላ ተኣሳስሩ። / Optional link when the parish exists in the register.',
        },
      },
      {
        name: 'achievements',
        type: 'array',
        label: 'ግብርታት / Achievements',
        localized: true,
        admin: {
          description:
            'ዝተሃንጻ ኣብያተ ክርስትያን፡ መንበሪ ቆሞስ፡ ሕድሳት — ነፍሲ ወከፍ ከም ምሉእ ምሉእ ሓሳብ። / Churches built, rectories, renovations — each as a complete sentence.',
        },
        fields: [{ name: 'text', type: 'textarea', required: true }],
      },
      {
        name: 'sentenceOverride',
        type: 'textarea',
        label: 'ፍሉይ ምሉእ ሓሳብ / Sentence override',
        admin: {
          description:
            'እቲ ልሙድ ኣገባብ ዘይሰማማዕ እንተኾይኑ፡ ነዛ መስርዕ እዚ ጥራይ ይሕተም። / When set, replaces the standard generated sentence for this row.',
        },
      },
    ],
  },
]
