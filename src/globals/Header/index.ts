import type { GlobalConfig } from 'payload'
import { revalidatePath } from 'next/cache'
import { isChanceryOrAbove } from '@/lib/permissions/collectionAccess'

export const Header: GlobalConfig = {
  slug: 'header',
  admin: {
    group: 'Navigation',
    description: 'Site header: logo, announcement banner, and utility links.',
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
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Logo image shown in the site header. Overrides the SiteSettings logo.' },
    },
    {
      name: 'logoAlt',
      type: 'text',
      localized: true,
      admin: { description: 'Alt text for the header logo.' },
    },
    {
      name: 'announcementBanner',
      type: 'group',
      label: 'Announcement Banner',
      admin: { description: 'Optional banner shown above the main navigation.' },
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'message',
          type: 'text',
          localized: true,
          admin: { condition: (_, sibling) => sibling?.enabled === true },
        },
        {
          name: 'link',
          type: 'text',
          admin: {
            description: 'Optional URL the banner message links to.',
            condition: (_, sibling) => sibling?.enabled === true,
          },
        },
        {
          name: 'style',
          type: 'select',
          options: [
            { label: 'Info (blue)', value: 'info' },
            { label: 'Warning (gold)', value: 'warning' },
            { label: 'Urgent (red)', value: 'urgent' },
          ],
          defaultValue: 'info',
          admin: { condition: (_, sibling) => sibling?.enabled === true },
        },
      ],
    },
    {
      name: 'utilityLinks',
      type: 'array',
      label: 'Utility Links (top bar)',
      maxRows: 3,
      fields: [
        { name: 'label', type: 'text', required: true, localized: true },
        { name: 'url', type: 'text', required: true },
        { name: 'icon', type: 'text', admin: { description: 'Optional icon name (e.g. phone, mail).' } },
      ],
    },
  ],
}
