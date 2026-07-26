import type { GlobalConfig } from 'payload'
import { safeRevalidatePath, safeRevalidateTag } from '../../lib/payload/revalidate'
import { can, canField } from '../../lib/permissions/access'
import { encrypt, isEncrypted, isMasked, mask } from '../../lib/crypto/fieldEncryption'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  admin: {
    group: 'Settings',
    description: 'Global site identity, contact info, and metadata defaults.',
  },
  access: { read: () => true, update: can('globals.site-settings.edit') },
  hooks: {
    afterChange: [
      () => {
        safeRevalidateTag('globals')
        safeRevalidatePath('/', 'layout')
      },
    ],
  },
  fields: [
    {
      name: 'siteName',
      type: 'text',
      required: true,
      defaultValue: 'Eparchy of Segeneyti',
    },
    {
      name: 'tagline',
      type: 'text',
      localized: true,
      admin: { description: 'Short tagline displayed in the browser tab and meta tags.' },
    },
    {
      name: 'siteDescription',
      type: 'textarea',
      localized: true,
      admin: { description: 'Default meta description (160 chars max).' },
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Main site logo. Recommended: SVG or PNG with transparent background.' },
    },
    {
      name: 'logoDark',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Dark variant of the logo (used on light backgrounds).' },
    },
    {
      name: 'showHeroLogo',
      type: 'checkbox',
      defaultValue: true,
      label: 'Show logo on homepage banner',
      admin: {
        description:
          'Display the site logo as a round emblem in the top-right of the homepage hero banner. Uses the Main site logo above.',
      },
    },
    {
      name: 'favicon',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Favicon image (ICO or 32×32 PNG).' },
    },
    {
      name: 'defaultOgImage',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Default Open Graph image (1200×630px) for social sharing.' },
    },
    {
      name: 'contact',
      type: 'group',
      label: 'Contact Information',
      fields: [
        { name: 'email', type: 'email' },
        { name: 'phone', type: 'text' },
        { name: 'fax', type: 'text' },
        {
          name: 'address',
          type: 'group',
          fields: [
            { name: 'street', type: 'text' },
            { name: 'city', type: 'text', defaultValue: 'Segeneyti' },
            { name: 'region', type: 'text', defaultValue: 'Southern Debub' },
            { name: 'country', type: 'text', defaultValue: 'Eritrea' },
            { name: 'poBox', type: 'text' },
          ],
        },
        { name: 'mapEmbedUrl', type: 'text', admin: { description: 'Google Maps embed URL for the contact page map.' } },
      ],
    },
    {
      name: 'offices',
      type: 'array',
      label: 'Office Contacts',
      admin: {
        description: 'Additional offices shown on the Contact page (e.g. Bishop\'s Secretariat, Caritas). The Chancery card is derived from Contact Information above.',
      },
      fields: [
        { name: 'name', type: 'text', required: true, localized: true },
        { name: 'role', type: 'text', localized: true, admin: { description: 'Short description of what this office handles.' } },
        { name: 'address', type: 'text', localized: true },
        { name: 'phone', type: 'text' },
        { name: 'email', type: 'email' },
        { name: 'hours', type: 'text', localized: true },
      ],
    },
    {
      name: 'socialLinks',
      type: 'group',
      label: 'Social Media',
      fields: [
        { name: 'facebook', type: 'text', admin: { description: 'Full Facebook page URL.' } },
        { name: 'youtube', type: 'text', admin: { description: 'Full YouTube channel URL.' } },
        { name: 'twitter', type: 'text', admin: { description: 'Full Twitter/X profile URL.' } },
        { name: 'telegram', type: 'text', admin: { description: 'Telegram channel link.' } },
        { name: 'instagram', type: 'text' },
      ],
    },
    {
      name: 'analytics',
      type: 'group',
      label: 'Analytics',
      fields: [
        { name: 'googleAnalyticsId', type: 'text', admin: { description: 'GA4 Measurement ID (G-XXXXXXXXXX).' } },
        { name: 'googleTagManagerId', type: 'text', admin: { description: 'GTM Container ID (GTM-XXXXXXX).' } },
      ],
    },
    // ── Bot protection ────────────────────────────────────────────────────────
    {
      name: 'security',
      type: 'group',
      label: 'Bot protection',
      admin: {
        description:
          'Cloudflare Turnstile challenge on the contact, newsletter, and donation forms. Free, and unlike reCAPTCHA it does not report your visitors to Google. Leave it off until the keys are filled in.',
      },
      fields: [
        {
          name: 'turnstileEnabled',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description:
              'Turn on to challenge form submissions. Switch off at any time if visitors on slow connections have trouble — the honeypot, timing check, and rate limits stay active either way.',
          },
        },
        {
          name: 'turnstileSiteKey',
          type: 'text',
          admin: {
            description: 'Public key from the Cloudflare dashboard. Safe to publish — it is rendered in the page.',
            condition: (_, siblingData) => Boolean(siblingData?.turnstileEnabled),
          },
        },
        {
          name: 'turnstileSecretKey',
          type: 'text',
          // This global is PUBLICLY readable (read: () => true above), so the
          // secret needs its own field-level gate — without it the key would be
          // served to anyone requesting /api/globals/site-settings.
          access: {
            read: canField('globals.site-settings.edit'),
            update: canField('globals.site-settings.edit'),
          },
          admin: {
            description: 'Secret key from the Cloudflare dashboard. Stored encrypted; shows only the last 4 characters.',
            condition: (_, siblingData) => Boolean(siblingData?.turnstileEnabled),
          },
          hooks: {
            // Same pattern as the donation receiving account: encrypt on the way
            // in, and never hand the plaintext back out — re-saving the masked
            // placeholder keeps the stored ciphertext rather than overwriting it
            // with asterisks.
            beforeChange: [
              ({ value, originalDoc }) => {
                const original = originalDoc?.security?.turnstileSecretKey
                if (value == null || value === '') return value
                if (isMasked(value)) return original ?? ''
                if (isEncrypted(value)) return value
                return encrypt(String(value))
              },
            ],
            // Masked for every reader EXCEPT the server-side verifier, which
            // opts in explicitly via req.context. Without that escape hatch the
            // only copy of the key would be one nobody — including us — can use.
            afterRead: [
              ({ value, req }) => {
                if ((req?.context as { revealSecrets?: boolean } | undefined)?.revealSecrets) return value
                return value ? mask(String(value)) : value
              },
            ],
          },
        },
      ],
    },
    {
      name: 'maintenanceMode',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Enable maintenance mode to show a holding page to visitors.' },
      access: {
        update: canField('system.maintenance-mode'),
      },
    },
  ],
}
