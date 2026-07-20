import type { CollectionConfig } from 'payload'
import { isChanceryOrAbove } from '../../lib/permissions/collectionAccess'

/**
 * RSS feeds the ingest job pulls from.
 *
 * These used to be hardcoded in src/lib/ingest/vaticanNews.ts, so adding a
 * source needed a code change and a deploy. They are content now.
 *
 * `target` decides which collection a feed's items become: news articles or
 * papal documents. Everything lands as a draft awaiting review either way —
 * see the ingest route.
 *
 * Only the headline, summary and a link back to the original are stored, never
 * the full article text. That is a copyright boundary, not a nicety: it keeps
 * republishing attributable and drives traffic back to the publisher.
 */
export const FeedSources: CollectionConfig = {
  slug: 'feed-sources',
  admin: {
    useAsTitle: 'name',
    group: 'Administration',
    defaultColumns: ['name', 'target', 'enabled', 'lastFetchedAt', 'lastStatus'],
    description:
      'RSS feeds imported automatically. Disable a source to stop importing from it without losing its settings.',
  },
  access: {
    read: isChanceryOrAbove,
    create: isChanceryOrAbove,
    update: isChanceryOrAbove,
    delete: isChanceryOrAbove,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: { description: 'Shown as the source attribution, e.g. "Vatican News".' },
    },
    {
      name: 'url',
      type: 'text',
      required: true,
      unique: true,
      validate: (value: unknown) => {
        const raw = String(value ?? '').trim()
        if (!raw) return 'A feed URL is required.'
        let parsed: URL
        try {
          parsed = new URL(raw)
        } catch {
          return 'Enter a full URL, including https://'
        }
        // http(s) only: the ingest job fetches this server-side, so allowing
        // other schemes would let a stored value reach the filesystem or
        // internal services.
        if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
          return 'Feed URL must start with http:// or https://'
        }
        return true
      },
      admin: { description: 'Full URL of the RSS/XML feed.' },
    },
    {
      name: 'target',
      type: 'select',
      required: true,
      defaultValue: 'news',
      options: [
        { label: 'News articles', value: 'news' },
        { label: 'Messages from the Holy Father', value: 'pope-messages' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Which collection imported items are created in.',
      },
    },
    {
      name: 'category',
      type: 'select',
      defaultValue: 'vatican',
      options: [
        { label: 'Eparchy', value: 'eparchy' },
        { label: 'Vatican', value: 'vatican' },
        { label: 'Pastoral', value: 'pastoral' },
        { label: 'Community', value: 'community' },
        { label: 'Social Ministry', value: 'social' },
        { label: 'Announcement', value: 'announcement' },
      ],
      admin: {
        position: 'sidebar',
        condition: (data) => data?.target === 'news',
        description: 'Category applied to articles imported from this feed.',
      },
    },
    {
      name: 'documentType',
      type: 'select',
      defaultValue: 'message',
      options: [
        { label: 'Encyclical', value: 'encyclical' },
        { label: 'Apostolic Exhortation', value: 'apostolic-exhortation' },
        { label: 'Apostolic Letter', value: 'apostolic-letter' },
        { label: 'Apostolic Constitution', value: 'apostolic-constitution' },
        { label: 'Message', value: 'message' },
        { label: 'Homily', value: 'homily' },
        { label: 'Audience Address', value: 'audience' },
        { label: 'Other', value: 'other' },
      ],
      admin: {
        position: 'sidebar',
        condition: (data) => data?.target === 'pope-messages',
        description: 'Document type applied to items imported from this feed.',
      },
    },
    {
      name: 'enabled',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Uncheck to skip this feed without deleting it.',
      },
    },
    {
      name: 'lastFetchedAt',
      type: 'date',
      admin: { position: 'sidebar', readOnly: true, description: 'Set by the ingest job.' },
    },
    {
      name: 'lastStatus',
      type: 'text',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Result of the last run — how many items were created, or the error.',
      },
    },
  ],
  timestamps: true,
}
