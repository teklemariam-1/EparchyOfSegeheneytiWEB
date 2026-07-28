import type { GlobalConfig } from 'payload'
import { safeRevalidatePath, safeRevalidateTag } from '../../lib/payload/revalidate'
import { can } from '../../lib/permissions/access'

export const PopeSettings: GlobalConfig = {
  slug: 'pope-settings',
  label: 'Current Pope',
  admin: {
    group: 'Magisterium',
    description:
      'The reigning Holy Father — photo and basic information shown at the top of the "Messages from the Holy Father" page. Update this when a new pope is elected.',
  },
  access: { read: () => true, update: can('globals.pope-settings.edit') },
  hooks: {
    afterChange: [
      () => {
        safeRevalidateTag('globals')
        safeRevalidatePath('/pope-messages')
      },
    ],
  },
  fields: [
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Official portrait of the Holy Father. Recommended: portrait orientation, at least 600×800px.',
      },
    },
    {
      name: 'name',
      type: 'text',
      localized: true,
      admin: {
        description: 'Papal name, e.g. "Pope Leo XIV". Leave empty to hide the whole section from the public page.',
      },
    },
    {
      name: 'title',
      type: 'text',
      localized: true,
      admin: {
        description: 'Title line shown under the name, e.g. "Bishop of Rome, Successor of Saint Peter".',
      },
    },
    {
      name: 'electedAt',
      type: 'date',
      admin: {
        date: { pickerAppearance: 'dayOnly' },
        description: 'Date of election to the papacy — shown as "Holy Father since …".',
      },
    },
    {
      name: 'bio',
      type: 'textarea',
      localized: true,
      admin: {
        description: 'Short biography or introduction (a few sentences).',
      },
    },
    {
      name: 'vaticanUrl',
      type: 'text',
      admin: {
        description: 'Link to the Holy Father\'s page on vatican.va (optional).',
      },
    },
  ],
}
