import type { CollectionConfig } from 'payload'
import { safeRevalidatePath, safeRevalidateTag } from '../../lib/payload/revalidate'
import { isPublishedOrAuthenticated } from '../../lib/permissions/readAccess'
import { crud, requirePublishPermission, hideUnless } from '../../lib/permissions/access'
import { slugFieldHook } from '../../lib/payload/slugField'

export const BishopMessages: CollectionConfig = {
  slug: 'bishop-messages',
  admin: {
    hidden: hideUnless('bishop-messages.create', 'bishop-messages.update', 'bishop-messages.delete', 'bishop-messages.publish'),
    useAsTitle: 'title',
    group: 'Magisterium',
    defaultColumns: ['_status', 'title', 'messageType', 'publishedAt'],
    description: 'Pastoral letters, homilies, and official messages from the Bishop.',
    preview: (doc) => `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/publications/bishop-messages/${(doc as any).slug}`,
  },
  access: {
    ...crud(isPublishedOrAuthenticated, 'bishop-messages.create', 'bishop-messages.update', 'bishop-messages.delete'),
  },
  versions: { drafts: true },
  hooks: {
    beforeChange: [requirePublishPermission('bishop-messages.publish')],
    afterChange: [
      ({ doc }) => {
        safeRevalidateTag('bishop-messages')
        safeRevalidatePath(`/publications/bishop-messages/${doc.slug}`)
        safeRevalidatePath('/publications/bishop-messages')
        safeRevalidatePath('/')
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
      name: 'messageType',
      type: 'select',
      options: [
        { label: 'Pastoral Letter', value: 'pastoral-letter' },
        { label: 'Homily', value: 'homily' },
        { label: 'Encyclical Response', value: 'encyclical-response' },
        { label: 'Christmas Message', value: 'christmas' },
        { label: 'Easter Message', value: 'easter' },
        { label: 'Extraordinary Announcement', value: 'extraordinary' },
        { label: 'General Message', value: 'general' },
      ],
      defaultValue: 'general',
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
    },
    {
      name: 'body',
      type: 'richText',
      localized: true,
      required: true,
    },
    {
      name: 'document',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Optional PDF version of this message.',
        position: 'sidebar',
      },
    },
    {
      name: 'isFeatured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Show on homepage.',
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
