import type { CollectionConfig } from 'payload'
import { isPublicRead, isChanceryOrAbove } from '@/lib/permissions/collectionAccess'

export const PopeMessages: CollectionConfig = {
  slug: 'pope-messages',
  admin: { useAsTitle: 'title', group: 'Magisterium', defaultColumns: ['title', 'publishedAt', 'status'] },
  access: { read: isPublicRead, create: isChanceryOrAbove, update: isChanceryOrAbove, delete: isChanceryOrAbove },
  versions: { drafts: true },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    { name: 'slug', type: 'text', required: true, unique: true, admin: { position: 'sidebar' } },
    { name: 'summary', type: 'textarea', localized: true },
    { name: 'body', type: 'richText', localized: true },
    { name: 'document', type: 'upload', relationTo: 'media', admin: { description: 'PDF document (optional)' } },
    { name: 'featuredImage', type: 'upload', relationTo: 'media' },
    { name: 'publishedAt', type: 'date', admin: { position: 'sidebar' } },
    { name: 'status', type: 'select', options: ['draft', 'published'], defaultValue: 'draft', admin: { position: 'sidebar' } },
  ],
}
