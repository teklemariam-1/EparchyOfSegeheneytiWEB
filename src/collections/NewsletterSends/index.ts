import type { CollectionConfig } from 'payload'
import { can, hideUnless } from '../../lib/permissions/access'

/**
 * The record of every newsletter send — and the guard against double-sending.
 *
 * A row here means "this article went to the list". The send library refuses
 * an article that already has one, which is the property that matters most in
 * a mailing system run by non-technical staff on an unreliable connection: a
 * second click, a retried request, or an impatient refresh must never mail
 * everyone twice.
 *
 * Written only by the server (the send library, with overrideAccess); no one
 * creates or edits rows by hand — a hand-edited log defeats the dedupe.
 * Gated by the existing subscribers permissions, so no new permission enum
 * entry (and no enum migration) is needed.
 */
export const NewsletterSends: CollectionConfig = {
  slug: 'newsletter-sends',
  admin: {
    useAsTitle: 'subject',
    group: 'Administration',
    defaultColumns: ['subject', 'sentAt', 'recipientCount', 'failureCount'],
    description: 'Log of newsletters sent to subscribers. Written automatically — one row per send.',
    hidden: hideUnless('subscribers.view'),
  },
  access: {
    read: can('subscribers.view'),
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [
    {
      name: 'news',
      type: 'relationship',
      relationTo: 'news',
      required: true,
      index: true,
      admin: { description: 'The article that was sent.' },
    },
    { name: 'subject', type: 'text', required: true },
    { name: 'sentAt', type: 'date', required: true, admin: { position: 'sidebar' } },
    {
      name: 'sentBy',
      type: 'relationship',
      relationTo: 'users',
      admin: { position: 'sidebar', description: 'Who pressed send.' },
    },
    {
      name: 'recipientCount',
      type: 'number',
      required: true,
      admin: { description: 'Successfully handed to the mail transport.' },
    },
    {
      name: 'failureCount',
      type: 'number',
      defaultValue: 0,
      admin: { description: 'Recipients whose send raised an error. Details are in the server log.' },
    },
  ],
  timestamps: true,
}
