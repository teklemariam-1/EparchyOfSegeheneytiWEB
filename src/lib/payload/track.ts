import { sql } from '@payloadcms/db-postgres'
import { getPayload } from './client'

/**
 * Increment an anonymous daily aggregate counter (visitor-stats collection).
 * Best-effort: analytics must never break a page view, so all errors are
 * swallowed. See src/collections/VisitorStats for the dimension model.
 */

/**
 * The only dimensions that may ever be written.
 *
 * Enforced here rather than at the call sites so no future caller — or a
 * request that reaches one — can invent a dimension and grow the table along a
 * new axis. An unknown dimension is dropped silently, exactly like any other
 * analytics failure.
 */
export const TRACKED_DIMENSIONS = [
  'path',
  'country',
  'device',
  'source',
  'language',
  'search',
  'search-empty',
  // Crawler traffic, kept separate so crawl volume stays visible without
  // polluting the human numbers.
  'bot',
] as const

export type TrackedDimension = (typeof TRACKED_DIMENSIONS)[number]

const DIMENSION_SET = new Set<string>(TRACKED_DIMENSIONS)

/** Hard cap on a stored key. Long keys are truncated, never rejected. */
const MAX_KEY_LENGTH = 200

export async function incrementStat(
  dimension: string,
  key: string,
  opts: { country?: string } = {},
): Promise<void> {
  try {
    if (!DIMENSION_SET.has(dimension)) return
    const safeKey = String(key ?? '').trim().slice(0, MAX_KEY_LENGTH)
    if (!safeKey) return

    const now = new Date()
    const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString()
    const payload = await getPayload()
    const db = (payload.db as unknown as { drizzle: { execute: (q: unknown) => Promise<unknown> } }).drizzle

    // Single atomic statement. The previous find-then-create/update lost
    // increments whenever two requests raced (both found nothing, both
    // inserted), which fragmented the counts precisely under the bot floods
    // this table is supposed to measure. Requires the unique index on
    // (dimension, key, date) — see the visitor_stats_unique migration.
    await db.execute(sql`
      INSERT INTO "visitor_stats" ("dimension", "key", "country", "date", "count", "created_at", "updated_at")
      VALUES (
        ${dimension},
        ${safeKey},
        ${opts.country ?? null},
        ${day},
        1,
        now(),
        now()
      )
      ON CONFLICT ("dimension", "key", "date")
      DO UPDATE SET "count" = "visitor_stats"."count" + 1, "updated_at" = now()
    `)
  } catch {
    // never surface analytics failures
  }
}
