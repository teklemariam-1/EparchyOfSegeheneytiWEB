import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "news_categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"value" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "event_types" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"value" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "news" ALTER COLUMN "category" DROP DEFAULT;
  ALTER TABLE "news" ALTER COLUMN "category" SET DATA TYPE varchar USING "category"::text;
  ALTER TABLE "news" ALTER COLUMN "category" SET DEFAULT 'eparchy';
  ALTER TABLE "_news_v" ALTER COLUMN "version_category" DROP DEFAULT;
  ALTER TABLE "_news_v" ALTER COLUMN "version_category" SET DATA TYPE varchar USING "version_category"::text;
  ALTER TABLE "_news_v" ALTER COLUMN "version_category" SET DEFAULT 'eparchy';
  ALTER TABLE "events" ALTER COLUMN "event_type" DROP DEFAULT;
  ALTER TABLE "events" ALTER COLUMN "event_type" SET DATA TYPE varchar USING "event_type"::text;
  ALTER TABLE "events" ALTER COLUMN "event_type" SET DEFAULT 'liturgical';
  ALTER TABLE "_events_v" ALTER COLUMN "version_event_type" DROP DEFAULT;
  ALTER TABLE "_events_v" ALTER COLUMN "version_event_type" SET DATA TYPE varchar USING "version_event_type"::text;
  ALTER TABLE "_events_v" ALTER COLUMN "version_event_type" SET DEFAULT 'liturgical';
  ALTER TABLE "feed_sources" ALTER COLUMN "category" DROP DEFAULT;
  ALTER TABLE "feed_sources" ALTER COLUMN "category" SET DATA TYPE varchar USING "category"::text;
  ALTER TABLE "feed_sources" ALTER COLUMN "category" SET DEFAULT 'vatican';
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "news_categories_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "event_types_id" integer;
  ALTER TABLE "banner_settings" ADD COLUMN "image_opacity" numeric DEFAULT 100;
  CREATE UNIQUE INDEX "news_categories_value_idx" ON "news_categories" USING btree ("value");
  CREATE INDEX "news_categories_updated_at_idx" ON "news_categories" USING btree ("updated_at");
  CREATE INDEX "news_categories_created_at_idx" ON "news_categories" USING btree ("created_at");
  CREATE UNIQUE INDEX "event_types_value_idx" ON "event_types" USING btree ("value");
  CREATE INDEX "event_types_updated_at_idx" ON "event_types" USING btree ("updated_at");
  CREATE INDEX "event_types_created_at_idx" ON "event_types" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_news_categories_fk" FOREIGN KEY ("news_categories_id") REFERENCES "public"."news_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_event_types_fk" FOREIGN KEY ("event_types_id") REFERENCES "public"."event_types"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_news_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("news_categories_id");
  CREATE INDEX "payload_locked_documents_rels_event_types_id_idx" ON "payload_locked_documents_rels" USING btree ("event_types_id");
  DROP TYPE "public"."enum_news_category";
  DROP TYPE "public"."enum__news_v_version_category";
  DROP TYPE "public"."enum_events_event_type";
  DROP TYPE "public"."enum__events_v_version_event_type";
  DROP TYPE "public"."enum_feed_sources_category";
  INSERT INTO "news_categories" ("label", "value") VALUES
    ('Eparchy News', 'eparchy'),
    ('Vatican / Universal Church', 'vatican'),
    ('Pastoral Letter', 'pastoral'),
    ('Community', 'community'),
    ('Social Ministry', 'social'),
    ('Announcement', 'announcement')
  ON CONFLICT ("value") DO NOTHING;
  INSERT INTO "event_types" ("label", "value") VALUES
    ('Liturgical / Mass', 'liturgical'),
    ('Feast Day', 'feast'),
    ('Youth Program', 'youth'),
    ('Community Gathering', 'community'),
    ('Educational / Catechism', 'education'),
    ('Social Ministry', 'social'),
    ('Pilgrimage', 'pilgrimage'),
    ('Conference', 'conference'),
    ('Other', 'other')
  ON CONFLICT ("value") DO NOTHING;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_news_category" AS ENUM('eparchy', 'vatican', 'pastoral', 'community', 'social', 'announcement');
  CREATE TYPE "public"."enum__news_v_version_category" AS ENUM('eparchy', 'vatican', 'pastoral', 'community', 'social', 'announcement');
  CREATE TYPE "public"."enum_events_event_type" AS ENUM('liturgical', 'feast', 'youth', 'community', 'education', 'social', 'pilgrimage', 'conference', 'other');
  CREATE TYPE "public"."enum__events_v_version_event_type" AS ENUM('liturgical', 'feast', 'youth', 'community', 'education', 'social', 'pilgrimage', 'conference', 'other');
  CREATE TYPE "public"."enum_feed_sources_category" AS ENUM('eparchy', 'vatican', 'pastoral', 'community', 'social', 'announcement');
  ALTER TABLE "news_categories" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "event_types" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "news_categories" CASCADE;
  DROP TABLE "event_types" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_news_categories_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_event_types_fk";
  
  DROP INDEX "payload_locked_documents_rels_news_categories_id_idx";
  DROP INDEX "payload_locked_documents_rels_event_types_id_idx";
  ALTER TABLE "news" ALTER COLUMN "category" SET DEFAULT 'eparchy'::"public"."enum_news_category";
  ALTER TABLE "news" ALTER COLUMN "category" SET DATA TYPE "public"."enum_news_category" USING "category"::"public"."enum_news_category";
  ALTER TABLE "_news_v" ALTER COLUMN "version_category" SET DEFAULT 'eparchy'::"public"."enum__news_v_version_category";
  ALTER TABLE "_news_v" ALTER COLUMN "version_category" SET DATA TYPE "public"."enum__news_v_version_category" USING "version_category"::"public"."enum__news_v_version_category";
  ALTER TABLE "events" ALTER COLUMN "event_type" SET DEFAULT 'liturgical'::"public"."enum_events_event_type";
  ALTER TABLE "events" ALTER COLUMN "event_type" SET DATA TYPE "public"."enum_events_event_type" USING "event_type"::"public"."enum_events_event_type";
  ALTER TABLE "_events_v" ALTER COLUMN "version_event_type" SET DEFAULT 'liturgical'::"public"."enum__events_v_version_event_type";
  ALTER TABLE "_events_v" ALTER COLUMN "version_event_type" SET DATA TYPE "public"."enum__events_v_version_event_type" USING "version_event_type"::"public"."enum__events_v_version_event_type";
  ALTER TABLE "feed_sources" ALTER COLUMN "category" SET DEFAULT 'vatican'::"public"."enum_feed_sources_category";
  ALTER TABLE "feed_sources" ALTER COLUMN "category" SET DATA TYPE "public"."enum_feed_sources_category" USING "category"::"public"."enum_feed_sources_category";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "news_categories_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "event_types_id";
  ALTER TABLE "banner_settings" DROP COLUMN "image_opacity";`)
}
