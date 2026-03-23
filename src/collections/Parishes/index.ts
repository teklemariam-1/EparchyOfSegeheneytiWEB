import type { CollectionConfig } from 'payload'
import { revalidatePath } from 'next/cache'
import { isPublicRead, isChanceryOrAbove, isOwnParishOrAbove } from '@/lib/permissions/collectionAccess'

export const Parishes: CollectionConfig = {
  slug: 'parishes',
  admin: {
    useAsTitle: 'name',
    group: 'Church',
    defaultColumns: ['name', 'region', 'vicariate', 'pastor', 'slug'],
    description: 'All parishes within the Eparchy of Segeneyti.',
    preview: (doc) => `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/parishes/${(doc as any).slug}`,
  },
  access: {
    read: isPublicRead,
    create: isChanceryOrAbove,
    update: isOwnParishOrAbove('id'),
    delete: isChanceryOrAbove,
  },
  hooks: {
    afterChange: [
      ({ doc }) => {
        revalidatePath(`/parishes/${doc.slug}`)
        revalidatePath('/parishes')
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
      name: 'vicariate',
      type: 'select',
      options: [
        { label: 'Segeneyti', value: 'segeneyti' },
        { label: 'Adi Keyih', value: 'adi-keyih' },
        { label: 'Dekemhare', value: 'dekemhare' },
        { label: 'Adi Ugri (Mendefera)', value: 'adi-ugri' },
        { label: 'Diaspora', value: 'diaspora' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'region',
      type: 'text',
      admin: { position: 'sidebar' },
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
      admin: { position: 'sidebar' },
    },
    {
      name: 'patron',
      type: 'text',
      localized: true,
      admin: {
        description: 'Name of the patron saint of this parish.',
        position: 'sidebar',
      },
    },
    {
      name: 'feastDate',
      type: 'text',
      admin: {
        description: "Parish feast day in Ge'ez calendar notation (e.g. '29 Nehase').",
        position: 'sidebar',
      },
    },
    {
      name: 'description',
      type: 'richText',
      localized: true,
    },
    {
      name: 'history',
      type: 'richText',
      localized: true,
    },
    {
      name: 'pastor',
      type: 'relationship',
      relationTo: 'priests',
      admin: { position: 'sidebar' },
    },
    {
      name: 'contact',
      type: 'group',
      fields: [
        { name: 'phone', type: 'text' },
        { name: 'email', type: 'email' },
        { name: 'address', type: 'textarea' },
        { name: 'mapUrl', type: 'text', admin: { description: 'Link to Google Maps or similar.' } },
      ],
    },
    {
      name: 'massTimes',
      type: 'array',
      fields: [
        {
          name: 'day',
          type: 'select',
          options: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        },
        { name: 'time', type: 'text' },
        { name: 'language', type: 'select', options: ['Tigrinya', 'English', 'Arabic', 'Other'] },
        { name: 'notes', type: 'text' },
      ],
    },
    {
      name: 'gallery',
      type: 'array',
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', required: true },
        { name: 'caption', type: 'text', localized: true },
      ],
    },
    {
      name: 'seo',
      type: 'group',
      label: 'SEO',
      admin: { position: 'sidebar' },
      fields: [
        { name: 'metaTitle', type: 'text', localized: true },
        { name: 'metaDescription', type: 'textarea', localized: true },
      ],
    },
  ],
  timestamps: true,
}
