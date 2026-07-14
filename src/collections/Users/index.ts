import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'
import { isSuperAdmin, isRoleOneOf } from '../../lib/permissions/collectionAccess'
import { superAdminOnly, elevatedOnly } from '../../lib/permissions/fieldAccess'

/** Minimum password policy: ≥8 chars with upper, lower, and a number. */
function assertStrongPassword(password: unknown): void {
  if (typeof password !== 'string' || password.length === 0) return // not being set/changed
  const strong =
    password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password)
  if (!strong) {
    throw new APIError(
      'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a number.',
      400,
    )
  }
}

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    // Brute-force protection: lock the account after repeated failures.
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000, // 15 minutes
    tokenExpiration: 2 * 60 * 60, // 2 hours (seconds)
  },
  hooks: {
    // Enforce password complexity server-side — the admin login UI checks this
    // too, but a direct API call to /api/users would otherwise bypass it.
    beforeValidate: [
      ({ data }) => {
        assertStrongPassword((data as { password?: unknown } | undefined)?.password)
        return data
      },
    ],
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'firstName', 'lastName', 'role', 'assignedParish'],
    group: 'Administration',
    description: 'CMS users and their editorial roles.',
  },
  access: {
    read: isRoleOneOf('super-admin', 'chancery-editor'),
    create: isSuperAdmin,
    update: ({ req }) => {
      const user = req.user as { id: string; role: string } | null
      if (!user) return false
      if (user.role === 'super-admin') return true
      return { id: { equals: user.id } }
    },
    delete: isSuperAdmin,
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'firstName', type: 'text', required: true },
        { name: 'lastName', type: 'text', required: true },
      ],
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'parish-editor',
      options: [
        { label: 'Super Admin', value: 'super-admin' },
        { label: 'Chancery Editor', value: 'chancery-editor' },
        { label: 'Parish Editor', value: 'parish-editor' },
        { label: 'Youth Editor', value: 'youth-editor' },
        { label: 'Catechist Editor', value: 'catechist-editor' },
        { label: 'Media Editor', value: 'media-editor' },
      ],
      // SECURITY: role must never be self-editable — otherwise any editor could
      // promote themselves to super-admin. Only super-admins may change roles.
      access: { update: superAdminOnly },
      admin: {
        position: 'sidebar',
        description: 'Determines which content areas this user can edit.',
      },
    },
    {
      name: 'assignedParish',
      type: 'relationship',
      relationTo: 'parishes',
      // SECURITY: only elevated roles may (re)assign a user's parish, so a
      // parish-editor cannot edit their own record to escape their scope.
      access: { update: elevatedOnly },
      admin: {
        position: 'sidebar',
        description: 'Required for parish-editor role — limits edit scope to this parish.',
        condition: (data) => data?.role === 'parish-editor',
      },
    },
    {
      name: 'profilePhoto',
      type: 'upload',
      relationTo: 'media',
      admin: { position: 'sidebar' },
    },
  ],
  timestamps: true,
}
