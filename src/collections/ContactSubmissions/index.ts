import type { CollectionConfig } from 'payload'
import { isChanceryOrAbove, isSuperAdmin } from '../../lib/permissions/collectionAccess'
import { elevatedOnly } from '../../lib/permissions/fieldAccess'

export const ContactSubmissions: CollectionConfig = {
  slug: 'contact-submissions',
  admin: {
    useAsTitle: 'name',
    group: 'Administration',
    defaultColumns: ['name', 'email', 'subject', 'status', 'createdAt'],
    description: 'Messages submitted via the public contact form.',
  },
  access: {
    read: isChanceryOrAbove,
    // No public REST create — the website form submits through a trusted server
    // action (overrideAccess), so the anonymous /api/contact-submissions POST
    // vector (spam/DB-flood) is closed entirely. Staff can still create in-admin.
    create: isChanceryOrAbove,
    update: isChanceryOrAbove,
    delete: isSuperAdmin,
  },
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        if (operation === 'create') {
          // Server-controlled fields — never trust client input for these.
          data.submittedAt = new Date().toISOString()
          data.status = 'new'
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      type: 'row',
      fields: [
        { name: 'email', type: 'email', required: true },
        { name: 'phone', type: 'text' },
      ],
    },
    {
      name: 'subject',
      type: 'text',
      required: true,
    },
    {
      name: 'message',
      type: 'textarea',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'new',
      // Only staff may set/change status — a public form submission cannot.
      access: { create: elevatedOnly, update: elevatedOnly },
      options: [
        { label: 'New', value: 'new' },
        { label: 'Read', value: 'read' },
        { label: 'Replied', value: 'replied' },
        { label: 'Archived', value: 'archived' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'submittedAt',
      type: 'date',
      // Server-stamped in beforeChange; never writable via the public API.
      access: { create: elevatedOnly, update: elevatedOnly },
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Timestamp when this message was submitted.',
      },
    },
    {
      name: 'adminNotes',
      type: 'textarea',
      // Internal-only — must not be settable by the public submitter.
      access: { create: elevatedOnly, update: elevatedOnly, read: elevatedOnly },
      admin: {
        description: 'Internal notes (not visible to submitter).',
      },
    },
  ],
  timestamps: true,
}
