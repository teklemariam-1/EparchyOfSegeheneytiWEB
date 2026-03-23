import type { CollectionConfig } from 'payload'
import { revalidatePath } from 'next/cache'
import { isPublicRead, isChanceryOrAbove } from '@/lib/permissions/collectionAccess'

export const Publications: CollectionConfig = {
  slug: 'publications',
  admin: {
    useAsTitle: 'title',
    group: 'Publications',
    defaultColumns: ['title', 'category', 'publishedAt', 'language'],
    description: 'Downloadable documents, booklets, and pastorals.',
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
        revalidatePath(`/publications/${doc.slug}`)
        revalidatePath('/publications')
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
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Pastoral Letter', value: 'pastoral' },
        { label: 'Liturgical Guide', value: 'liturgical' },
        { label: 'Catechetical / Educational', value: 'educational' },
        { label: 'Youth Resource', value: 'youth' },
        { label: 'Social Ministry', value: 'social' },
        { label: 'Official Documents', value: 'official' },
        { label: 'Prayer Book', value: 'prayer' },
        { label: 'Other', value: 'other' },
      ],
      defaultValue: 'other',
      admin: { position: 'sidebar' },
    },
    {
      name: 'language',
      type: 'select',
      options: [
        { label: 'Tigrinya', value: 'ti' },
        { label: 'English', value: 'en' },
        { label: 'Arabic', value: 'ar' },
        { label: 'Italian', value: 'it' },
        { label: 'Multiple', value: 'multi' },
      ],
      defaultValue: 'ti',
      admin: { position: 'sidebar' },
    },
    {
      name: 'publishedAt',
      type: 'date',
      index: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
      admin: { position: 'sidebar' },
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'file',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: { description: 'The main document file (PDF recommended).' },
    },
    {
      name: 'fileSize',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Human-readable file size (e.g. "2.4 MB").',
      },
    },
    {
      name: 'pageCount',
      type: 'number',
      admin: { description: 'Number of pages in the document.' },
    },
    {
      name: 'isFeatured',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
  ],
  timestamps: true,
}
