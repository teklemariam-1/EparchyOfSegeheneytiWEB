import type { CollectionConfig } from 'payload'
import { can, hideUnless } from '../../lib/permissions/access'
import { hasPermission, type AuthUser } from '../../lib/permissions/resolve'
import { safeRevalidatePath, safeRevalidateTag } from '../../lib/payload/revalidate'

export const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    staticDir: 'media',
    imageSizes: [
      { name: 'thumbnail', width: 400, height: 300, position: 'centre' },
      { name: 'card', width: 800, height: 600, position: 'centre' },
      { name: 'hero', width: 1920, height: 1080, position: 'centre' },
      { name: 'og', width: 1200, height: 630, position: 'centre' },
    ],
    // Render the admin list thumbnail through Next's image optimizer, from the
    // ORIGINAL upload. This serves a small, same-origin (`/_next/image`) image,
    // so it displays regardless of the Blob-host CSP or whether a resized
    // `thumbnail` variant was produced — the failure mode that showed every
    // image as a black box. Non-images return null and keep the file icon.
    adminThumbnail: ({ doc }) => {
      const mimeType = (doc as { mimeType?: unknown }).mimeType
      const url = (doc as { url?: unknown }).url
      if (typeof mimeType !== 'string' || !mimeType.startsWith('image/')) return null
      if (typeof url !== 'string' || !url) return null
      return `/_next/image?url=${encodeURIComponent(url)}&w=256&q=70`
    },
    mimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/svg+xml',
      'application/pdf',
      // Downloadable resources (Android apps, archives). Some browsers report
      // an .apk as octet-stream, so both are accepted.
      'application/vnd.android.package-archive',
      'application/octet-stream',
      'application/zip',
    ],
  },
  admin: {
    group: 'Content',
    useAsTitle: 'filename',
    description: 'Images, documents, and other media assets.',
    components: {
      // View-style buttons (Details / Large / Medium / Small) above the list;
      // the grid styling lives in admin/custom.css under [data-media-view].
      beforeListTable: ['@/components/admin/MediaViewToggle#MediaViewToggle'],
    },
  },
  access: {
    // Public visitors and editors without media.view-restricted can only read
    // public assets. Restricted assets (e.g. files attached to restricted archive
    // documents) are hidden so they cannot be fetched by their direct media URL.
    read: ({ req }) => {
      if (hasPermission(req.user as AuthUser | null, 'media.view-restricted')) return true
      // Treat null/missing accessLevel as public (safe default for existing assets).
      return {
        or: [
          { accessLevel: { equals: 'public' } },
          { accessLevel: { exists: false } },
        ],
      }
    },
    // Any authenticated editor may upload/update media (all presets grant media.upload).
    create: can('media.upload'),
    update: can('media.upload'),
    delete: can('media.delete'),
  },
  hooks: {
    afterChange: [
      () => {
        safeRevalidateTag('media')
        safeRevalidatePath('/media')
      },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      localized: true,
      admin: {
        description: 'Descriptive alt text for accessibility and SEO.',
      },
    },
    {
      name: 'caption',
      type: 'text',
      localized: true,
    },
    {
      name: 'credit',
      type: 'text',
      admin: {
        description: 'Photo credit or source attribution.',
      },
    },
    {
      name: 'category',
      type: 'select',
      options: [
        { label: 'General', value: 'general' },
        { label: 'Event Photo', value: 'event' },
        { label: 'Parish Photo', value: 'parish' },
        { label: 'Bishop / Clergy', value: 'clergy' },
        { label: 'Document (PDF)', value: 'document' },
      ],
      defaultValue: 'general',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'accessLevel',
      type: 'select',
      required: true,
      defaultValue: 'public',
      options: [
        { label: 'Public', value: 'public' },
        { label: 'Restricted (authenticated only)', value: 'restricted' },
      ],
      admin: {
        position: 'sidebar',
        description:
          'Restricted assets are hidden from public visitors. Set automatically for files attached to restricted archive documents.',
      },
    },
  ],
  timestamps: true,
}
