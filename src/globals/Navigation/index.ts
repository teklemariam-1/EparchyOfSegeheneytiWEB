import type { GlobalConfig } from 'payload'
import { isChanceryOrAbove } from '@/lib/permissions/collectionAccess'

export const Navigation: GlobalConfig = {
  slug: 'navigation',
  admin: { group: 'Navigation' },
  access: { read: () => true, update: isChanceryOrAbove },
  fields: [
    { name: 'mainNav', type: 'array', fields: [
      { name: 'label', type: 'text', required: true, localized: true },
      { name: 'url', type: 'text' },
      { name: 'children', type: 'array', fields: [
        { name: 'label', type: 'text', required: true, localized: true },
        { name: 'url', type: 'text', required: true },
        { name: 'description', type: 'text', localized: true },
      ]},
    ]},
  ],
}
