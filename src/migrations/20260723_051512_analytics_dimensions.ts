import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "visitor_stats" ALTER COLUMN "country" DROP NOT NULL;
  ALTER TABLE "visitor_stats" ADD COLUMN "dimension" varchar DEFAULT 'country' NOT NULL;
  -- Existing rows are country counters: add "key" as nullable, backfill from
  -- country, then enforce NOT NULL.
  ALTER TABLE "visitor_stats" ADD COLUMN "key" varchar;
  UPDATE "visitor_stats" SET "key" = COALESCE("country", 'Unknown') WHERE "key" IS NULL;
  ALTER TABLE "visitor_stats" ALTER COLUMN "key" SET NOT NULL;
  CREATE INDEX "visitor_stats_dimension_idx" ON "visitor_stats" USING btree ("dimension");
  CREATE INDEX "visitor_stats_key_idx" ON "visitor_stats" USING btree ("key");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "visitor_stats_dimension_idx";
  DROP INDEX "visitor_stats_key_idx";
  ALTER TABLE "visitor_stats" ALTER COLUMN "country" SET NOT NULL;
  ALTER TABLE "visitor_stats" DROP COLUMN "dimension";
  ALTER TABLE "visitor_stats" DROP COLUMN "key";`)
}
