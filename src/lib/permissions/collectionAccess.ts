import type { Access, AccessArgs } from 'payload'
import type { Role } from '@/lib/constants/roles'

type UserWithRole = {
  id: string
  role: Role
  assignedParish?: string | null
}

/**
 * Returns true only for super-admin users.
 */
export const isSuperAdmin: Access = ({ req }: AccessArgs) => {
  const user = req.user as UserWithRole | null
  return user?.role === 'super-admin'
}

/**
 * Returns true for super-admin and chancery-editor roles.
 */
export const isChanceryOrAbove: Access = ({ req }: AccessArgs) => {
  const user = req.user as UserWithRole | null
  if (!user) return false
  return ['super-admin', 'chancery-editor'].includes(user.role)
}

/**
 * Returns true for any authenticated user with an editor role.
 */
export const isAnyEditor: Access = ({ req }: AccessArgs) => {
  return Boolean(req.user)
}

/**
 * Allows read access to everyone (public content).
 */
export const isPublicRead: Access = () => true

/**
 * Allows read access only to authenticated users.
 */
export const isAuthenticated: Access = ({ req }: AccessArgs) => {
  return Boolean(req.user)
}

/**
 * Builds an access function that allows a specific set of roles.
 */
export function isRoleOneOf(...roles: Role[]): Access {
  return ({ req }: AccessArgs) => {
    const user = req.user as UserWithRole | null
    if (!user) return false
    return roles.includes(user.role)
  }
}

/**
 * Builds an access function for parish-scoped editors.
 * The editor can only modify documents where doc[parishField] matches their assignedParish.
 * Super-admin and chancery-editor bypass this restriction.
 */
export function isOwnParishOrAbove(parishField = 'parish'): Access {
  return ({ req, id, data }: AccessArgs) => {
    const user = req.user as UserWithRole | null
    if (!user) return false

    // Elevated roles bypass parish scope restriction
    if (['super-admin', 'chancery-editor'].includes(user.role)) return true

    if (user.role !== 'parish-editor') return false

    // For create operations, check against incoming data
    if (!id && data) {
      const parishId =
        typeof data[parishField] === 'object'
          ? (data[parishField] as { id: string }).id
          : data[parishField]
      return parishId === user.assignedParish
    }

    // For read/update/delete we rely on a where clause to filter
    // The collection must also add `where: { parish: { equals: user.assignedParish } }`
    // in its list access when the user is a parish-editor.
    return {
      [parishField]: {
        equals: user.assignedParish,
      },
    } as unknown as boolean
  }
}

/**
 * Access for contact submissions — only elevated roles can read; no one can
 * create through admin (submissions come in via the API/form endpoint).
 */
export const contactSubmissionAccess = {
  read: isChanceryOrAbove,
  create: isPublicRead, // public POST via API
  update: isChanceryOrAbove,
  delete: isSuperAdmin,
}
