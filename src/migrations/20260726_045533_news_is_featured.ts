import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "news" ADD COLUMN "is_featured" boolean DEFAULT false;
  ALTER TABLE "_news_v" ADD COLUMN "version_is_featured" boolean DEFAULT false;
  CREATE INDEX "news_is_featured_idx" ON "news" USING btree ("is_featured");
  CREATE INDEX "_news_v_version_version_is_featured_idx" ON "_news_v" USING btree ("version_is_featured");`)

  // Hand-added. The listing sorts on `-isFeatured` to hoist a pinned article,
  // and Postgres places NULLs FIRST under DESC (verified) — so a single NULL
  // row would silently take the hero slot ahead of a genuinely pinned story,
  // and ahead of the newest article when nothing is pinned.
  //
  // ADD COLUMN … DEFAULT false already backfills existing rows on PG 11+; this
  // is the belt to that braces, and it is idempotent.
  await db.execute(sql`UPDATE "news" SET "is_featured" = false WHERE "is_featured" IS NULL`)
  await db.execute(sql`UPDATE "_news_v" SET "version_is_featured" = false WHERE "version_is_featured" IS NULL`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "news_is_featured_idx";
  DROP INDEX "_news_v_version_version_is_featured_idx";
  ALTER TABLE "news" DROP COLUMN "is_featured";
  ALTER TABLE "_news_v" DROP COLUMN "version_is_featured";`)
}
