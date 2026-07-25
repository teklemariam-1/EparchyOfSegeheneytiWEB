import type { Access, FieldAccess, CollectionBeforeChangeHook } from 'payload'
import { APIError } from 'payload'
import { hasPermission, type AuthUser } from './resolve'
import type { Permission } from './permissions'

/**
 * Permission-based access factories. Collection/global/field access and publish
 * gating are all expressed through these, so every enforcement decision routes
 * through `hasPermission` (see ./resolve) rather than a hardcoded role string.
 *
 * This module is deliberately free of `getPayload` imports — it is imported by
 * collection configs, and pulling the Payload instance in here would create an
 * import cycle with payload.config. Route-handler authorization lives in
 * ./authorizeRoute instead.
 */

/** Collection/global access gated on a single permission. */
export function can(permission: Permission): Access {
  return ({ req }) => hasPermission(req.user as AuthUser | null, permission)
}

/**
 * `admin.hidden` helper — hides a collection/global from the sidebar unless the
 * user holds at least one of the given permissions. Cosmetic only: the `access`
 * functions remain the real enforcement, so a hidden collection reached by direct
 * URL is still denied.
 */
export function hideUnless(...permissions: Permission[]) {
  return ({ user }: { user: unknown }) =>
    !permissions.some((p) => hasPermission(user as AuthUser | null, p))
}

/** Field-level access gated on a single permission. */
export function canField(permission: Permission): FieldAccess {
  return ({ req }) => hasPermission(req.user as AuthUser | null, permission)
}

/**
 * Standard create/update/delete access block for a resource, plus a supplied
 * `read`. Keeps the 20-odd content collections terse while remaining fully
 * type-checked (each permission string is validated against the catalog).
 */
export function crud(
  read: Access,
  create: Permission,
  update: Permission,
  del: Permission,
): { read: Access; create: Access; update: Access; delete: Access } {
  return { read, create: can(create), update: can(update), delete: can(del) }
}

/**
 * Parish-scoped access: holders of `fullPermission` (chancery/super) get
 * everything; holders of only `ownPermission` (parish-editor) are constrained to
 * documents whose `parishField` equals their `assignedParish`. Others: denied.
 *
 * On create, checks the incoming data; on read/update/delete, returns a
 * where-constraint so Payload filters the list rather than returning a bare bool.
 */
export function canManageOwnParish(
  fullPermission: Permission,
  ownPermission: Permission,
  parishField = 'parish',
): Access {
  return ({ req, id, data }) => {
    const user = req.user as (AuthUser & { assignedParish?: string | null }) | null
    if (!user) return false
    if (hasPermission(user, fullPermission)) return true
    if (!hasPermission(user, ownPermission)) return false

    // Create: validate the incoming parish matches the user's assignment.
    if (!id && data) {
      const raw = (data as Record<string, unknown>)[parishField]
      const parishId = raw && typeof raw === 'object' ? (raw as { id?: string }).id : raw
      return parishId === user.assignedParish
    }
    // Read/update/delete: scope by where-clause.
    return { [parishField]: { equals: user.assignedParish } } as unknown as boolean
  }
}

/**
 * beforeChange hook that gates the draft→published transition behind a distinct
 * publish permission. Editing a draft, or updating an already-published doc, is
 * governed by the collection's normal update access; only the act of publishing
 * requires `permission`.
 */
export function requirePublishPermission(permission: Permission): CollectionBeforeChangeHook {
  return ({ data, req, originalDoc }) => {
    const target = (data as { _status?: string } | undefined)?._status
    const wasPublished = (originalDoc as { _status?: string } | undefined)?._status === 'published'
    if (target === 'published' && !wasPublished && !hasPermission(req.user as AuthUser | null, permission)) {
      throw new APIError(
        'You do not have permission to publish this. Save it as a draft and ask a colleague with publishing rights.',
        403,
      )
    }
    return data
  }
}
