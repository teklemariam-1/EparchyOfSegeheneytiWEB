import type { CollectionConfig } from 'payload'
import { isPublicRead, isSuperAdmin, isRoleOneOf } from '@/lib/permissions/collectionAccess'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'firstName', 'lastName', 'role'],
    group: 'Administration',
  },
  access: {
    read: isRoleOneOf('super-admin', 'chancery-editor'),
    create: isSuperAdmin,
    update: isRoleOneOf('super-admin', 'chancery-editor'),
    delete: isSuperAdmin,
  },
  fields: [
    {
      name: 'firstName',
      type: 'text',
      required: true,
    },
    {
      name: 'lastName',
      type: 'text',
      required: true,
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'parish-editor',
      options: [
        { label: 'Super Admin', value: 'super-admin' },
        { label: 'Chancery Editor', value: 'chancery-editor' },
        { label: 'Parish Editor', value: 'parish-editor' },
        { label: 'Youth Editor', value: 'youth-editor' },
        { label: 'Catechist Editor', value: 'catechist-editor' },
        { label: 'Media Editor', value: 'media-editor' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'assignedParish',
      type: 'relationship',
      relationTo: 'parishes',
      admin: {
        description: 'Required for parish-editor role — limits edit scope to this parish.',
        position: 'sidebar',
        condition: (data) => data?.role === 'parish-editor',
      },
    },
  ],
}
