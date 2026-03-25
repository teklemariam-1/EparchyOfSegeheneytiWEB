import type { GlobalConfig } from 'payload'
import { revalidatePath } from 'next/cache'
import { isChanceryOrAbove } from '../../lib/permissions/collectionAccess'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  admin: {
    group: 'Settings',
    description: 'Global site identity, contact info, and metadata defaults.',
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
      name: 'siteName',
      type: 'text',
      required: true,
      defaultValue: 'Eparchy of Segeneyti',
    },
    {
      name: 'tagline',
      type: 'text',
      localized: true,
      admin: { description: 'Short tagline displayed in the browser tab and meta tags.' },
    },
    {
      name: 'siteDescription',
      type: 'textarea',
      localized: true,
      admin: { description: 'Default meta description (160 chars max).' },
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Main site logo. Recommended: SVG or PNG with transparent background.' },
    },
    {
      name: 'logoDark',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Dark variant of the logo (used on light backgrounds).' },
    },
    {
      name: 'favicon',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Favicon image (ICO or 32×32 PNG).' },
    },
    {
      name: 'defaultOgImage',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Default Open Graph image (1200×630px) for social sharing.' },
    },
    {
      name: 'contact',
      type: 'group',
      label: 'Contact Information',
      fields: [
        { name: 'email', type: 'email' },
        { name: 'phone', type: 'text' },
        { name: 'fax', type: 'text' },
        {
          name: 'address',
          type: 'group',
          fields: [
            { name: 'street', type: 'text' },
            { name: 'city', type: 'text', defaultValue: 'Segeneyti' },
            { name: 'region', type: 'text', defaultValue: 'Southern Debub' },
            { name: 'country', type: 'text', defaultValue: 'Eritrea' },
            { name: 'poBox', type: 'text' },
          ],
        },
        { name: 'mapEmbedUrl', type: 'text', admin: { description: 'Google Maps embed URL for the contact page map.' } },
      ],
    },
    {
      name: 'socialLinks',
      type: 'group',
      label: 'Social Media',
      fields: [
        { name: 'facebook', type: 'text', admin: { description: 'Full Facebook page URL.' } },
        { name: 'youtube', type: 'text', admin: { description: 'Full YouTube channel URL.' } },
        { name: 'twitter', type: 'text', admin: { description: 'Full Twitter/X profile URL.' } },
        { name: 'telegram', type: 'text', admin: { description: 'Telegram channel link.' } },
        { name: 'instagram', type: 'text' },
      ],
    },
    {
      name: 'analytics',
      type: 'group',
      label: 'Analytics',
      fields: [
        { name: 'googleAnalyticsId', type: 'text', admin: { description: 'GA4 Measurement ID (G-XXXXXXXXXX).' } },
        { name: 'googleTagManagerId', type: 'text', admin: { description: 'GTM Container ID (GTM-XXXXXXX).' } },
      ],
    },
    {
      name: 'maintenanceMode',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Enable maintenance mode to show a holding page to visitors.' },
      access: {
        update: ({ req: { user } }) => !!(user && (user as any).role === 'super-admin'),
      },
    },
  ],
}
