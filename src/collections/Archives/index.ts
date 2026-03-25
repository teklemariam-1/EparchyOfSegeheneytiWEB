import type { CollectionConfig } from 'payload'
import { revalidatePath } from 'next/cache'
import { isPublicRead, isChanceryOrAbove, isSuperAdmin } from '../../lib/permissions/collectionAccess'

export const Archives: CollectionConfig = {
  slug: 'archives',
  admin: {
    useAsTitle: 'title',
    group: 'Publications',
    defaultColumns: ['title', 'category', 'year', 'accessLevel'],
    description: 'Historical and official documents for the Eparchy archive.',
  },
  access: {
    read: ({ req }) => {
      // Public archives can be read by everyone; restricted ones need auth
      const user = req.user as { role: string } | null
      if (user && ['super-admin', 'chancery-editor'].includes(user.role)) return true
      return { accessLevel: { equals: 'public' } }
    },
    create: isChanceryOrAbove,
    update: isChanceryOrAbove,
    delete: isSuperAdmin,
  },
  hooks: {
    afterChange: [
      ({ doc }) => {
        revalidatePath(`/archives/${doc.slug}`)
        revalidatePath('/archives')
      },
    ],
  },
  fields: [
    {
      name: 'title',
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
      name: 'year',
      type: 'number',
      required: true,
      index: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Official Documents', value: 'official' },
        { label: 'Pastoral Letters', value: 'pastoral' },
        { label: 'Historical Records', value: 'historical' },
        { label: 'Correspondence', value: 'correspondence' },
        { label: 'Council / Synod Minutes', value: 'council' },
        { label: 'Statistics / Reports', value: 'reports' },
        { label: 'Other', value: 'other' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'accessLevel',
      type: 'select',
      required: true,
      defaultValue: 'public',
      options: [
        { label: 'Public', value: 'public' },
        { label: 'Restricted (authenticated only)', value: 'restricted' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'files',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        { name: 'file', type: 'upload', relationTo: 'media', required: true },
        { name: 'label', type: 'text', localized: true, admin: { description: 'Document title or description.' } },
        { name: 'language', type: 'select', options: ['ti', 'en', 'ar', 'it', 'other'], defaultValue: 'ti' },
      ],
    },
    {
      name: 'tags',
      type: 'array',
      fields: [{ name: 'tag', type: 'text' }],
      admin: { position: 'sidebar' },
    },
  ],
  timestamps: true,
}
