import type { Field, Payload } from 'payload'
import { canField } from '../permissions/access'
import type { Permission } from '../permissions/permissions'

/**
 * Scheduled publishing — write on Friday, appear on Sunday.
 *
 * Chancery staff are in Eritrea on an unreliable connection; the audience is
 * abroad. Until now, publishing a Sunday message meant being online at the
 * moment it should appear. This lets a draft carry a `publishAt`, and a cron
 * flips due drafts to published.
 *
 * ── Scheduling IS publishing ─────────────────────────────────────────────────
 * The field is gated by the same permission as publishing now. Without that, an
 * editor who lacks `news.publish` could schedule a draft one minute ahead and
 * the cron would launder it into print. Same act, same permission.
 *
 * ── Timing honesty ───────────────────────────────────────────────────────────
 * The Vercel plan runs crons DAILY (a finer schedule has been rejected by this
 * plan before — see deploy.yml's history). So a scheduled time is honoured on
 * the next daily run, not to the minute. The endpoint also accepts an external
 * scheduler with the CRON_SECRET bearer (cron-job.org and the like) for anyone
 * who wants hourly precision without a plan upgrade. The field description
 * tells staff the truth rather than implying minute precision.
 */

/** Collections the publisher sweeps, with the permission that gates scheduling. */
export const SCHEDULABLE_COLLECTIONS: { slug: string; publishPermission: Permission }[] = [
  { slug: 'news', publishPermission: 'news.publish' },
  { slug: 'pages', publishPermission: 'pages.publish' },
  { slug: 'pope-messages', publishPermission: 'pope-messages.publish' },
  { slug: 'bishop-messages', publishPermission: 'bishop-messages.publish' },
  { slug: 'apps', publishPermission: 'apps.publish' },
  { slug: 'offices', publishPermission: 'offices.publish' },
  { slug: 'events', publishPermission: 'events.publish' },
  { slug: 'bishops', publishPermission: 'bishops.publish' },
]

/**
 * The sidebar field a draft-enabled collection adds to opt in.
 *
 * `update` access mirrors the publish gate. `create` too: a document can be
 * born as a draft with a schedule already attached.
 */
export function publishAtField(publishPermission: Permission): Field {
  return {
    name: 'publishAt',
    type: 'date',
    index: true,
    access: {
      create: canField(publishPermission),
      update: canField(publishPermission),
    },
    admin: {
      position: 'sidebar',
      date: { pickerAppearance: 'dayAndTime' },
      description:
        'Publish this draft automatically at (or soon after) this time — the check runs on a schedule, not to the minute. Requires the same permission as publishing now. Cleared once published.',
    },
  }
}

export interface PublishDueResult {
  published: { collection: string; id: string | number; title?: string }[]
  errors: { collection: string; id: string | number; error: string }[]
}

/**
 * Publish every draft whose time has come. Called by the cron route; extracted
 * so it can be tested without HTTP.
 *
 * Sets `context.scheduledPublish`, which `requirePublishPermission` honours —
 * the cron has no `req.user`, and the permission check already happened when a
 * publish-holder set the field (its access gate). `publishAt` is cleared in the
 * same update: without that, a document later unpublished by staff would be
 * silently re-published on the next run, because its schedule would still be in
 * the past.
 */
export async function publishDueDrafts(payload: Payload, now: Date): Promise<PublishDueResult> {
  const result: PublishDueResult = { published: [], errors: [] }

  for (const { slug } of SCHEDULABLE_COLLECTIONS) {
    let due: { docs: { id: string | number; title?: string }[] }
    try {
      due = (await payload.find({
        collection: slug as never,
        where: {
          _status: { equals: 'draft' },
          publishAt: { less_than_equal: now.toISOString() },
        },
        // A backlog beyond this is unprecedented for this site; the next run
        // picks up anything left.
        limit: 50,
        depth: 0,
        draft: true,
        overrideAccess: true,
      })) as never
    } catch (err) {
      result.errors.push({ collection: slug, id: '-', error: String(err) })
      continue
    }

    for (const doc of due.docs) {
      try {
        await payload.update({
          collection: slug as never,
          id: doc.id,
          data: { _status: 'published', publishAt: null } as never,
          draft: false,
          overrideAccess: true,
          context: { scheduledPublish: true },
        })
        result.published.push({ collection: slug, id: doc.id, title: doc.title })
      } catch (err) {
        // One bad document must not hold the rest of the queue hostage.
        result.errors.push({ collection: slug, id: doc.id, error: String(err) })
      }
    }
  }

  return result
}
