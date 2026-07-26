import { sql } from '@payloadcms/db-postgres'
import { getPayload } from '../payload/client'

/**
 * Fixed-window rate limiting backed by Postgres (see collections/RateLimits).
 *
 * One atomic statement per check:
 *
 *   INSERT … ON CONFLICT (bucket, window_start) DO UPDATE SET count = count + 1
 *
 * so two concurrent serverless invocations can never both read "0" and both
 * allow the request — the classic read-then-write race that makes naive
 * limiters useless exactly when they matter.
 *
 * Fixed windows (rather than a sliding log) are deliberate: one row and one
 * round-trip per check, at the cost of allowing up to 2× the limit across a
 * window boundary. For "stop the flood" thresholds that trade is right; it
 * would not be for billing.
 */

export interface RateLimitOptions {
  /** Requests permitted per window. */
  limit: number
  /** Window length in seconds. */
  windowSeconds: number
  /**
   * What to do when the STORE ITSELF fails (database unreachable, migration not
   * yet applied). `true` allows the request through, `false` denies it.
   *
   * Analytics fail open — a database blip must not break page views. Auth fails
   * closed — if we cannot count login attempts we must not serve them, or a
   * database outage becomes an unlimited brute-force window.
   */
  failOpen: boolean
}

export interface RateLimitResult {
  allowed: boolean
  /**
   * Requests seen in this window INCLUDING this one. Lets a caller act exactly
   * on the crossing (`count === limit + 1`) rather than on every call past it —
   * which is how the failed-login alert avoids firing once per attempt.
   */
  count: number
  /** Requests still permitted in this window (0 once blocked). */
  remaining: number
  /** Seconds until the current window ends — suitable for a Retry-After header. */
  retryAfterSeconds: number
  /** True when the decision came from the failure policy rather than a real count. */
  degraded: boolean
}

/** Chance of opportunistically pruning expired rows on any given call. */
const SWEEP_PROBABILITY = 0.01

/**
 * Consume one unit against `bucket`.
 *
 * `bucket` must already be non-identifying — callers pass
 * `action:hashedClientKey` (see ./clientId), never a raw IP.
 */
export async function consume(bucket: string, options: RateLimitOptions): Promise<RateLimitResult> {
  const { limit, windowSeconds, failOpen } = options
  const windowMs = windowSeconds * 1000
  const now = Date.now()
  const windowStart = new Date(Math.floor(now / windowMs) * windowMs)
  const retryAfterSeconds = Math.max(1, Math.ceil((windowStart.getTime() + windowMs - now) / 1000))

  try {
    const payload = await getPayload()
    const db = (payload.db as unknown as { drizzle: DrizzleLike }).drizzle

    const result = await db.execute(sql`
      INSERT INTO "rate_limits" ("bucket", "window_start", "count", "created_at", "updated_at")
      VALUES (${bucket}, ${windowStart.toISOString()}, 1, now(), now())
      ON CONFLICT ("bucket", "window_start")
      DO UPDATE SET "count" = "rate_limits"."count" + 1, "updated_at" = now()
      RETURNING "count"
    `)

    // Drizzle returns numeric columns as strings on node-postgres.
    const count = Number((result.rows?.[0] as { count?: unknown } | undefined)?.count ?? 0)

    if (Math.random() < SWEEP_PROBABILITY) void sweep(db)

    return {
      allowed: count <= limit,
      count,
      remaining: Math.max(0, limit - count),
      retryAfterSeconds,
      degraded: false,
    }
  } catch (err) {
    // The store is unavailable. Apply the caller's policy rather than guessing.
    console.error(`[rate-limit] store unavailable for "${bucket.split(':')[0]}"`, err)
    return {
      allowed: failOpen,
      count: 0,
      remaining: failOpen ? limit : 0,
      retryAfterSeconds,
      degraded: true,
    }
  }
}

interface DrizzleLike {
  execute: (query: unknown) => Promise<{ rows?: unknown[] }>
}

/**
 * Drop counters whose window closed over a day ago.
 *
 * Runs opportunistically on a small fraction of calls instead of on a cron, so
 * the table stays bounded without another scheduled job to own and monitor.
 * Failures are ignored — a full table is a housekeeping problem, not a request
 * failure.
 */
async function sweep(db: DrizzleLike) {
  try {
    await db.execute(sql`DELETE FROM "rate_limits" WHERE "window_start" < now() - interval '1 day'`)
  } catch {
    // Housekeeping only — never surface.
  }
}
