import type { CollectionConfig } from 'payload'
import { safeRevalidatePath, safeRevalidateTag } from '../../lib/payload/revalidate'
import { isPublicRead } from '../../lib/permissions/readAccess'
import { crud, hideUnless } from '../../lib/permissions/access'
import { slugFieldHook } from '../../lib/payload/slugField'

export const Ministries: CollectionConfig = {
  slug: 'ministries',
  admin: {
    hidden: hideUnless('ministries.create', 'ministries.update', 'ministries.delete'),
    useAsTitle: 'name',
    group: 'Church',
    defaultColumns: ['name', 'type', 'parish', 'status'],
    description: 'Eparchy and parish-level ministry groups.',
    preview: (doc) => `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/ministries/${(doc as any).slug}`,
  },
  access: {
    ...crud(isPublicRead, 'ministries.create', 'ministries.update', 'ministries.delete'),
  },
  hooks: {
    afterChange: [
      ({ doc }) => {
        safeRevalidateTag('ministries')
        safeRevalidatePath(`/ministries/${doc.slug}`)
        safeRevalidatePath('/ministries')
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
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Youth Council', value: 'youth-council' },
        { label: 'Catechists', value: 'catechists' },
        { label: "Children's Ministry", value: 'children' },
        { label: 'Small Christian Community', value: 'small-christian-community' },
        { label: 'Lay Apostolate', value: 'lay-apostolate' },
        { label: 'Caritas / Social', value: 'caritas' },
        { label: "Women's League", value: 'women-league' },
        { label: "Men's League", value: 'men-league' },
        { label: 'Choir / Liturgical Music', value: 'choir' },
        { label: 'Other', value: 'other' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
      admin: { position: 'sidebar' },
    },
    {
      name: 'description',
      type: 'richText',
      localized: true,
    },
    {
      name: 'mission',
      type: 'textarea',
      localized: true,
      admin: { description: 'Brief mission statement.' },
    },
    {
      name: 'parish',
      type: 'relationship',
      relationTo: 'parishes',
      admin: {
        position: 'sidebar',
        description: 'Leave blank for eparchy-wide ministries.',
      },
    },
    {
      name: 'leader',
      type: 'group',
      fields: [
        { name: 'name', type: 'text' },
        { name: 'phone', type: 'text' },
        { name: 'email', type: 'email' },
      ],
    },
    {
      name: 'meetingInfo',
      type: 'group',
      label: 'Meeting Information',
      fields: [
        { name: 'schedule', type: 'text', localized: true, admin: { description: 'e.g. Every Sunday after 9am Mass' } },
        { name: 'venue', type: 'text', localized: true },
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
  ],
  timestamps: true,
}
