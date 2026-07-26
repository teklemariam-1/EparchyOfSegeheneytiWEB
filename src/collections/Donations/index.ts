import type { CollectionConfig } from 'payload'
import { can, canField, hideUnless } from '../../lib/permissions/access'
import { currencyExponent } from '../../lib/donations/amounts'

/**
 * Donation records — both card payments and manual bank transfers.
 *
 * There is NO public REST create. The public donate form submits through a
 * trusted server action (overrideAccess), matching ContactSubmissions and
 * Subscribers, which closes the anonymous spam/flood vector. Staff-controlled
 * fields (status, Stripe references, timestamps, notes) carry field-level access
 * so a public submission can never set them.
 *
 * ── The rule that matters ───────────────────────────────────────────────────
 * A card donation is created `pending` when the Checkout Session is created and
 * is promoted to `succeeded` **only by a signature-verified Stripe webhook**.
 * The browser landing on the success URL proves nothing — anyone can type that
 * URL. The beforeChange hook below enforces this at the data layer, so the
 * guarantee does not depend on every future caller remembering it.
 *
 * ── Money ───────────────────────────────────────────────────────────────────
 * `amountMinor` is the canonical amount: an integer count of the currency's
 * minor unit, exactly what Stripe charged. `amount` is the major-unit decimal
 * kept in step with it for the admin list and the existing "Amount raised"
 * aggregation, and is derived by the hook below — never edited independently.
 *
 * `anonymous` controls only public *display*. Name and email are always
 * collected so a receipt can be sent and the gift acknowledged.
 */

/** Status values a Stripe payment may only reach through a verified webhook. */
const WEBHOOK_ONLY_STATUSES = new Set(['succeeded', 'refunded', 'disputed'])

