import type { CollectionConfig } from 'payload'
import { safeRevalidatePath, safeRevalidateTag } from '../../lib/payload/revalidate'
import { isPublishedOrAuthenticated } from '../../lib/permissions/readAccess'
import { can, requirePublishPermission, hideUnless } from '../../lib/permissions/access'
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
      beforeListTable: [
        '@/components/admin/news/FetchVaticanNews#FetchVaticanNews',
        '@/components/admin/news/NewsGrouping#NewsGrouping',
      ],
    },
    hidden: hideUnless('news.create', 'news.update', 'news.delete'),
  },
  access: {
    read: isPublishedOrAuthenticated,
    create: can('news.create'),
    update: can('news.update'),
    delete: can('news.delete'),
  },
  versions: { drafts: true },
  hooks: {
    // Publishing is a distinct permission from editing — gate the draft→published
    // transition on news.publish.
    beforeChange: [
      requirePublishPermission('news.publish'),
      // The listing hoists a pinned article with `sort: -isFeatured`, and
      // Postgres orders NULLs FIRST under DESC. A null here would therefore
      // take the hero slot ahead of the article staff actually pinned. The
      // migration backfills existing rows; this stops any write path — the
      // Vatican News ingest, a REST call, a seed script — from reintroducing one.
      ({ data }) => {
        const record = data as { isFeatured?: unknown; publishedAt?: unknown }
        if (record.isFeatured === null || record.isFeatured === undefined) {
          record.isFeatured = false
        }
        // Same hazard, same reason: the listing sorts on `-publishedAt`, so an
        // article saved without a date would sort ahead of everything and take
        // the hero slot. Imports without a date did exactly that until the
        // 20260726_060000 backfill; defaulting here stops it recurring.
        if (record.publishedAt === null || record.publishedAt === undefined || record.publishedAt === '') {
          record.publishedAt = new Date().toISOString()
        }
        return data
      },
    ],
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
      name: 'isFeatured',
      type: 'checkbox',
      defaultValue: false,
      index: true,
      admin: {
        position: 'sidebar',
        description:
          'Pin this article to the large hero slot on the news page. If several are ticked, the most recent wins. Leave unticked and the newest article is used automatically.',
      },
    },
    {
      // Options are managed in the News Categories collection (admin-editable),
      // so this is a text field rendered as a dynamic dropdown.
      name: 'category',
      type: 'text',
      defaultValue: 'eparchy',
      admin: {
        position: 'sidebar',
        components: {
          Field: {
            path: '@/components/admin/TaxonomySelect#TaxonomySelect',
            clientProps: { collectionSlug: 'news-categories', labelText: 'Category' },
          },
        },
      },
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
      admin: { position: 'sidebar' },
    },
    {
      // Additional photos shown below the article body. The featured image
      // stays the single lead/thumbnail used in listings and link previews.
      name: 'gallery',
      type: 'array',
      label: 'Photo gallery',
      admin: {
        description:
          'Extra photos for this article, shown after the body. The featured image above remains the one used in listings and social previews.',
      },
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', required: true },
        { name: 'caption', type: 'text', localized: true },
      ],
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
