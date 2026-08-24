import type { Field } from 'payload'

/**
 * Tab ጉዕዞ ክህነት — diaconate, ordination, and (for priests ordained outside the
 * Catholic Church) the reception into full communion. Bishops' names are typed
 * with their full written title («ኣቡነ ማርቆስ ጳጳስ ኦርቶዶክስ ቤተክርስትያን»), never
 * assembled from parts.
 */
export const priesthoodTab: Field[] = [
  {
    name: 'diaconate',
    type: 'group',
    label: 'መዓርገ ዲቁና / Diaconate',
    fields: [
      {
        type: 'row',
        fields: [
          { name: 'date', type: 'date', label: 'ዕለት / Date' },
          { name: 'bishop', type: 'text', label: 'ብኢድ / Ordaining bishop' },
          { name: 'place', type: 'text', label: 'ቦታ / Place' },
        ],
      },
    ],
  },
  {
    name: 'ordination',
    type: 'group',
    label: 'መዓርገ ክህነት / Priestly ordination',
    fields: [
      {
        type: 'row',
        fields: [
          { name: 'date', type: 'date', label: 'ዕለት / Date', required: true },
          {
            name: 'bishop',
            type: 'text',
            label: 'ብኢድ / Ordaining bishop',
            required: true,
            admin: { description: 'ምሉእ መዓርጎም ይጻሓፍ፣ ንኣብነት፦ ኣቡነ ማርቆስ ጳጳስ ኦርቶዶክስ ቤተክርስትያን' },
          },
          { name: 'place', type: 'text', label: 'ቦታ / Place' },
        ],
      },
      {
        name: 'church',
        type: 'select',
        label: 'ቤተክርስትያን / Church of ordination',
        required: true,
        defaultValue: 'catholic',
        options: [
          { label: 'ካቶሊካዊት / Catholic', value: 'catholic' },
          { label: 'ኦርቶዶክስ / Orthodox', value: 'orthodox' },
          { label: 'ካልእ / Other', value: 'other' },
        ],
      },
    ],
  },
  {
    name: 'fullCommunion',
    type: 'group',
    label: 'ናብ ካቶሊካዊት ቤተክርስትያን ምእታው / Reception into full communion',
    admin: {
      condition: (data) => {
        const church = (data as { ordination?: { church?: string } } | undefined)?.ordination?.church
        return Boolean(church) && church !== 'catholic'
      },
    },
    fields: [
      {
        type: 'row',
        fields: [
          { name: 'year', type: 'number', label: 'ዓመት / Year' },
          {
            name: 'authorizingBishop',
            type: 'text',
            label: 'ብፍቓድ / Authorizing bishop',
            admin: { description: 'ንኣብነት፦ ብጹዕ ኣቡነ ኣብርሃ ፍራንሱዋ' },
          },
        ],
      },
    ],
  },
  {
    name: 'religiousOrder',
    type: 'text',
    label: 'ማሕበር / Religious order',
  },
]
