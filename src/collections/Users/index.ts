import type { CollectionConfig } from 'payload'
import { isSuperAdmin, isRoleOneOf } from '@/lib/permissions/collectionAccess'
import { selfOrAdmin } from '@/lib/permissions/fieldAccess'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'firstName', 'lastName', 'role', 'assignedParish'],
    group: 'Administration',
    description: 'CMS users and their editorial roles.',
  },
  access: {
    read: isRoleOneOf('super-admin', 'chancery-editor'),
    create: isSuperAdmin,
    update: ({ req }) => {
      const user = req.user as { id: string; role: string } | null
      if (!user) return false
      if (user.role === 'super-admin') return true
      return { id: { equals: user.id } }
    },
    delete: isSuperAdmin,
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'firstName', type: 'text', required: true },
        { name: 'lastName', type: 'text', required: true },
      ],
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
      access: { update: selfOrAdmin },
      admin: {
        position: 'sidebar',
        description: 'Determines which content areas this user can edit.',
      },
    },
    {
      name: 'assignedParish',
      type: 'relationship',
      relationTo: 'parishes',
      admin: {
        position: 'sidebar',
        description: 'Required for parish-editor role — limits edit scope to this parish.',
        condition: (data) => data?.role === 'parish-editor',
      },
    },
    {
      name: 'profilePhoto',
      type: 'upload',
      relationTo: 'media',
      admin: { position: 'sidebar' },
    },
  ],
  timestamps: true,
}
