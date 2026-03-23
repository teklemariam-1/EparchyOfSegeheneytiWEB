import type { GlobalConfig } from 'payload'
import { isChanceryOrAbove } from '@/lib/permissions/collectionAccess'

export const Header: GlobalConfig = {
  slug: 'header',
  admin: { group: 'Navigation' },
  access: { read: () => true, update: isChanceryOrAbove },
  fields: [
    { name: 'logo', type: 'upload', relationTo: 'media' },
    { name: 'logoAlt', type: 'text', localized: true },
    { name: 'announcementBanner', type: 'group', fields: [
      { name: 'enabled', type: 'checkbox', defaultValue: false },
      { name: 'message', type: 'text', localized: true },
      { name: 'link', type: 'text' },
    ]},
  ],
}
