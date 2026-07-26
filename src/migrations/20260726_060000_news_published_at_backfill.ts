import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Backfill `published_at` so "newest first" actually means that.
 *
 * Postgres orders NULLs FIRST under `DESC`, so an article with no publish date
 * sorted ahead of every dated one — taking the magazine hero slot and the top
 * of every page. Eight published articles were in that state (imports that
 * never carried a date), which is why the listing had stories at the top that
 * were not the newest.
 *
 * `created_at` is the honest substitute: it is when the article actually
 * entered the site, and it is never null. A `News` beforeChange hook now sets
 * `publishedAt` on save, so this cannot recur.
 *
 * No schema change — data only. There is no meaningful `down`: restoring the
 * NULLs would only reinstate the bug, and the original nulls carried no
 * information to lose.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "news"
    SET "published_at" = "created_at"
    WHERE "published_at" IS NULL
  `)

  await db.execute(sql`
    UPDATE "_news_v"
    SET "version_published_at" = "created_at"
    WHERE "version_published_at" IS NULL
  `)
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Intentionally empty — see the note above.
}
