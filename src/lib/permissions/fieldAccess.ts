import type { FieldAccess } from 'payload'
import type { Role } from '@/lib/constants/roles'

type UserWithRole = {
  id: string
  role: Role
}

/**
 * Restricts a field to be editable only by super-admin.
 * Other roles see it as read-only.
 */
export const superAdminOnly: FieldAccess = ({ req }) => {
  const user = req.user as UserWithRole | null
  return user?.role === 'super-admin'
}

/**
 * Restricts a field to elevated roles (super-admin, chancery-editor).
 */
export const elevatedOnly: FieldAccess = ({ req }) => {
  const user = req.user as UserWithRole | null
  if (!user) return false
  return ['super-admin', 'chancery-editor'].includes(user.role)
}

/**
 * Only the authenticated user themselves can edit these fields.
 * (e.g., their own profile name / password hint)
 */
export const selfOrAdmin: FieldAccess = ({ req, id }) => {
  const user = req.user as UserWithRole | null
  if (!user) return false
  if (user.role === 'super-admin') return true
  return user.id === id
}
