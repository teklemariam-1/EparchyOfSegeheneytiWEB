import type { CollectionConfig } from 'payload'
import { isRoleOneOf, isAnyEditor } from '../../lib/permissions/collectionAccess'
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
    adminThumbnail: 'thumbnail',
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
  },
  access: {
    // Public visitors and non-elevated editors can only read public assets.
    // Restricted assets (e.g. files attached to restricted archive documents)
    // are hidden so they cannot be fetched by their direct media URL/API.
    read: ({ req }) => {
      const user = req.user as { role?: string } | null
      if (user && ['super-admin', 'chancery-editor', 'media-editor'].includes(user.role ?? '')) {
        return true
      }
      // Treat null/missing accessLevel as public (safe default for existing assets).
      return {
        or: [
          { accessLevel: { equals: 'public' } },
          { accessLevel: { exists: false } },
        ],
      }
    },
    create: isAnyEditor,
    update: isAnyEditor,
    delete: isRoleOneOf('super-admin', 'chancery-editor', 'media-editor'),
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
