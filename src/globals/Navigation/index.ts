import type { GlobalConfig } from 'payload'
import { revalidatePath } from 'next/cache'
import { isChanceryOrAbove } from '../../lib/permissions/collectionAccess'

export const Navigation: GlobalConfig = {
  slug: 'navigation',
  admin: {
    group: 'Navigation',
    description: 'Main site navigation structure with optional mega-menu dropdowns.',
  },
  access: { read: () => true, update: isChanceryOrAbove },
  hooks: {
    afterChange: [
      () => {
        revalidatePath('/', 'layout')
      },
    ],
  },
  fields: [
    {
      name: 'mainNav',
      type: 'array',
      label: 'Main Navigation Items',
      admin: {
        description: 'Top-level navigation items. Each item can have a dropdown with sub-links.',
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'url',
          type: 'text',
          admin: { description: 'Leave blank if this item is a dropdown parent only.' },
        },
        {
          name: 'openInNewTab',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'children',
          type: 'array',
          label: 'Dropdown Items',
          fields: [
            { name: 'label', type: 'text', required: true, localized: true },
            { name: 'url', type: 'text', required: true },
            {
              name: 'description',
              type: 'text',
              localized: true,
              admin: { description: 'Short description shown in mega-menu dropdowns.' },
            },
            { name: 'icon', type: 'text', admin: { description: 'Optional Lucide icon name.' } },
            { name: 'openInNewTab', type: 'checkbox', defaultValue: false },
          ],
        },
      ],
    },
    {
      name: 'mobileExtra',
      type: 'array',
      label: 'Mobile-only Links',
      admin: {
        description: 'Additional links shown only in the mobile navigation drawer (e.g. Live Stream, Give).',
      },
      fields: [
        { name: 'label', type: 'text', required: true, localized: true },
        { name: 'url', type: 'text', required: true },
        { name: 'highlight', type: 'checkbox', defaultValue: false, admin: { description: 'Show as a highlighted button.' } },
      ],
    },
  ],
}
