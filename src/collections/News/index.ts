import type { CollectionConfig } from 'payload'
import { safeRevalidatePath, safeRevalidateTag } from '../../lib/payload/revalidate'
import { isPublishedOrAuthenticated, isChanceryOrAbove } from '../../lib/permissions/collectionAccess'
import { slugFieldHook } from '../../lib/payload/slugField'

export const News: CollectionConfig = {
  slug: 'news',
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    defaultColumns: ['_status', 'title', 'slug', 'category', 'publishedAt'],
    description: 'Eparchy news articles and announcements.',
    preview: (doc) => `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/news/${(doc as any).slug}`,
    components: {
      // On-demand Vatican News import, so staff need not wait for the 6-hourly cron.
      beforeListTable: ['@/components/admin/news/FetchVaticanNews#FetchVaticanNews'],
    },
  },
  access: {
    read: isPublishedOrAuthenticated,
    create: isChanceryOrAbove,
    update: isChanceryOrAbove,
    delete: isChanceryOrAbove,
  },
  versions: { drafts: true },
  hooks: {
    afterChange: [
      ({ doc }) => {
        safeRevalidateTag('news')
        safeRevalidatePath(`/news/${doc.slug}`)
        safeRevalidatePath('/news')
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
      admin: {
        position: 'sidebar',
        description: 'Auto-generated from the title if left blank. Used in the URL.',
      },
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
      name: 'sourceUrl',
      type: 'text',
      admin: {
        position: 'sidebar',
        description:
          'Optional. Link to the original article if this news was republished from another outlet (e.g. Vatican News). Shown as an attribution link on the article page.',
      },
      validate: (value: unknown) => {
        if (!value) return true // optional
        return typeof value === 'string' && /^https?:\/\/.+/i.test(value)
          ? true
          : 'Enter a full URL starting with http:// or https://'
      },
    },
    {
      name: 'sourceName',
      type: 'text',
      admin: {
        position: 'sidebar',
        description: 'Optional label for the source, e.g. "Vatican News". Defaults to the link\'s domain.',
        condition: (data) => Boolean(data?.sourceUrl),
      },
    },
    {
      name: 'isImported',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Set automatically when an article arrives from an external feed.',
      },
    },
    {
      name: 'importedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
        condition: (data) => Boolean(data?.isImported),
      },
    },
    {
      name: 'reviewStatus',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { label: 'Pending review', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
      ],
      admin: {
        position: 'sidebar',
        condition: (data) => Boolean(data?.isImported),
        description:
          'Editorial triage for imported items. This does NOT publish the article — use Publish for that. Marking Rejected keeps a record so the item is never re-imported.',
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
        { name: 'ogImage', type: 'upload', relationTo: 'media' },
      ],
    },
  ],
  timestamps: true,
}
