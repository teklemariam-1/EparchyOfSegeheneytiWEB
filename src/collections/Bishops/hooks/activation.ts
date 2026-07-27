import type { CollectionBeforeChangeHook, CollectionAfterChangeHook } from 'payload'
import { APIError } from 'payload'
import { hasPermission, type AuthUser } from '../../../lib/permissions/resolve'
import { writeAudit } from '../../../lib/permissions/audit'
import { safeRevalidatePath, safeRevalidateTag } from '../../../lib/payload/revalidate'

/**
 * Exactly one Eparch may be `isActive` — the sitting one.
 *
 * Three layers, deliberately:
 *
 *   1. A partial unique index in Postgres
 *      (`… ON bishops (is_active) WHERE is_active = true`). This is the only
 *      layer that holds under a race or a direct SQL write, and it is why the
 *      demotion below must be committed before the promotion.
 *   2. This hook, which demotes the incumbent so activating a successor is one
 *      action rather than "remember to untick the other one first".
 *   3. A distinct `bishops.set_active` permission, because flipping this flag
 *      changes the name, portrait and title shown across the whole public site.
 *
 * Ordering matters. Postgres evaluates the unique index per statement, so
 * promoting first would collide with the incumbent's still-true row and abort.
 * The incumbent is therefore demoted first, inside the SAME transaction as the
 * promotion (`req.transactionID`, which Payload opens for the operation and
 * threads through hooks) — so either both writes land or neither does, and the
 * database is never left with two active Eparchs or none.
 */

interface BishopDoc {
  id: string | number
  isActive?: boolean | null
  fullName?: unknown
  termEnd?: unknown
  termEndReason?: unknown
}

/**
 * Gate the activation itself behind `bishops.set_active`, separately from the
 * `update` access that governs ordinary edits.
 *
 * Only the transition into active is gated: deactivating is part of the
 * successor's activation, and blocking it here would deadlock the demotion.
 */
export const requireSetActivePermission: CollectionBeforeChangeHook = async ({
  data,
  req,
  originalDoc,
}) => {
  const becomingActive = (data as { isActive?: unknown })?.isActive === true
  const wasActive = (originalDoc as BishopDoc | undefined)?.isActive === true
  if (!becomingActive || wasActive) return data

  if (!hasPermission(req.user as AuthUser | null, 'bishops.set_active')) {
    throw new APIError(
      'You do not have permission to change which Eparch is shown as the sitting one. Ask a super-admin.',
      403,
    )
  }
  return data
}

/**
 * Demote the incumbent in the same transaction as the promotion.
 *
 * Runs as `beforeChange` rather than `afterChange` so the demotion is committed
 * to the transaction before the promoting row is written — see the ordering note
 * above. `overrideAccess: true` is correct here: the caller's right to do this
 * was already established by `requireSetActivePermission`, and the demotion is a
 * consequence of that decision rather than a separate edit they are performing.
 */
export const deactivateIncumbent: CollectionBeforeChangeHook = async ({
  data,
  req,
  originalDoc,
}) => {
  const becomingActive = (data as { isActive?: unknown })?.isActive === true
  const wasActive = (originalDoc as BishopDoc | undefined)?.isActive === true
  if (!becomingActive || wasActive) return data

  const selfId = (originalDoc as BishopDoc | undefined)?.id

  const incumbents = await req.payload.find({
    collection: 'bishops',
    where: { isActive: { equals: true } },
    limit: 10,
    depth: 0,
    overrideAccess: true,
    req,
  })

  for (const doc of incumbents.docs as unknown as BishopDoc[]) {
    if (selfId !== undefined && String(doc.id) === String(selfId)) continue

    // Close out the outgoing term in the same write. Term end and reason are
    // only defaulted when staff left them blank — a chancery that recorded a
    // retirement date months ago must not have it overwritten with today.
    const patch: Record<string, unknown> = { isActive: false }
    if (!doc.termEnd) patch.termEnd = new Date().toISOString()
    if (!doc.termEndReason) patch.termEndReason = 'other'

    await req.payload.update({
      collection: 'bishops',
      id: doc.id,
      data: patch,
      overrideAccess: true,
      req,
    })
  }

  return data
}

/**
 * Audit the activation and invalidate every public surface that names the
 * Eparch. Runs after the write so it records what actually committed.
 */
export const auditAndRevalidateActivation: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
  operation,
}) => {
  const isActive = (doc as BishopDoc).isActive === true
  const wasActive = (previousDoc as BishopDoc | undefined)?.isActive === true
  if (!isActive || (wasActive && operation === 'update')) return doc

  await writeAudit(req.payload, {
    action: 'bishops.set_active',
    actor: req.user as AuthUser | null,
    targetCollection: 'bishops',
    targetId: (doc as BishopDoc).id,
    summary: `Set as the sitting Eparch (record #${(doc as BishopDoc).id})`,
    req: { headers: req.headers as Headers },
  })

  revalidateBishopSurfaces((doc as { slug?: string }).slug)
  return doc
}

/**
 * Every cache tag and path that shows the Eparch's name, portrait or title.
 *
 * Kept in one place and called from both the activation hook and the ordinary
 * afterChange hook: a partial list is worse than none, because the pages it
 * misses go on showing the previous Eparch for up to the 300s cachedQuery TTL
 * with nothing to indicate they are stale.
 */
export function revalidateBishopSurfaces(slug?: string): void {
  // Data-cache tags (see cachedQuery).
  safeRevalidateTag('bishops')
  safeRevalidateTag('globals') // homepage/about read bishop identity through the globals tag
  safeRevalidateTag('bishop-messages') // message bylines carry his name

  // Rendered routes.
  safeRevalidatePath('/', 'layout') // header, footer and nav on every page
  safeRevalidatePath('/')
  safeRevalidatePath('/about')
  safeRevalidatePath('/bishop')
  safeRevalidatePath('/eparchs')
  safeRevalidatePath('/contact')
  safeRevalidatePath('/bishop-messages')
  if (slug) safeRevalidatePath(`/eparchs/${slug}`)
}
