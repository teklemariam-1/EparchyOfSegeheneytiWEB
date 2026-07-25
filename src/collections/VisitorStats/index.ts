import type { CollectionConfig } from 'payload'
import { can, hideUnless } from '../../lib/permissions/access'

/**
 * Anonymous, aggregated visit counts by day.
 *
 * Deliberately NOT per-request logging: one row per (dimension, key, day) with
 * a running count. No IP addresses, no user agents, no cookies, no per-person
 * records — just daily aggregates:
 *
 *   dimension 'country'  key ER / IT / ...      (one per browser session)
 *   dimension 'path'     key /news/some-slug    (one per page view)
 *   dimension 'device'   key mobile|tablet|desktop  (per session)
 *   dimension 'source'   key direct|google|facebook|... (per session)
 *   dimension 'language' key en|ti|ar|...       (per session)
 *   dimension 'search' / 'search-empty'  key <term>  (per on-site search)
 *
 * Written only by the server (/api/track, overrideAccess). No public access.
 */
export const VisitorStats: CollectionConfig = {
  slug: 'visitor-stats',
  admin: {
    useAsTitle: 'key',
    group: 'Administration',
    defaultColumns: ['dimension', 'key', 'date', 'count'],
    description: 'Anonymous daily visit aggregates. No personal data is stored.',
    hidden: hideUnless('visitor-stats.view'),
  },
  access: {
    read: can('visitor-stats.view'),
    create: can('visitor-stats.view'),
    update: can('visitor-stats.view'),
    delete: can('visitor-stats.delete'),
  },
  fields: [
    {
      name: 'dimension',
      type: 'text',
      required: true,
      defaultValue: 'country',
      index: true,
      admin: { description: "What is being counted: country, path, device, source, language, search." },
    },
    {
      name: 'key',
      type: 'text',
      required: true,
      index: true,
      admin: { description: 'The value within the dimension (country code, path, device class, …).' },
    },
    {
      // Kept for the original country rows and admin readability.
      name: 'country',
      type: 'text',
      index: true,
      admin: { description: "Country code (only set when dimension is 'country')." },
    },
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
