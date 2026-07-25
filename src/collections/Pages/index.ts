import type { CollectionConfig } from 'payload'
import { safeRevalidatePath } from '../../lib/payload/revalidate'
import { isPublishedOrAuthenticated } from '../../lib/permissions/readAccess'
import { crud, requirePublishPermission, hideUnless } from '../../lib/permissions/access'
import { slugFieldHook } from '../../lib/payload/slugField'

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    hidden: hideUnless('pages.create', 'pages.update', 'pages.delete', 'pages.publish'),
    useAsTitle: 'title',
    group: 'Content',
    defaultColumns: ['_status', 'title', 'slug', 'updatedAt'],
    description: 'Static informational pages (About, History, Contact, etc.).',
    preview: (doc) => `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/${(doc as any).slug}`,
  },
  access: {
    ...crud(isPublishedOrAuthenticated, 'pages.create', 'pages.update', 'pages.delete'),
  },
  versions: { drafts: true },
  hooks: {
    beforeChange: [requirePublishPermission('pages.publish')],
    afterChange: [
      ({ doc }) => {
        safeRevalidatePath(`/${doc.slug}`)
        safeRevalidatePath('/', 'layout')
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
      admin: {
        position: 'sidebar',
        description: 'URL path segment (e.g. "about", "history").',
      },
    },
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
      admin: { position: 'sidebar' },
    },
    {
      name: 'hero',
      type: 'group',
      label: 'Hero Section',
      fields: [
        { name: 'heading', type: 'text', localized: true },
        { name: 'subheading', type: 'text', localized: true },
      ],
    },
    {
      name: 'content',
      type: 'richText',
      localized: true,
    },
    {
      name: 'seo',
      type: 'group',
      label: 'SEO',
      admin: { position: 'sidebar' },
      fields: [
        { name: 'metaTitle', type: 'text', localized: true },
        { name: 'metaDescription', type: 'textarea', localized: true },
        { name: 'ogImage', type: 'upload', relationTo: 'media' },
        { name: 'noIndex', type: 'checkbox', defaultValue: false },
      ],
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: { position: 'sidebar', readOnly: true },
    },
  ],
  timestamps: true,
}
