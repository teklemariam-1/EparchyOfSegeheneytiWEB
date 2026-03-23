import type { CollectionConfig } from 'payload'
import { isPublicRead, isChanceryOrAbove } from '@/lib/permissions/collectionAccess'

export const SmallChristianCommunities: CollectionConfig = {
  slug: 'small-christian-communities',
  admin: { useAsTitle: 'name', group: 'Ministries' },
  access: { read: isPublicRead, create: isChanceryOrAbove, update: isChanceryOrAbove, delete: isChanceryOrAbove },
  fields: [
    { name: 'name', type: 'text', required: true, localized: true },
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'description', type: 'richText', localized: true },
    { name: 'parish', type: 'relationship', relationTo: 'parishes', admin: { position: 'sidebar' } },
    { name: 'meetingSchedule', type: 'text' },
    { name: 'status', type: 'select', options: ['active', 'inactive'], defaultValue: 'active', admin: { position: 'sidebar' } },
  ],
}
