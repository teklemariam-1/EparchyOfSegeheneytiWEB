import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // ── Merge duplicate visitor-stats rows BEFORE the unique index below ───────
  //
  // Hand-added step. `incrementStat` used to read-then-write, so two concurrent
  // requests could both miss the same (dimension, key, date) and both INSERT.
  // Production has been serving bot floods, which is exactly when that race
  // fires — so duplicates are likely, and `CREATE UNIQUE INDEX` would abort the
  // whole migration and block the deploy.
  //
  // Counts are SUMMED into the earliest row rather than discarded: these are the
  // only visit figures the eparchy has, and a deduplication that silently lost
  // traffic would be worse than the duplicates.
  await db.execute(sql`
    WITH ranked AS (
      SELECT
        "id",
        "count",
        first_value("id") OVER (PARTITION BY "dimension", "key", "date" ORDER BY "id") AS keep_id
      FROM "visitor_stats"
    ), totals AS (
      SELECT keep_id, SUM("count") AS total FROM ranked GROUP BY keep_id
    )
    UPDATE "visitor_stats" vs
    SET "count" = totals.total
    FROM totals
    WHERE vs."id" = totals.keep_id AND vs."count" <> totals.total
  `)

  await db.execute(sql`
    DELETE FROM "visitor_stats" vs
    USING (
      SELECT
        "id",
        first_value("id") OVER (PARTITION BY "dimension", "key", "date" ORDER BY "id") AS keep_id
      FROM "visitor_stats"
    ) ranked
    WHERE vs."id" = ranked."id" AND ranked."id" <> ranked.keep_id
  `)

  await db.execute(sql`
   CREATE TABLE "rate_limits" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"bucket" varchar NOT NULL,
  	"window_start" timestamp(3) with time zone NOT NULL,
  	"count" numeric DEFAULT 0 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "rate_limits_id" integer;
  ALTER TABLE "site_settings" ADD COLUMN "security_turnstile_enabled" boolean DEFAULT false;
  ALTER TABLE "site_settings" ADD COLUMN "security_turnstile_site_key" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "security_turnstile_secret_key" varchar;
  CREATE INDEX "rate_limits_bucket_idx" ON "rate_limits" USING btree ("bucket");
  CREATE INDEX "rate_limits_window_start_idx" ON "rate_limits" USING btree ("window_start");
  CREATE INDEX "rate_limits_updated_at_idx" ON "rate_limits" USING btree ("updated_at");
  CREATE INDEX "rate_limits_created_at_idx" ON "rate_limits" USING btree ("created_at");
  CREATE UNIQUE INDEX "bucket_windowStart_idx" ON "rate_limits" USING btree ("bucket","window_start");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_rate_limits_fk" FOREIGN KEY ("rate_limits_id") REFERENCES "public"."rate_limits"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "dimension_key_date_idx" ON "visitor_stats" USING btree ("dimension","key","date");
  CREATE INDEX "payload_locked_documents_rels_rate_limits_id_idx" ON "payload_locked_documents_rels" USING btree ("rate_limits_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "rate_limits" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "rate_limits" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_rate_limits_fk";
  
  DROP INDEX "dimension_key_date_idx";
  DROP INDEX "payload_locked_documents_rels_rate_limits_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "rate_limits_id";
  ALTER TABLE "site_settings" DROP COLUMN "security_turnstile_enabled";
  ALTER TABLE "site_settings" DROP COLUMN "security_turnstile_site_key";
  ALTER TABLE "site_settings" DROP COLUMN "security_turnstile_secret_key";`)
}
