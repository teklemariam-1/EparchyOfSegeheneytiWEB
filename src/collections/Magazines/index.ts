import type { CollectionConfig } from 'payload'
import { isPublicRead, isChanceryOrAbove } from '@/lib/permissions/collectionAccess'

export const Magazines: CollectionConfig = {
  slug: 'magazines',
  admin: { useAsTitle: 'title', group: 'Publications', defaultColumns: ['title', 'issueNumber', 'publishedAt'] },
  access: { read: isPublicRead, create: isChanceryOrAbove, update: isChanceryOrAbove, delete: isChanceryOrAbove },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    { name: 'slug', type: 'text', required: true, unique: true, admin: { position: 'sidebar' } },
    { name: 'issueNumber', type: 'number' },
    { name: 'year', type: 'number' },
    { name: 'description', type: 'textarea', localized: true },
    { name: 'document', type: 'upload', relationTo: 'media', required: true },
    { name: 'coverImage', type: 'upload', relationTo: 'media' },
    { name: 'publishedAt', type: 'date', admin: { position: 'sidebar' } },
  ],
}
