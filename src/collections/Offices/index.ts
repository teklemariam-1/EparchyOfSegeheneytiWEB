import type { CollectionConfig } from 'payload'
import { safeRevalidatePath, safeRevalidateTag } from '../../lib/payload/revalidate'
import { isPublicRead, isChanceryOrAbove } from '../../lib/permissions/collectionAccess'
import { slugFieldHook } from '../../lib/payload/slugField'

/**
 * Offices & councils of the Eparchy — e.g. the Youth Council.
 *
 * Each office is its own page (/offices/<slug>) with content it manages
 * independently: a description, plus three self-contained streams —
 * announcements, updates (posts) and events. Keeping them on the office
 * document (rather than tagging global News/Events) is deliberate: staff update
 * one place, and an office's content never leaks into the site-wide feeds
 * unless they choose to add it there too.
 */
export const Offices: CollectionConfig = {
  slug: 'offices',
  admin: {
    useAsTitle: 'name',
    group: 'Church',
    defaultColumns: ['name', 'slug', 'order'],
    description: 'Offices and councils (e.g. Youth Council). Each has its own page.',
    preview: (doc) => `${(process.env.NEXT_PUBLIC_SITE_URL ?? '').trim()}/offices/${(doc as any).slug}`,
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
        safeRevalidateTag('offices')
        safeRevalidatePath(`/offices/${doc.slug}`)
        safeRevalidatePath('/offices')
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      localized: true,
      admin: { description: 'e.g. "Youth Council"' },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      hooks: { beforeValidate: [slugFieldHook(['name'])] },
      admin: { position: 'sidebar' },
    },
    {
      name: 'order',
      type: 'number',
      admin: { position: 'sidebar', description: 'Listing order (lowest first).' },
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Banner image for the office page.' },
    },
    {
      name: 'tagline',
      type: 'text',
      localized: true,
      admin: { description: 'One-line summary shown under the title.' },
    },
    {
      name: 'about',
      type: 'richText',
      localized: true,
      admin: { description: 'Main description of the office and its work.' },
    },
    {
      name: 'leader',
      type: 'group',
      label: 'Coordinator / Contact',
      fields: [
        { name: 'name', type: 'text', localized: true },
        { name: 'role', type: 'text', localized: true },
        { name: 'phone', type: 'text' },
        { name: 'email', type: 'email' },
      ],
    },
    // ── Announcements: short, dated notices ────────────────────────────────
    {
      name: 'announcements',
      type: 'array',
      labels: { singular: 'Announcement', plural: 'Announcements' },
      admin: { description: 'Short notices shown at the top of the page. Newest first.' },
      fields: [
        { name: 'title', type: 'text', required: true, localized: true },
        { name: 'date', type: 'date', admin: { date: { pickerAppearance: 'dayOnly' } } },
        { name: 'body', type: 'textarea', localized: true },
      ],
    },
    // ── Updates: richer, post-style items ──────────────────────────────────
    {
      name: 'updates',
      type: 'array',
      labels: { singular: 'Update', plural: 'Updates' },
      admin: { description: 'News-style posts for this office. Newest first.' },
      fields: [
        { name: 'title', type: 'text', required: true, localized: true },
        { name: 'date', type: 'date', admin: { date: { pickerAppearance: 'dayOnly' } } },
        { name: 'image', type: 'upload', relationTo: 'media' },
        { name: 'excerpt', type: 'textarea', localized: true },
        { name: 'body', type: 'richText', localized: true },
      ],
    },
    // ── Events: office-specific, self-contained ────────────────────────────
    {
      name: 'events',
      type: 'array',
      labels: { singular: 'Event', plural: 'Events' },
      admin: { description: 'Events run by this office.' },
      fields: [
        { name: 'title', type: 'text', required: true, localized: true },
        {
          type: 'row',
          fields: [
            { name: 'startDate', type: 'date', required: true, admin: { width: '50%' } },
            { name: 'endDate', type: 'date', admin: { width: '50%' } },
          ],
        },
        { name: 'location', type: 'text', localized: true },
        { name: 'description', type: 'textarea', localized: true },
      ],
    },
  ],
  timestamps: true,
}
