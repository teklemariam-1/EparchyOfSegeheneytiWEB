import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "visitor_stats" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"country" varchar NOT NULL,
  	"date" timestamp(3) with time zone NOT NULL,
  	"count" numeric DEFAULT 0 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "visitor_stats_id" integer;
  CREATE INDEX "visitor_stats_country_idx" ON "visitor_stats" USING btree ("country");
  CREATE INDEX "visitor_stats_date_idx" ON "visitor_stats" USING btree ("date");
  CREATE INDEX "visitor_stats_updated_at_idx" ON "visitor_stats" USING btree ("updated_at");
  CREATE INDEX "visitor_stats_created_at_idx" ON "visitor_stats" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_visitor_stats_fk" FOREIGN KEY ("visitor_stats_id") REFERENCES "public"."visitor_stats"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_visitor_stats_id_idx" ON "payload_locked_documents_rels" USING btree ("visitor_stats_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "visitor_stats" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "visitor_stats" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_visitor_stats_fk";
  
  DROP INDEX "payload_locked_documents_rels_visitor_stats_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "visitor_stats_id";`)
}
