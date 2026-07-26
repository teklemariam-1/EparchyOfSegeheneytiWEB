import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'
import { can, canField, hideUnless } from '../../lib/permissions/access'
import { PERMISSIONS, permissionLabel } from '../../lib/permissions/permissions'
import { hasPermission, type AuthUser } from '../../lib/permissions/resolve'
import {
  guardUserBeforeChange,
  guardUserBeforeDelete,
  auditAndInviteUserAfterChange,
  rejectInactiveLogin,
} from '../../lib/permissions/userGuards'

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

/**
 * Options for the override pickers, in catalog order — which groups them by area
 * (content, then taxonomies, media, administration, globals) rather than
 * alphabetically, so related permissions sit together in the list. The value is
 * always the raw catalog string the resolver checks; only the label is dressed up.
 */
const PERMISSION_OPTIONS = PERMISSIONS.map((p) => ({ label: permissionLabel(p), value: p }))

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    // Brute-force protection: lock the account after repeated failures. This
    // protects ONE account; the per-client limit in lib/security/authGuard is
    // what stops one password being sprayed across many accounts.
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000, // 15 minutes
    tokenExpiration: 2 * 60 * 60, // 2 hours (seconds)
    // API keys are not used anywhere; leaving the default off means no user can
    // hold a long-lived bearer credential that bypasses login entirely.
    useAPIKey: false,
    // Payload's defaults already set httpOnly and path; these are pinned
    // explicitly so a future config change cannot quietly weaken them.
    cookies: {
      // Never sent over plain HTTP in production. Left off locally so the admin
      // still works on http://localhost.
      secure: process.env.NODE_ENV === 'production',
      // 'Lax' rather than 'Strict': the admin relies on top-level navigations
      // back to /admin after login and after a password-reset link, which
      // 'Strict' would strip the cookie from, locking users out of their own
      // reset email.
      sameSite: 'Lax',
    },
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
    beforeLogin: [rejectInactiveLogin],
    beforeChange: [guardUserBeforeChange],
    beforeDelete: [guardUserBeforeDelete],
    afterChange: [auditAndInviteUserAfterChange],
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'firstName', 'lastName', 'role', 'status', 'assignedParish'],
    group: 'Administration',
    description: 'CMS users, their roles, and any per-user permission overrides.',
    hidden: hideUnless('users.view'),
  },
  access: {
    // Everyone may read their own record — the admin account page needs it —
    // and `users.view` holders may read all of them.
    read: ({ req }) => {
      const user = req.user as AuthUser | null
      if (!user) return false
      if (hasPermission(user, 'users.view')) return true
      return { id: { equals: user.id } }
    },
    create: can('users.manage'),
    // Editing other users requires `users.manage`; everyone else is confined to
    // their own record, where field access + the beforeChange guard keep role,
    // permissions, and status out of reach.
    update: ({ req }) => {
      const user = req.user as AuthUser | null
      if (!user) return false
      if (hasPermission(user, 'users.manage')) return true
      return { id: { equals: user.id } }
    },
    delete: can('users.manage'),
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
      // promote themselves to super-admin. `users.manage` holders only, and the
      // beforeChange guard blocks even them from editing their own role.
      access: { update: canField('users.manage') },
      admin: {
        position: 'sidebar',
        description: 'Preset bundle of permissions. Fine-tune with the overrides below.',
      },
    },
    {
      name: 'status',
      type: 'select',
      // Deliberately not `required`: rows predating this field read as active
      // (the resolver only treats an explicit 'suspended' as inactive), so the
      // migration needs no backfill and scripted user creation stays valid.
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Suspended', value: 'suspended' },
      ],
      access: { update: canField('users.manage') },
      admin: {
        position: 'sidebar',
        description:
          'Suspending revokes every permission immediately, on the next request — the account stays for the audit trail.',
      },
    },
    {
      name: 'expiresAt',
      type: 'date',
      access: { update: canField('users.manage') },
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayOnly' },
        description: 'Optional. For temporary accounts (volunteers, contractors) — access stops at this date.',
      },
    },
    {
      type: 'collapsible',
      label: 'Permission overrides',
      admin: {
        initCollapsed: true,
        description:
          'Only needed when this person should differ from their role. Leave both empty and the role preset applies as-is.',
      },
      fields: [
        {
          name: 'permissionsGrant',
          type: 'select',
          hasMany: true,
          options: PERMISSION_OPTIONS,
          access: { update: canField('users.manage') },
          admin: {
            description: 'Extra permissions this person gets on top of their role.',
          },
        },
        {
          name: 'permissionsRevoke',
          type: 'select',
          hasMany: true,
          options: PERMISSION_OPTIONS,
          access: { update: canField('users.manage') },
          admin: {
            description:
              'Permissions taken away from their role. Revoking beats granting, so listing the same permission in both leaves it denied.',
          },
        },
      ],
    },
    {
      name: 'assignedParish',
      type: 'relationship',
      relationTo: 'parishes',
      // SECURITY: a parish-editor must not be able to edit their own record to
      // escape their scope, so reassignment needs `users.manage`.
      access: { update: canField('users.manage') },
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
