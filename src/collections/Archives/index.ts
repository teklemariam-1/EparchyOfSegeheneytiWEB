import type { CollectionConfig } from 'payload'
import { isPublicRead, isChanceryOrAbove } from '@/lib/permissions/collectionAccess'

export const Archives: CollectionConfig = {
  slug: 'archives',
  admin: { useAsTitle: 'title', group: 'Publications' },
  access: { read: isPublicRead, create: isChanceryOrAbove, update: isChanceryOrAbove, delete: isChanceryOrAbove },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'year', type: 'number' },
    { name: 'category', type: 'select', options: ['official', 'pastoral', 'historical', 'correspondence', 'other'] },
    { name: 'description', type: 'textarea', localized: true },
    { name: 'files', type: 'array', fields: [{ name: 'file', type: 'upload', relationTo: 'media' }, { name: 'label', type: 'text' }] },
  ],
}
