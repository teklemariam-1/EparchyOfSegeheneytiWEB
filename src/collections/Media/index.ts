import type { CollectionConfig } from 'payload'
import { isRoleOneOf, isAnyEditor } from '@/lib/permissions/collectionAccess'

export const Media: CollectionConfig = {
  slug: 'media',
  upload: true,
  admin: {
    group: 'Content',
    useAsTitle: 'filename',
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
      admin: {
        description: 'Descriptive alt text for accessibility and SEO.',
      },
    },
    {
      name: 'caption',
      type: 'text',
    },
    {
      name: 'credit',
      type: 'text',
      admin: {
        description: 'Photo credit or source.',
      },
    },
  ],
}
