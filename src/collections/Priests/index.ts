import type { CollectionConfig } from 'payload'
import { isPublicRead, isChanceryOrAbove } from '@/lib/permissions/collectionAccess'

export const Priests: CollectionConfig = {
  slug: 'priests',
  admin: { useAsTitle: 'fullName', group: 'Church', defaultColumns: ['fullName', 'title', 'parish', 'status'] },
  access: { read: isPublicRead, create: isChanceryOrAbove, update: isChanceryOrAbove, delete: isChanceryOrAbove },
  fields: [
    { name: 'fullName', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, admin: { position: 'sidebar' } },
    { name: 'title', type: 'select', options: ['Rev. Fr.', 'Msgr.', 'Bishop', 'Archbishop', 'Cardinal', 'Deacon'], defaultValue: 'Rev. Fr.' },
    { name: 'role', type: 'text', admin: { description: 'e.g. Pastor, Vicar, Chancellor' } },
    { name: 'bio', type: 'richText' },
    { name: 'photo', type: 'upload', relationTo: 'media' },
    { name: 'parish', type: 'relationship', relationTo: 'parishes', admin: { position: 'sidebar' } },
    { name: 'ordinationDate', type: 'date', admin: { position: 'sidebar' } },
    { name: 'status', type: 'select', options: ['active', 'retired', 'deceased'], defaultValue: 'active', admin: { position: 'sidebar' } },
  ],
}
