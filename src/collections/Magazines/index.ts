import type { CollectionConfig } from 'payload'
import { revalidatePath } from 'next/cache'
import { isPublicRead, isChanceryOrAbove } from '@/lib/permissions/collectionAccess'

export const Magazines: CollectionConfig = {
  slug: 'magazines',
  admin: {
    useAsTitle: 'title',
    group: 'Publications',
    defaultColumns: ['title', 'issueNumber', 'year', 'publishedAt'],
    description: 'Eparchy magazine issues (e.g. Tesfanet, Qal Hiwet).',
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
        revalidatePath(`/publications/magazines/${doc.slug}`)
        revalidatePath('/publications/magazines')
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
      name: 'publishedAt',
      type: 'date',
      required: true,
      index: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
      admin: { position: 'sidebar' },
    },
    {
      type: 'row',
      fields: [
        { name: 'issueNumber', type: 'number', admin: { description: 'Issue number within the year.' } },
        { name: 'year', type: 'number', required: true },
        { name: 'volume', type: 'number', admin: { description: 'Volume number.' } },
      ],
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
      admin: { description: "Summary of this issue's contents." },
    },
    {
      name: 'document',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: { description: 'Full PDF of the magazine issue.' },
    },
    {
      name: 'featuredArticles',
      type: 'array',
      fields: [
        { name: 'articleTitle', type: 'text', required: true, localized: true },
        { name: 'pageNumber', type: 'number' },
        { name: 'author', type: 'text' },
      ],
    },
    {
      name: 'isFeatured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Show as "Latest Issue" on the publications page.',
      },
    },
  ],
  timestamps: true,
}
