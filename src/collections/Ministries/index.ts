import type { CollectionConfig } from 'payload'
import { revalidatePath } from 'next/cache'
import { isPublicRead, isChanceryOrAbove, isRoleOneOf } from '../../lib/permissions/collectionAccess'

export const Ministries: CollectionConfig = {
  slug: 'ministries',
  admin: {
    useAsTitle: 'name',
    group: 'Church',
    defaultColumns: ['name', 'type', 'parish', 'status'],
    description: 'Eparchy and parish-level ministry groups.',
    preview: (doc) => `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/ministries/${(doc as any).slug}`,
  },
  access: {
    read: isPublicRead,
    create: isRoleOneOf('super-admin', 'chancery-editor', 'parish-editor', 'catechist-editor', 'youth-editor'),
    update: isRoleOneOf('super-admin', 'chancery-editor', 'parish-editor', 'catechist-editor', 'youth-editor'),
    delete: isChanceryOrAbove,
  },
  hooks: {
    afterChange: [
      ({ doc }) => {
        revalidatePath(`/ministries/${doc.slug}`)
        revalidatePath('/ministries')
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
