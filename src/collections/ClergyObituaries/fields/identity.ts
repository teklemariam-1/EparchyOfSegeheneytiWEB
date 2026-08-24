import type { Field } from 'payload'

/**
 * Tab መንነት — who the priest was. Names are written exactly as the chancery
 * writes them, titles included («ቀሺ ወልደማርያም ተኽለ»), so nothing here is
 * localized except the birthplace, which readers see inside prose.
 */
export const identityTab: Field[] = [
  {
    type: 'row',
    fields: [
      {
        name: 'honorific',
        type: 'select',
        label: 'መዓርግ / Honorific',
        required: true,
        // Stored as the Tigrinya word itself (the Priests collection does the
        // same with its `title` select) — the composer prints it verbatim.
        options: [
          { label: 'ቀሺ', value: 'ቀሺ' },
          { label: 'ኣባ', value: 'ኣባ' },
          { label: 'መልኣከ ሰላም', value: 'መልኣከ ሰላም' },
          { label: 'ሊቀ ካህናት', value: 'ሊቀ ካህናት' },
          { label: 'ካልእ / Other', value: 'other' },
        ],
      },
      {
        name: 'honorificOther',
        type: 'text',
        label: 'ካልእ መዓርግ / Other honorific',
        admin: { condition: (data) => data?.honorific === 'other' },
      },
    ],
  },
  {
    name: 'fullName',
    type: 'text',
    label: 'ምሉእ ስም / Full name',
    required: true,
    admin: { description: 'ንኣብነት፦ ዑቕባገብርኤል ቀሺ ወልደማርያም' },
  },
  {
    name: 'photo',
    type: 'upload',
    relationTo: 'media',
    label: 'ስእሊ / Photo',
    required: true,
  },
  {
    type: 'row',
    fields: [
      {
        name: 'birthDate',
        type: 'date',
        label: 'ዕለተ ልደት / Date of birth',
        required: true,
      },
      {
        name: 'birthPlace',
        type: 'text',
        label: 'ዓዲ ልደት / Place of birth',
        localized: true,
        required: true,
        admin: { description: 'ንኣብነት፦ ዓዲጣል' },
      },
    ],
  },
  {
    name: 'fatherName',
    type: 'text',
    label: 'ስም ኣቦ / Father',
    required: true,
    admin: { description: 'ምስ መዓርጎም ይጻሓፍ፣ ንኣብነት፦ ቀሺ ወልደማርያም ተኽለ' },
  },
  {
    name: 'motherName',
    type: 'text',
    label: 'ስም ኣደ / Mother',
    required: true,
    admin: { description: 'ንኣብነት፦ ወ/ሮ ግደይ ገብረንጉስ' },
  },
  {
    name: 'relatedPriest',
    type: 'relationship',
    relationTo: 'priests',
    label: 'ካብ መዝገብ ካህናት / From the clergy register',
    admin: {
      description:
        'ነቲ ዝዓረፈ ካህን ካብ መዝገብ ካህናት ምረጹ፣ ጥርሑ ዝተረፈ ስም፡ ስእሊ፡ ዕለተ ልደትን ዕለተ ክህነትን ካብኡ ባዕሉ ይመልእ። / Pick the deceased priest from the clergy register — empty name, photo, birth and ordination dates are filled in from it.',
    },
  },
]
