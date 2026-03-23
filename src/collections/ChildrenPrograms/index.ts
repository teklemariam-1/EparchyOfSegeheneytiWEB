import type { CollectionConfig } from 'payload'
import { isPublicRead, isRoleOneOf } from '@/lib/permissions/collectionAccess'

export const ChildrenPrograms: CollectionConfig = {
  slug: 'children-programs',
  admin: { useAsTitle: 'name', group: 'Ministries' },
  access: {
    read: isPublicRead,
    create: isRoleOneOf('super-admin', 'chancery-editor', 'youth-editor'),
    update: isRoleOneOf('super-admin', 'chancery-editor', 'youth-editor'),
    delete: isRoleOneOf('super-admin', 'chancery-editor'),
  },
  fields: [
    { name: 'name', type: 'text', required: true, localized: true },
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'ageGroup', type: 'text', admin: { description: 'e.g. 6-12 years' } },
    { name: 'description', type: 'richText', localized: true },
    { name: 'featuredImage', type: 'upload', relationTo: 'media' },
    { name: 'status', type: 'select', options: ['active', 'inactive'], defaultValue: 'active', admin: { position: 'sidebar' } },
  ],
}
