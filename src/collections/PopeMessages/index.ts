import type { CollectionConfig } from 'payload'
import { safeRevalidatePath, safeRevalidateTag } from '../../lib/payload/revalidate'
import { isPublishedOrAuthenticated } from '../../lib/permissions/readAccess'
import { crud, requirePublishPermission, hideUnless } from '../../lib/permissions/access'
import { slugFieldHook } from '../../lib/payload/slugField'
import { publishAtField } from '../../lib/payload/scheduledPublish'

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
    publishAtField('pope-messages.publish'),
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
      name: 'translationStatus',
      type: 'select',
      options: [
        { label: 'Auto-translated to Tigrinya', value: 'auto' },
        { label: 'Translation failed — imported in English', value: 'failed' },
        { label: 'Imported in source language', value: 'source' },
      ],
      admin: {
        position: 'sidebar',
        readOnly: true,
        condition: (data) => Boolean(data?.translationStatus),
        description:
          'Set by the feed import. "Failed" drafts still need a human translation before publishing.',
      },
    },
    {
      name: 'sourceTitle',
      type: 'text',
      admin: {
        position: 'sidebar',
        readOnly: true,
        condition: (data) => Boolean(data?.sourceTitle),
        description: 'Original title as published by the feed, kept for cross-checking the translation.',
      },
    },
    {
      name: 'sourceSummary',
      type: 'textarea',
      admin: {
        position: 'sidebar',
        readOnly: true,
        condition: (data) => Boolean(data?.sourceSummary),
        description: 'Original summary as published by the feed, kept for cross-checking the translation.',
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
