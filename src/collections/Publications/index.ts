import type { CollectionConfig } from 'payload'
import { isPublicRead, isChanceryOrAbove } from '@/lib/permissions/collectionAccess'

export const Publications: CollectionConfig = {
  slug: 'publications',
  admin: { useAsTitle: 'title', group: 'Publications', defaultColumns: ['title', 'category', 'publishedAt'] },
  access: { read: isPublicRead, create: isChanceryOrAbove, update: isChanceryOrAbove, delete: isChanceryOrAbove },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    { name: 'slug', type: 'text', required: true, unique: true, admin: { position: 'sidebar' } },
    { name: 'category', type: 'select', options: ['pastoral', 'liturgical', 'educational', 'news', 'other'] },
    { name: 'description', type: 'textarea', localized: true },
    { name: 'file', type: 'upload', relationTo: 'media', required: true },
    { name: 'coverImage', type: 'upload', relationTo: 'media' },
    { name: 'publishedAt', type: 'date', admin: { position: 'sidebar' } },
  ],
}
