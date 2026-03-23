import type { CollectionConfig } from 'payload'
import { revalidatePath } from 'next/cache'
import { isPublicRead, isChanceryOrAbove } from '@/lib/permissions/collectionAccess'

export const Priests: CollectionConfig = {
  slug: 'priests',
  admin: {
    useAsTitle: 'fullName',
    group: 'Church',
    defaultColumns: ['fullName', 'title', 'assignment', 'parish', 'status'],
    description: 'Priests, deacons, and clergy of the Eparchy.',
  },
  access: {
    read: isPublicRead,
    create: isChanceryOrAbove,
    update: isChanceryOrAbove,
    delete: isChanceryOrAbove,
  },
  hooks: {
    afterChange: [
      ({ doc }) => {
        revalidatePath(`/parishes`)
      },
    ],
  },
  fields: [
    {
      name: 'fullName',
      type: 'text',
      required: true,
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
      name: 'title',
      type: 'select',
      required: true,
      defaultValue: 'Rev. Fr.',
      options: [
        { label: 'Rev. Fr.', value: 'Rev. Fr.' },
        { label: 'Msgr.', value: 'Msgr.' },
        { label: 'Bishop', value: 'Bishop' },
        { label: 'Archbishop', value: 'Archbishop' },
        { label: 'Cardinal', value: 'Cardinal' },
        { label: 'Deacon', value: 'Deacon' },
        { label: 'Brother', value: 'Brother' },
        { label: 'Sister', value: 'Sister' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Retired', value: 'retired' },
        { label: 'Deceased', value: 'deceased' },
        { label: 'On Leave', value: 'on-leave' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      admin: { position: 'sidebar' },
    },
    {
      name: 'assignment',
      type: 'text',
      localized: true,
      admin: {
        description: 'Official role/position (e.g. "Pastor, St. Mary Parish", "Vicar General").',
      },
    },
    {
      name: 'bio',
      type: 'richText',
      localized: true,
    },
    {
      name: 'parish',
      type: 'relationship',
      relationTo: 'parishes',
      hasMany: true,
      admin: { position: 'sidebar' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'ordinationDate',
          type: 'date',
          label: 'Ordination Date',
        },
        {
          name: 'birthDate',
          type: 'date',
          label: 'Birth Date',
        },
      ],
    },
    {
      name: 'education',
      type: 'array',
      fields: [
        { name: 'institution', type: 'text', required: true },
        { name: 'degree', type: 'text' },
        { name: 'year', type: 'number' },
      ],
    },
    {
      name: 'contact',
      type: 'group',
      fields: [
        { name: 'email', type: 'email' },
        { name: 'phone', type: 'text' },
      ],
    },
  ],
  timestamps: true,
}
