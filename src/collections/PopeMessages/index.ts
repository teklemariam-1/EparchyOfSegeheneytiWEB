import type { CollectionConfig } from 'payload'
import { safeRevalidatePath, safeRevalidateTag } from '../../lib/payload/revalidate'
import { isPublishedOrAuthenticated } from '../../lib/permissions/readAccess'
import { crud, requirePublishPermission, hideUnless } from '../../lib/permissions/access'
import { slugFieldHook } from '../../lib/payload/slugField'

export const PopeMessages: CollectionConfig = {
  slug: 'pope-messages',
  admin: {
    hidden: hideUnless('pope-messages.create', 'pope-messages.update', 'pope-messages.delete', 'pope-messages.publish'),
    useAsTitle: 'title',
    group: 'Magisterium',
    defaultColumns: ['_status', 'title', 'documentType', 'publishedAt'],
    description: 'Papal encyclicals, apostolic exhortations, and messages from the Holy Father.',
  },
  access: {
    ...crud(isPublishedOrAuthenticated, 'pope-messages.create', 'pope-messages.update', 'pope-messages.delete'),
  },
  versions: { drafts: true },
  hooks: {
    beforeChange: [requirePublishPermission('pope-messages.publish')],
    afterChange: [
      ({ doc }) => {
        safeRevalidateTag('pope-messages')
        safeRevalidatePath(`/pope-messages/${doc.slug}`)
        safeRevalidatePath('/pope-messages')
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
      hooks: { beforeValidate: [slugFieldHook()] },
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
