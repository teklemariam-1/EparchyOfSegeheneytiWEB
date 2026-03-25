import type { GlobalConfig } from 'payload'
import { revalidatePath } from 'next/cache'
import { isChanceryOrAbove } from '../../lib/permissions/collectionAccess'

export const Footer: GlobalConfig = {
  slug: 'footer',
  admin: {
    group: 'Navigation',
    description: 'Site footer: link columns, social icons, and copyright text.',
  },
  access: { read: () => true, update: isChanceryOrAbove },
  hooks: {
    afterChange: [
      () => {
        revalidatePath('/', 'layout')
      },
    ],
  },
  fields: [
    {
      name: 'copyrightText',
      type: 'text',
      localized: true,
      admin: { description: 'Copyright notice (e.g. "© 2025 Eparchy of Segeneyti. All rights reserved.").' },
    },
    {
      name: 'columns',
      type: 'array',
      label: 'Footer Link Columns',
      maxRows: 4,
      fields: [
        {
          name: 'heading',
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'links',
          type: 'array',
          fields: [
            { name: 'label', type: 'text', required: true, localized: true },
            { name: 'url', type: 'text', required: true },
            { name: 'newTab', type: 'checkbox', defaultValue: false },
          ],
        },
      ],
    },
    {
      name: 'bottomLinks',
      type: 'array',
      label: 'Bottom Bar Links',
      maxRows: 5,
      admin: { description: 'Small links in the very bottom bar (Privacy Policy, Terms, etc.).' },
      fields: [
        { name: 'label', type: 'text', required: true, localized: true },
        { name: 'url', type: 'text', required: true },
      ],
    },
    {
      name: 'showSocialLinks',
      type: 'checkbox',
      defaultValue: true,
      admin: { description: 'Display social media icons in the footer (sourced from Site Settings).' },
    },
    {
      name: 'newsletterSignup',
      type: 'group',
      label: 'Newsletter Signup Block',
      fields: [
        { name: 'enabled', type: 'checkbox', defaultValue: false },
        { name: 'heading', type: 'text', localized: true },
        { name: 'subtext', type: 'text', localized: true },
        { name: 'placeholder', type: 'text', localized: true },
        { name: 'buttonLabel', type: 'text', localized: true },
      ],
    },
  ],
}
