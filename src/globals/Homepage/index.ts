import type { GlobalConfig } from 'payload'
import { revalidatePath } from 'next/cache'
import { isChanceryOrAbove } from '@/lib/permissions/collectionAccess'

export const Homepage: GlobalConfig = {
  slug: 'homepage',
  admin: {
    group: 'Content',
    description: 'Homepage hero, featured content, and section toggles.',
  },
  access: { read: () => true, update: isChanceryOrAbove },
  hooks: {
    afterChange: [
      () => {
        revalidatePath('/')
      },
    ],
  },
  fields: [
    {
      name: 'hero',
      type: 'group',
      label: 'Hero Section',
      fields: [
        {
          name: 'headline',
          type: 'text',
          localized: true,
          admin: { description: 'Main hero heading text.' },
        },
        {
          name: 'subheading',
          type: 'text',
          localized: true,
        },
        {
          name: 'backgroundImage',
          type: 'upload',
          relationTo: 'media',
        },
        {
          name: 'primaryCta',
          type: 'group',
          label: 'Primary Button',
          fields: [
            { name: 'label', type: 'text', localized: true },
            { name: 'url', type: 'text' },
          ],
        },
        {
          name: 'secondaryCta',
          type: 'group',
          label: 'Secondary Button',
          fields: [
            { name: 'label', type: 'text', localized: true },
            { name: 'url', type: 'text' },
          ],
        },
      ],
    },
    {
      name: 'bishopMessage',
      type: 'group',
      label: "Bishop's Message Section",
      fields: [
        { name: 'enabled', type: 'checkbox', defaultValue: true },
        {
          name: 'featuredMessage',
          type: 'relationship',
          relationTo: 'bishop-messages',
          admin: {
            condition: (_, sibling) => sibling?.enabled !== false,
            description: 'Pin a specific message, or leave blank to use the latest.',
          },
        },
        { name: 'sectionHeading', type: 'text', localized: true },
        { name: 'sectionSubtext', type: 'text', localized: true },
      ],
    },
    {
      name: 'latestNews',
      type: 'group',
      label: 'Latest News Section',
      fields: [
        { name: 'enabled', type: 'checkbox', defaultValue: true },
        { name: 'sectionHeading', type: 'text', localized: true },
        {
          name: 'count',
          type: 'number',
          defaultValue: 3,
          min: 1,
          max: 6,
          admin: { description: 'Number of news items to display.' },
        },
        {
          name: 'featuredArticles',
          type: 'relationship',
          relationTo: 'news',
          hasMany: true,
          admin: { description: 'Pin specific articles. Leave empty to show latest published.' },
        },
      ],
    },
    {
      name: 'upcomingEvents',
      type: 'group',
      label: 'Upcoming Events Section',
      fields: [
        { name: 'enabled', type: 'checkbox', defaultValue: true },
        { name: 'sectionHeading', type: 'text', localized: true },
        {
          name: 'count',
          type: 'number',
          defaultValue: 3,
          min: 1,
          max: 6,
          admin: { description: 'Number of events to display.' },
        },
      ],
    },
    {
      name: 'quickLinks',
      type: 'group',
      label: 'Quick Links Section',
      fields: [
        { name: 'enabled', type: 'checkbox', defaultValue: true },
        { name: 'sectionHeading', type: 'text', localized: true },
        {
          name: 'links',
          type: 'array',
          maxRows: 8,
          fields: [
            { name: 'label', type: 'text', required: true, localized: true },
            { name: 'url', type: 'text', required: true },
            { name: 'icon', type: 'text', admin: { description: 'Lucide icon name or emoji.' } },
            { name: 'description', type: 'text', localized: true },
          ],
        },
      ],
    },
  ],
}
