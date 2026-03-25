import type { CollectionConfig } from 'payload'
import { revalidatePath } from 'next/cache'
import { isPublicRead, isChanceryOrAbove } from '../../lib/permissions/collectionAccess'

export const Clinics: CollectionConfig = {
  slug: 'clinics',
  admin: {
    useAsTitle: 'name',
    group: 'Institutions',
    defaultColumns: ['name', 'facilityType', 'parish', 'status'],
    description: 'Medical facilities affiliated with the Eparchy.',
    preview: (doc) => `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/institutions/clinics/${(doc as any).slug}`,
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
        revalidatePath(`/institutions/clinics/${doc.slug}`)
        revalidatePath('/institutions/clinics')
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
      name: 'facilityType',
      type: 'select',
      required: true,
      options: [
        { label: 'Hospital', value: 'hospital' },
        { label: 'Health Centre', value: 'health-centre' },
        { label: 'Clinic', value: 'clinic' },
        { label: 'Dispensary', value: 'dispensary' },
        { label: 'Pharmacy', value: 'pharmacy' },
        { label: 'Mother & Child Centre', value: 'mother-child' },
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
      name: 'services',
      type: 'array',
      fields: [
        { name: 'serviceName', type: 'text', required: true, localized: true },
        { name: 'description', type: 'textarea', localized: true },
      ],
    },
    {
      name: 'openingHours',
      type: 'text',
      localized: true,
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