export const Donations: CollectionConfig = {
  slug: 'donations',
  admin: {
    useAsTitle: 'donorName',
    group: 'Administration',
    defaultColumns: ['status', 'donorName', 'amount', 'currency', 'provider', 'reference', 'createdAt'],
    description: 'Donations and pledges received through the website.',
    listSearchableFields: ['donorName', 'donorEmail', 'reference', 'message', 'stripeSessionId', 'stripePaymentIntentId'],
    hidden: hideUnless('donations.view'),
    components: {
      beforeListTable: [
        '@/components/admin/donations/DonationsSummary#DonationsSummary',
        '@/components/admin/donations/DonationsGrouping#DonationsGrouping',
      ],
    },
  },
  access: {
    read: can('donations.view'),
    create: can('donations.manage'),
    update: can('donations.manage'),
    delete: can('donations.delete'),
  },
  hooks: {
    // Runs BEFORE field validation, which matters: `amount` is required but
    // read-only, so a staff member creating a donation by hand never types one.
    // Deriving it here means the required check sees the value the hook
    // computed rather than failing on an empty field.
    beforeValidate: [
      ({ data, operation, originalDoc }) => {
        if (!data) return data

        if (operation === 'create') {
          data.submittedAt = new Date().toISOString()
          if (!data.status) data.status = 'pending'
          if (!data.provider) data.provider = 'manual'
        }

        // Keep the display decimal in step with the canonical integer. Doing it
        // here rather than at each call site means no writer can leave the two
        // disagreeing — a ledger where the number shown differs from the number
        // charged is the one discrepancy nobody would forgive.
        const minor = data.amountMinor ?? originalDoc?.amountMinor
        const currency = data.currency ?? originalDoc?.currency ?? 'ERN'
        if (minor != null) {
          const exponent = currencyExponent(String(currency))
          data.amount = exponent === 0 ? Number(minor) : Number(minor) / 10 ** exponent
        }

        return data
      },
    ],
    beforeChange: [
      ({ data, originalDoc, req }) => {
        // A Stripe payment may only be marked paid, refunded or disputed by the
        // webhook handler, which sets this context flag after verifying the
        // signature against the raw body. An admin edit, a stray script or a
        // future server action cannot promote a card donation by hand.
        const provider = data.provider ?? originalDoc?.provider
        const nextStatus = data.status
        if (
          provider === 'stripe' &&
          nextStatus &&
          nextStatus !== originalDoc?.status &&
          WEBHOOK_ONLY_STATUSES.has(String(nextStatus)) &&
          req?.context?.stripeWebhook !== true
        ) {
          throw new Error(
            `[donations] status "${nextStatus}" on a Stripe donation may only be set by a verified webhook. ` +
              'If a payment is stuck, replay the event from the Stripe dashboard rather than editing the record.',
          )
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
        {
          name: 'donorEmail',
          type: 'email',
          required: true,
          // Donor contact details are the most sensitive thing here. Viewing the
          // ledger (donations.view) is a reporting need; reading a congregation's
          // email addresses is a separate, higher one.
          access: { read: canField('donations.manage') },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'amountMinor',
          type: 'number',
          required: true,
          min: 1,
          label: 'Amount (minor units)',
          access: { create: canField('donations.manage'), update: canField('donations.manage') },
          admin: {
            description: 'Canonical amount as an integer, e.g. 5000 = 50.00 USD. Set by the payment flow.',
            step: 1,
          },
        },
        {
          name: 'amount',
          type: 'number',
          required: true,
          min: 0,
          label: 'Amount',
          access: { update: () => false },
          admin: { readOnly: true, description: 'Display value, derived from the minor-unit amount.' },
        },
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
    {
      name: 'message',
      type: 'textarea',
      // A donor's message is written to the Eparchy, not to everyone with list
      // access. Same gate as the email address.
      access: { read: canField('donations.manage') },
      admin: { description: 'Optional message from the donor.' },
    },
    {
      name: 'anonymous',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Hide the donor’s name in public statistics and lists.' },
    },
    {
      name: 'locale',
      type: 'select',
      defaultValue: 'en',
      options: [
        { label: 'English', value: 'en' },
        { label: 'ትግርኛ (Tigrinya)', value: 'ti' },
      ],
      access: { update: canField('donations.manage') },
      admin: { position: 'sidebar', description: 'Language the donor gave in — receipts are sent in it.' },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      // Staff-only — a public submission cannot set or change this.
      access: { create: canField('donations.manage'), update: canField('donations.manage') },
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Succeeded', value: 'succeeded' },
        { label: 'Failed', value: 'failed' },
        { label: 'Refunded', value: 'refunded' },
        { label: 'Disputed', value: 'disputed' },
        // Retained for manual pledges staff abandon; not part of the card
        // lifecycle. Existing rows already use it.
        { label: 'Cancelled', value: 'cancelled' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Card donations are promoted only by a verified Stripe webhook.',
      },
    },
    {
      name: 'provider',
      type: 'select',
      defaultValue: 'manual',
      label: 'Method',
      access: { update: canField('donations.manage') },
      options: [
        { label: 'Manual transfer', value: 'manual' },
        { label: 'Stripe (card)', value: 'stripe' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'reference',
      type: 'text',
      index: true,
      // Generated server-side for every donation. The treasurer reconciles a
      // bank statement line against this, so it must exist from creation — its
      // absence is exactly what made the previous manual flow unusable.
      access: { create: canField('donations.manage'), update: canField('donations.manage') },
      admin: { position: 'sidebar', description: 'Reference the donor quotes on a transfer.' },
    },
    // ── Stripe references (webhook-written) ──────────────────────────────────
    {
      type: 'collapsible',
      label: 'Stripe references',
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'stripeSessionId',
          type: 'text',
          index: true,
          access: { create: canField('donations.manage'), update: canField('donations.manage') },
          admin: { description: 'Checkout Session id (cs_…).' },
        },
        {
          name: 'stripePaymentIntentId',
          type: 'text',
          index: true,
          access: { create: canField('donations.manage'), update: canField('donations.manage') },
          admin: { description: 'PaymentIntent id (pi_…) — search this in the Stripe dashboard.' },
        },
        {
          name: 'stripeChargeId',
          type: 'text',
          access: { create: canField('donations.manage'), update: canField('donations.manage') },
        },
        {
          name: 'stripeCustomerId',
          type: 'text',
          access: { create: canField('donations.manage'), update: canField('donations.manage') },
        },
        {
          name: 'stripeSubscriptionId',
          type: 'text',
          access: { create: canField('donations.manage'), update: canField('donations.manage') },
          admin: {
            description:
              'Reserved for recurring giving via Stripe Billing, which is not enabled yet — the column exists so switching it on later is additive.',
          },
        },
        {
          name: 'stripeEventId',
          type: 'text',
          access: { create: canField('donations.manage'), update: canField('donations.manage') },
          admin: { description: 'The last Stripe event applied to this record.' },
        },
        {
          name: 'refundedAmountMinor',
          type: 'number',
          min: 0,
          access: { create: canField('donations.manage'), update: canField('donations.manage') },
          admin: { description: 'Amount refunded, in minor units. Partial refunds are possible.' },
        },
        {
          name: 'failureReason',
          type: 'text',
          access: { create: canField('donations.manage'), update: canField('donations.manage') },
          admin: { description: 'Stripe’s decline reason. Never contains card details.' },
        },
      ],
    },
    {
      name: 'submittedAt',
      type: 'date',
      access: { create: canField('donations.manage'), update: canField('donations.manage') },
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'confirmedAt',
      type: 'date',
      access: { create: canField('donations.manage'), update: canField('donations.manage') },
      admin: { position: 'sidebar', readOnly: true, description: 'When the payment or transfer was confirmed.' },
    },
    {
      name: 'adminNotes',
      type: 'textarea',
      access: {
        create: canField('donations.manage'),
        update: canField('donations.manage'),
        read: canField('donations.manage'),
      },
      admin: { description: 'Internal notes (not visible to the donor).' },
    },
  ],
  timestamps: true,
}
