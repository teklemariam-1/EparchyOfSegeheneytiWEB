import type { CollectionConfig } from 'payload'
import { isPublicRead, isChanceryOrAbove } from '@/lib/permissions/collectionAccess'

export const Clinics: CollectionConfig = {
  slug: 'clinics',
  admin: { useAsTitle: 'name', group: 'Institutions' },
  access: { read: isPublicRead, create: isChanceryOrAbove, update: isChanceryOrAbove, delete: isChanceryOrAbove },
  fields: [
    { name: 'name', type: 'text', required: true, localized: true },
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'type', type: 'select', options: ['clinic', 'hospital', 'dispensary', 'pharmacy'] },
    { name: 'location', type: 'text' },
    { name: 'description', type: 'richText', localized: true },
    { name: 'featuredImage', type: 'upload', relationTo: 'media' },
    { name: 'status', type: 'select', options: ['active', 'inactive'], defaultValue: 'active', admin: { position: 'sidebar' } },
  ],
}
