import { PERMISSIONS, PRESET_PERMISSIONS, isKnownPermission, type Permission } from './permissions'
import type { Role } from '../constants/roles'

/**
 * The single place access is resolved. Every access decision in the codebase —
 * collection/global/field access, route handlers, admin nav visibility, the
 * client `can()` helper — routes through `hasPermission`/`getEffectivePermissions`.
 *
 * The ONLY hardcoded role comparison permitted in the app is the `super-admin`
 * short-circuit inside this module. Permissions are read from the user record on
 * every request (Payload reloads `req.user` per request), so a revoked grant or a
 * suspended account takes effect on the very next request — no stale-token window.
 *
 * Pure and DB-free so it can be unit tested directly.
 */

export interface AuthUser {
  id?: string | number
  role?: Role | string | null
  permissionsGrant?: string[] | null
  permissionsRevoke?: string[] | null
  status?: string | null
  expiresAt?: string | null
}

/** A user is inactive if suspended or past their expiry date. */
export function isActive(user: AuthUser | null | undefined): boolean {
  if (!user) return false
  if (user.status === 'suspended') return false
  if (user.expiresAt) {
    const t = Date.parse(user.expiresAt)
    if (!Number.isNaN(t) && t <= Date.now()) return false
  }
  return true
}

/** The full set of permissions a user effectively holds right now. */
export function getEffectivePermissions(user: AuthUser | null | undefined): Permission[] {
  if (!user || !isActive(user)) return []
  if (user.role === 'super-admin') return [...PERMISSIONS]

  const preset = PRESET_PERMISSIONS[user.role as Exclude<Role, 'super-admin'>] ?? []
  const set = new Set<string>(preset)
  for (const g of user.permissionsGrant ?? []) set.add(g)
  for (const r of user.permissionsRevoke ?? []) set.delete(r)
  return [...set].filter(isKnownPermission)
}

/** Whether a user holds a specific permission. */
export function hasPermission(user: AuthUser | null | undefined, permission: Permission): boolean {
  if (!user || !isActive(user)) return false
  if (user.role === 'super-admin') return true

  const preset = PRESET_PERMISSIONS[user.role as Exclude<Role, 'super-admin'>] ?? []
  if (preset.includes(permission)) {
    return !(user.permissionsRevoke ?? []).includes(permission)
  }
  return (user.permissionsGrant ?? []).includes(permission)
}

/** Whether a user holds ALL of the given permissions. */
export function hasAllPermissions(user: AuthUser | null | undefined, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(user, p))
}

/** Whether a user holds ANY of the given permissions. */
export function hasAnyPermission(user: AuthUser | null | undefined, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(user, p))
}
