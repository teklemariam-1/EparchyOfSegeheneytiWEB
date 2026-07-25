import type { CollectionConfig } from 'payload'
import { can, hideUnless } from '../../lib/permissions/access'

/**
 * Immutable audit trail for sensitive actions — user invitations, role and
 * permission changes, and donation-settings edits.
 *
 * Read-only in the admin (no create/update/delete access for anyone); entries
 * are written exclusively from collection hooks via `overrideAccess`. Only
 * holders of `audit-log.view` (super-admin by default) may read it. Never store
 * secrets or decrypted account details here — only a human-readable summary.
 */
export const AuditLog: CollectionConfig = {
  slug: 'audit-log',
  admin: {
    hidden: hideUnless('audit-log.view'),
    useAsTitle: 'action',
    group: 'Administration',
    defaultColumns: ['action', 'actorEmail', 'targetCollection', 'targetId', 'createdAt'],
    description: 'Immutable record of sensitive administrative actions.',
    listSearchableFields: ['action', 'actorEmail', 'targetCollection', 'summary'],
  },
  access: {
    read: can('audit-log.view'),
    // Written only by server-side hooks (overrideAccess). Never editable by hand.
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [
    {
      name: 'action',
      type: 'text',
      required: true,
      admin: { description: 'e.g. user.created, user.permissions-changed, donation-settings.updated.' },
    },
    { name: 'actor', type: 'relationship', relationTo: 'users', admin: { description: 'Who performed the action.' } },
    { name: 'actorEmail', type: 'text', admin: { description: 'Actor email snapshot (survives user deletion).' } },
    { name: 'targetCollection', type: 'text' },
    { name: 'targetId', type: 'text' },
    { name: 'summary', type: 'textarea', admin: { description: 'Human-readable before/after summary. No secrets.' } },
    { name: 'ip', type: 'text' },
  ],
  timestamps: true,
}
