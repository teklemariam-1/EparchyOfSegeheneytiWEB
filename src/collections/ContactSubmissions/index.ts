import type { CollectionConfig } from 'payload'
import { isChanceryOrAbove } from '@/lib/permissions/collectionAccess'

export const ContactSubmissions: CollectionConfig = {
  slug: 'contact-submissions',
  admin: { useAsTitle: 'name', group: 'Administration' },
  access: {
    read: isChanceryOrAbove,
    create: () => true,
    update: isChanceryOrAbove,
    delete: isChanceryOrAbove,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'email', type: 'email', required: true },
    { name: 'subject', type: 'text', required: true },
    { name: 'message', type: 'textarea', required: true },
    { name: 'phone', type: 'text' },
    { name: 'status', type: 'select', options: ['new', 'read', 'replied', 'archived'], defaultValue: 'new', admin: { position: 'sidebar' } },
    { name: 'submittedAt', type: 'date', admin: { position: 'sidebar', readOnly: true } },
  ],
  timestamps: true,
}
