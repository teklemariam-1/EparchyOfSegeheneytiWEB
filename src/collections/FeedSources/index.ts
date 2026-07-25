import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'
import { can, hideUnless } from '../../lib/permissions/access'
import { resolveFeedUrl } from '../../lib/ingest/resolveFeedUrl'
import { probeFeed } from '../../lib/ingest/vaticanNews'

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
    hidden: hideUnless('feed-sources.manage'),
    useAsTitle: 'name',
    group: 'Administration',
    defaultColumns: ['name', 'target', 'enabled', 'healthStatus', 'lastFetchedAt', 'lastStatus'],
    description:
      'RSS feeds imported automatically. Disable a source to stop importing from it without losing its settings.',
  },
  access: {
    read: can('feed-sources.manage'),
    create: can('feed-sources.manage'),
    update: can('feed-sources.manage'),
    delete: can('feed-sources.manage'),
  },
  hooks: {
    beforeChange: [
      async ({ data, originalDoc }) => {
        // Only resolve/test when the URL is new or changed, so re-saving an
        // existing source does not make a network call every time.
        const url = data?.url
        if (!url || url === originalDoc?.url) return data

        // A human usually pastes the page they read (…/ti.html), not its feed.
        // Turn it into the real feed URL, or throw a message they can act on.
        const { url: resolved, changed } = await resolveFeedUrl(String(url))
        data.url = resolved

        // Validate on save: test-fetch the feed now so the admin sees an
        // immediate "N items found" success or a clear, actionable error before
        // the record is stored. A dead or wrong URL never gets silently saved.
        const probe = await probeFeed(resolved, 5)
        if (!probe.ok) {
          throw new APIError(
            `Could not read that feed (${probe.httpStatus ?? 'no response'}): ${probe.error ?? 'unknown error'}`,
            400,
          )
        }

        const corrected = changed ? `URL auto-corrected to ${resolved}. ` : ''
        data.feedFormat = probe.format
        data.lastItemCount = probe.itemCount
        data.lastError = null
        data.healthStatus = 'healthy'
        data.consecutiveFailures = 0
        data.lastFetchedAt = new Date().toISOString()
        data.lastStatus = `${corrected}✓ ${probe.itemCount} item${probe.itemCount === 1 ? '' : 's'} found (${probe.format.toUpperCase()})`
        return data
      },
    ],
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
      // Options are managed in the News Categories collection (admin-editable).
      name: 'category',
      type: 'text',
      defaultValue: 'vatican',
      admin: {
        position: 'sidebar',
        condition: (data) => data?.target === 'news',
        description: 'Category applied to articles imported from this feed.',
        components: {
          Field: {
            path: '@/components/admin/TaxonomySelect#TaxonomySelect',
            clientProps: { collectionSlug: 'news-categories', labelText: 'Category' },
          },
        },
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
      name: 'healthStatus',
      type: 'select',
      defaultValue: 'unknown',
      options: [
        { label: '— Unknown', value: 'unknown' },
        { label: '✓ Healthy', value: 'healthy' },
        { label: '⚠ Degraded', value: 'degraded' },
        { label: '✕ Failing', value: 'failing' },
      ],
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Set automatically from the last fetch. Degraded after 1 failure, failing after 3.',
      },
    },
    {
      name: 'feedFormat',
      type: 'text',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Detected feed format (RSS / Atom / JSON).',
      },
    },
    {
      name: 'lastItemCount',
      type: 'number',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Number of items found on the last successful fetch.',
      },
    },
    {
      name: 'consecutiveFailures',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar', readOnly: true, description: 'Reset to 0 on a successful fetch.' },
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
    {
      name: 'lastError',
      type: 'text',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'The error message from the last failed fetch, if any.',
      },
    },
  ],
  timestamps: true,
}
