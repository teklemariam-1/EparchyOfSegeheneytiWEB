import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * `ADD VALUE IF NOT EXISTS` is hand-applied, as on every permission-enum
 * migration since the bishops one failed in production on exactly this: a
 * plain ADD VALUE aborts when the label already exists, which happens whenever
 * a database was schema-pushed ahead of its migrations.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_mass_intentions_status" AS ENUM('new', 'scheduled', 'celebrated', 'declined');
  CREATE TYPE "public"."enum_mass_intentions_intention_type" AS ENUM('repose', 'anniversary', 'healing', 'thanksgiving', 'special');
  ALTER TYPE "public"."enum_users_permissions_grant" ADD VALUE IF NOT EXISTS 'mass-intentions.view' BEFORE 'donations.view';
  ALTER TYPE "public"."enum_users_permissions_grant" ADD VALUE IF NOT EXISTS 'mass-intentions.manage' BEFORE 'donations.view';
  ALTER TYPE "public"."enum_users_permissions_grant" ADD VALUE IF NOT EXISTS 'mass-intentions.delete' BEFORE 'donations.view';
  ALTER TYPE "public"."enum_users_permissions_revoke" ADD VALUE IF NOT EXISTS 'mass-intentions.view' BEFORE 'donations.view';
  ALTER TYPE "public"."enum_users_permissions_revoke" ADD VALUE IF NOT EXISTS 'mass-intentions.manage' BEFORE 'donations.view';
  ALTER TYPE "public"."enum_users_permissions_revoke" ADD VALUE IF NOT EXISTS 'mass-intentions.delete' BEFORE 'donations.view';
  CREATE TABLE "mass_intentions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"status" "enum_mass_intentions_status" DEFAULT 'new' NOT NULL,
  	"scheduled_for" timestamp(3) with time zone,
  	"intention_type" "enum_mass_intentions_intention_type" NOT NULL,
  	"for_whom" varchar NOT NULL,
  	"parish" varchar,
  	"preferred_date" varchar,
  	"details" varchar,
  	"requester_name" varchar NOT NULL,
  	"requester_email" varchar NOT NULL,
  	"requester_phone" varchar,
  	"staff_notes" varchar,
  	"submitted_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "mass_intentions_id" integer;
  CREATE INDEX "mass_intentions_updated_at_idx" ON "mass_intentions" USING btree ("updated_at");
  CREATE INDEX "mass_intentions_created_at_idx" ON "mass_intentions" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_mass_intentions_fk" FOREIGN KEY ("mass_intentions_id") REFERENCES "public"."mass_intentions"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_mass_intentions_id_idx" ON "payload_locked_documents_rels" USING btree ("mass_intentions_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "mass_intentions" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "mass_intentions" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_mass_intentions_fk";
  
  ALTER TABLE "users_permissions_grant" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum_users_permissions_grant";
  CREATE TYPE "public"."enum_users_permissions_grant" AS ENUM('news.create', 'news.update', 'news.delete', 'news.publish', 'pages.create', 'pages.update', 'pages.delete', 'pages.publish', 'pope-messages.create', 'pope-messages.update', 'pope-messages.delete', 'pope-messages.publish', 'bishop-messages.create', 'bishop-messages.update', 'bishop-messages.delete', 'bishop-messages.publish', 'bishops.view', 'bishops.create', 'bishops.edit', 'bishops.delete', 'bishops.publish', 'bishops.set_active', 'apps.create', 'apps.update', 'apps.delete', 'apps.publish', 'offices.create', 'offices.update', 'offices.delete', 'offices.publish', 'events.create', 'events.update', 'events.delete', 'events.publish', 'events.manage-own', 'publications.create', 'publications.update', 'publications.delete', 'magazines.create', 'magazines.update', 'magazines.delete', 'archives.create', 'archives.update', 'archives.delete', 'priests.create', 'priests.update', 'priests.delete', 'vicariates.create', 'vicariates.update', 'vicariates.delete', 'schools.create', 'schools.update', 'schools.delete', 'clinics.create', 'clinics.update', 'clinics.delete', 'parishes.create', 'parishes.update', 'parishes.delete', 'parishes.update-own', 'ministries.create', 'ministries.update', 'ministries.delete', 'children-programs.create', 'children-programs.update', 'children-programs.delete', 'small-christian-communities.create', 'small-christian-communities.update', 'small-christian-communities.delete', 'small-christian-communities.manage-own', 'news-categories.manage', 'event-types.manage', 'geez-calendar.manage', 'geez-calendar.import', 'media.upload', 'media.delete', 'media.view-restricted', 'feed-sources.manage', 'subscribers.view', 'subscribers.manage', 'subscribers.delete', 'visitor-stats.view', 'visitor-stats.delete', 'contact-submissions.view', 'contact-submissions.manage', 'contact-submissions.publish-qa', 'contact-submissions.delete', 'sacramental-requests.view', 'sacramental-requests.manage', 'sacramental-requests.delete', 'donations.view', 'donations.manage', 'donations.config', 'donations.delete', 'users.view', 'users.manage', 'audit-log.view', 'system.maintenance-mode', 'globals.site-settings.edit', 'globals.header.edit', 'globals.footer.edit', 'globals.homepage.edit', 'globals.navigation.edit', 'globals.about-page.edit', 'globals.banner-settings.edit', 'globals.donation-settings.edit', 'globals.pope-settings.edit');
  ALTER TABLE "users_permissions_grant" ALTER COLUMN "value" SET DATA TYPE "public"."enum_users_permissions_grant" USING "value"::"public"."enum_users_permissions_grant";
  ALTER TABLE "users_permissions_revoke" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum_users_permissions_revoke";
  CREATE TYPE "public"."enum_users_permissions_revoke" AS ENUM('news.create', 'news.update', 'news.delete', 'news.publish', 'pages.create', 'pages.update', 'pages.delete', 'pages.publish', 'pope-messages.create', 'pope-messages.update', 'pope-messages.delete', 'pope-messages.publish', 'bishop-messages.create', 'bishop-messages.update', 'bishop-messages.delete', 'bishop-messages.publish', 'bishops.view', 'bishops.create', 'bishops.edit', 'bishops.delete', 'bishops.publish', 'bishops.set_active', 'apps.create', 'apps.update', 'apps.delete', 'apps.publish', 'offices.create', 'offices.update', 'offices.delete', 'offices.publish', 'events.create', 'events.update', 'events.delete', 'events.publish', 'events.manage-own', 'publications.create', 'publications.update', 'publications.delete', 'magazines.create', 'magazines.update', 'magazines.delete', 'archives.create', 'archives.update', 'archives.delete', 'priests.create', 'priests.update', 'priests.delete', 'vicariates.create', 'vicariates.update', 'vicariates.delete', 'schools.create', 'schools.update', 'schools.delete', 'clinics.create', 'clinics.update', 'clinics.delete', 'parishes.create', 'parishes.update', 'parishes.delete', 'parishes.update-own', 'ministries.create', 'ministries.update', 'ministries.delete', 'children-programs.create', 'children-programs.update', 'children-programs.delete', 'small-christian-communities.create', 'small-christian-communities.update', 'small-christian-communities.delete', 'small-christian-communities.manage-own', 'news-categories.manage', 'event-types.manage', 'geez-calendar.manage', 'geez-calendar.import', 'media.upload', 'media.delete', 'media.view-restricted', 'feed-sources.manage', 'subscribers.view', 'subscribers.manage', 'subscribers.delete', 'visitor-stats.view', 'visitor-stats.delete', 'contact-submissions.view', 'contact-submissions.manage', 'contact-submissions.publish-qa', 'contact-submissions.delete', 'sacramental-requests.view', 'sacramental-requests.manage', 'sacramental-requests.delete', 'donations.view', 'donations.manage', 'donations.config', 'donations.delete', 'users.view', 'users.manage', 'audit-log.view', 'system.maintenance-mode', 'globals.site-settings.edit', 'globals.header.edit', 'globals.footer.edit', 'globals.homepage.edit', 'globals.navigation.edit', 'globals.about-page.edit', 'globals.banner-settings.edit', 'globals.donation-settings.edit', 'globals.pope-settings.edit');
  ALTER TABLE "users_permissions_revoke" ALTER COLUMN "value" SET DATA TYPE "public"."enum_users_permissions_revoke" USING "value"::"public"."enum_users_permissions_revoke";
  DROP INDEX "payload_locked_documents_rels_mass_intentions_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "mass_intentions_id";
  DROP TYPE "public"."enum_mass_intentions_status";
  DROP TYPE "public"."enum_mass_intentions_intention_type";`)
}
