import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_feed_sources_target" AS ENUM('news', 'pope-messages');
  CREATE TYPE "public"."enum_feed_sources_category" AS ENUM('eparchy', 'vatican', 'pastoral', 'community', 'social', 'announcement');
  CREATE TYPE "public"."enum_feed_sources_document_type" AS ENUM('encyclical', 'apostolic-exhortation', 'apostolic-letter', 'apostolic-constitution', 'message', 'homily', 'audience', 'other');
  CREATE TABLE "feed_sources" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"url" varchar NOT NULL,
  	"target" "enum_feed_sources_target" DEFAULT 'news' NOT NULL,
  	"category" "enum_feed_sources_category" DEFAULT 'vatican',
  	"document_type" "enum_feed_sources_document_type" DEFAULT 'message',
  	"enabled" boolean DEFAULT true,
  	"last_fetched_at" timestamp(3) with time zone,
  	"last_status" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "feed_sources_id" integer;
  CREATE UNIQUE INDEX "feed_sources_url_idx" ON "feed_sources" USING btree ("url");
  CREATE INDEX "feed_sources_updated_at_idx" ON "feed_sources" USING btree ("updated_at");
  CREATE INDEX "feed_sources_created_at_idx" ON "feed_sources" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_feed_sources_fk" FOREIGN KEY ("feed_sources_id") REFERENCES "public"."feed_sources"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_feed_sources_id_idx" ON "payload_locked_documents_rels" USING btree ("feed_sources_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "feed_sources" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "feed_sources" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_feed_sources_fk";
  
  DROP INDEX "payload_locked_documents_rels_feed_sources_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "feed_sources_id";
  DROP TYPE "public"."enum_feed_sources_target";
  DROP TYPE "public"."enum_feed_sources_category";
  DROP TYPE "public"."enum_feed_sources_document_type";`)
}
