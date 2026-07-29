import type { CollectionConfig } from 'payload'
import { safeRevalidatePath, safeRevalidateTag } from '../../lib/payload/revalidate'
import { isPublicRead } from '../../lib/permissions/readAccess'
import { can, canManageOwnParish, hideUnless } from '../../lib/permissions/access'
import { slugFieldHook } from '../../lib/payload/slugField'

export const Parishes: CollectionConfig = {
  slug: 'parishes',
  admin: {
    hidden: hideUnless('parishes.create', 'parishes.update', 'parishes.delete', 'parishes.update-own'),
    useAsTitle: 'name',
    group: 'Church',
    defaultColumns: ['name', 'region', 'vicariate', 'pastor', 'slug'],
    description: 'All parishes within the Eparchy of Segheneyti.',
    preview: (doc) => `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/parishes/${(doc as any).slug}`,
  },
  access: {
    read: isPublicRead,
    create: can('parishes.create'),
    update: canManageOwnParish('parishes.update', 'parishes.update-own', 'id'),
    delete: can('parishes.delete'),
  },
  hooks: {
    afterChange: [
      ({ doc }) => {
        safeRevalidateTag('parishes')
        safeRevalidatePath(`/parishes/${doc.slug}`)
        safeRevalidatePath('/parishes')
      },
    ],
  },
  fields: [
    {
      name: 'name',
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
      name: 'vicariate',
      type: 'relationship',
      relationTo: 'vicariates',
      index: true,
      admin: {
        position: 'sidebar',
        description: 'The vicariate this parish belongs to (Eparchy → Vicariate → Parish).',
      },
    },
    {
      name: 'region',
      type: 'text',
      admin: { position: 'sidebar' },
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
      admin: { position: 'sidebar' },
    },
    {
      name: 'patron',
      type: 'text',
      localized: true,
      admin: {
        description: 'Name of the patron saint of this parish.',
        position: 'sidebar',
      },
    },
    {
      name: 'feastDate',
      type: 'text',
      admin: {
        description: "Parish feast day in Ge'ez calendar notation (e.g. '29 Nehase').",
        position: 'sidebar',
      },
    },
    {
      name: 'description',
      type: 'richText',
      localized: true,
    },
    {
      name: 'history',
      type: 'richText',
      localized: true,
    },
    {
      name: 'pastor',
      type: 'relationship',
      relationTo: 'priests',
      admin: { position: 'sidebar' },
    },
    {
      name: 'contact',
      type: 'group',
      fields: [
        { name: 'phone', type: 'text' },
        { name: 'email', type: 'email' },
        { name: 'address', type: 'textarea' },
        { name: 'mapUrl', type: 'text', admin: { description: 'Link to Google Maps or similar.' } },
      ],
    },
    {
      name: 'massTimes',
      type: 'array',
      fields: [
        {
          name: 'day',
          type: 'select',
          options: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        },
        {
          // The structured time that lets a viewer abroad see "· Sat 19:00
          // your time". Optional on purpose: "after sunrise" is a real
          // liturgical answer that belongs in the free-text field below, and
          // forcing a fake number would be worse than showing no conversion.
          name: 'startTime',
          type: 'text',
          validate: (value: unknown) => {
            if (value === null || value === undefined || value === '') return true
            return typeof value === 'string' && /^([01]?\d|2[0-3]):([0-5]\d)$/.test(value.trim())
              ? true
              : 'Use 24-hour HH:MM, e.g. 07:30 — or leave empty and use the text field for times like "after sunrise".'
          },
          admin: {
            description: '24-hour local time, e.g. 07:30. Lets visitors abroad see it in their own timezone.',
          },
        },
        {
          name: 'time',
          type: 'text',
          admin: {
            description: 'Free text, shown as-is when no structured time is set — e.g. "after sunrise".',
          },
        },
        { name: 'language', type: 'select', options: ['Tigrinya', 'English', 'Arabic', 'Other'] },
        { name: 'notes', type: 'text' },
      ],
    },
    {
      name: 'gallery',
      type: 'array',
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', required: true },
        { name: 'caption', type: 'text', localized: true },
      ],
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
