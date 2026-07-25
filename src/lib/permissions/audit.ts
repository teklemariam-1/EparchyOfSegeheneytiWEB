import type { AuthUser } from './resolve'

/**
 * Append an entry to the audit log. Best-effort: an audit failure must never
 * abort the action being audited. Uses the request's payload instance (passed in
 * from a hook) so it never imports getPayload — avoiding an import cycle with
 * collection configs.
 */
export interface AuditEntry {
  action: string
  actor?: AuthUser | null
  targetCollection?: string
  targetId?: string | number
  summary?: string
  req?: { ip?: string; headers?: Headers }
}

/**
 * Structural stand-in for the Payload instance. Typing the argument as Payload's
 * own `create` would drag its overloaded per-collection generics in here for no
 * benefit — `overrideAccess: true` means this call never varies.
 */
interface PayloadLike {
  create: (args: any) => Promise<unknown>
}

function clientIp(req?: { ip?: string; headers?: Headers }): string | undefined {
  if (!req) return undefined
  if (req.ip) return req.ip
  const fwd = req.headers?.get?.('x-forwarded-for')
  return fwd ? fwd.split(',')[0]!.trim() : undefined
}

export async function writeAudit(payload: PayloadLike, entry: AuditEntry): Promise<void> {
  try {
    await payload.create({
      collection: 'audit-log',
      overrideAccess: true,
      data: {
        action: entry.action,
        actor: entry.actor?.id ?? undefined,
        actorEmail: (entry.actor as { email?: string } | null | undefined)?.email ?? undefined,
        targetCollection: entry.targetCollection,
        targetId: entry.targetId != null ? String(entry.targetId) : undefined,
        summary: entry.summary,
        ip: clientIp(entry.req),
      },
    })
  } catch {
    // Auditing must never break the triggering operation.
  }
}
