import type { GlobalConfig } from 'payload'
import { safeRevalidatePath, safeRevalidateTag } from '../../lib/payload/revalidate'
import { isChanceryOrAbove } from '../../lib/permissions/collectionAccess'

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
        safeRevalidateTag('globals')
        safeRevalidatePath('/')
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
          name: 'overlay',
          type: 'group',
          label: 'Background Overlay',
          admin: {
            description:
              'Tint applied over the hero image so the text stays readable. Lower the opacity to show more of the photo.',
          },
          fields: [
            {
              name: 'color',
              type: 'select',
              defaultValue: 'maroon',
              options: [
                { label: 'Maroon (brand)', value: 'maroon' },
                { label: 'Charcoal / near-black', value: 'charcoal' },
                { label: 'Deep green', value: 'green' },
                { label: 'Navy', value: 'navy' },
                { label: 'Gold', value: 'gold' },
                { label: 'Custom colour…', value: 'custom' },
                { label: 'None (no tint)', value: 'none' },
              ],
            },
            {
              name: 'customColor',
              type: 'text',
              admin: {
                description: 'Hex value, e.g. #5d1827',
                condition: (_, sibling) => sibling?.color === 'custom',
              },
            },
            {
              name: 'opacity',
              type: 'number',
              min: 0,
              max: 100,
              defaultValue: 65,
              admin: {
                description:
                  '0 = photo fully visible (text may be hard to read), 100 = solid colour. 55–75 usually reads well.',
                condition: (_, sibling) => sibling?.color !== 'none',
              },
            },
            {
              name: 'darkenBottom',
              type: 'checkbox',
              defaultValue: true,
              label: 'Darken towards the bottom',
              admin: {
                description: 'Adds a soft gradient so headings stay legible over busy photos.',
              },
            },
          ],
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
        // Bishop identity — rendered in the About page's bishop profile block.
        {
          name: 'photo',
          type: 'upload',
          relationTo: 'media',
          admin: { description: "Portrait of the Bishop, shown on the About page." },
        },
        {
          name: 'bishopName',
          type: 'text',
          localized: true,
          admin: { description: 'e.g. "Most Rev. Abune ..." — shown under the portrait.' },
        },
        {
          name: 'bishopTitle',
          type: 'text',
          localized: true,
          admin: { description: 'e.g. "Bishop of the Catholic Eparchy of Segeneyti".' },
        },
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
