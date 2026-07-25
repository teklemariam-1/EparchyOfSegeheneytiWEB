import type { CollectionConfig } from 'payload'
import { can, canField, hideUnless } from '../../lib/permissions/access'

/**
 * Newsletter subscribers.
 *
 * Double opt-in: a signup lands as "pending" with a confirmation token and only
 * becomes "confirmed" after the person clicks the link we email them. This is
 * both good practice and, in many places, a legal requirement for a mailing
 * list — we must be able to show consent.
 *
 * The public form submits through a trusted server action (overrideAccess), so
 * there is no open REST create endpoint to flood, mirroring ContactSubmissions.
 */
export const Subscribers: CollectionConfig = {
  slug: 'subscribers',
  admin: {
    hidden: hideUnless('subscribers.view'),
    useAsTitle: 'email',
    group: 'Administration',
    defaultColumns: ['email', 'status', 'confirmedAt', 'createdAt'],
    description: 'Newsletter subscribers. Confirmed subscribers receive broadcasts.',
  },
  access: {
    read: can('subscribers.view'),
    // No public create/update/delete — the signup, confirm and unsubscribe
    // flows all run server-side with overrideAccess. Staff can still manage
    // subscribers in-admin.
    create: can('subscribers.manage'),
    update: can('subscribers.manage'),
    delete: can('subscribers.delete'),
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending confirmation', value: 'pending' },
        { label: 'Confirmed', value: 'confirmed' },
        { label: 'Unsubscribed', value: 'unsubscribed' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'locale',
      type: 'select',
      defaultValue: 'en',
      options: [
        { label: 'English', value: 'en' },
        { label: 'Tigrinya', value: 'ti' },
      ],
      admin: { position: 'sidebar', description: 'Preferred language at signup.' },
    },
    {
      // Random token embedded in the confirmation link. Cleared once confirmed.
      // Read-gated so it is never returned to a view-only grant or leaked via the
      // API; the confirm/unsubscribe flows read it server-side with overrideAccess.
      name: 'confirmationToken',
      type: 'text',
      index: true,
      access: { read: canField('subscribers.manage') },
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      // Stable token embedded in every email's unsubscribe link. Read-gated (see above).
      name: 'unsubscribeToken',
      type: 'text',
      index: true,
      access: { read: canField('subscribers.manage') },
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'confirmedAt',
      type: 'date',
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'unsubscribedAt',
      type: 'date',
      admin: { readOnly: true, position: 'sidebar' },
    },
  ],
  timestamps: true,
}
