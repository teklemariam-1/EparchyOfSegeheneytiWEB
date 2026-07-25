import { getPayload } from '../payload/client'
import { hasPermission, type AuthUser } from './resolve'
import type { Permission } from './permissions'

/**
 * Resolve the authenticated user from a request and check a permission.
 *
 * For API route handlers and admin server components that need a server-side
 * permission gate. Returns the user (or null) plus whether they hold the
 * permission, so the caller can distinguish 401 (no session) from 403.
 */
export async function authorizeRoute(
  headers: Headers,
  permission: Permission,
): Promise<{ user: AuthUser | null; authorized: boolean }> {
  const payload = await getPayload()
  const { user } = await payload.auth({ headers })
  const authUser = (user as AuthUser | null) ?? null
  return { user: authUser, authorized: hasPermission(authUser, permission) }
}
