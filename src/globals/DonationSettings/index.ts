import type { GlobalConfig } from 'payload'
import { can, canField } from '../../lib/permissions/access'
import { safeRevalidatePath, safeRevalidateTag } from '../../lib/payload/revalidate'
import { encrypt, isEncrypted, isMasked, mask } from '../../lib/crypto/fieldEncryption'
import { writeAudit } from '../../lib/permissions/audit'
import type { AuthUser } from '../../lib/permissions/resolve'

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
 *     `publicTransferDetails` group — so staff decide exactly what account
 *     detail (if any) is published, and the stored number stays protected.
 *
 * ── Two payment methods, both live ─────────────────────────────────────────
 * `provider` selects which methods the donate page offers: manual transfer,
 * Stripe card, or both. It is NOT an either/or in practice — donors inside
 * Eritrea cannot use cards at all (no issuer, and ERN is not a currency Stripe
 * can charge), so manual transfer can never be switched off. "Both" is the
 * intended setting once a Stripe account exists.
 *
 * ── Stripe entity ──────────────────────────────────────────────────────────
 * Stripe does not support Eritrea as a business or payout country. A live
 * account requires a legal entity registered elsewhere (a diaspora support
 * association, a partner diocese, or a fiscal sponsor) collecting on the
 * Eparchy's behalf. Its country, settlement currency and payout schedule are
 * properties of STRIPE_SECRET_KEY and of the settings below — nothing about
 * that entity is hardcoded, so it can be changed without a code change.
 */
/**
 * Fields whose values must never reach the audit log — only the fact they
 * changed. `publicTransferDetails` is deliberately absent: it is published on
 * the website, so logging a change to it is a feature, not a leak.
 */
const SECRET_FIELDS = new Set(['receivingAccount'])

/**
 * Names the top-level fields that changed, with before → after values for the
 * ordinary ones and a bare "changed" for the secret-bearing ones. Bookkeeping
 * fields the beforeChange hook writes itself are skipped so every save does not
 * log a change.
 */
function summarizeChanges(prev: unknown, next: unknown): string {
  const before = (prev ?? {}) as Record<string, unknown>
  const after = (next ?? {}) as Record<string, unknown>
  const skip = new Set(['lastChangedBy', 'lastChangedAt', 'updatedAt', 'createdAt', 'id', 'globalType'])
  const changed: string[] = []

  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (skip.has(key)) continue
    if (JSON.stringify(before[key]) === JSON.stringify(after[key])) continue
    if (SECRET_FIELDS.has(key)) {
      changed.push(`${key} changed`)
    } else if (typeof after[key] === 'object' && after[key] !== null) {
      changed.push(`${key} changed`)
    } else {
      changed.push(`${key}: ${String(before[key] ?? '—')} → ${String(after[key] ?? '—')}`)
    }
  }
  return changed.length ? changed.join('; ') : 'saved with no field changes'
}

