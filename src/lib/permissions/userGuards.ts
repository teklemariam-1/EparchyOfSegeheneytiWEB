import type {
  CollectionBeforeChangeHook,
  CollectionBeforeDeleteHook,
  CollectionAfterChangeHook,
  CollectionBeforeLoginHook,
  Payload,
} from 'payload'
import { APIError } from 'payload'
import { randomBytes } from 'node:crypto'
import { writeAudit } from './audit'
import { isActive, type AuthUser } from './resolve'

/**
 * Guardrails for the Users collection. These are enforced in hooks (the real
 * security boundary), not merely in the admin UI:
 *
 *  - Suspended and expired accounts cannot log in at all.
 *  - The last active super-admin cannot be demoted, deactivated, or deleted.
 *  - No user may change their OWN role, permissions, or account status — not even
 *    a super-admin acting on themselves (prevents self-lockout and escalation).
 *  - New users are created without a password and emailed a set-password link
 *    (invitation flow); a random password is set so the account is valid but
 *    unusable until they set their own.
 *  - Permission/role/status changes are written to the audit log.
 */

type UserDoc = {
  id?: string | number
  role?: string
  status?: string
  email?: string
  permissionsGrant?: string[] | null
  permissionsRevoke?: string[] | null
  expiresAt?: string | null
}

const SENSITIVE_FIELDS = ['role', 'permissionsGrant', 'permissionsRevoke', 'status', 'expiresAt'] as const

function isActiveStatus(status: unknown): boolean {
  return status !== 'suspended'
}

async function otherActiveSuperAdmins(payload: Payload, excludeId: string | number): Promise<number> {
  const res = await payload.find({
    collection: 'users',
    where: {
      and: [
        { role: { equals: 'super-admin' } },
        { id: { not_equals: excludeId } },
        { or: [{ status: { equals: 'active' } }, { status: { exists: false } }] },
      ],
    },
    limit: 0,
    depth: 0,
    overrideAccess: true,
  })
  return res.totalDocs ?? 0
}

/** Random password satisfying the strength policy; never shown to anyone. */
function throwawayPassword(): string {
  return `${randomBytes(24).toString('base64url')}Aa1!`
}

/**
 * Refuse the session outright for a suspended or expired account. Without this
 * they could still authenticate and reach an empty admin, since the resolver
 * only strips their permissions. Same wording for both cases — an attacker
 * probing accounts learns nothing about which state a given address is in.
 */
export const rejectInactiveLogin: CollectionBeforeLoginHook = ({ user }) => {
  if (!isActive(user as AuthUser)) {
    throw new APIError('This account is not active. Contact an administrator.', 403)
  }
  return user
}

export const guardUserBeforeChange: CollectionBeforeChangeHook = async ({ data, req, operation, originalDoc }) => {
  const actor = req.user as AuthUser | null
  const original = originalDoc as UserDoc | undefined

  // Invitation flow: create without a password → set a throwaway one so the
  // account is valid; the set-password email goes out in afterChange.
  if (operation === 'create' && !(data as { password?: string }).password) {
    ;(data as { password?: string }).password = throwawayPassword()
  }

  if (operation === 'update' && original && actor) {
    const editingSelf = String(actor.id) === String(original.id)

    // No self-editing of role/permissions/status — even for super-admins.
    if (editingSelf) {
      for (const field of SENSITIVE_FIELDS) {
        const incoming = (data as Record<string, unknown>)[field]
        if (incoming !== undefined && JSON.stringify(incoming) !== JSON.stringify((original as Record<string, unknown>)[field])) {
          throw new APIError(
            'You cannot change your own role, permissions, or account status. Ask another administrator.',
            403,
          )
        }
      }
    }

    // Protect the last active super-admin from demotion/deactivation.
    const wasActiveSuper = original.role === 'super-admin' && isActiveStatus(original.status)
    const demoting = (data as UserDoc).role !== undefined && (data as UserDoc).role !== 'super-admin'
    const deactivating = (data as UserDoc).status === 'suspended'
    if (wasActiveSuper && (demoting || deactivating)) {
      if ((await otherActiveSuperAdmins(req.payload, original.id!)) === 0) {
        throw new APIError('You cannot demote or deactivate the last active super-admin.', 403)
      }
    }
  }

  return data
}

export const guardUserBeforeDelete: CollectionBeforeDeleteHook = async ({ req, id }) => {
  let target: UserDoc | null = null
  try {
    target = (await req.payload.findByID({ collection: 'users', id, depth: 0, overrideAccess: true })) as UserDoc
  } catch {
    target = null
  }
  if (target?.role === 'super-admin' && isActiveStatus(target.status)) {
    if ((await otherActiveSuperAdmins(req.payload, id)) === 0) {
      throw new APIError('You cannot delete the last active super-admin.', 403)
    }
  }
}

export const auditAndInviteUserAfterChange: CollectionAfterChangeHook = async ({ doc, req, operation, previousDoc }) => {
  const actor = req.user as AuthUser | null
  const user = doc as UserDoc

  if (operation === 'create') {
    // Send the set-password invitation link via the existing email chain.
    try {
      await req.payload.forgotPassword({
        collection: 'users',
        data: { email: user.email as string },
        disableEmail: false,
      })
    } catch (err) {
      req.payload.logger?.error?.(`[users] invitation email failed for ${user.email}: ${String(err)}`)
    }
    await writeAudit(req.payload, {
      action: 'user.created',
      actor,
      targetCollection: 'users',
      targetId: user.id,
      summary: `Created user ${user.email} with role ${user.role}`,
      req,
    })
    return doc
  }

  // Log sensitive changes on update.
  const prev = previousDoc as UserDoc | undefined
  if (prev) {
    const changes: string[] = []
    if (prev.role !== user.role) changes.push(`role ${prev.role} → ${user.role}`)
    if (prev.status !== user.status) changes.push(`status ${prev.status ?? 'active'} → ${user.status ?? 'active'}`)
    if (JSON.stringify(prev.permissionsGrant) !== JSON.stringify(user.permissionsGrant))
      changes.push('permission grants changed')
    if (JSON.stringify(prev.permissionsRevoke) !== JSON.stringify(user.permissionsRevoke))
      changes.push('permission revokes changed')
    if (changes.length) {
      await writeAudit(req.payload, {
        action: 'user.permissions-changed',
        actor,
        targetCollection: 'users',
        targetId: user.id,
        summary: `${user.email}: ${changes.join('; ')}`,
        req,
      })
    }
  }

  return doc
}
