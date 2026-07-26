import type { CollectionConfig } from 'payload'
import { can, hideUnless } from '../../lib/permissions/access'

/**
 * The webhook idempotency ledger — one row per Stripe event we have seen.
 *
 * Stripe guarantees *at least once* delivery, not exactly once. It retries on
 * any non-2xx, on a timeout, and occasionally sends the same event twice even
 * after a 200. Without a record of what has already been applied, a single
 * retried `checkout.session.completed` would post the same gift into the ledger
 * twice — and a church's donation record showing a gift that was never given is
 * worse than one showing nothing at all, because it will be reconciled against
 * a bank statement and found wrong.
 *
 * `eventId` carries a UNIQUE constraint, and the handler *inserts first*. The
 * database, not application logic, decides who wins: a concurrent duplicate
 * delivery fails the insert and is dropped. A find-then-create check would race
 * between the two, which is precisely the case Stripe's retries produce.
 *
 * Rows are staff-readable for debugging a missing donation and are never
 * writable through the API — only the webhook handler creates them, with
 * overrideAccess.
 */
export const StripeEvents: CollectionConfig = {
  slug: 'stripe-events',
  admin: {
    useAsTitle: 'eventId',
    group: 'Administration',
    defaultColumns: ['eventId', 'type', 'status', 'donation', 'createdAt'],
    description: 'Stripe webhook deliveries. Used to make payment processing idempotent.',
    listSearchableFields: ['eventId', 'type'],
    hidden: hideUnless('donations.view'),
  },
  access: {
    read: can('donations.view'),
    // Written only by the webhook handler (overrideAccess). Nothing in the admin
    // UI or the REST API may create, edit or remove an entry — deleting one
    // would make a replayed event apply a second time.
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [
    {
      name: 'eventId',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'Stripe event id (evt_…). Unique — this is the replay guard.' },
    },
    { name: 'type', type: 'text', required: true, index: true, admin: { description: 'e.g. checkout.session.completed' } },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'received',
      options: [
        { label: 'Received', value: 'received' },
        { label: 'Processed', value: 'processed' },
        { label: 'Ignored (event type not handled)', value: 'ignored' },
        { label: 'Failed', value: 'failed' },
      ],
    },
    {
      name: 'donation',
      type: 'relationship',
      relationTo: 'donations',
      admin: { description: 'The donation this event applied to, when it could be resolved.' },
    },
    { name: 'livemode', type: 'checkbox', defaultValue: false, admin: { description: 'False for test-mode events.' } },
    {
      name: 'error',
      type: 'textarea',
      admin: { description: 'Why processing failed, when it did. Never contains card data.' },
    },
  ],
  timestamps: true,
}
