import type { GlobalConfig } from 'payload'
import { isChanceryOrAbove } from '@/lib/permissions/collectionAccess'

export const Footer: GlobalConfig = {
  slug: 'footer',
  admin: { group: 'Navigation' },
  access: { read: () => true, update: isChanceryOrAbove },
  fields: [
    { name: 'copyrightText', type: 'text', localized: true },
    { name: 'columns', type: 'array', fields: [
      { name: 'heading', type: 'text', required: true, localized: true },
      { name: 'links', type: 'array', fields: [
        { name: 'label', type: 'text', required: true, localized: true },
        { name: 'url', type: 'text', required: true },
        { name: 'newTab', type: 'checkbox', defaultValue: false },
      ]},
    ]},
    { name: 'bottomLinks', type: 'array', fields: [
      { name: 'label', type: 'text', required: true, localized: true },
      { name: 'url', type: 'text', required: true },
    ]},
  ],
}
