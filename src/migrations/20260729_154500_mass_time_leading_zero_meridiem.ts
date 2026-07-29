import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Follow-up to 20260729_150227: catch "06:00 am".
 *
 * The first backfill's meridiem regex accepted hours `1[0-2]|[1-9]` — twelve
 *-hour clock hours WITHOUT a leading zero — so "6:00 am" converted but
 * "06:00 am" did not. Production had exactly that shape sitting in a real
 * parish row, which is how the gap was found: by reading what the deploy
 * actually did rather than assuming it.
 *
 * Same conservatism as the original: only NULL start_time rows, only shapes
 * that parse unambiguously, everything else left alone. Safe to re-run.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "parishes_mass_times"
    SET "start_time" =
      lpad((
        CASE
          WHEN lower(btrim("time")) ~ 'p' AND split_part(btrim("time"), ':', 1)::int <> 12
            THEN split_part(btrim("time"), ':', 1)::int + 12
          WHEN lower(btrim("time")) ~ 'a' AND split_part(btrim("time"), ':', 1)::int = 12
            THEN 0
          ELSE split_part(btrim("time"), ':', 1)::int
        END
      )::text, 2, '0') || ':' || substring(btrim("time") from ':([0-5][0-9])')
    WHERE "start_time" IS NULL
      AND btrim("time") ~* '^(0?[1-9]|1[0-2]):[0-5][0-9] ?[AP]\.?M\.?$'
  `)
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Data-only, derived from the free-text column which is untouched; there is
  // nothing meaningful to restore.
}