export const DonationSettings: GlobalConfig = {
  slug: 'donation-settings',
  admin: {
    group: 'Settings',
    description: 'Enable donations, set amounts/currency, donor-facing text, and the (encrypted) receiving account.',
  },
  access: {
    read: () => true, // public config is filtered field-by-field below
    update: can('globals.donation-settings.edit'),
  },
  hooks: {
    afterChange: [
      ({ doc, previousDoc, req }) => {
        safeRevalidateTag('globals')
        safeRevalidateTag('donation-settings')
        safeRevalidatePath('/donate')
        void writeAudit(req.payload, {
          action: 'donation-settings.updated',
          actor: req.user as AuthUser | null,
          targetCollection: 'donation-settings',
          summary: summarizeChanges(previousDoc, doc),
          req,
        })
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
    // Reports what the SERVER has, since Stripe credentials are environment
    // variables rather than fields. Without this, choosing a card method below
    // appears to do nothing and there is no way to tell why.
    {
      name: 'stripeStatus',
      type: 'ui',
      admin: {
        components: { Field: '@/components/admin/donations/StripeStatus#StripeStatus' },
      },
    },
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
      label: 'Payment methods offered',
      options: [
        { label: 'Manual transfer only', value: 'manual' },
        { label: 'Card only (Stripe)', value: 'stripe' },
        { label: 'Both — manual transfer and card', value: 'both' },
      ],
      admin: {
        position: 'sidebar',
        description:
          'Manual transfer is the only method available to donors inside Eritrea, so "Card only" hides giving from them entirely. Card requires STRIPE_SECRET_KEY on the server; without it the card option is suppressed automatically.',
      },
    },
    {
      name: 'preferManualForCountries',
      type: 'text',
      defaultValue: 'ER',
      admin: {
        position: 'sidebar',
        description:
          'Comma-separated ISO country codes whose visitors see manual transfer first. Cards are unusable in Eritrea, so ER is the default.',
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
    // ── Manual transfer: what donors are actually told ───────────────────────
    //
    // These are structured rather than one free-text blob because the old blob
    // was optional, frequently empty, and had no place for the reference code —
    // so a donor could finish the form and be shown nothing about how to pay.
    // The page now renders a labelled account block plus the donor's reference,
    // and warns staff in the admin when the block is empty.
    {
      name: 'publicTransferDetails',
      type: 'group',
      label: 'Transfer details shown to donors (public)',
      admin: {
        description:
          'Published verbatim on the donate page and in the pledge email. Fill in at least an account name and number, or donors are told to contact the chancery instead. The private receiving account below is never published.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'accountHolder', type: 'text', label: 'Account name' },
            { name: 'bankName', type: 'text', label: 'Bank / provider' },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'accountNumber',
              type: 'text',
              label: 'Account number to publish',
              admin: { description: 'Exactly as a donor must type it. Publishing this is a deliberate choice.' },
            },
            { name: 'swift', type: 'text', label: 'SWIFT / BIC', admin: { description: 'For transfers from abroad.' } },
          ],
        },
      ],
    },
    {
      name: 'manualInstructions',
      type: 'textarea',
      localized: true,
      label: 'Extra transfer notes',
      admin: {
        description:
          'Optional notes shown under the account block (branch, opening hours, mobile-money steps). The account details and the reference code are rendered from the fields above — do not repeat them here.',
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
      access: { read: canField('donations.config'), create: canField('donations.config'), update: canField('donations.config') },
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
    // ── Stripe (card) ────────────────────────────────────────────────────────
    //
    // No key material lives here. STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET and
    // NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY are env vars: rotating a compromised
    // key must not require a database write, and a secret in a globals row is a
    // secret in every backup.
    {
      name: 'stripeCurrencies',
      type: 'array',
      label: 'Currencies accepted by card',
      admin: {
        condition: (data) => data?.provider === 'stripe' || data?.provider === 'both',
        description:
          'Separate from the list above because Stripe cannot charge in ERN. A donor who picks a currency that is not here is offered manual transfer only. Leave empty to fall back to USD.',
      },
      fields: [
        { name: 'code', type: 'text', required: true, admin: { description: 'ISO code Stripe supports, e.g. USD, EUR, GBP.' } },
        { name: 'label', type: 'text', admin: { description: 'Optional display name.' } },
      ],
    },
    {
      name: 'stripeStatementDescriptor',
      type: 'text',
      maxLength: 22,
      admin: {
        condition: (data) => data?.provider === 'stripe' || data?.provider === 'both',
        description:
          'What appears on the donor’s card statement (max 22 chars). If the Stripe account is held by a partner entity, this is how a donor recognises the charge — leave empty to use the Stripe account default.',
      },
    },
    {
      name: 'stripeAccountNotice',
      type: 'textarea',
      localized: true,
      admin: {
        condition: (data) => data?.provider === 'stripe' || data?.provider === 'both',
        description:
          'Shown beside the card option. Use it to disclose which legal entity receives card gifts on the Eparchy’s behalf, since that name — not the Eparchy’s — appears on the Stripe page and the card statement.',
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
