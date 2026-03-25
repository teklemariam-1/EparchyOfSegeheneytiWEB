import type { CollectionConfig } from 'payload'
import { revalidatePath } from 'next/cache'
import { isPublicRead, isChanceryOrAbove } from '../../lib/permissions/collectionAccess'

export const News: CollectionConfig = {
  slug: 'news',
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    defaultColumns: ['title', 'slug', 'category', 'publishedAt', 'status'],
    description: 'Eparchy news articles and announcements.',
    preview: (doc) => `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/news/${(doc as any).slug}`,
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
        revalidatePath(`/news/${doc.slug}`)
        revalidatePath('/news')
        revalidatePath('/')
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
      admin: {
        position: 'sidebar',
        description: 'Auto-generated from title. Used in the URL.',
      },
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
      name: 'category',
      type: 'select',
      options: [
        { label: 'Eparchy News', value: 'eparchy' },
        { label: 'Vatican / Universal Church', value: 'vatican' },
        { label: 'Pastoral Letter', value: 'pastoral' },
        { label: 'Community', value: 'community' },
        { label: 'Social Ministry', value: 'social' },
        { label: 'Announcement', value: 'announcement' },
      ],
      defaultValue: 'eparchy',
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
      admin: {
        description: 'Short summary shown in news listings and social previews (max 160 chars).',
      },
    },
    {
      name: 'body',
      type: 'richText',
      localized: true,
      required: true,
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      admin: { position: 'sidebar' },
    },
    {
      name: 'relatedNews',
      type: 'relationship',
      relationTo: 'news',
      hasMany: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'tags',
      type: 'array',
      fields: [{ name: 'tag', type: 'text' }],
      admin: { position: 'sidebar' },
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
      ],
    },
  ],
  timestamps: true,
}
