import type { CollectionConfig } from 'payload'
import { revalidatePath } from 'next/cache'
import { isPublicRead, isChanceryOrAbove } from '../../lib/permissions/collectionAccess'

export const Schools: CollectionConfig = {
  slug: 'schools',
  admin: {
    useAsTitle: 'name',
    group: 'Institutions',
    defaultColumns: ['name', 'level', 'parish', 'status'],
    description: 'Catholic schools operated by or affiliated with the Eparchy.',
    preview: (doc) => `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/institutions/schools/${(doc as any).slug}`,
  },
  access: {
    read: isPublicRead,
    create: isChanceryOrAbove,
    update: isChanceryOrAbove,
    delete: isChanceryOrAbove,
  },
  hooks: {
    afterChange: [
      ({ doc }) => {
        revalidatePath(`/institutions/schools/${doc.slug}`)
        revalidatePath('/institutions/schools')
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
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'level',
      type: 'select',
      required: true,
      options: [
        { label: 'Kindergarten', value: 'kindergarten' },
        { label: 'Primary (Grades 1-5)', value: 'primary' },
        { label: 'Middle (Grades 6-8)', value: 'middle' },
        { label: 'Secondary (Grades 9-12)', value: 'secondary' },
        { label: 'Vocational / Technical', value: 'vocational' },
        { label: 'Higher Education', value: 'higher' },
        { label: 'Combined (K-12)', value: 'combined' },
      ],
      admin: { position: 'sidebar' },
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
      name: 'parish',
      type: 'relationship',
      relationTo: 'parishes',
      admin: { position: 'sidebar' },
    },
    {
      name: 'contact',
      type: 'group',
      fields: [
        { name: 'address', type: 'textarea' },
        { name: 'phone', type: 'text' },
        { name: 'email', type: 'email' },
      ],
    },
    {
      name: 'principalName',
      type: 'text',
    },
    {
      name: 'foundedYear',
      type: 'number',
    },
    {
      name: 'studentCount',
      type: 'number',
      admin: { description: 'Approximate current enrollment.' },
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
