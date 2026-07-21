import type { CollectionConfig } from 'payload'
import { isChanceryOrAbove, isSuperAdmin } from '../../lib/permissions/collectionAccess'

/**
 * Anonymous, aggregated visit counts by country and day.
 *
 * Deliberately NOT per-request logging: one row per (country, day), with a
 * running count. No IP addresses, no user agents, no per-person records — just
 * enough to show "visitors by country" without collecting personal data.
 *
 * Written only by the server (/api/track, overrideAccess). No public access.
 */
export const VisitorStats: CollectionConfig = {
  slug: 'visitor-stats',
  admin: {
    useAsTitle: 'country',
    group: 'Administration',
    defaultColumns: ['country', 'date', 'count'],
    description: 'Anonymous visit counts by country and day. No personal data is stored.',
    hidden: false,
  },
  access: {
    read: isChanceryOrAbove,
    create: isChanceryOrAbove,
    update: isChanceryOrAbove,
    delete: isSuperAdmin,
  },
  fields: [
    { name: 'country', type: 'text', required: true, index: true },
    {
      name: 'date',
      type: 'date',
      required: true,
      index: true,
      admin: { date: { pickerAppearance: 'dayOnly' } },
    },
    { name: 'count', type: 'number', required: true, defaultValue: 0 },
  ],
  timestamps: true,
}
