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
 *     `manualInstructions` text — so staff decide exactly what account detail (if
 *     any) is published, and the stored number stays protected.
 *
 * Payment approach: "manual transfer + record" now, with a `provider` field so a
 * PSP (e.g. Stripe) can be switched on later without a schema change. Stripe is
 * not available to an Eritrea-registered entity, so live card processing is
 * stubbed behind the toggle rather than built.
 */
/** Fields whose values must never reach the audit log — only the fact they changed. */
const SECRET_FIELDS = new Set(['receivingAccount', 'stripePublishableKey'])

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
    // ── Stripe (placeholder; secret key stays in env, never stored) ──────────
    {
      name: 'stripePublishableKey',
      type: 'text',
      // Incidental fix: add an update gate so a lower-privileged editor cannot
      // write the key even though the global's update permission is broader.
      access: { read: canField('donations.config'), update: canField('donations.config') },
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
