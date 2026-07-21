import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_offices_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__offices_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__offices_v_published_locale" AS ENUM('en', 'ti');
  CREATE TABLE "offices_announcements" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"date" timestamp(3) with time zone
  );
  
  CREATE TABLE "offices_announcements_locales" (
  	"title" varchar,
  	"body" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "offices_updates" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"date" timestamp(3) with time zone,
  	"image_id" integer
  );
  
  CREATE TABLE "offices_updates_locales" (
  	"title" varchar,
  	"excerpt" varchar,
  	"body" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "offices_events" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"start_date" timestamp(3) with time zone,
  	"end_date" timestamp(3) with time zone
  );
  
  CREATE TABLE "offices_events_locales" (
  	"title" varchar,
  	"location" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "offices" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"order" numeric,
  	"featured_image_id" integer,
  	"leader_phone" varchar,
  	"leader_email" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_offices_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "offices_locales" (
  	"name" varchar,
  	"tagline" varchar,
  	"about" jsonb,
  	"leader_name" varchar,
  	"leader_role" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_offices_v_version_announcements" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"date" timestamp(3) with time zone,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_offices_v_version_announcements_locales" (
  	"title" varchar,
  	"body" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_offices_v_version_updates" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"date" timestamp(3) with time zone,
  	"image_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_offices_v_version_updates_locales" (
  	"title" varchar,
  	"excerpt" varchar,
  	"body" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_offices_v_version_events" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"start_date" timestamp(3) with time zone,
  	"end_date" timestamp(3) with time zone,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_offices_v_version_events_locales" (
  	"title" varchar,
  	"location" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_offices_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_slug" varchar,
  	"version_order" numeric,
  	"version_featured_image_id" integer,
  	"version_leader_phone" varchar,
  	"version_leader_email" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__offices_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__offices_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_offices_v_locales" (
  	"version_name" varchar,
  	"version_tagline" varchar,
  	"version_about" jsonb,
  	"version_leader_name" varchar,
  	"version_leader_role" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "offices_id" integer;
  ALTER TABLE "offices_announcements" ADD CONSTRAINT "offices_announcements_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."offices"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "offices_announcements_locales" ADD CONSTRAINT "offices_announcements_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."offices_announcements"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "offices_updates" ADD CONSTRAINT "offices_updates_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "offices_updates" ADD CONSTRAINT "offices_updates_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."offices"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "offices_updates_locales" ADD CONSTRAINT "offices_updates_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."offices_updates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "offices_events" ADD CONSTRAINT "offices_events_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."offices"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "offices_events_locales" ADD CONSTRAINT "offices_events_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."offices_events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "offices" ADD CONSTRAINT "offices_featured_image_id_media_id_fk" FOREIGN KEY ("featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "offices_locales" ADD CONSTRAINT "offices_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."offices"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_offices_v_version_announcements" ADD CONSTRAINT "_offices_v_version_announcements_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_offices_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_offices_v_version_announcements_locales" ADD CONSTRAINT "_offices_v_version_announcements_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_offices_v_version_announcements"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_offices_v_version_updates" ADD CONSTRAINT "_offices_v_version_updates_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_offices_v_version_updates" ADD CONSTRAINT "_offices_v_version_updates_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_offices_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_offices_v_version_updates_locales" ADD CONSTRAINT "_offices_v_version_updates_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_offices_v_version_updates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_offices_v_version_events" ADD CONSTRAINT "_offices_v_version_events_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_offices_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_offices_v_version_events_locales" ADD CONSTRAINT "_offices_v_version_events_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_offices_v_version_events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_offices_v" ADD CONSTRAINT "_offices_v_parent_id_offices_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."offices"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_offices_v" ADD CONSTRAINT "_offices_v_version_featured_image_id_media_id_fk" FOREIGN KEY ("version_featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_offices_v_locales" ADD CONSTRAINT "_offices_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_offices_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "offices_announcements_order_idx" ON "offices_announcements" USING btree ("_order");
  CREATE INDEX "offices_announcements_parent_id_idx" ON "offices_announcements" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "offices_announcements_locales_locale_parent_id_unique" ON "offices_announcements_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "offices_updates_order_idx" ON "offices_updates" USING btree ("_order");
  CREATE INDEX "offices_updates_parent_id_idx" ON "offices_updates" USING btree ("_parent_id");
  CREATE INDEX "offices_updates_image_idx" ON "offices_updates" USING btree ("image_id");
  CREATE UNIQUE INDEX "offices_updates_locales_locale_parent_id_unique" ON "offices_updates_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "offices_events_order_idx" ON "offices_events" USING btree ("_order");
  CREATE INDEX "offices_events_parent_id_idx" ON "offices_events" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "offices_events_locales_locale_parent_id_unique" ON "offices_events_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "offices_slug_idx" ON "offices" USING btree ("slug");
  CREATE INDEX "offices_featured_image_idx" ON "offices" USING btree ("featured_image_id");
  CREATE INDEX "offices_updated_at_idx" ON "offices" USING btree ("updated_at");
  CREATE INDEX "offices_created_at_idx" ON "offices" USING btree ("created_at");
  CREATE INDEX "offices__status_idx" ON "offices" USING btree ("_status");
  CREATE UNIQUE INDEX "offices_locales_locale_parent_id_unique" ON "offices_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_offices_v_version_announcements_order_idx" ON "_offices_v_version_announcements" USING btree ("_order");
  CREATE INDEX "_offices_v_version_announcements_parent_id_idx" ON "_offices_v_version_announcements" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_offices_v_version_announcements_locales_locale_parent_id_un" ON "_offices_v_version_announcements_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_offices_v_version_updates_order_idx" ON "_offices_v_version_updates" USING btree ("_order");
  CREATE INDEX "_offices_v_version_updates_parent_id_idx" ON "_offices_v_version_updates" USING btree ("_parent_id");
  CREATE INDEX "_offices_v_version_updates_image_idx" ON "_offices_v_version_updates" USING btree ("image_id");
  CREATE UNIQUE INDEX "_offices_v_version_updates_locales_locale_parent_id_unique" ON "_offices_v_version_updates_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_offices_v_version_events_order_idx" ON "_offices_v_version_events" USING btree ("_order");
  CREATE INDEX "_offices_v_version_events_parent_id_idx" ON "_offices_v_version_events" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_offices_v_version_events_locales_locale_parent_id_unique" ON "_offices_v_version_events_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_offices_v_parent_idx" ON "_offices_v" USING btree ("parent_id");
  CREATE INDEX "_offices_v_version_version_slug_idx" ON "_offices_v" USING btree ("version_slug");
  CREATE INDEX "_offices_v_version_version_featured_image_idx" ON "_offices_v" USING btree ("version_featured_image_id");
  CREATE INDEX "_offices_v_version_version_updated_at_idx" ON "_offices_v" USING btree ("version_updated_at");
  CREATE INDEX "_offices_v_version_version_created_at_idx" ON "_offices_v" USING btree ("version_created_at");
  CREATE INDEX "_offices_v_version_version__status_idx" ON "_offices_v" USING btree ("version__status");
  CREATE INDEX "_offices_v_created_at_idx" ON "_offices_v" USING btree ("created_at");
  CREATE INDEX "_offices_v_updated_at_idx" ON "_offices_v" USING btree ("updated_at");
  CREATE INDEX "_offices_v_snapshot_idx" ON "_offices_v" USING btree ("snapshot");
  CREATE INDEX "_offices_v_published_locale_idx" ON "_offices_v" USING btree ("published_locale");
  CREATE INDEX "_offices_v_latest_idx" ON "_offices_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_offices_v_locales_locale_parent_id_unique" ON "_offices_v_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_offices_fk" FOREIGN KEY ("offices_id") REFERENCES "public"."offices"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_offices_id_idx" ON "payload_locked_documents_rels" USING btree ("offices_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "offices_announcements" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "offices_announcements_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "offices_updates" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "offices_updates_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "offices_events" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "offices_events_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "offices" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "offices_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_offices_v_version_announcements" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_offices_v_version_announcements_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_offices_v_version_updates" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_offices_v_version_updates_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_offices_v_version_events" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_offices_v_version_events_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_offices_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_offices_v_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "offices_announcements" CASCADE;
  DROP TABLE "offices_announcements_locales" CASCADE;
  DROP TABLE "offices_updates" CASCADE;
  DROP TABLE "offices_updates_locales" CASCADE;
  DROP TABLE "offices_events" CASCADE;
  DROP TABLE "offices_events_locales" CASCADE;
  DROP TABLE "offices" CASCADE;
  DROP TABLE "offices_locales" CASCADE;
  DROP TABLE "_offices_v_version_announcements" CASCADE;
  DROP TABLE "_offices_v_version_announcements_locales" CASCADE;
  DROP TABLE "_offices_v_version_updates" CASCADE;
  DROP TABLE "_offices_v_version_updates_locales" CASCADE;
  DROP TABLE "_offices_v_version_events" CASCADE;
  DROP TABLE "_offices_v_version_events_locales" CASCADE;
  DROP TABLE "_offices_v" CASCADE;
  DROP TABLE "_offices_v_locales" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_offices_fk";
  
  DROP INDEX "payload_locked_documents_rels_offices_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "offices_id";
  DROP TYPE "public"."enum_offices_status";
  DROP TYPE "public"."enum__offices_v_version_status";
  DROP TYPE "public"."enum__offices_v_published_locale";`)
}
