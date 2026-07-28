import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Idempotent for the same reason as 20260726_131455_bishops_collection: parts
 * of the schema may already exist in production via a dev schema-push, so every
 * statement is an "ensure it exists" rather than "create from nothing".
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_users_permissions_grant" ADD VALUE IF NOT EXISTS 'globals.pope-settings.edit';
  ALTER TYPE "public"."enum_users_permissions_revoke" ADD VALUE IF NOT EXISTS 'globals.pope-settings.edit';
  CREATE TABLE IF NOT EXISTS "pope_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"photo_id" integer,
  	"elected_at" timestamp(3) with time zone,
  	"vatican_url" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );

  CREATE TABLE IF NOT EXISTS "pope_settings_locales" (
  	"name" varchar,
  	"title" varchar,
  	"bio" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );

  DO $$ BEGIN
  ALTER TABLE "pope_settings" ADD CONSTRAINT "pope_settings_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "pope_settings_locales" ADD CONSTRAINT "pope_settings_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pope_settings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  CREATE INDEX IF NOT EXISTS "pope_settings_photo_idx" ON "pope_settings" USING btree ("photo_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "pope_settings_locales_locale_parent_id_unique" ON "pope_settings_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE IF EXISTS "pope_settings" CASCADE;
  DROP TABLE IF EXISTS "pope_settings_locales" CASCADE;
  ALTER TABLE "users_permissions_grant" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum_users_permissions_grant";
  CREATE TYPE "public"."enum_users_permissions_grant" AS ENUM('news.create', 'news.update', 'news.delete', 'news.publish', 'pages.create', 'pages.update', 'pages.delete', 'pages.publish', 'pope-messages.create', 'pope-messages.update', 'pope-messages.delete', 'pope-messages.publish', 'bishop-messages.create', 'bishop-messages.update', 'bishop-messages.delete', 'bishop-messages.publish', 'bishops.view', 'bishops.create', 'bishops.edit', 'bishops.delete', 'bishops.publish', 'bishops.set_active', 'apps.create', 'apps.update', 'apps.delete', 'apps.publish', 'offices.create', 'offices.update', 'offices.delete', 'offices.publish', 'events.create', 'events.update', 'events.delete', 'events.publish', 'events.manage-own', 'publications.create', 'publications.update', 'publications.delete', 'magazines.create', 'magazines.update', 'magazines.delete', 'archives.create', 'archives.update', 'archives.delete', 'priests.create', 'priests.update', 'priests.delete', 'vicariates.create', 'vicariates.update', 'vicariates.delete', 'schools.create', 'schools.update', 'schools.delete', 'clinics.create', 'clinics.update', 'clinics.delete', 'parishes.create', 'parishes.update', 'parishes.delete', 'parishes.update-own', 'ministries.create', 'ministries.update', 'ministries.delete', 'children-programs.create', 'children-programs.update', 'children-programs.delete', 'small-christian-communities.create', 'small-christian-communities.update', 'small-christian-communities.delete', 'small-christian-communities.manage-own', 'news-categories.manage', 'event-types.manage', 'geez-calendar.manage', 'geez-calendar.import', 'media.upload', 'media.delete', 'media.view-restricted', 'feed-sources.manage', 'subscribers.view', 'subscribers.manage', 'subscribers.delete', 'visitor-stats.view', 'visitor-stats.delete', 'contact-submissions.view', 'contact-submissions.manage', 'contact-submissions.publish-qa', 'contact-submissions.delete', 'donations.view', 'donations.manage', 'donations.config', 'donations.delete', 'users.view', 'users.manage', 'audit-log.view', 'system.maintenance-mode', 'globals.site-settings.edit', 'globals.header.edit', 'globals.footer.edit', 'globals.homepage.edit', 'globals.navigation.edit', 'globals.about-page.edit', 'globals.banner-settings.edit', 'globals.donation-settings.edit');
  ALTER TABLE "users_permissions_grant" ALTER COLUMN "value" SET DATA TYPE "public"."enum_users_permissions_grant" USING "value"::"public"."enum_users_permissions_grant";
  ALTER TABLE "users_permissions_revoke" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum_users_permissions_revoke";
  CREATE TYPE "public"."enum_users_permissions_revoke" AS ENUM('news.create', 'news.update', 'news.delete', 'news.publish', 'pages.create', 'pages.update', 'pages.delete', 'pages.publish', 'pope-messages.create', 'pope-messages.update', 'pope-messages.delete', 'pope-messages.publish', 'bishop-messages.create', 'bishop-messages.update', 'bishop-messages.delete', 'bishop-messages.publish', 'bishops.view', 'bishops.create', 'bishops.edit', 'bishops.delete', 'bishops.publish', 'bishops.set_active', 'apps.create', 'apps.update', 'apps.delete', 'apps.publish', 'offices.create', 'offices.update', 'offices.delete', 'offices.publish', 'events.create', 'events.update', 'events.delete', 'events.publish', 'events.manage-own', 'publications.create', 'publications.update', 'publications.delete', 'magazines.create', 'magazines.update', 'magazines.delete', 'archives.create', 'archives.update', 'archives.delete', 'priests.create', 'priests.update', 'priests.delete', 'vicariates.create', 'vicariates.update', 'vicariates.delete', 'schools.create', 'schools.update', 'schools.delete', 'clinics.create', 'clinics.update', 'clinics.delete', 'parishes.create', 'parishes.update', 'parishes.delete', 'parishes.update-own', 'ministries.create', 'ministries.update', 'ministries.delete', 'children-programs.create', 'children-programs.update', 'children-programs.delete', 'small-christian-communities.create', 'small-christian-communities.update', 'small-christian-communities.delete', 'small-christian-communities.manage-own', 'news-categories.manage', 'event-types.manage', 'geez-calendar.manage', 'geez-calendar.import', 'media.upload', 'media.delete', 'media.view-restricted', 'feed-sources.manage', 'subscribers.view', 'subscribers.manage', 'subscribers.delete', 'visitor-stats.view', 'visitor-stats.delete', 'contact-submissions.view', 'contact-submissions.manage', 'contact-submissions.publish-qa', 'contact-submissions.delete', 'donations.view', 'donations.manage', 'donations.config', 'donations.delete', 'users.view', 'users.manage', 'audit-log.view', 'system.maintenance-mode', 'globals.site-settings.edit', 'globals.header.edit', 'globals.footer.edit', 'globals.homepage.edit', 'globals.navigation.edit', 'globals.about-page.edit', 'globals.banner-settings.edit', 'globals.donation-settings.edit');
  ALTER TABLE "users_permissions_revoke" ALTER COLUMN "value" SET DATA TYPE "public"."enum_users_permissions_revoke" USING "value"::"public"."enum_users_permissions_revoke";`)
}
