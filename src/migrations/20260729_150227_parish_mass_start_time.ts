import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "parishes_mass_times" ADD COLUMN IF NOT EXISTS "start_time" varchar;`)

  // ── Hand-added backfill ────────────────────────────────────────────────────
  //
  // Staff have already typed times into the free-text column — "9:00", "9:00
  // AM", "07.30". Where that text parses unambiguously, promote it into the
  // structured column so those rows gain the viewer-local display without
  // anyone retyping. One regex per accepted shape, entirely in SQL, so the
  // backfill needs no application code at migrate time.
  //
  // Deliberately conservative: anything that does not match — "after sunrise",
  // Tigrinya text, ranges like "9:00-11:00" — is left exactly as it is. A real
  // liturgical answer is not dirty data, and the page renders the free text
  // unconverted for such rows. Re-running is safe: `start_time IS NULL` guards
  // every statement.

  // Plain 24h "H:MM" / "HH:MM" (no meridiem).
  await db.execute(sql`
    UPDATE "parishes_mass_times"
    SET "start_time" = lpad(split_part(btrim("time"), ':', 1), 2, '0') || ':' || split_part(btrim("time"), ':', 2)
    WHERE "start_time" IS NULL
      AND btrim("time") ~ '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
  `)

  // "H.MM" with a dot separator.
  await db.execute(sql`
    UPDATE "parishes_mass_times"
    SET "start_time" = lpad(split_part(btrim("time"), '.', 1), 2, '0') || ':' || split_part(btrim("time"), '.', 2)
    WHERE "start_time" IS NULL
      AND btrim("time") ~ '^([01]?[0-9]|2[0-3])\.[0-5][0-9]$'
  `)

  // "H:MM AM/PM" (also "a.m."). 12 AM → 00, 12 PM stays 12, PM adds 12.
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
      AND btrim("time") ~* '^(1[0-2]|[1-9]):[0-5][0-9] ?[AP]\.?M\.?$'
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "parishes_mass_times" DROP COLUMN "start_time";`)
}
