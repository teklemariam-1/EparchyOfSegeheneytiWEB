import type { CollectionConfig } from 'payload'
import { isPublicRead, isChanceryOrAbove } from '@/lib/permissions/collectionAccess'

export const Schools: CollectionConfig = {
  slug: 'schools',
  admin: { useAsTitle: 'name', group: 'Institutions' },
  access: { read: isPublicRead, create: isChanceryOrAbove, update: isChanceryOrAbove, delete: isChanceryOrAbove },
  fields: [
    { name: 'name', type: 'text', required: true, localized: true },
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'level', type: 'select', options: ['primary', 'middle', 'secondary', 'vocational', 'higher'] },
    { name: 'location', type: 'text' },
    { name: 'description', type: 'richText', localized: true },
    { name: 'featuredImage', type: 'upload', relationTo: 'media' },
    { name: 'photos', type: 'array', fields: [{ name: 'image', type: 'upload', relationTo: 'media' }] },
    { name: 'status', type: 'select', options: ['active', 'inactive'], defaultValue: 'active', admin: { position: 'sidebar' } },
  ],
}
