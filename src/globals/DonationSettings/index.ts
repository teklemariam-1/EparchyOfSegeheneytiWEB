import type { GlobalConfig } from 'payload'
import { isChanceryOrAbove } from '../../lib/permissions/collectionAccess'
import { superAdminOnly } from '../../lib/permissions/fieldAccess'
import { safeRevalidatePath, safeRevalidateTag } from '../../lib/payload/revalidate'
import { encrypt, isEncrypted, isMasked, mask } from '../../lib/crypto/fieldEncryption'

/**
 * Donation configuration.
 *
 * Two clearly separated blocks:
 *
 *  1. Public config (read: () => true) — everything the /donate page needs:
 *     the enable toggle, preset amounts, currencies, limits, one-time/recurring,
 *     and the donor-facing instructions text. Safe to expose.
 *
 *  2. Receiving account (super-admin only, ENCRYPTED at rest) — the canonical
 *     record of where funds are collected. The account number is AES-256-GCM
 *     encrypted (never stored plaintext), masked to the last 4 in the admin UI,
 *     and readable only by super-admins. It is NOT sent to the public API. What
 *     donors see for a manual transfer is the separate, admin-curated
 *     `manualInstructions` text — so staff decide exactly what account detail (if
 *     any) is published, and the stored number stays protected.
 *
 * Payment approach: "manual transfer + record" now, with a `provider` field so a
 * PSP (e.g. Stripe) can be switched on later without a schema change. Stripe is
 * not available to an Eritrea-registered entity, so live card processing is
 * stubbed behind the toggle rather than built.
 */
export const DonationSettings: GlobalConfig = {
  slug: 'donation-settings',
  admin: {
    group: 'Settings',
    description: 'Enable donations, set amounts/currency, donor-facing text, and the (encrypted) receiving account.',
  },
  access: {
    read: () => true, // public config is filtered field-by-field below
    update: isChanceryOrAbove,
  },
  hooks: {
    afterChange: [
      () => {
        safeRevalidateTag('globals')
        safeRevalidateTag('donation-settings')
        safeRevalidatePath('/donate')
      },
    ],
    beforeChange: [
      ({ data, req }) => {
        // Audit: record who last changed settings and when.
        if (req?.user?.id) {
          data.lastChangedBy = req.user.id
          data.lastChangedAt = new Date().toISOString()
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'enabled',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Master switch. When off, the donate page and CTAs are hidden.' },
    },
    {
      name: 'provider',
      type: 'select',
      defaultValue: 'manual',
      options: [
        { label: 'Manual transfer (record pledges)', value: 'manual' },
        { label: 'Stripe (online card — requires keys, not available in Eritrea)', value: 'stripe' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Manual transfer is the working flow. Stripe is a placeholder for later.',
      },
    },
    // ── Amounts & currency (public) ──────────────────────────────────────────
    {
      name: 'presetAmounts',
      type: 'array',
      label: 'Preset amounts',
      maxRows: 8,
      admin: { description: 'Quick-pick amounts shown as buttons.' },
      fields: [{ name: 'amount', type: 'number', required: true, min: 1 }],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'defaultCurrency',
          type: 'text',
          defaultValue: 'ERN',
          admin: { description: 'ISO code, e.g. ERN, USD, EUR.', width: '33%' },
        },
        { name: 'minAmount', type: 'number', defaultValue: 1, min: 0, admin: { width: '33%' } },
        { name: 'maxAmount', type: 'number', admin: { description: 'Optional cap.', width: '33%' } },
      ],
    },
    {
      name: 'currencies',
      type: 'array',
      label: 'Allowed currencies',
      admin: { description: 'Currencies a donor may choose. Leave empty to use only the default.' },
      fields: [
        { name: 'code', type: 'text', required: true, admin: { description: 'ISO code, e.g. USD.' } },
        { name: 'label', type: 'text', admin: { description: 'Optional display name.' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'allowCustomAmount', type: 'checkbox', defaultValue: true },
        { name: 'allowRecurring', type: 'checkbox', defaultValue: true, admin: { description: 'Offer monthly giving.' } },
      ],
    },
    // ── Donor-facing text (public, localized) ────────────────────────────────
    {
      name: 'intro',
      type: 'textarea',
      localized: true,
      admin: { description: 'Short intro shown at the top of the donate page.' },
    },
    {
      name: 'manualInstructions',
      type: 'textarea',
      localized: true,
      admin: {
        description:
          'Shown to donors explaining how to complete a manual transfer (bank name, public account/till, reference to quote). You decide what account detail to publish here — the stored account number below stays private.',
      },
    },
    {
      name: 'thankYou',
      type: 'textarea',
      localized: true,
      admin: { description: 'Confirmation message shown after a donation is recorded.' },
    },
    // ── Receiving account (super-admin only, ENCRYPTED) ──────────────────────
    {
      name: 'receivingAccount',
      type: 'group',
      label: 'Receiving account (private)',
      access: { read: superAdminOnly, create: superAdminOnly, update: superAdminOnly },
      admin: {
        description:
          'Internal record of where funds are collected. Encrypted at rest, masked here, never sent to the public site.',
      },
      fields: [
        { name: 'accountHolder', type: 'text' },
        { name: 'bankOrProvider', type: 'text', admin: { description: 'Bank or payment provider name.' } },
        {
          name: 'accountNumber',
          type: 'text',
          admin: {
            description: 'Stored encrypted. Shows only the last 4 digits; type a new number to replace it.',
          },
          hooks: {
            // Encrypt on the way in (unless it is the masked value being re-saved
            // unchanged, in which case keep the stored ciphertext).
            beforeChange: [
              ({ value, originalDoc }) => {
                const original = originalDoc?.receivingAccount?.accountNumber
                if (value == null || value === '') return value
                if (isMasked(value)) return original ?? '' // unchanged masked value
                if (isEncrypted(value)) return value // already ciphertext
                return encrypt(String(value))
              },
            ],
            // Never expose the real number — always return a masked form.
            afterRead: [({ value }) => (value ? mask(String(value)) : value)],
          },
        },
        { name: 'referenceNote', type: 'text', admin: { description: 'Reference/memo to quote on transfers.' } },
      ],
    },
    // ── Stripe (placeholder; secret key stays in env, never stored) ──────────
    {
      name: 'stripePublishableKey',
      type: 'text',
      access: { read: superAdminOnly },
      admin: {
        position: 'sidebar',
        condition: (data) => data?.provider === 'stripe',
        description: 'Publishable key only. The secret key lives in STRIPE_SECRET_KEY (env), never in the DB.',
      },
    },
    // ── Audit (read-only) ────────────────────────────────────────────────────
    {
      name: 'lastChangedBy',
      type: 'relationship',
      relationTo: 'users',
      access: { update: () => false },
      admin: { position: 'sidebar', readOnly: true, description: 'Who last changed donation settings.' },
    },
    {
      name: 'lastChangedAt',
      type: 'date',
      access: { update: () => false },
      admin: { position: 'sidebar', readOnly: true },
    },
  ],
}
