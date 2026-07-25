import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_permissions_grant" AS ENUM('news.create', 'news.update', 'news.delete', 'news.publish', 'pages.create', 'pages.update', 'pages.delete', 'pages.publish', 'pope-messages.create', 'pope-messages.update', 'pope-messages.delete', 'pope-messages.publish', 'bishop-messages.create', 'bishop-messages.update', 'bishop-messages.delete', 'bishop-messages.publish', 'apps.create', 'apps.update', 'apps.delete', 'apps.publish', 'offices.create', 'offices.update', 'offices.delete', 'offices.publish', 'events.create', 'events.update', 'events.delete', 'events.publish', 'events.manage-own', 'publications.create', 'publications.update', 'publications.delete', 'magazines.create', 'magazines.update', 'magazines.delete', 'archives.create', 'archives.update', 'archives.delete', 'priests.create', 'priests.update', 'priests.delete', 'vicariates.create', 'vicariates.update', 'vicariates.delete', 'schools.create', 'schools.update', 'schools.delete', 'clinics.create', 'clinics.update', 'clinics.delete', 'parishes.create', 'parishes.update', 'parishes.delete', 'parishes.update-own', 'ministries.create', 'ministries.update', 'ministries.delete', 'children-programs.create', 'children-programs.update', 'children-programs.delete', 'small-christian-communities.create', 'small-christian-communities.update', 'small-christian-communities.delete', 'small-christian-communities.manage-own', 'news-categories.manage', 'event-types.manage', 'geez-calendar.manage', 'geez-calendar.import', 'media.upload', 'media.delete', 'media.view-restricted', 'feed-sources.manage', 'subscribers.view', 'subscribers.manage', 'subscribers.delete', 'visitor-stats.view', 'visitor-stats.delete', 'contact-submissions.view', 'contact-submissions.manage', 'contact-submissions.publish-qa', 'contact-submissions.delete', 'donations.view', 'donations.manage', 'donations.config', 'donations.delete', 'users.view', 'users.manage', 'audit-log.view', 'system.maintenance-mode', 'globals.site-settings.edit', 'globals.header.edit', 'globals.footer.edit', 'globals.homepage.edit', 'globals.navigation.edit', 'globals.about-page.edit', 'globals.banner-settings.edit', 'globals.donation-settings.edit');
  CREATE TYPE "public"."enum_users_permissions_revoke" AS ENUM('news.create', 'news.update', 'news.delete', 'news.publish', 'pages.create', 'pages.update', 'pages.delete', 'pages.publish', 'pope-messages.create', 'pope-messages.update', 'pope-messages.delete', 'pope-messages.publish', 'bishop-messages.create', 'bishop-messages.update', 'bishop-messages.delete', 'bishop-messages.publish', 'apps.create', 'apps.update', 'apps.delete', 'apps.publish', 'offices.create', 'offices.update', 'offices.delete', 'offices.publish', 'events.create', 'events.update', 'events.delete', 'events.publish', 'events.manage-own', 'publications.create', 'publications.update', 'publications.delete', 'magazines.create', 'magazines.update', 'magazines.delete', 'archives.create', 'archives.update', 'archives.delete', 'priests.create', 'priests.update', 'priests.delete', 'vicariates.create', 'vicariates.update', 'vicariates.delete', 'schools.create', 'schools.update', 'schools.delete', 'clinics.create', 'clinics.update', 'clinics.delete', 'parishes.create', 'parishes.update', 'parishes.delete', 'parishes.update-own', 'ministries.create', 'ministries.update', 'ministries.delete', 'children-programs.create', 'children-programs.update', 'children-programs.delete', 'small-christian-communities.create', 'small-christian-communities.update', 'small-christian-communities.delete', 'small-christian-communities.manage-own', 'news-categories.manage', 'event-types.manage', 'geez-calendar.manage', 'geez-calendar.import', 'media.upload', 'media.delete', 'media.view-restricted', 'feed-sources.manage', 'subscribers.view', 'subscribers.manage', 'subscribers.delete', 'visitor-stats.view', 'visitor-stats.delete', 'contact-submissions.view', 'contact-submissions.manage', 'contact-submissions.publish-qa', 'contact-submissions.delete', 'donations.view', 'donations.manage', 'donations.config', 'donations.delete', 'users.view', 'users.manage', 'audit-log.view', 'system.maintenance-mode', 'globals.site-settings.edit', 'globals.header.edit', 'globals.footer.edit', 'globals.homepage.edit', 'globals.navigation.edit', 'globals.about-page.edit', 'globals.banner-settings.edit', 'globals.donation-settings.edit');
  CREATE TYPE "public"."enum_users_status" AS ENUM('active', 'suspended');
  CREATE TABLE "users_permissions_grant" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_users_permissions_grant",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "users_permissions_revoke" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_users_permissions_revoke",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "audit_log" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"action" varchar NOT NULL,
  	"actor_id" integer,
  	"actor_email" varchar,
  	"target_collection" varchar,
  	"target_id" varchar,
  	"summary" varchar,
  	"ip" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users" ADD COLUMN "status" "enum_users_status" DEFAULT 'active';
  ALTER TABLE "users" ADD COLUMN "expires_at" timestamp(3) with time zone;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "audit_log_id" integer;
  ALTER TABLE "users_permissions_grant" ADD CONSTRAINT "users_permissions_grant_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_permissions_revoke" ADD CONSTRAINT "users_permissions_revoke_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "users_permissions_grant_order_idx" ON "users_permissions_grant" USING btree ("order");
  CREATE INDEX "users_permissions_grant_parent_idx" ON "users_permissions_grant" USING btree ("parent_id");
  CREATE INDEX "users_permissions_revoke_order_idx" ON "users_permissions_revoke" USING btree ("order");
  CREATE INDEX "users_permissions_revoke_parent_idx" ON "users_permissions_revoke" USING btree ("parent_id");
  CREATE INDEX "audit_log_actor_idx" ON "audit_log" USING btree ("actor_id");
  CREATE INDEX "audit_log_updated_at_idx" ON "audit_log" USING btree ("updated_at");
  CREATE INDEX "audit_log_created_at_idx" ON "audit_log" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_audit_log_fk" FOREIGN KEY ("audit_log_id") REFERENCES "public"."audit_log"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_audit_log_id_idx" ON "payload_locked_documents_rels" USING btree ("audit_log_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users_permissions_grant" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "users_permissions_revoke" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "audit_log" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "users_permissions_grant" CASCADE;
  DROP TABLE "users_permissions_revoke" CASCADE;
  DROP TABLE "audit_log" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_audit_log_fk";
  
  DROP INDEX "payload_locked_documents_rels_audit_log_id_idx";
  ALTER TABLE "users" DROP COLUMN "status";
  ALTER TABLE "users" DROP COLUMN "expires_at";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "audit_log_id";
  DROP TYPE "public"."enum_users_permissions_grant";
  DROP TYPE "public"."enum_users_permissions_revoke";
  DROP TYPE "public"."enum_users_status";`)
}
