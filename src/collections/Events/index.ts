import type { CollectionConfig } from 'payload'
import { revalidatePath } from 'next/cache'
import { isPublicRead, isChanceryOrAbove, isOwnParishOrAbove } from '@/lib/permissions/collectionAccess'

export const Events: CollectionConfig = {
  slug: 'events',
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    defaultColumns: ['title', 'startDate', 'endDate', 'parish', 'status'],
    description: 'Eparchy-wide and parish-level events.',
    preview: (doc) => `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/events/${(doc as any).slug}`,
  },
  access: {
    read: isPublicRead,
    create: isOwnParishOrAbove(),
    update: isOwnParishOrAbove(),
    delete: isChanceryOrAbove,
  },
  versions: { drafts: true },
  hooks: {
    afterChange: [
      ({ doc }) => {
        revalidatePath(`/events/${doc.slug}`)
        revalidatePath('/events')
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
        { label: 'Cancelled', value: 'cancelled' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'eventType',
      type: 'select',
      options: [
        { label: 'Liturgical / Mass', value: 'liturgical' },
        { label: 'Feast Day', value: 'feast' },
        { label: 'Youth Program', value: 'youth' },
        { label: 'Community Gathering', value: 'community' },
        { label: 'Educational / Catechism', value: 'education' },
        { label: 'Social Ministry', value: 'social' },
        { label: 'Pilgrimage', value: 'pilgrimage' },
        { label: 'Conference', value: 'conference' },
        { label: 'Other', value: 'other' },
      ],
      defaultValue: 'liturgical',
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
      name: 'description',
      type: 'richText',
      localized: true,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'startDate',
          type: 'date',
          required: true,
          admin: { date: { pickerAppearance: 'dayAndTime' } },
        },
        {
          name: 'endDate',
          type: 'date',
          admin: { date: { pickerAppearance: 'dayAndTime' } },
        },
      ],
    },
    {
      name: 'isAllDay',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'location',
      type: 'group',
      fields: [
        { name: 'name', type: 'text', localized: true },
        { name: 'address', type: 'text' },
        { name: 'googleMapsUrl', type: 'text' },
      ],
    },
    {
      name: 'parish',
      type: 'relationship',
      relationTo: 'parishes',
      admin: { position: 'sidebar' },
    },
    {
      name: 'organizer',
      type: 'relationship',
      relationTo: 'users',
      admin: { position: 'sidebar' },
    },
    {
      name: 'isRecurring',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'geezCalendarRef',
      type: 'relationship',
      relationTo: 'geez-calendar-entries',
      label: "Ge'ez Calendar Entry",
      admin: {
        position: 'sidebar',
        description: "Link to the corresponding Ge'ez liturgical calendar entry.",
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
