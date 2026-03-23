import type { CollectionConfig } from 'payload'
import { isPublicRead, isChanceryOrAbove } from '@/lib/permissions/collectionAccess'

export const Ministries: CollectionConfig = {
  slug: 'ministries',
  admin: { useAsTitle: 'name', group: 'Church', defaultColumns: ['name', 'type', 'slug'] },
  access: { read: isPublicRead, create: isChanceryOrAbove, update: isChanceryOrAbove, delete: isChanceryOrAbove },
  fields: [
    { name: 'name', type: 'text', required: true, localized: true },
    { name: 'slug', type: 'text', required: true, unique: true, admin: { position: 'sidebar' } },
    { name: 'type', type: 'select', options: ['youth-council', 'catechists', 'children', 'small-christian-community', 'lay-apostolate', 'caritas', 'women-league', 'men-league', 'other'] },
    { name: 'description', type: 'richText', localized: true },
    { name: 'featuredImage', type: 'upload', relationTo: 'media' },
  ],
}
