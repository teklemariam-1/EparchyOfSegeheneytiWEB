import type { CollectionConfig } from 'payload'
import { isChanceryOrAbove, isSuperAdmin } from '../../lib/permissions/collectionAccess'
import { elevatedOnly } from '../../lib/permissions/fieldAccess'

/**
 * Donation records (pledges and, later, processed payments).
 *
 * Like ContactSubmissions and Subscribers, there is NO public REST create — the
 * public donate form submits through a trusted server action (overrideAccess),
 * closing the anonymous spam/flood vector. Staff-controlled fields (status,
 * provider references, submittedAt, notes) are locked with field-level access
 * so a public submission can never set them.
 *
 * `anonymous` controls only public *display* (stats/recent lists). Name and
 * email are always collected so a receipt can be sent and the gift acknowledged.
 */
export const Donations: CollectionConfig = {
  slug: 'donations',
  admin: {
    useAsTitle: 'donorName',
    group: 'Administration',
    defaultColumns: ['status', 'donorName', 'amount', 'currency', 'frequency', 'createdAt'],
    description: 'Donations and pledges received through the website.',
    listSearchableFields: ['donorName', 'donorEmail', 'reference', 'message'],
  },
  access: {
    read: isChanceryOrAbove,
    create: isChanceryOrAbove,
    update: isChanceryOrAbove,
    delete: isSuperAdmin,
  },
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        if (operation === 'create') {
          data.submittedAt = new Date().toISOString()
          if (!data.status) data.status = 'pending'
          if (!data.provider) data.provider = 'manual'
        }
        return data
      },
    ],
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'donorName', type: 'text', required: true },
        { name: 'donorEmail', type: 'email', required: true },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'amount', type: 'number', required: true, min: 0 },
        { name: 'currency', type: 'text', required: true, defaultValue: 'ERN' },
        {
          name: 'frequency',
          type: 'select',
          defaultValue: 'one-time',
          options: [
            { label: 'One-time', value: 'one-time' },
            { label: 'Monthly', value: 'monthly' },
          ],
        },
      ],
    },
    { name: 'message', type: 'textarea', admin: { description: 'Optional message from the donor.' } },
    {
      name: 'anonymous',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Hide the donor’s name in public statistics and lists.' },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      // Staff-only — a public submission cannot set or change this.
      access: { create: elevatedOnly, update: elevatedOnly },
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Received', value: 'received' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'provider',
      type: 'select',
      defaultValue: 'manual',
      access: { update: elevatedOnly },
      options: [
        { label: 'Manual transfer', value: 'manual' },
        { label: 'Stripe', value: 'stripe' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'providerRef',
      type: 'text',
      access: { create: elevatedOnly, update: elevatedOnly },
      admin: { position: 'sidebar', description: 'External payment/session id (for a PSP).' },
    },
    {
      name: 'reference',
      type: 'text',
      access: { create: elevatedOnly, update: elevatedOnly },
      admin: { position: 'sidebar', description: 'Bank/transfer reference for reconciliation.' },
    },
    {
      name: 'submittedAt',
      type: 'date',
      access: { create: elevatedOnly, update: elevatedOnly },
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'adminNotes',
      type: 'textarea',
      access: { create: elevatedOnly, update: elevatedOnly, read: elevatedOnly },
      admin: { description: 'Internal notes (not visible to the donor).' },
    },
  ],
  timestamps: true,
}
