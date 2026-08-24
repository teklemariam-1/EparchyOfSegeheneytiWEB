import type { Field } from 'payload'

/**
 * Tab ሓዳርን ስድራቤትን — married secular clergy only. The whole group appears
 * once isMarried is ticked; ticking spouseDeceased is what puts «ነፍስሄርት»
 * before the spouse's name in the composed text.
 */
export const familyTab: Field[] = [
  {
    name: 'isMarried',
    type: 'checkbox',
    label: 'ምርዑው / Married',
    defaultValue: false,
  },
  {
    name: 'marriage',
    type: 'group',
    label: 'ሓዳር / Marriage',
    admin: { condition: (data) => Boolean(data?.isMarried) },
    fields: [
      {
        type: 'row',
        fields: [
          {
            name: 'marriageDate',
            type: 'date',
            label: 'ዕለተ ቃል ኪዳን / Date of marriage',
          },
          {
            name: 'spouseName',
            type: 'text',
            label: 'ስም በዓልቲ ቤት / Spouse',
            admin: { description: 'ንኣብነት፦ ወ/ሮ ግደይ ካሕሳይ' },
          },
        ],
      },
      {
        name: 'spouseDeceased',
        type: 'checkbox',
        label: 'ነፍስሄርት / Spouse predeceased',
        defaultValue: false,
        admin: {
          description: 'ምስ ተመልከተ፡ ቅድሚ ስማ «ነፍስሄርት» ይጻሓፍ። / When ticked, «ነፍስሄርት» is written before her name.',
        },
      },
      {
        name: 'children',
        type: 'array',
        label: 'ውሉዳት / Children',
        fields: [{ name: 'name', type: 'text', required: true }],
      },
    ],
  },
]
