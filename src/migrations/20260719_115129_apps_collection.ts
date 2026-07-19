import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_apps_resource_type" AS ENUM('android-app', 'ios-app', 'download');
  CREATE TYPE "public"."enum_apps_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__apps_v_version_resource_type" AS ENUM('android-app', 'ios-app', 'download');
  CREATE TYPE "public"."enum__apps_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__apps_v_published_locale" AS ENUM('en', 'ti');
  CREATE TABLE "apps" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"resource_type" "enum_apps_resource_type" DEFAULT 'android-app',
  	"published_at" timestamp(3) with time zone,
  	"version" varchar,
  	"banner_image_id" integer,
  	"icon_id" integer,
  	"file_id" integer,
  	"file_size_label" varchar,
  	"play_store_url" varchar,
  	"app_store_url" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_apps_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "apps_locales" (
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_apps_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_slug" varchar,
  	"version_resource_type" "enum__apps_v_version_resource_type" DEFAULT 'android-app',
  	"version_published_at" timestamp(3) with time zone,
  	"version_version" varchar,
  	"version_banner_image_id" integer,
  	"version_icon_id" integer,
  	"version_file_id" integer,
  	"version_file_size_label" varchar,
  	"version_play_store_url" varchar,
  	"version_app_store_url" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__apps_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__apps_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_apps_v_locales" (
  	"version_title" varchar,
  	"version_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "apps_id" integer;
  ALTER TABLE "apps" ADD CONSTRAINT "apps_banner_image_id_media_id_fk" FOREIGN KEY ("banner_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "apps" ADD CONSTRAINT "apps_icon_id_media_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "apps" ADD CONSTRAINT "apps_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "apps_locales" ADD CONSTRAINT "apps_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."apps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_apps_v" ADD CONSTRAINT "_apps_v_parent_id_apps_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."apps"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_apps_v" ADD CONSTRAINT "_apps_v_version_banner_image_id_media_id_fk" FOREIGN KEY ("version_banner_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_apps_v" ADD CONSTRAINT "_apps_v_version_icon_id_media_id_fk" FOREIGN KEY ("version_icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_apps_v" ADD CONSTRAINT "_apps_v_version_file_id_media_id_fk" FOREIGN KEY ("version_file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_apps_v_locales" ADD CONSTRAINT "_apps_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_apps_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "apps_slug_idx" ON "apps" USING btree ("slug");
  CREATE INDEX "apps_published_at_idx" ON "apps" USING btree ("published_at");
  CREATE INDEX "apps_banner_image_idx" ON "apps" USING btree ("banner_image_id");
  CREATE INDEX "apps_icon_idx" ON "apps" USING btree ("icon_id");
  CREATE INDEX "apps_file_idx" ON "apps" USING btree ("file_id");
  CREATE INDEX "apps_updated_at_idx" ON "apps" USING btree ("updated_at");
  CREATE INDEX "apps_created_at_idx" ON "apps" USING btree ("created_at");
  CREATE INDEX "apps__status_idx" ON "apps" USING btree ("_status");
  CREATE UNIQUE INDEX "apps_locales_locale_parent_id_unique" ON "apps_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_apps_v_parent_idx" ON "_apps_v" USING btree ("parent_id");
  CREATE INDEX "_apps_v_version_version_slug_idx" ON "_apps_v" USING btree ("version_slug");
  CREATE INDEX "_apps_v_version_version_published_at_idx" ON "_apps_v" USING btree ("version_published_at");
  CREATE INDEX "_apps_v_version_version_banner_image_idx" ON "_apps_v" USING btree ("version_banner_image_id");
  CREATE INDEX "_apps_v_version_version_icon_idx" ON "_apps_v" USING btree ("version_icon_id");
  CREATE INDEX "_apps_v_version_version_file_idx" ON "_apps_v" USING btree ("version_file_id");
  CREATE INDEX "_apps_v_version_version_updated_at_idx" ON "_apps_v" USING btree ("version_updated_at");
  CREATE INDEX "_apps_v_version_version_created_at_idx" ON "_apps_v" USING btree ("version_created_at");
  CREATE INDEX "_apps_v_version_version__status_idx" ON "_apps_v" USING btree ("version__status");
  CREATE INDEX "_apps_v_created_at_idx" ON "_apps_v" USING btree ("created_at");
  CREATE INDEX "_apps_v_updated_at_idx" ON "_apps_v" USING btree ("updated_at");
  CREATE INDEX "_apps_v_snapshot_idx" ON "_apps_v" USING btree ("snapshot");
  CREATE INDEX "_apps_v_published_locale_idx" ON "_apps_v" USING btree ("published_locale");
  CREATE INDEX "_apps_v_latest_idx" ON "_apps_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_apps_v_locales_locale_parent_id_unique" ON "_apps_v_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_apps_fk" FOREIGN KEY ("apps_id") REFERENCES "public"."apps"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_apps_id_idx" ON "payload_locked_documents_rels" USING btree ("apps_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "apps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "apps_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_apps_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_apps_v_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "apps" CASCADE;
  DROP TABLE "apps_locales" CASCADE;
  DROP TABLE "_apps_v" CASCADE;
  DROP TABLE "_apps_v_locales" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_apps_fk";
  
  DROP INDEX "payload_locked_documents_rels_apps_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "apps_id";
  DROP TYPE "public"."enum_apps_resource_type";
  DROP TYPE "public"."enum_apps_status";
  DROP TYPE "public"."enum__apps_v_version_resource_type";
  DROP TYPE "public"."enum__apps_v_version_status";
  DROP TYPE "public"."enum__apps_v_published_locale";`)
}
