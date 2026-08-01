import type { GlobalConfig } from 'payload'
import { safeRevalidatePath, safeRevalidateTag } from '../../lib/payload/revalidate'
import { can } from '../../lib/permissions/access'

export const Header: GlobalConfig = {
  slug: 'header',
  admin: {
    group: 'Navigation',
    description:
      'Everything in the site header: logo, the small top bar, the announcement banner, and which action buttons appear.',
  },
  access: { read: () => true, update: can('globals.header.edit') },
  hooks: {
    afterChange: [
      () => {
        safeRevalidateTag('globals')
        safeRevalidatePath('/', 'layout')
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
      admin: {
        description:
          'A slim bar above the main navigation — a phone number, an office address, a link to give. Leave empty and the bar does not appear at all.',
      },
      fields: [
        { name: 'label', type: 'text', required: true, localized: true },
        { name: 'url', type: 'text', required: true },
        {
          name: 'icon',
          type: 'select',
          defaultValue: 'none',
          options: [
            { label: 'None', value: 'none' },
            { label: 'Phone', value: 'phone' },
            { label: 'Email', value: 'mail' },
            { label: 'Location', value: 'location' },
            { label: 'Clock', value: 'clock' },
          ],
          // Was a free-text field inviting any icon name, which quietly rendered
          // nothing when the name did not exist. A closed list can only be right.
          admin: { description: 'Optional icon shown before the label.' },
        },
      ],
    },
    {
      name: 'actions',
      type: 'group',
      label: 'Header buttons',
      admin: {
        description:
          'Which action buttons appear in the header. All are on by default. The search box collapses to an icon on phones; the donate button is desktop-only by design.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'showSearch',
              type: 'checkbox',
              defaultValue: true,
              label: 'Search box',
              admin: { width: '33%' },
            },
            {
              name: 'showDonate',
              type: 'checkbox',
              defaultValue: true,
              label: 'Donate button',
              admin: {
                width: '33%',
                description: 'Also requires donations to be enabled in Donation Settings.',
              },
            },
            {
              name: 'showSettings',
              type: 'checkbox',
              defaultValue: true,
              label: 'Settings (text size, language)',
              admin: { width: '33%' },
            },
          ],
        },
        {
          name: 'showLanguage',
          type: 'checkbox',
          defaultValue: true,
          label: 'Language switcher',
          admin: {
            description:
              'The English / ትግርኛ toggle. Switching it off does not strip anyone of the choice — the settings page still offers it — but this is the only one-tap route to it, so leave it on unless there is a reason.',
          },
        },
      ],
    },
  ],
}
