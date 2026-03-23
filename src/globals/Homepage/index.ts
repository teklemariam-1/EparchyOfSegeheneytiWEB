import type { GlobalConfig } from 'payload'
import { isChanceryOrAbove } from '@/lib/permissions/collectionAccess'

export const Homepage: GlobalConfig = {
  slug: 'homepage',
  admin: { group: 'Content' },
  access: { read: () => true, update: isChanceryOrAbove },
  fields: [
    { name: 'heroHeadline', type: 'text', localized: true },
    { name: 'heroSubheading', type: 'text', localized: true },
    { name: 'heroImage', type: 'upload', relationTo: 'media' },
    { name: 'heroCta', type: 'group', fields: [
      { name: 'primaryLabel', type: 'text', localized: true },
      { name: 'primaryUrl', type: 'text' },
      { name: 'secondaryLabel', type: 'text', localized: true },
      { name: 'secondaryUrl', type: 'text' },
    ]},
    { name: 'featuredBishopMessage', type: 'relationship', relationTo: 'bishop-messages', admin: { position: 'sidebar' } },
    { name: 'showLatestNews', type: 'checkbox', defaultValue: true },
    { name: 'showUpcomingEvents', type: 'checkbox', defaultValue: true },
    { name: 'latestNewsCount', type: 'number', defaultValue: 3, min: 1, max: 6 },
    { name: 'upcomingEventsCount', type: 'number', defaultValue: 3, min: 1, max: 6 },
  ],
}
