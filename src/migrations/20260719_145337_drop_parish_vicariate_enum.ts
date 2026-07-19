import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "vicariates" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"order" numeric,
  	"featured_image_id" integer,
  	"vicar_id" integer,
  	"contact_phone" varchar,
  	"contact_email" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "vicariates_locales" (
  	"name" varchar NOT NULL,
  	"seat" varchar,
  	"description" varchar,
  	"about" jsonb,
  	"contact_address" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "vicariates_id" integer;
  ALTER TABLE "vicariates" ADD CONSTRAINT "vicariates_featured_image_id_media_id_fk" FOREIGN KEY ("featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "vicariates" ADD CONSTRAINT "vicariates_vicar_id_priests_id_fk" FOREIGN KEY ("vicar_id") REFERENCES "public"."priests"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "vicariates_locales" ADD CONSTRAINT "vicariates_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."vicariates"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "vicariates_slug_idx" ON "vicariates" USING btree ("slug");
  CREATE INDEX "vicariates_featured_image_idx" ON "vicariates" USING btree ("featured_image_id");
  CREATE INDEX "vicariates_vicar_idx" ON "vicariates" USING btree ("vicar_id");
  CREATE INDEX "vicariates_updated_at_idx" ON "vicariates" USING btree ("updated_at");
  CREATE INDEX "vicariates_created_at_idx" ON "vicariates" USING btree ("created_at");
  CREATE UNIQUE INDEX "vicariates_locales_locale_parent_id_unique" ON "vicariates_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_vicariates_fk" FOREIGN KEY ("vicariates_id") REFERENCES "public"."vicariates"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_vicariates_id_idx" ON "payload_locked_documents_rels" USING btree ("vicariates_id");
  ALTER TABLE "parishes" DROP COLUMN "vicariate";
  DROP TYPE "public"."enum_parishes_vicariate";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_parishes_vicariate" AS ENUM('segeneyti', 'adi-keyih', 'dekemhare', 'adi-ugri', 'diaspora');
  ALTER TABLE "vicariates" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "vicariates_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "vicariates" CASCADE;
  DROP TABLE "vicariates_locales" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_vicariates_fk";
  
  DROP INDEX "payload_locked_documents_rels_vicariates_id_idx";
  ALTER TABLE "parishes" ADD COLUMN "vicariate" "enum_parishes_vicariate";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "vicariates_id";`)
}
