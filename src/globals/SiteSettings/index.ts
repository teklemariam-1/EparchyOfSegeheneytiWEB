import type { GlobalConfig } from 'payload'
import { isSuperAdmin, isChanceryOrAbove } from '@/lib/permissions/collectionAccess'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  admin: { group: 'Settings' },
  access: { read: () => true, update: isChanceryOrAbove },
  fields: [
    { name: 'siteName', type: 'text', required: true, defaultValue: 'Eparchy of Segeneyti' },
    { name: 'tagline', type: 'text', localized: true },
    { name: 'siteDescription', type: 'textarea', localized: true },
    { name: 'logo', type: 'upload', relationTo: 'media' },
    { name: 'favicon', type: 'upload', relationTo: 'media' },
    { name: 'ogImage', type: 'upload', relationTo: 'media' },
    { name: 'email', type: 'email' },
    { name: 'phone', type: 'text' },
    { name: 'address', type: 'textarea' },
    { name: 'socialLinks', type: 'group', fields: [
      { name: 'facebook', type: 'text' },
      { name: 'youtube', type: 'text' },
      { name: 'twitter', type: 'text' },
    ]},
    { name: 'googleAnalyticsId', type: 'text', admin: { condition: (_, siblingData) => !!siblingData } },
    { name: 'maintenanceMode', type: 'checkbox', defaultValue: false, access: { update: ({ req: { user } }) => !!(user && (user as any).role === 'super-admin') } },
  ],
}
