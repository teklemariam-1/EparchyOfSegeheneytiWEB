import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * `ADD VALUE IF NOT EXISTS` is deliberate, not generated. The bishops migration
 * failed in production on exactly this — a plain ADD VALUE aborts if the label
 * is already present, which happens whenever a database has been schema-pushed
 * ahead of its migrations. Guarding it costs nothing and makes the migration
 * safe to re-run.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_sacramental_requests_status" AS ENUM('new', 'in-progress', 'waiting', 'completed', 'declined');
  CREATE TYPE "public"."enum_sacramental_requests_sacrament" AS ENUM('baptism', 'confirmation', 'first-communion', 'marriage', 'freedom-to-marry', 'other');
  ALTER TYPE "public"."enum_users_permissions_grant" ADD VALUE IF NOT EXISTS 'sacramental-requests.view' BEFORE 'donations.view';
  ALTER TYPE "public"."enum_users_permissions_grant" ADD VALUE IF NOT EXISTS 'sacramental-requests.manage' BEFORE 'donations.view';
  ALTER TYPE "public"."enum_users_permissions_grant" ADD VALUE IF NOT EXISTS 'sacramental-requests.delete' BEFORE 'donations.view';
  ALTER TYPE "public"."enum_users_permissions_revoke" ADD VALUE IF NOT EXISTS 'sacramental-requests.view' BEFORE 'donations.view';
  ALTER TYPE "public"."enum_users_permissions_revoke" ADD VALUE IF NOT EXISTS 'sacramental-requests.manage' BEFORE 'donations.view';
  ALTER TYPE "public"."enum_users_permissions_revoke" ADD VALUE IF NOT EXISTS 'sacramental-requests.delete' BEFORE 'donations.view';
  CREATE TABLE "sacramental_requests" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"status" "enum_sacramental_requests_status" DEFAULT 'new' NOT NULL,
  	"sacrament" "enum_sacramental_requests_sacrament" NOT NULL,
  	"subject_name" varchar NOT NULL,
  	"parish" varchar,
  	"approximate_date" varchar,
  	"father_name" varchar,
  	"mother_name" varchar,
  	"requester_name" varchar NOT NULL,
  	"requester_email" varchar NOT NULL,
  	"requester_phone" varchar,
  	"relationship" varchar,
  	"purpose" varchar,
  	"staff_notes" varchar,
  	"submitted_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "sacramental_requests_id" integer;
  CREATE INDEX "sacramental_requests_updated_at_idx" ON "sacramental_requests" USING btree ("updated_at");
  CREATE INDEX "sacramental_requests_created_at_idx" ON "sacramental_requests" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_sacramental_requests_fk" FOREIGN KEY ("sacramental_requests_id") REFERENCES "public"."sacramental_requests"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_sacramental_requests_id_idx" ON "payload_locked_documents_rels" USING btree ("sacramental_requests_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "sacramental_requests" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "sacramental_requests" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_sacramental_requests_fk";
  
  ALTER TABLE "users_permissions_grant" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum_users_permissions_grant";
  CREATE TYPE "public"."enum_users_permissions_grant" AS ENUM('news.create', 'news.update', 'news.delete', 'news.publish', 'pages.create', 'pages.update', 'pages.delete', 'pages.publish', 'pope-messages.create', 'pope-messages.update', 'pope-messages.delete', 'pope-messages.publish', 'bishop-messages.create', 'bishop-messages.update', 'bishop-messages.delete', 'bishop-messages.publish', 'bishops.view', 'bishops.create', 'bishops.edit', 'bishops.delete', 'bishops.publish', 'bishops.set_active', 'apps.create', 'apps.update', 'apps.delete', 'apps.publish', 'offices.create', 'offices.update', 'offices.delete', 'offices.publish', 'events.create', 'events.update', 'events.delete', 'events.publish', 'events.manage-own', 'publications.create', 'publications.update', 'publications.delete', 'magazines.create', 'magazines.update', 'magazines.delete', 'archives.create', 'archives.update', 'archives.delete', 'priests.create', 'priests.update', 'priests.delete', 'vicariates.create', 'vicariates.update', 'vicariates.delete', 'schools.create', 'schools.update', 'schools.delete', 'clinics.create', 'clinics.update', 'clinics.delete', 'parishes.create', 'parishes.update', 'parishes.delete', 'parishes.update-own', 'ministries.create', 'ministries.update', 'ministries.delete', 'children-programs.create', 'children-programs.update', 'children-programs.delete', 'small-christian-communities.create', 'small-christian-communities.update', 'small-christian-communities.delete', 'small-christian-communities.manage-own', 'news-categories.manage', 'event-types.manage', 'geez-calendar.manage', 'geez-calendar.import', 'media.upload', 'media.delete', 'media.view-restricted', 'feed-sources.manage', 'subscribers.view', 'subscribers.manage', 'subscribers.delete', 'visitor-stats.view', 'visitor-stats.delete', 'contact-submissions.view', 'contact-submissions.manage', 'contact-submissions.publish-qa', 'contact-submissions.delete', 'donations.view', 'donations.manage', 'donations.config', 'donations.delete', 'users.view', 'users.manage', 'audit-log.view', 'system.maintenance-mode', 'globals.site-settings.edit', 'globals.header.edit', 'globals.footer.edit', 'globals.homepage.edit', 'globals.navigation.edit', 'globals.about-page.edit', 'globals.banner-settings.edit', 'globals.donation-settings.edit', 'globals.pope-settings.edit');
  ALTER TABLE "users_permissions_grant" ALTER COLUMN "value" SET DATA TYPE "public"."enum_users_permissions_grant" USING "value"::"public"."enum_users_permissions_grant";
  ALTER TABLE "users_permissions_revoke" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum_users_permissions_revoke";
  CREATE TYPE "public"."enum_users_permissions_revoke" AS ENUM('news.create', 'news.update', 'news.delete', 'news.publish', 'pages.create', 'pages.update', 'pages.delete', 'pages.publish', 'pope-messages.create', 'pope-messages.update', 'pope-messages.delete', 'pope-messages.publish', 'bishop-messages.create', 'bishop-messages.update', 'bishop-messages.delete', 'bishop-messages.publish', 'bishops.view', 'bishops.create', 'bishops.edit', 'bishops.delete', 'bishops.publish', 'bishops.set_active', 'apps.create', 'apps.update', 'apps.delete', 'apps.publish', 'offices.create', 'offices.update', 'offices.delete', 'offices.publish', 'events.create', 'events.update', 'events.delete', 'events.publish', 'events.manage-own', 'publications.create', 'publications.update', 'publications.delete', 'magazines.create', 'magazines.update', 'magazines.delete', 'archives.create', 'archives.update', 'archives.delete', 'priests.create', 'priests.update', 'priests.delete', 'vicariates.create', 'vicariates.update', 'vicariates.delete', 'schools.create', 'schools.update', 'schools.delete', 'clinics.create', 'clinics.update', 'clinics.delete', 'parishes.create', 'parishes.update', 'parishes.delete', 'parishes.update-own', 'ministries.create', 'ministries.update', 'ministries.delete', 'children-programs.create', 'children-programs.update', 'children-programs.delete', 'small-christian-communities.create', 'small-christian-communities.update', 'small-christian-communities.delete', 'small-christian-communities.manage-own', 'news-categories.manage', 'event-types.manage', 'geez-calendar.manage', 'geez-calendar.import', 'media.upload', 'media.delete', 'media.view-restricted', 'feed-sources.manage', 'subscribers.view', 'subscribers.manage', 'subscribers.delete', 'visitor-stats.view', 'visitor-stats.delete', 'contact-submissions.view', 'contact-submissions.manage', 'contact-submissions.publish-qa', 'contact-submissions.delete', 'donations.view', 'donations.manage', 'donations.config', 'donations.delete', 'users.view', 'users.manage', 'audit-log.view', 'system.maintenance-mode', 'globals.site-settings.edit', 'globals.header.edit', 'globals.footer.edit', 'globals.homepage.edit', 'globals.navigation.edit', 'globals.about-page.edit', 'globals.banner-settings.edit', 'globals.donation-settings.edit', 'globals.pope-settings.edit');
  ALTER TABLE "users_permissions_revoke" ALTER COLUMN "value" SET DATA TYPE "public"."enum_users_permissions_revoke" USING "value"::"public"."enum_users_permissions_revoke";
  DROP INDEX "payload_locked_documents_rels_sacramental_requests_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "sacramental_requests_id";
  DROP TYPE "public"."enum_sacramental_requests_status";
  DROP TYPE "public"."enum_sacramental_requests_sacrament";`)
}
