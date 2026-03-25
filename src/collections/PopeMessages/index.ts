import type { CollectionConfig } from 'payload'
import { revalidatePath } from 'next/cache'
import { isPublicRead, isChanceryOrAbove } from '../../lib/permissions/collectionAccess'

export const PopeMessages: CollectionConfig = {
  slug: 'pope-messages',
  admin: {
    useAsTitle: 'title',
    group: 'Magisterium',
    defaultColumns: ['title', 'documentType', 'publishedAt', 'status'],
    description: 'Papal encyclicals, apostolic exhortations, and messages from the Holy Father.',
  },
  access: {
    read: isPublicRead,
    create: isChanceryOrAbove,
    update: isChanceryOrAbove,
    delete: isChanceryOrAbove,
  },
  versions: { drafts: true },
  hooks: {
    afterChange: [
      ({ doc }) => {
        revalidatePath(`/publications/pope-messages/${doc.slug}`)
        revalidatePath('/publications/pope-messages')
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
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'publishedAt',
      type: 'date',
      index: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'documentType',
      type: 'select',
      options: [
        { label: 'Encyclical', value: 'encyclical' },
        { label: 'Apostolic Exhortation', value: 'apostolic-exhortation' },
        { label: 'Apostolic Letter', value: 'apostolic-letter' },
        { label: 'Apostolic Constitution', value: 'apostolic-constitution' },
        { label: 'Message', value: 'message' },
        { label: 'Homily', value: 'homily' },
        { label: 'Audience Address', value: 'audience' },
        { label: 'Other', value: 'other' },
      ],
      defaultValue: 'message',
      admin: { position: 'sidebar' },
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
      admin: { position: 'sidebar' },
    },
    {
      name: 'excerpt',
      type: 'textarea',
      localized: true,
      admin: { description: 'Opening lines or a key excerpt, shown in listings.' },
    },
    {
      name: 'body',
      type: 'richText',
      localized: true,
    },
    {
      name: 'document',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'PDF copy of the full document.',
        position: 'sidebar',
      },
    },
    {
      name: 'sourceUrl',
      type: 'text',
      admin: {
        description: 'Link to the original Vatican document (vatican.va).',
        position: 'sidebar',
      },
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
