import type { GlobalConfig } from 'payload'
import { safeRevalidatePath, safeRevalidateTag } from '../../lib/payload/revalidate'
import { can } from '../../lib/permissions/access'

export const AboutPage: GlobalConfig = {
  slug: 'about-page',
  admin: {
    group: 'Content',
    description: 'Editable content for the public About page (mission, stats, pillars, timeline).',
  },
  access: { read: () => true, update: can('globals.about-page.edit') },
  hooks: {
    afterChange: [
      () => {
        safeRevalidateTag('globals')
        safeRevalidatePath('/about')
      },
    ],
  },
  fields: [
    {
      name: 'mission',
      type: 'group',
      label: 'Mission Section',
      fields: [
        { name: 'heading', type: 'text', localized: true, admin: { description: 'e.g. "Our Mission"' } },
        { name: 'intro', type: 'textarea', localized: true, admin: { description: 'Opening lead paragraph.' } },
        { name: 'body', type: 'textarea', localized: true, admin: { description: 'Second paragraph.' } },
      ],
    },
    {
      name: 'stats',
      type: 'array',
      label: 'Key Statistics',
      admin: { description: 'e.g. 47 Parishes, 12 Schools, 6 Clinics.' },
      fields: [
        { name: 'value', type: 'text', required: true, admin: { description: 'e.g. "47"' } },
        { name: 'label', type: 'text', required: true, localized: true, admin: { description: 'e.g. "Parishes"' } },
      ],
    },
    {
      name: 'pillars',
      type: 'group',
      label: 'Pillars Section',
      fields: [
        { name: 'heading', type: 'text', localized: true },
        {
          name: 'items',
          type: 'array',
          fields: [
            { name: 'icon', type: 'text', admin: { description: 'Emoji or icon.' } },
            { name: 'title', type: 'text', required: true, localized: true },
            { name: 'body', type: 'textarea', localized: true },
          ],
        },
      ],
    },
    {
      name: 'timeline',
      type: 'group',
      label: 'Timeline Section',
      fields: [
        { name: 'heading', type: 'text', localized: true },
        {
          name: 'items',
          type: 'array',
          fields: [
            { name: 'year', type: 'text', required: true },
            { name: 'label', type: 'text', required: true, localized: true },
            { name: 'description', type: 'textarea', localized: true },
          ],
        },
      ],
    },
    {
      name: 'geez',
      type: 'group',
      label: "Ge'ez Tradition Section",
      fields: [
        { name: 'heading', type: 'text', localized: true },
        { name: 'body', type: 'textarea', localized: true },
        { name: 'ctaLabel', type: 'text', localized: true, admin: { description: 'Button text linking to the Ge\'ez calendar.' } },
      ],
    },
  ],
}
