import type { CollectionConfig } from 'payload'
import { revalidatePath } from 'next/cache'
import { isPublicRead, isRoleOneOf, isChanceryOrAbove } from '@/lib/permissions/collectionAccess'

export const ChildrenPrograms: CollectionConfig = {
  slug: 'children-programs',
  admin: {
    useAsTitle: 'name',
    group: 'Ministries',
    defaultColumns: ['name', 'ageGroup', 'parish', 'status'],
    description: 'Catechism, Sunday school, and other children ministry programs.',
  },
  access: {
    read: isPublicRead,
    create: isRoleOneOf('super-admin', 'chancery-editor', 'youth-editor', 'catechist-editor'),
    update: isRoleOneOf('super-admin', 'chancery-editor', 'youth-editor', 'catechist-editor'),
    delete: isChanceryOrAbove,
  },
  hooks: {
    afterChange: [
      ({ doc }) => {
        revalidatePath('/ministries/children')
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
        { label: 'Seasonal', value: 'seasonal' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'ageGroup',
      type: 'text',
      admin: {
        description: 'Target age group (e.g. "6–12 years").',
        position: 'sidebar',
      },
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
      admin: { position: 'sidebar' },
    },
    {
      name: 'description',
      type: 'richText',
      localized: true,
    },
    {
      name: 'curriculum',
      type: 'richText',
      localized: true,
      admin: { description: 'Overview of the program curriculum or topics covered.' },
    },
    {
      name: 'parish',
      type: 'relationship',
      relationTo: 'parishes',
      admin: { position: 'sidebar' },
    },
    {
      name: 'coordinator',
      type: 'group',
      fields: [
        { name: 'name', type: 'text' },
        { name: 'phone', type: 'text' },
        { name: 'email', type: 'email' },
      ],
    },
    {
      name: 'schedule',
      type: 'text',
      localized: true,
      admin: { description: 'Meeting times and frequency.' },
    },
    {
      name: 'gallery',
      type: 'array',
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', required: true },
        { name: 'caption', type: 'text', localized: true },
      ],
    },
  ],
  timestamps: true,
}
