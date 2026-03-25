import type { CollectionConfig } from 'payload'
import { isRoleOneOf, isAnyEditor } from '../../lib/permissions/collectionAccess'

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
    ],
  },
  admin: {
    group: 'Content',
    useAsTitle: 'filename',
    description: 'Images, documents, and other media assets.',
  },
  access: {
    read: () => true,
    create: isAnyEditor,
    update: isAnyEditor,
    delete: isRoleOneOf('super-admin', 'chancery-editor', 'media-editor'),
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
  ],
  timestamps: true,
}
