import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * IDEMPOTENT BY NECESSITY — read before regenerating this file.
 *
 * Production already contained the whole bishops schema before this migration
 * ever ran: 17 enum types and 56 tables, created by Drizzle's dev schema-push
 * rather than by a migration. (That happens when the app is started in dev mode
 * against the production DATABASE_URI — .env.vercel.local holds those
 * credentials.) The generated migration therefore aborted on the very first
 * `CREATE TYPE ... already exists`, and the deploy was blocked.
 *
 * So every statement here is written to be safe to re-run: IF NOT EXISTS where
 * Postgres supports it, and a DO block swallowing `duplicate_object` for enum
 * types and foreign keys, where it does not. The migration is an "ensure this
 * schema exists" operation rather than a "build it from nothing" one, and is
 * correct in both directions — on an empty database it creates everything, on
 * the pushed production database it creates only what is genuinely missing.
 *
 * What was genuinely missing mattered: `bishops_single_active_idx`, the partial
 * unique index that is the only real guarantee of one sitting Eparch. Schema
 * push cannot express it, so production had the tables but NOT the constraint.
 * That index is the substantive change this migration makes to production.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN
  CREATE TYPE "public"."enum_bishops_milestones_people_role" AS ENUM('principal-consecrator', 'co-consecrator', 'ordaining-bishop', 'appointing-pontiff', 'presenter', 'predecessor', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  CREATE TYPE "public"."enum_bishops_milestones_documents_document_type" AS ENUM('appointment-bull', 'pastoral-letter', 'decree', 'homily', 'academic-paper', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  CREATE TYPE "public"."enum_bishops_milestones_links_link_type" AS ENUM('holy-see', 'eritrean-catholic-church', 'news-article', 'video', 'reference-database', 'document', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  CREATE TYPE "public"."enum_bishops_milestones_milestone_type" AS ENUM('birth', 'baptism', 'chrismation', 'first-communion', 'minor-seminary', 'major-seminary', 'philosophy-theology-studies', 'religious-profession', 'diaconate-ordination', 'priestly-ordination', 'pastoral-assignment', 'further-studies', 'academic-appointment', 'curial-role', 'episcopal-appointment', 'episcopal-consecration', 'enthronement', 'synod-participation', 'pastoral-visit', 'pastoral-act', 'retirement', 'transfer', 'death', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  CREATE TYPE "public"."enum_bishops_milestones_date_precision" AS ENUM('exact', 'month', 'year', 'approximate');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  CREATE TYPE "public"."enum_bishops_milestones_end_date_precision" AS ENUM('exact', 'month', 'year', 'approximate', 'ongoing');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  CREATE TYPE "public"."enum_bishops_honors_category" AS ENUM('ecclesiastical', 'academic', 'civil', 'recognition', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  CREATE TYPE "public"."enum_bishops_honors_date_precision" AS ENUM('exact', 'month', 'year', 'approximate');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  CREATE TYPE "public"."enum_bishops_pastoral_priorities_status" AS ENUM('planned', 'ongoing', 'completed', 'paused');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  CREATE TYPE "public"."enum_bishops_links_link_type" AS ENUM('holy-see', 'eritrean-catholic-church', 'news-article', 'video', 'reference-database', 'document', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  CREATE TYPE "public"."enum_bishops_documents_document_type" AS ENUM('appointment-bull', 'pastoral-letter', 'decree', 'homily', 'academic-paper', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  CREATE TYPE "public"."enum_bishops_honorific" AS ENUM('abune', 'his-excellency-abune', 'most-reverend', 'his-eminence', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  CREATE TYPE "public"."enum_bishops_date_of_birth_precision" AS ENUM('exact', 'month', 'year', 'approximate');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  CREATE TYPE "public"."enum_bishops_date_of_death_precision" AS ENUM('exact', 'month', 'year', 'approximate');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  CREATE TYPE "public"."enum_bishops_term_end_reason" AS ENUM('retired', 'transferred', 'deceased', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  CREATE TYPE "public"."enum_bishops_appointing_authority" AS ENUM('roman-pontiff', 'council-of-hierarchs', 'dicastery-eastern-churches', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  CREATE TYPE "public"."enum_bishops_status" AS ENUM('draft', 'published');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  CREATE TYPE "public"."enum__bishops_v_version_milestones_people_role" AS ENUM('principal-consecrator', 'co-consecrator', 'ordaining-bishop', 'appointing-pontiff', 'presenter', 'predecessor', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  CREATE TYPE "public"."enum__bishops_v_version_milestones_documents_document_type" AS ENUM('appointment-bull', 'pastoral-letter', 'decree', 'homily', 'academic-paper', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  CREATE TYPE "public"."enum__bishops_v_version_milestones_links_link_type" AS ENUM('holy-see', 'eritrean-catholic-church', 'news-article', 'video', 'reference-database', 'document', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  CREATE TYPE "public"."enum__bishops_v_version_milestones_milestone_type" AS ENUM('birth', 'baptism', 'chrismation', 'first-communion', 'minor-seminary', 'major-seminary', 'philosophy-theology-studies', 'religious-profession', 'diaconate-ordination', 'priestly-ordination', 'pastoral-assignment', 'further-studies', 'academic-appointment', 'curial-role', 'episcopal-appointment', 'episcopal-consecration', 'enthronement', 'synod-participation', 'pastoral-visit', 'pastoral-act', 'retirement', 'transfer', 'death', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  CREATE TYPE "public"."enum__bishops_v_version_milestones_date_precision" AS ENUM('exact', 'month', 'year', 'approximate');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  CREATE TYPE "public"."enum__bishops_v_version_milestones_end_date_precision" AS ENUM('exact', 'month', 'year', 'approximate', 'ongoing');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  CREATE TYPE "public"."enum__bishops_v_version_honors_category" AS ENUM('ecclesiastical', 'academic', 'civil', 'recognition', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  CREATE TYPE "public"."enum__bishops_v_version_honors_date_precision" AS ENUM('exact', 'month', 'year', 'approximate');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  CREATE TYPE "public"."enum__bishops_v_version_pastoral_priorities_status" AS ENUM('planned', 'ongoing', 'completed', 'paused');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  CREATE TYPE "public"."enum__bishops_v_version_links_link_type" AS ENUM('holy-see', 'eritrean-catholic-church', 'news-article', 'video', 'reference-database', 'document', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  CREATE TYPE "public"."enum__bishops_v_version_documents_document_type" AS ENUM('appointment-bull', 'pastoral-letter', 'decree', 'homily', 'academic-paper', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  CREATE TYPE "public"."enum__bishops_v_version_honorific" AS ENUM('abune', 'his-excellency-abune', 'most-reverend', 'his-eminence', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  CREATE TYPE "public"."enum__bishops_v_version_date_of_birth_precision" AS ENUM('exact', 'month', 'year', 'approximate');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  CREATE TYPE "public"."enum__bishops_v_version_date_of_death_precision" AS ENUM('exact', 'month', 'year', 'approximate');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  CREATE TYPE "public"."enum__bishops_v_version_term_end_reason" AS ENUM('retired', 'transferred', 'deceased', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  CREATE TYPE "public"."enum__bishops_v_version_appointing_authority" AS ENUM('roman-pontiff', 'council-of-hierarchs', 'dicastery-eastern-churches', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  CREATE TYPE "public"."enum__bishops_v_version_status" AS ENUM('draft', 'published');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  CREATE TYPE "public"."enum__bishops_v_published_locale" AS ENUM('en', 'ti');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  ALTER TYPE "public"."enum_users_permissions_grant" ADD VALUE IF NOT EXISTS 'bishops.view' BEFORE 'apps.create';
  ALTER TYPE "public"."enum_users_permissions_grant" ADD VALUE IF NOT EXISTS 'bishops.create' BEFORE 'apps.create';
  ALTER TYPE "public"."enum_users_permissions_grant" ADD VALUE IF NOT EXISTS 'bishops.edit' BEFORE 'apps.create';
  ALTER TYPE "public"."enum_users_permissions_grant" ADD VALUE IF NOT EXISTS 'bishops.delete' BEFORE 'apps.create';
  ALTER TYPE "public"."enum_users_permissions_grant" ADD VALUE IF NOT EXISTS 'bishops.publish' BEFORE 'apps.create';
  ALTER TYPE "public"."enum_users_permissions_grant" ADD VALUE IF NOT EXISTS 'bishops.set_active' BEFORE 'apps.create';
  ALTER TYPE "public"."enum_users_permissions_revoke" ADD VALUE IF NOT EXISTS 'bishops.view' BEFORE 'apps.create';
  ALTER TYPE "public"."enum_users_permissions_revoke" ADD VALUE IF NOT EXISTS 'bishops.create' BEFORE 'apps.create';
  ALTER TYPE "public"."enum_users_permissions_revoke" ADD VALUE IF NOT EXISTS 'bishops.edit' BEFORE 'apps.create';
  ALTER TYPE "public"."enum_users_permissions_revoke" ADD VALUE IF NOT EXISTS 'bishops.delete' BEFORE 'apps.create';
  ALTER TYPE "public"."enum_users_permissions_revoke" ADD VALUE IF NOT EXISTS 'bishops.publish' BEFORE 'apps.create';
  ALTER TYPE "public"."enum_users_permissions_revoke" ADD VALUE IF NOT EXISTS 'bishops.set_active' BEFORE 'apps.create';
  CREATE TABLE IF NOT EXISTS "bishops_milestones_people" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"role" "enum_bishops_milestones_people_role" DEFAULT 'other',
  	"priest_id" integer
  );
  
  CREATE TABLE IF NOT EXISTS "bishops_milestones_people_locales" (
  	"name" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "bishops_milestones_documents" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"document_type" "enum_bishops_milestones_documents_document_type" DEFAULT 'other',
  	"date" timestamp(3) with time zone,
  	"publication_id" integer,
  	"file_id" integer,
  	"is_public" boolean DEFAULT true
  );
  
  CREATE TABLE IF NOT EXISTS "bishops_milestones_documents_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "bishops_milestones_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar,
  	"link_type" "enum_bishops_milestones_links_link_type" DEFAULT 'other',
  	"source_name" varchar,
  	"date" timestamp(3) with time zone,
  	"last_checked_at" timestamp(3) with time zone,
  	"is_public" boolean DEFAULT true
  );
  
  CREATE TABLE IF NOT EXISTS "bishops_milestones_links_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "bishops_milestones" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"milestone_type" "enum_bishops_milestones_milestone_type" DEFAULT 'pastoral-assignment',
  	"is_public" boolean DEFAULT true,
  	"order" numeric,
  	"date" timestamp(3) with time zone,
  	"date_precision" "enum_bishops_milestones_date_precision" DEFAULT 'exact',
  	"end_date" timestamp(3) with time zone,
  	"end_date_precision" "enum_bishops_milestones_end_date_precision" DEFAULT 'exact',
  	"parish_id" integer,
  	"vicariate_id" integer,
  	"gallery_key" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "bishops_milestones_locales" (
  	"title" varchar,
  	"location" varchar,
  	"description" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "bishops_honors" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"category" "enum_bishops_honors_category" DEFAULT 'ecclesiastical',
  	"date" timestamp(3) with time zone,
  	"date_precision" "enum_bishops_honors_date_precision" DEFAULT 'exact',
  	"certificate_id" integer,
  	"publication_id" integer,
  	"url" varchar,
  	"is_public" boolean DEFAULT true
  );
  
  CREATE TABLE IF NOT EXISTS "bishops_honors_locales" (
  	"name" varchar,
  	"awarding_body" varchar,
  	"place" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "bishops_education" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"start_year" numeric,
  	"end_year" numeric,
  	"is_public" boolean DEFAULT true
  );
  
  CREATE TABLE IF NOT EXISTS "bishops_education_locales" (
  	"institution" varchar,
  	"location" varchar,
  	"field_of_study" varchar,
  	"degree" varchar,
  	"thesis_title" varchar,
  	"notes" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "bishops_previous_appointments" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"start_year" numeric,
  	"end_year" numeric
  );
  
  CREATE TABLE IF NOT EXISTS "bishops_previous_appointments_locales" (
  	"title" varchar,
  	"place" varchar,
  	"notes" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "bishops_pastoral_priorities" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"status" "enum_bishops_pastoral_priorities_status" DEFAULT 'ongoing',
  	"start_date" timestamp(3) with time zone,
  	"end_date" timestamp(3) with time zone,
  	"is_public" boolean DEFAULT true
  );
  
  CREATE TABLE IF NOT EXISTS "bishops_pastoral_priorities_locales" (
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "bishops_galleries_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"date" timestamp(3) with time zone,
  	"credit" varchar,
  	"is_public" boolean DEFAULT true
  );
  
  CREATE TABLE IF NOT EXISTS "bishops_galleries_images_locales" (
  	"caption" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "bishops_galleries" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"cover_image_id" integer,
  	"date" timestamp(3) with time zone,
  	"is_public" boolean DEFAULT true
  );
  
  CREATE TABLE IF NOT EXISTS "bishops_galleries_locales" (
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "bishops_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar,
  	"link_type" "enum_bishops_links_link_type" DEFAULT 'other',
  	"source_name" varchar,
  	"date" timestamp(3) with time zone,
  	"last_checked_at" timestamp(3) with time zone,
  	"is_public" boolean DEFAULT true
  );
  
  CREATE TABLE IF NOT EXISTS "bishops_links_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "bishops_documents" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"document_type" "enum_bishops_documents_document_type" DEFAULT 'other',
  	"date" timestamp(3) with time zone,
  	"publication_id" integer,
  	"file_id" integer,
  	"is_public" boolean DEFAULT true
  );
  
  CREATE TABLE IF NOT EXISTS "bishops_documents_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "bishops_internal_attachments" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"file_id" integer,
  	"note" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "bishops" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"is_active" boolean DEFAULT false,
  	"slug" varchar,
  	"honorific" "enum_bishops_honorific" DEFAULT 'abune',
  	"portrait_id" integer,
  	"coat_of_arms_id" integer,
  	"motto_original" varchar,
  	"date_of_birth" timestamp(3) with time zone,
  	"date_of_birth_precision" "enum_bishops_date_of_birth_precision" DEFAULT 'exact',
  	"date_of_death" timestamp(3) with time zone,
  	"date_of_death_precision" "enum_bishops_date_of_death_precision" DEFAULT 'exact',
  	"home_parish_id" integer,
  	"home_vicariate_id" integer,
  	"term_start" timestamp(3) with time zone,
  	"term_end" timestamp(3) with time zone,
  	"term_end_reason" "enum_bishops_term_end_reason",
  	"appointing_authority" "enum_bishops_appointing_authority" DEFAULT 'roman-pontiff',
  	"appointment_date" timestamp(3) with time zone,
  	"predecessor_id" integer,
  	"successor_id" integer,
  	"principal_consecrator_id" integer,
  	"internal_notes" varchar,
  	"private_contact_phone" varchar,
  	"private_contact_email" varchar,
  	"private_contact_assistant" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_bishops_status" DEFAULT 'draft'
  );
  
  CREATE TABLE IF NOT EXISTS "bishops_locales" (
  	"full_name" varchar,
  	"episcopal_name" varchar,
  	"formal_title" varchar,
  	"baptismal_name" varchar,
  	"family_name" varchar,
  	"name_in_religion" varchar,
  	"motto" varchar,
  	"motto_note" varchar,
  	"place_of_birth" varchar,
  	"place_of_death" varchar,
  	"nationality" varchar DEFAULT 'Eritrean',
  	"appointing_authority_name" varchar,
  	"principal_consecrator_name" varchar,
  	"biography_summary" varchar,
  	"biography" jsonb,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "bishops_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer,
  	"bishop_messages_id" integer,
  	"publications_id" integer,
  	"news_id" integer,
  	"events_id" integer
  );
  
  CREATE TABLE IF NOT EXISTS "_bishops_v_version_milestones_people" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"role" "enum__bishops_v_version_milestones_people_role" DEFAULT 'other',
  	"priest_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_bishops_v_version_milestones_people_locales" (
  	"name" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_bishops_v_version_milestones_documents" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"document_type" "enum__bishops_v_version_milestones_documents_document_type" DEFAULT 'other',
  	"date" timestamp(3) with time zone,
  	"publication_id" integer,
  	"file_id" integer,
  	"is_public" boolean DEFAULT true,
  	"_uuid" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_bishops_v_version_milestones_documents_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_bishops_v_version_milestones_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"url" varchar,
  	"link_type" "enum__bishops_v_version_milestones_links_link_type" DEFAULT 'other',
  	"source_name" varchar,
  	"date" timestamp(3) with time zone,
  	"last_checked_at" timestamp(3) with time zone,
  	"is_public" boolean DEFAULT true,
  	"_uuid" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_bishops_v_version_milestones_links_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_bishops_v_version_milestones" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"milestone_type" "enum__bishops_v_version_milestones_milestone_type" DEFAULT 'pastoral-assignment',
  	"is_public" boolean DEFAULT true,
  	"order" numeric,
  	"date" timestamp(3) with time zone,
  	"date_precision" "enum__bishops_v_version_milestones_date_precision" DEFAULT 'exact',
  	"end_date" timestamp(3) with time zone,
  	"end_date_precision" "enum__bishops_v_version_milestones_end_date_precision" DEFAULT 'exact',
  	"parish_id" integer,
  	"vicariate_id" integer,
  	"gallery_key" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_bishops_v_version_milestones_locales" (
  	"title" varchar,
  	"location" varchar,
  	"description" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_bishops_v_version_honors" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"category" "enum__bishops_v_version_honors_category" DEFAULT 'ecclesiastical',
  	"date" timestamp(3) with time zone,
  	"date_precision" "enum__bishops_v_version_honors_date_precision" DEFAULT 'exact',
  	"certificate_id" integer,
  	"publication_id" integer,
  	"url" varchar,
  	"is_public" boolean DEFAULT true,
  	"_uuid" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_bishops_v_version_honors_locales" (
  	"name" varchar,
  	"awarding_body" varchar,
  	"place" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_bishops_v_version_education" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"start_year" numeric,
  	"end_year" numeric,
  	"is_public" boolean DEFAULT true,
  	"_uuid" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_bishops_v_version_education_locales" (
  	"institution" varchar,
  	"location" varchar,
  	"field_of_study" varchar,
  	"degree" varchar,
  	"thesis_title" varchar,
  	"notes" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_bishops_v_version_previous_appointments" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"start_year" numeric,
  	"end_year" numeric,
  	"_uuid" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_bishops_v_version_previous_appointments_locales" (
  	"title" varchar,
  	"place" varchar,
  	"notes" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_bishops_v_version_pastoral_priorities" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"status" "enum__bishops_v_version_pastoral_priorities_status" DEFAULT 'ongoing',
  	"start_date" timestamp(3) with time zone,
  	"end_date" timestamp(3) with time zone,
  	"is_public" boolean DEFAULT true,
  	"_uuid" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_bishops_v_version_pastoral_priorities_locales" (
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_bishops_v_version_galleries_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"date" timestamp(3) with time zone,
  	"credit" varchar,
  	"is_public" boolean DEFAULT true,
  	"_uuid" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_bishops_v_version_galleries_images_locales" (
  	"caption" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_bishops_v_version_galleries" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"cover_image_id" integer,
  	"date" timestamp(3) with time zone,
  	"is_public" boolean DEFAULT true,
  	"_uuid" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_bishops_v_version_galleries_locales" (
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_bishops_v_version_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"url" varchar,
  	"link_type" "enum__bishops_v_version_links_link_type" DEFAULT 'other',
  	"source_name" varchar,
  	"date" timestamp(3) with time zone,
  	"last_checked_at" timestamp(3) with time zone,
  	"is_public" boolean DEFAULT true,
  	"_uuid" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_bishops_v_version_links_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_bishops_v_version_documents" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"document_type" "enum__bishops_v_version_documents_document_type" DEFAULT 'other',
  	"date" timestamp(3) with time zone,
  	"publication_id" integer,
  	"file_id" integer,
  	"is_public" boolean DEFAULT true,
  	"_uuid" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_bishops_v_version_documents_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_bishops_v_version_internal_attachments" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"file_id" integer,
  	"note" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_bishops_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_is_active" boolean DEFAULT false,
  	"version_slug" varchar,
  	"version_honorific" "enum__bishops_v_version_honorific" DEFAULT 'abune',
  	"version_portrait_id" integer,
  	"version_coat_of_arms_id" integer,
  	"version_motto_original" varchar,
  	"version_date_of_birth" timestamp(3) with time zone,
  	"version_date_of_birth_precision" "enum__bishops_v_version_date_of_birth_precision" DEFAULT 'exact',
  	"version_date_of_death" timestamp(3) with time zone,
  	"version_date_of_death_precision" "enum__bishops_v_version_date_of_death_precision" DEFAULT 'exact',
  	"version_home_parish_id" integer,
  	"version_home_vicariate_id" integer,
  	"version_term_start" timestamp(3) with time zone,
  	"version_term_end" timestamp(3) with time zone,
  	"version_term_end_reason" "enum__bishops_v_version_term_end_reason",
  	"version_appointing_authority" "enum__bishops_v_version_appointing_authority" DEFAULT 'roman-pontiff',
  	"version_appointment_date" timestamp(3) with time zone,
  	"version_predecessor_id" integer,
  	"version_successor_id" integer,
  	"version_principal_consecrator_id" integer,
  	"version_internal_notes" varchar,
  	"version_private_contact_phone" varchar,
  	"version_private_contact_email" varchar,
  	"version_private_contact_assistant" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__bishops_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__bishops_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE IF NOT EXISTS "_bishops_v_locales" (
  	"version_full_name" varchar,
  	"version_episcopal_name" varchar,
  	"version_formal_title" varchar,
  	"version_baptismal_name" varchar,
  	"version_family_name" varchar,
  	"version_name_in_religion" varchar,
  	"version_motto" varchar,
  	"version_motto_note" varchar,
  	"version_place_of_birth" varchar,
  	"version_place_of_death" varchar,
  	"version_nationality" varchar DEFAULT 'Eritrean',
  	"version_appointing_authority_name" varchar,
  	"version_principal_consecrator_name" varchar,
  	"version_biography_summary" varchar,
  	"version_biography" jsonb,
  	"version_seo_meta_title" varchar,
  	"version_seo_meta_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "_bishops_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer,
  	"bishop_messages_id" integer,
  	"publications_id" integer,
  	"news_id" integer,
  	"events_id" integer
  );
  
  ALTER TABLE "bishop_messages" ADD COLUMN IF NOT EXISTS "bishop_id" integer;
  ALTER TABLE "_bishop_messages_v" ADD COLUMN IF NOT EXISTS "version_bishop_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "bishops_id" integer;
  DO $$ BEGIN
  ALTER TABLE "bishops_milestones_people" ADD CONSTRAINT "bishops_milestones_people_priest_id_priests_id_fk" FOREIGN KEY ("priest_id") REFERENCES "public"."priests"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "bishops_milestones_people" ADD CONSTRAINT "bishops_milestones_people_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."bishops_milestones"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "bishops_milestones_people_locales" ADD CONSTRAINT "bishops_milestones_people_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."bishops_milestones_people"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "bishops_milestones_documents" ADD CONSTRAINT "bishops_milestones_documents_publication_id_publications_id_fk" FOREIGN KEY ("publication_id") REFERENCES "public"."publications"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "bishops_milestones_documents" ADD CONSTRAINT "bishops_milestones_documents_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "bishops_milestones_documents" ADD CONSTRAINT "bishops_milestones_documents_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."bishops_milestones"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "bishops_milestones_documents_locales" ADD CONSTRAINT "bishops_milestones_documents_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."bishops_milestones_documents"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "bishops_milestones_links" ADD CONSTRAINT "bishops_milestones_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."bishops_milestones"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "bishops_milestones_links_locales" ADD CONSTRAINT "bishops_milestones_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."bishops_milestones_links"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "bishops_milestones" ADD CONSTRAINT "bishops_milestones_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "bishops_milestones" ADD CONSTRAINT "bishops_milestones_vicariate_id_vicariates_id_fk" FOREIGN KEY ("vicariate_id") REFERENCES "public"."vicariates"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "bishops_milestones" ADD CONSTRAINT "bishops_milestones_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."bishops"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "bishops_milestones_locales" ADD CONSTRAINT "bishops_milestones_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."bishops_milestones"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "bishops_honors" ADD CONSTRAINT "bishops_honors_certificate_id_media_id_fk" FOREIGN KEY ("certificate_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "bishops_honors" ADD CONSTRAINT "bishops_honors_publication_id_publications_id_fk" FOREIGN KEY ("publication_id") REFERENCES "public"."publications"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "bishops_honors" ADD CONSTRAINT "bishops_honors_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."bishops"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "bishops_honors_locales" ADD CONSTRAINT "bishops_honors_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."bishops_honors"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "bishops_education" ADD CONSTRAINT "bishops_education_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."bishops"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "bishops_education_locales" ADD CONSTRAINT "bishops_education_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."bishops_education"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "bishops_previous_appointments" ADD CONSTRAINT "bishops_previous_appointments_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."bishops"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "bishops_previous_appointments_locales" ADD CONSTRAINT "bishops_previous_appointments_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."bishops_previous_appointments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "bishops_pastoral_priorities" ADD CONSTRAINT "bishops_pastoral_priorities_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."bishops"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "bishops_pastoral_priorities_locales" ADD CONSTRAINT "bishops_pastoral_priorities_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."bishops_pastoral_priorities"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "bishops_galleries_images" ADD CONSTRAINT "bishops_galleries_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "bishops_galleries_images" ADD CONSTRAINT "bishops_galleries_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."bishops_galleries"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "bishops_galleries_images_locales" ADD CONSTRAINT "bishops_galleries_images_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."bishops_galleries_images"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "bishops_galleries" ADD CONSTRAINT "bishops_galleries_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "bishops_galleries" ADD CONSTRAINT "bishops_galleries_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."bishops"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "bishops_galleries_locales" ADD CONSTRAINT "bishops_galleries_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."bishops_galleries"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "bishops_links" ADD CONSTRAINT "bishops_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."bishops"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "bishops_links_locales" ADD CONSTRAINT "bishops_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."bishops_links"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "bishops_documents" ADD CONSTRAINT "bishops_documents_publication_id_publications_id_fk" FOREIGN KEY ("publication_id") REFERENCES "public"."publications"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "bishops_documents" ADD CONSTRAINT "bishops_documents_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "bishops_documents" ADD CONSTRAINT "bishops_documents_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."bishops"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "bishops_documents_locales" ADD CONSTRAINT "bishops_documents_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."bishops_documents"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "bishops_internal_attachments" ADD CONSTRAINT "bishops_internal_attachments_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "bishops_internal_attachments" ADD CONSTRAINT "bishops_internal_attachments_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."bishops"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "bishops" ADD CONSTRAINT "bishops_portrait_id_media_id_fk" FOREIGN KEY ("portrait_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "bishops" ADD CONSTRAINT "bishops_coat_of_arms_id_media_id_fk" FOREIGN KEY ("coat_of_arms_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "bishops" ADD CONSTRAINT "bishops_home_parish_id_parishes_id_fk" FOREIGN KEY ("home_parish_id") REFERENCES "public"."parishes"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "bishops" ADD CONSTRAINT "bishops_home_vicariate_id_vicariates_id_fk" FOREIGN KEY ("home_vicariate_id") REFERENCES "public"."vicariates"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "bishops" ADD CONSTRAINT "bishops_predecessor_id_bishops_id_fk" FOREIGN KEY ("predecessor_id") REFERENCES "public"."bishops"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "bishops" ADD CONSTRAINT "bishops_successor_id_bishops_id_fk" FOREIGN KEY ("successor_id") REFERENCES "public"."bishops"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "bishops" ADD CONSTRAINT "bishops_principal_consecrator_id_priests_id_fk" FOREIGN KEY ("principal_consecrator_id") REFERENCES "public"."priests"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "bishops_locales" ADD CONSTRAINT "bishops_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."bishops"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "bishops_rels" ADD CONSTRAINT "bishops_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."bishops"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "bishops_rels" ADD CONSTRAINT "bishops_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "bishops_rels" ADD CONSTRAINT "bishops_rels_bishop_messages_fk" FOREIGN KEY ("bishop_messages_id") REFERENCES "public"."bishop_messages"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "bishops_rels" ADD CONSTRAINT "bishops_rels_publications_fk" FOREIGN KEY ("publications_id") REFERENCES "public"."publications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "bishops_rels" ADD CONSTRAINT "bishops_rels_news_fk" FOREIGN KEY ("news_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "bishops_rels" ADD CONSTRAINT "bishops_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "_bishops_v_version_milestones_people" ADD CONSTRAINT "_bishops_v_version_milestones_people_priest_id_priests_id_fk" FOREIGN KEY ("priest_id") REFERENCES "public"."priests"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "_bishops_v_version_milestones_people" ADD CONSTRAINT "_bishops_v_version_milestones_people_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_bishops_v_version_milestones"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "_bishops_v_version_milestones_people_locales" ADD CONSTRAINT "_bishops_v_version_milestones_people_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_bishops_v_version_milestones_people"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "_bishops_v_version_milestones_documents" ADD CONSTRAINT "_bishops_v_version_milestones_documents_publication_id_publications_id_fk" FOREIGN KEY ("publication_id") REFERENCES "public"."publications"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "_bishops_v_version_milestones_documents" ADD CONSTRAINT "_bishops_v_version_milestones_documents_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "_bishops_v_version_milestones_documents" ADD CONSTRAINT "_bishops_v_version_milestones_documents_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_bishops_v_version_milestones"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "_bishops_v_version_milestones_documents_locales" ADD CONSTRAINT "_bishops_v_version_milestones_documents_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_bishops_v_version_milestones_documents"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "_bishops_v_version_milestones_links" ADD CONSTRAINT "_bishops_v_version_milestones_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_bishops_v_version_milestones"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "_bishops_v_version_milestones_links_locales" ADD CONSTRAINT "_bishops_v_version_milestones_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_bishops_v_version_milestones_links"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "_bishops_v_version_milestones" ADD CONSTRAINT "_bishops_v_version_milestones_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "_bishops_v_version_milestones" ADD CONSTRAINT "_bishops_v_version_milestones_vicariate_id_vicariates_id_fk" FOREIGN KEY ("vicariate_id") REFERENCES "public"."vicariates"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "_bishops_v_version_milestones" ADD CONSTRAINT "_bishops_v_version_milestones_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_bishops_v"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "_bishops_v_version_milestones_locales" ADD CONSTRAINT "_bishops_v_version_milestones_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_bishops_v_version_milestones"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "_bishops_v_version_honors" ADD CONSTRAINT "_bishops_v_version_honors_certificate_id_media_id_fk" FOREIGN KEY ("certificate_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "_bishops_v_version_honors" ADD CONSTRAINT "_bishops_v_version_honors_publication_id_publications_id_fk" FOREIGN KEY ("publication_id") REFERENCES "public"."publications"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "_bishops_v_version_honors" ADD CONSTRAINT "_bishops_v_version_honors_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_bishops_v"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "_bishops_v_version_honors_locales" ADD CONSTRAINT "_bishops_v_version_honors_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_bishops_v_version_honors"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "_bishops_v_version_education" ADD CONSTRAINT "_bishops_v_version_education_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_bishops_v"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "_bishops_v_version_education_locales" ADD CONSTRAINT "_bishops_v_version_education_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_bishops_v_version_education"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "_bishops_v_version_previous_appointments" ADD CONSTRAINT "_bishops_v_version_previous_appointments_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_bishops_v"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "_bishops_v_version_previous_appointments_locales" ADD CONSTRAINT "_bishops_v_version_previous_appointments_locales_parent_i_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_bishops_v_version_previous_appointments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "_bishops_v_version_pastoral_priorities" ADD CONSTRAINT "_bishops_v_version_pastoral_priorities_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_bishops_v"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "_bishops_v_version_pastoral_priorities_locales" ADD CONSTRAINT "_bishops_v_version_pastoral_priorities_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_bishops_v_version_pastoral_priorities"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "_bishops_v_version_galleries_images" ADD CONSTRAINT "_bishops_v_version_galleries_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "_bishops_v_version_galleries_images" ADD CONSTRAINT "_bishops_v_version_galleries_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_bishops_v_version_galleries"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "_bishops_v_version_galleries_images_locales" ADD CONSTRAINT "_bishops_v_version_galleries_images_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_bishops_v_version_galleries_images"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "_bishops_v_version_galleries" ADD CONSTRAINT "_bishops_v_version_galleries_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "_bishops_v_version_galleries" ADD CONSTRAINT "_bishops_v_version_galleries_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_bishops_v"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "_bishops_v_version_galleries_locales" ADD CONSTRAINT "_bishops_v_version_galleries_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_bishops_v_version_galleries"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "_bishops_v_version_links" ADD CONSTRAINT "_bishops_v_version_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_bishops_v"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "_bishops_v_version_links_locales" ADD CONSTRAINT "_bishops_v_version_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_bishops_v_version_links"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "_bishops_v_version_documents" ADD CONSTRAINT "_bishops_v_version_documents_publication_id_publications_id_fk" FOREIGN KEY ("publication_id") REFERENCES "public"."publications"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "_bishops_v_version_documents" ADD CONSTRAINT "_bishops_v_version_documents_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "_bishops_v_version_documents" ADD CONSTRAINT "_bishops_v_version_documents_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_bishops_v"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "_bishops_v_version_documents_locales" ADD CONSTRAINT "_bishops_v_version_documents_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_bishops_v_version_documents"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "_bishops_v_version_internal_attachments" ADD CONSTRAINT "_bishops_v_version_internal_attachments_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "_bishops_v_version_internal_attachments" ADD CONSTRAINT "_bishops_v_version_internal_attachments_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_bishops_v"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "_bishops_v" ADD CONSTRAINT "_bishops_v_parent_id_bishops_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."bishops"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "_bishops_v" ADD CONSTRAINT "_bishops_v_version_portrait_id_media_id_fk" FOREIGN KEY ("version_portrait_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "_bishops_v" ADD CONSTRAINT "_bishops_v_version_coat_of_arms_id_media_id_fk" FOREIGN KEY ("version_coat_of_arms_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "_bishops_v" ADD CONSTRAINT "_bishops_v_version_home_parish_id_parishes_id_fk" FOREIGN KEY ("version_home_parish_id") REFERENCES "public"."parishes"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "_bishops_v" ADD CONSTRAINT "_bishops_v_version_home_vicariate_id_vicariates_id_fk" FOREIGN KEY ("version_home_vicariate_id") REFERENCES "public"."vicariates"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "_bishops_v" ADD CONSTRAINT "_bishops_v_version_predecessor_id_bishops_id_fk" FOREIGN KEY ("version_predecessor_id") REFERENCES "public"."bishops"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "_bishops_v" ADD CONSTRAINT "_bishops_v_version_successor_id_bishops_id_fk" FOREIGN KEY ("version_successor_id") REFERENCES "public"."bishops"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "_bishops_v" ADD CONSTRAINT "_bishops_v_version_principal_consecrator_id_priests_id_fk" FOREIGN KEY ("version_principal_consecrator_id") REFERENCES "public"."priests"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "_bishops_v_locales" ADD CONSTRAINT "_bishops_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_bishops_v"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "_bishops_v_rels" ADD CONSTRAINT "_bishops_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_bishops_v"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "_bishops_v_rels" ADD CONSTRAINT "_bishops_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "_bishops_v_rels" ADD CONSTRAINT "_bishops_v_rels_bishop_messages_fk" FOREIGN KEY ("bishop_messages_id") REFERENCES "public"."bishop_messages"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "_bishops_v_rels" ADD CONSTRAINT "_bishops_v_rels_publications_fk" FOREIGN KEY ("publications_id") REFERENCES "public"."publications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "_bishops_v_rels" ADD CONSTRAINT "_bishops_v_rels_news_fk" FOREIGN KEY ("news_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "_bishops_v_rels" ADD CONSTRAINT "_bishops_v_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  CREATE INDEX IF NOT EXISTS "bishops_milestones_people_order_idx" ON "bishops_milestones_people" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "bishops_milestones_people_parent_id_idx" ON "bishops_milestones_people" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "bishops_milestones_people_priest_idx" ON "bishops_milestones_people" USING btree ("priest_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "bishops_milestones_people_locales_locale_parent_id_unique" ON "bishops_milestones_people_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "bishops_milestones_documents_order_idx" ON "bishops_milestones_documents" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "bishops_milestones_documents_parent_id_idx" ON "bishops_milestones_documents" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "bishops_milestones_documents_publication_idx" ON "bishops_milestones_documents" USING btree ("publication_id");
  CREATE INDEX IF NOT EXISTS "bishops_milestones_documents_file_idx" ON "bishops_milestones_documents" USING btree ("file_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "bishops_milestones_documents_locales_locale_parent_id_unique" ON "bishops_milestones_documents_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "bishops_milestones_links_order_idx" ON "bishops_milestones_links" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "bishops_milestones_links_parent_id_idx" ON "bishops_milestones_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "bishops_milestones_links_locales_locale_parent_id_unique" ON "bishops_milestones_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "bishops_milestones_order_idx" ON "bishops_milestones" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "bishops_milestones_parent_id_idx" ON "bishops_milestones" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "bishops_milestones_parish_idx" ON "bishops_milestones" USING btree ("parish_id");
  CREATE INDEX IF NOT EXISTS "bishops_milestones_vicariate_idx" ON "bishops_milestones" USING btree ("vicariate_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "bishops_milestones_locales_locale_parent_id_unique" ON "bishops_milestones_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "bishops_honors_order_idx" ON "bishops_honors" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "bishops_honors_parent_id_idx" ON "bishops_honors" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "bishops_honors_certificate_idx" ON "bishops_honors" USING btree ("certificate_id");
  CREATE INDEX IF NOT EXISTS "bishops_honors_publication_idx" ON "bishops_honors" USING btree ("publication_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "bishops_honors_locales_locale_parent_id_unique" ON "bishops_honors_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "bishops_education_order_idx" ON "bishops_education" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "bishops_education_parent_id_idx" ON "bishops_education" USING btree ("_parent_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "bishops_education_locales_locale_parent_id_unique" ON "bishops_education_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "bishops_previous_appointments_order_idx" ON "bishops_previous_appointments" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "bishops_previous_appointments_parent_id_idx" ON "bishops_previous_appointments" USING btree ("_parent_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "bishops_previous_appointments_locales_locale_parent_id_uniqu" ON "bishops_previous_appointments_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "bishops_pastoral_priorities_order_idx" ON "bishops_pastoral_priorities" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "bishops_pastoral_priorities_parent_id_idx" ON "bishops_pastoral_priorities" USING btree ("_parent_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "bishops_pastoral_priorities_locales_locale_parent_id_unique" ON "bishops_pastoral_priorities_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "bishops_galleries_images_order_idx" ON "bishops_galleries_images" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "bishops_galleries_images_parent_id_idx" ON "bishops_galleries_images" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "bishops_galleries_images_image_idx" ON "bishops_galleries_images" USING btree ("image_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "bishops_galleries_images_locales_locale_parent_id_unique" ON "bishops_galleries_images_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "bishops_galleries_order_idx" ON "bishops_galleries" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "bishops_galleries_parent_id_idx" ON "bishops_galleries" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "bishops_galleries_cover_image_idx" ON "bishops_galleries" USING btree ("cover_image_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "bishops_galleries_locales_locale_parent_id_unique" ON "bishops_galleries_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "bishops_links_order_idx" ON "bishops_links" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "bishops_links_parent_id_idx" ON "bishops_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "bishops_links_locales_locale_parent_id_unique" ON "bishops_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "bishops_documents_order_idx" ON "bishops_documents" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "bishops_documents_parent_id_idx" ON "bishops_documents" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "bishops_documents_publication_idx" ON "bishops_documents" USING btree ("publication_id");
  CREATE INDEX IF NOT EXISTS "bishops_documents_file_idx" ON "bishops_documents" USING btree ("file_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "bishops_documents_locales_locale_parent_id_unique" ON "bishops_documents_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "bishops_internal_attachments_order_idx" ON "bishops_internal_attachments" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "bishops_internal_attachments_parent_id_idx" ON "bishops_internal_attachments" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "bishops_internal_attachments_file_idx" ON "bishops_internal_attachments" USING btree ("file_id");
  CREATE INDEX IF NOT EXISTS "bishops_is_active_idx" ON "bishops" USING btree ("is_active");
  CREATE UNIQUE INDEX IF NOT EXISTS "bishops_slug_idx" ON "bishops" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "bishops_portrait_idx" ON "bishops" USING btree ("portrait_id");
  CREATE INDEX IF NOT EXISTS "bishops_coat_of_arms_idx" ON "bishops" USING btree ("coat_of_arms_id");
  CREATE INDEX IF NOT EXISTS "bishops_home_parish_idx" ON "bishops" USING btree ("home_parish_id");
  CREATE INDEX IF NOT EXISTS "bishops_home_vicariate_idx" ON "bishops" USING btree ("home_vicariate_id");
  CREATE INDEX IF NOT EXISTS "bishops_predecessor_idx" ON "bishops" USING btree ("predecessor_id");
  CREATE INDEX IF NOT EXISTS "bishops_successor_idx" ON "bishops" USING btree ("successor_id");
  CREATE INDEX IF NOT EXISTS "bishops_principal_consecrator_idx" ON "bishops" USING btree ("principal_consecrator_id");
  CREATE INDEX IF NOT EXISTS "bishops_updated_at_idx" ON "bishops" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "bishops_created_at_idx" ON "bishops" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "bishops__status_idx" ON "bishops" USING btree ("_status");
  CREATE UNIQUE INDEX IF NOT EXISTS "bishops_locales_locale_parent_id_unique" ON "bishops_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "bishops_rels_order_idx" ON "bishops_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "bishops_rels_parent_idx" ON "bishops_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "bishops_rels_path_idx" ON "bishops_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "bishops_rels_media_id_idx" ON "bishops_rels" USING btree ("media_id");
  CREATE INDEX IF NOT EXISTS "bishops_rels_bishop_messages_id_idx" ON "bishops_rels" USING btree ("bishop_messages_id");
  CREATE INDEX IF NOT EXISTS "bishops_rels_publications_id_idx" ON "bishops_rels" USING btree ("publications_id");
  CREATE INDEX IF NOT EXISTS "bishops_rels_news_id_idx" ON "bishops_rels" USING btree ("news_id");
  CREATE INDEX IF NOT EXISTS "bishops_rels_events_id_idx" ON "bishops_rels" USING btree ("events_id");
  CREATE INDEX IF NOT EXISTS "_bishops_v_version_milestones_people_order_idx" ON "_bishops_v_version_milestones_people" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_bishops_v_version_milestones_people_parent_id_idx" ON "_bishops_v_version_milestones_people" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_bishops_v_version_milestones_people_priest_idx" ON "_bishops_v_version_milestones_people" USING btree ("priest_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "_bishops_v_version_milestones_people_locales_locale_parent_i" ON "_bishops_v_version_milestones_people_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "_bishops_v_version_milestones_documents_order_idx" ON "_bishops_v_version_milestones_documents" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_bishops_v_version_milestones_documents_parent_id_idx" ON "_bishops_v_version_milestones_documents" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_bishops_v_version_milestones_documents_publication_idx" ON "_bishops_v_version_milestones_documents" USING btree ("publication_id");
  CREATE INDEX IF NOT EXISTS "_bishops_v_version_milestones_documents_file_idx" ON "_bishops_v_version_milestones_documents" USING btree ("file_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "_bishops_v_version_milestones_documents_locales_locale_paren" ON "_bishops_v_version_milestones_documents_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "_bishops_v_version_milestones_links_order_idx" ON "_bishops_v_version_milestones_links" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_bishops_v_version_milestones_links_parent_id_idx" ON "_bishops_v_version_milestones_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "_bishops_v_version_milestones_links_locales_locale_parent_id" ON "_bishops_v_version_milestones_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "_bishops_v_version_milestones_order_idx" ON "_bishops_v_version_milestones" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_bishops_v_version_milestones_parent_id_idx" ON "_bishops_v_version_milestones" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_bishops_v_version_milestones_parish_idx" ON "_bishops_v_version_milestones" USING btree ("parish_id");
  CREATE INDEX IF NOT EXISTS "_bishops_v_version_milestones_vicariate_idx" ON "_bishops_v_version_milestones" USING btree ("vicariate_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "_bishops_v_version_milestones_locales_locale_parent_id_uniqu" ON "_bishops_v_version_milestones_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "_bishops_v_version_honors_order_idx" ON "_bishops_v_version_honors" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_bishops_v_version_honors_parent_id_idx" ON "_bishops_v_version_honors" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_bishops_v_version_honors_certificate_idx" ON "_bishops_v_version_honors" USING btree ("certificate_id");
  CREATE INDEX IF NOT EXISTS "_bishops_v_version_honors_publication_idx" ON "_bishops_v_version_honors" USING btree ("publication_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "_bishops_v_version_honors_locales_locale_parent_id_unique" ON "_bishops_v_version_honors_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "_bishops_v_version_education_order_idx" ON "_bishops_v_version_education" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_bishops_v_version_education_parent_id_idx" ON "_bishops_v_version_education" USING btree ("_parent_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "_bishops_v_version_education_locales_locale_parent_id_unique" ON "_bishops_v_version_education_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "_bishops_v_version_previous_appointments_order_idx" ON "_bishops_v_version_previous_appointments" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_bishops_v_version_previous_appointments_parent_id_idx" ON "_bishops_v_version_previous_appointments" USING btree ("_parent_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "_bishops_v_version_previous_appointments_locales_locale_pare" ON "_bishops_v_version_previous_appointments_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "_bishops_v_version_pastoral_priorities_order_idx" ON "_bishops_v_version_pastoral_priorities" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_bishops_v_version_pastoral_priorities_parent_id_idx" ON "_bishops_v_version_pastoral_priorities" USING btree ("_parent_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "_bishops_v_version_pastoral_priorities_locales_locale_parent" ON "_bishops_v_version_pastoral_priorities_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "_bishops_v_version_galleries_images_order_idx" ON "_bishops_v_version_galleries_images" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_bishops_v_version_galleries_images_parent_id_idx" ON "_bishops_v_version_galleries_images" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_bishops_v_version_galleries_images_image_idx" ON "_bishops_v_version_galleries_images" USING btree ("image_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "_bishops_v_version_galleries_images_locales_locale_parent_id" ON "_bishops_v_version_galleries_images_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "_bishops_v_version_galleries_order_idx" ON "_bishops_v_version_galleries" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_bishops_v_version_galleries_parent_id_idx" ON "_bishops_v_version_galleries" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_bishops_v_version_galleries_cover_image_idx" ON "_bishops_v_version_galleries" USING btree ("cover_image_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "_bishops_v_version_galleries_locales_locale_parent_id_unique" ON "_bishops_v_version_galleries_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "_bishops_v_version_links_order_idx" ON "_bishops_v_version_links" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_bishops_v_version_links_parent_id_idx" ON "_bishops_v_version_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "_bishops_v_version_links_locales_locale_parent_id_unique" ON "_bishops_v_version_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "_bishops_v_version_documents_order_idx" ON "_bishops_v_version_documents" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_bishops_v_version_documents_parent_id_idx" ON "_bishops_v_version_documents" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_bishops_v_version_documents_publication_idx" ON "_bishops_v_version_documents" USING btree ("publication_id");
  CREATE INDEX IF NOT EXISTS "_bishops_v_version_documents_file_idx" ON "_bishops_v_version_documents" USING btree ("file_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "_bishops_v_version_documents_locales_locale_parent_id_unique" ON "_bishops_v_version_documents_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "_bishops_v_version_internal_attachments_order_idx" ON "_bishops_v_version_internal_attachments" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_bishops_v_version_internal_attachments_parent_id_idx" ON "_bishops_v_version_internal_attachments" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_bishops_v_version_internal_attachments_file_idx" ON "_bishops_v_version_internal_attachments" USING btree ("file_id");
  CREATE INDEX IF NOT EXISTS "_bishops_v_parent_idx" ON "_bishops_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_bishops_v_version_version_is_active_idx" ON "_bishops_v" USING btree ("version_is_active");
  CREATE INDEX IF NOT EXISTS "_bishops_v_version_version_slug_idx" ON "_bishops_v" USING btree ("version_slug");
  CREATE INDEX IF NOT EXISTS "_bishops_v_version_version_portrait_idx" ON "_bishops_v" USING btree ("version_portrait_id");
  CREATE INDEX IF NOT EXISTS "_bishops_v_version_version_coat_of_arms_idx" ON "_bishops_v" USING btree ("version_coat_of_arms_id");
  CREATE INDEX IF NOT EXISTS "_bishops_v_version_version_home_parish_idx" ON "_bishops_v" USING btree ("version_home_parish_id");
  CREATE INDEX IF NOT EXISTS "_bishops_v_version_version_home_vicariate_idx" ON "_bishops_v" USING btree ("version_home_vicariate_id");
  CREATE INDEX IF NOT EXISTS "_bishops_v_version_version_predecessor_idx" ON "_bishops_v" USING btree ("version_predecessor_id");
  CREATE INDEX IF NOT EXISTS "_bishops_v_version_version_successor_idx" ON "_bishops_v" USING btree ("version_successor_id");
  CREATE INDEX IF NOT EXISTS "_bishops_v_version_version_principal_consecrator_idx" ON "_bishops_v" USING btree ("version_principal_consecrator_id");
  CREATE INDEX IF NOT EXISTS "_bishops_v_version_version_updated_at_idx" ON "_bishops_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_bishops_v_version_version_created_at_idx" ON "_bishops_v" USING btree ("version_created_at");
  CREATE INDEX IF NOT EXISTS "_bishops_v_version_version__status_idx" ON "_bishops_v" USING btree ("version__status");
  CREATE INDEX IF NOT EXISTS "_bishops_v_created_at_idx" ON "_bishops_v" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_bishops_v_updated_at_idx" ON "_bishops_v" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "_bishops_v_snapshot_idx" ON "_bishops_v" USING btree ("snapshot");
  CREATE INDEX IF NOT EXISTS "_bishops_v_published_locale_idx" ON "_bishops_v" USING btree ("published_locale");
  CREATE INDEX IF NOT EXISTS "_bishops_v_latest_idx" ON "_bishops_v" USING btree ("latest");
  CREATE UNIQUE INDEX IF NOT EXISTS "_bishops_v_locales_locale_parent_id_unique" ON "_bishops_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "_bishops_v_rels_order_idx" ON "_bishops_v_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "_bishops_v_rels_parent_idx" ON "_bishops_v_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_bishops_v_rels_path_idx" ON "_bishops_v_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "_bishops_v_rels_media_id_idx" ON "_bishops_v_rels" USING btree ("media_id");
  CREATE INDEX IF NOT EXISTS "_bishops_v_rels_bishop_messages_id_idx" ON "_bishops_v_rels" USING btree ("bishop_messages_id");
  CREATE INDEX IF NOT EXISTS "_bishops_v_rels_publications_id_idx" ON "_bishops_v_rels" USING btree ("publications_id");
  CREATE INDEX IF NOT EXISTS "_bishops_v_rels_news_id_idx" ON "_bishops_v_rels" USING btree ("news_id");
  CREATE INDEX IF NOT EXISTS "_bishops_v_rels_events_id_idx" ON "_bishops_v_rels" USING btree ("events_id");
  DO $$ BEGIN
  ALTER TABLE "bishop_messages" ADD CONSTRAINT "bishop_messages_bishop_id_bishops_id_fk" FOREIGN KEY ("bishop_id") REFERENCES "public"."bishops"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "_bishop_messages_v" ADD CONSTRAINT "_bishop_messages_v_version_bishop_id_bishops_id_fk" FOREIGN KEY ("version_bishop_id") REFERENCES "public"."bishops"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  DO $$ BEGIN
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_bishops_fk" FOREIGN KEY ("bishops_id") REFERENCES "public"."bishops"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
  CREATE INDEX IF NOT EXISTS "bishop_messages_bishop_idx" ON "bishop_messages" USING btree ("bishop_id");
  CREATE INDEX IF NOT EXISTS "_bishop_messages_v_version_version_bishop_idx" ON "_bishop_messages_v" USING btree ("version_bishop_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_bishops_id_idx" ON "payload_locked_documents_rels" USING btree ("bishops_id");`)

  // ── Hand-added: exactly one sitting Eparch ────────────────────────────────
  //
  // A partial unique index, which Payload's schema generator cannot express.
  // The application-level hook (collections/Bishops/hooks/activation.ts) demotes
  // the incumbent so activation is one action, but a hook cannot survive a race
  // between two concurrent saves, a Local API script, or a direct SQL write.
  // This is the layer that actually holds: the second row to claim is_active
  // = true is rejected by the database.
  //
  // Partial (WHERE is_active = true) rather than a plain unique index, because
  // every other Eparch is false and a full unique index would allow only one
  // inactive record in the whole table.
  //
  // Deliberately NOT applied to "_bishops_v": that table holds draft versions,
  // where a successor's record may legitimately be prepared as active before
  // the appointment is announced. The constraint bites when it is published.
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "bishops_single_active_idx" ON "bishops" ("is_active") WHERE "is_active" = true;
  `)

  // If two rows are already active — impossible through the admin, but possible
  // if this migration is re-run against a hand-edited database — the index
  // creation above fails loudly rather than silently picking a winner. That is
  // the intended behaviour: which of two Eparchs is the sitting one is not a
  // decision a migration should make.
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // Hand-added counterpart to the partial unique index in up(). Dropped first
  // so it cannot outlive the table it constrains if the DROP TABLE below is
  // ever narrowed.
  await db.execute(sql`DROP INDEX IF EXISTS "bishops_single_active_idx";`)

  await db.execute(sql`
   ALTER TABLE "bishops_milestones_people" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "bishops_milestones_people_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "bishops_milestones_documents" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "bishops_milestones_documents_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "bishops_milestones_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "bishops_milestones_links_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "bishops_milestones" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "bishops_milestones_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "bishops_honors" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "bishops_honors_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "bishops_education" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "bishops_education_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "bishops_previous_appointments" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "bishops_previous_appointments_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "bishops_pastoral_priorities" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "bishops_pastoral_priorities_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "bishops_galleries_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "bishops_galleries_images_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "bishops_galleries" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "bishops_galleries_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "bishops_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "bishops_links_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "bishops_documents" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "bishops_documents_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "bishops_internal_attachments" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "bishops" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "bishops_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "bishops_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_bishops_v_version_milestones_people" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_bishops_v_version_milestones_people_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_bishops_v_version_milestones_documents" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_bishops_v_version_milestones_documents_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_bishops_v_version_milestones_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_bishops_v_version_milestones_links_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_bishops_v_version_milestones" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_bishops_v_version_milestones_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_bishops_v_version_honors" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_bishops_v_version_honors_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_bishops_v_version_education" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_bishops_v_version_education_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_bishops_v_version_previous_appointments" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_bishops_v_version_previous_appointments_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_bishops_v_version_pastoral_priorities" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_bishops_v_version_pastoral_priorities_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_bishops_v_version_galleries_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_bishops_v_version_galleries_images_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_bishops_v_version_galleries" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_bishops_v_version_galleries_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_bishops_v_version_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_bishops_v_version_links_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_bishops_v_version_documents" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_bishops_v_version_documents_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_bishops_v_version_internal_attachments" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_bishops_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_bishops_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_bishops_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "bishops_milestones_people" CASCADE;
  DROP TABLE "bishops_milestones_people_locales" CASCADE;
  DROP TABLE "bishops_milestones_documents" CASCADE;
  DROP TABLE "bishops_milestones_documents_locales" CASCADE;
  DROP TABLE "bishops_milestones_links" CASCADE;
  DROP TABLE "bishops_milestones_links_locales" CASCADE;
  DROP TABLE "bishops_milestones" CASCADE;
  DROP TABLE "bishops_milestones_locales" CASCADE;
  DROP TABLE "bishops_honors" CASCADE;
  DROP TABLE "bishops_honors_locales" CASCADE;
  DROP TABLE "bishops_education" CASCADE;
  DROP TABLE "bishops_education_locales" CASCADE;
  DROP TABLE "bishops_previous_appointments" CASCADE;
  DROP TABLE "bishops_previous_appointments_locales" CASCADE;
  DROP TABLE "bishops_pastoral_priorities" CASCADE;
  DROP TABLE "bishops_pastoral_priorities_locales" CASCADE;
  DROP TABLE "bishops_galleries_images" CASCADE;
  DROP TABLE "bishops_galleries_images_locales" CASCADE;
  DROP TABLE "bishops_galleries" CASCADE;
  DROP TABLE "bishops_galleries_locales" CASCADE;
  DROP TABLE "bishops_links" CASCADE;
  DROP TABLE "bishops_links_locales" CASCADE;
  DROP TABLE "bishops_documents" CASCADE;
  DROP TABLE "bishops_documents_locales" CASCADE;
  DROP TABLE "bishops_internal_attachments" CASCADE;
  DROP TABLE "bishops" CASCADE;
  DROP TABLE "bishops_locales" CASCADE;
  DROP TABLE "bishops_rels" CASCADE;
  DROP TABLE "_bishops_v_version_milestones_people" CASCADE;
  DROP TABLE "_bishops_v_version_milestones_people_locales" CASCADE;
  DROP TABLE "_bishops_v_version_milestones_documents" CASCADE;
  DROP TABLE "_bishops_v_version_milestones_documents_locales" CASCADE;
  DROP TABLE "_bishops_v_version_milestones_links" CASCADE;
  DROP TABLE "_bishops_v_version_milestones_links_locales" CASCADE;
  DROP TABLE "_bishops_v_version_milestones" CASCADE;
  DROP TABLE "_bishops_v_version_milestones_locales" CASCADE;
  DROP TABLE "_bishops_v_version_honors" CASCADE;
  DROP TABLE "_bishops_v_version_honors_locales" CASCADE;
  DROP TABLE "_bishops_v_version_education" CASCADE;
  DROP TABLE "_bishops_v_version_education_locales" CASCADE;
  DROP TABLE "_bishops_v_version_previous_appointments" CASCADE;
  DROP TABLE "_bishops_v_version_previous_appointments_locales" CASCADE;
  DROP TABLE "_bishops_v_version_pastoral_priorities" CASCADE;
  DROP TABLE "_bishops_v_version_pastoral_priorities_locales" CASCADE;
  DROP TABLE "_bishops_v_version_galleries_images" CASCADE;
  DROP TABLE "_bishops_v_version_galleries_images_locales" CASCADE;
  DROP TABLE "_bishops_v_version_galleries" CASCADE;
  DROP TABLE "_bishops_v_version_galleries_locales" CASCADE;
  DROP TABLE "_bishops_v_version_links" CASCADE;
  DROP TABLE "_bishops_v_version_links_locales" CASCADE;
  DROP TABLE "_bishops_v_version_documents" CASCADE;
  DROP TABLE "_bishops_v_version_documents_locales" CASCADE;
  DROP TABLE "_bishops_v_version_internal_attachments" CASCADE;
  DROP TABLE "_bishops_v" CASCADE;
  DROP TABLE "_bishops_v_locales" CASCADE;
  DROP TABLE "_bishops_v_rels" CASCADE;
  ALTER TABLE "bishop_messages" DROP CONSTRAINT "bishop_messages_bishop_id_bishops_id_fk";
  
  ALTER TABLE "_bishop_messages_v" DROP CONSTRAINT "_bishop_messages_v_version_bishop_id_bishops_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_bishops_fk";
  
  ALTER TABLE "users_permissions_grant" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum_users_permissions_grant";
  CREATE TYPE "public"."enum_users_permissions_grant" AS ENUM('news.create', 'news.update', 'news.delete', 'news.publish', 'pages.create', 'pages.update', 'pages.delete', 'pages.publish', 'pope-messages.create', 'pope-messages.update', 'pope-messages.delete', 'pope-messages.publish', 'bishop-messages.create', 'bishop-messages.update', 'bishop-messages.delete', 'bishop-messages.publish', 'apps.create', 'apps.update', 'apps.delete', 'apps.publish', 'offices.create', 'offices.update', 'offices.delete', 'offices.publish', 'events.create', 'events.update', 'events.delete', 'events.publish', 'events.manage-own', 'publications.create', 'publications.update', 'publications.delete', 'magazines.create', 'magazines.update', 'magazines.delete', 'archives.create', 'archives.update', 'archives.delete', 'priests.create', 'priests.update', 'priests.delete', 'vicariates.create', 'vicariates.update', 'vicariates.delete', 'schools.create', 'schools.update', 'schools.delete', 'clinics.create', 'clinics.update', 'clinics.delete', 'parishes.create', 'parishes.update', 'parishes.delete', 'parishes.update-own', 'ministries.create', 'ministries.update', 'ministries.delete', 'children-programs.create', 'children-programs.update', 'children-programs.delete', 'small-christian-communities.create', 'small-christian-communities.update', 'small-christian-communities.delete', 'small-christian-communities.manage-own', 'news-categories.manage', 'event-types.manage', 'geez-calendar.manage', 'geez-calendar.import', 'media.upload', 'media.delete', 'media.view-restricted', 'feed-sources.manage', 'subscribers.view', 'subscribers.manage', 'subscribers.delete', 'visitor-stats.view', 'visitor-stats.delete', 'contact-submissions.view', 'contact-submissions.manage', 'contact-submissions.publish-qa', 'contact-submissions.delete', 'donations.view', 'donations.manage', 'donations.config', 'donations.delete', 'users.view', 'users.manage', 'audit-log.view', 'system.maintenance-mode', 'globals.site-settings.edit', 'globals.header.edit', 'globals.footer.edit', 'globals.homepage.edit', 'globals.navigation.edit', 'globals.about-page.edit', 'globals.banner-settings.edit', 'globals.donation-settings.edit');
  ALTER TABLE "users_permissions_grant" ALTER COLUMN "value" SET DATA TYPE "public"."enum_users_permissions_grant" USING "value"::"public"."enum_users_permissions_grant";
  ALTER TABLE "users_permissions_revoke" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum_users_permissions_revoke";
  CREATE TYPE "public"."enum_users_permissions_revoke" AS ENUM('news.create', 'news.update', 'news.delete', 'news.publish', 'pages.create', 'pages.update', 'pages.delete', 'pages.publish', 'pope-messages.create', 'pope-messages.update', 'pope-messages.delete', 'pope-messages.publish', 'bishop-messages.create', 'bishop-messages.update', 'bishop-messages.delete', 'bishop-messages.publish', 'apps.create', 'apps.update', 'apps.delete', 'apps.publish', 'offices.create', 'offices.update', 'offices.delete', 'offices.publish', 'events.create', 'events.update', 'events.delete', 'events.publish', 'events.manage-own', 'publications.create', 'publications.update', 'publications.delete', 'magazines.create', 'magazines.update', 'magazines.delete', 'archives.create', 'archives.update', 'archives.delete', 'priests.create', 'priests.update', 'priests.delete', 'vicariates.create', 'vicariates.update', 'vicariates.delete', 'schools.create', 'schools.update', 'schools.delete', 'clinics.create', 'clinics.update', 'clinics.delete', 'parishes.create', 'parishes.update', 'parishes.delete', 'parishes.update-own', 'ministries.create', 'ministries.update', 'ministries.delete', 'children-programs.create', 'children-programs.update', 'children-programs.delete', 'small-christian-communities.create', 'small-christian-communities.update', 'small-christian-communities.delete', 'small-christian-communities.manage-own', 'news-categories.manage', 'event-types.manage', 'geez-calendar.manage', 'geez-calendar.import', 'media.upload', 'media.delete', 'media.view-restricted', 'feed-sources.manage', 'subscribers.view', 'subscribers.manage', 'subscribers.delete', 'visitor-stats.view', 'visitor-stats.delete', 'contact-submissions.view', 'contact-submissions.manage', 'contact-submissions.publish-qa', 'contact-submissions.delete', 'donations.view', 'donations.manage', 'donations.config', 'donations.delete', 'users.view', 'users.manage', 'audit-log.view', 'system.maintenance-mode', 'globals.site-settings.edit', 'globals.header.edit', 'globals.footer.edit', 'globals.homepage.edit', 'globals.navigation.edit', 'globals.about-page.edit', 'globals.banner-settings.edit', 'globals.donation-settings.edit');
  ALTER TABLE "users_permissions_revoke" ALTER COLUMN "value" SET DATA TYPE "public"."enum_users_permissions_revoke" USING "value"::"public"."enum_users_permissions_revoke";
  DROP INDEX "bishop_messages_bishop_idx";
  DROP INDEX "_bishop_messages_v_version_version_bishop_idx";
  DROP INDEX "payload_locked_documents_rels_bishops_id_idx";
  ALTER TABLE "bishop_messages" DROP COLUMN "bishop_id";
  ALTER TABLE "_bishop_messages_v" DROP COLUMN "version_bishop_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "bishops_id";
  DROP TYPE "public"."enum_bishops_milestones_people_role";
  DROP TYPE "public"."enum_bishops_milestones_documents_document_type";
  DROP TYPE "public"."enum_bishops_milestones_links_link_type";
  DROP TYPE "public"."enum_bishops_milestones_milestone_type";
  DROP TYPE "public"."enum_bishops_milestones_date_precision";
  DROP TYPE "public"."enum_bishops_milestones_end_date_precision";
  DROP TYPE "public"."enum_bishops_honors_category";
  DROP TYPE "public"."enum_bishops_honors_date_precision";
  DROP TYPE "public"."enum_bishops_pastoral_priorities_status";
  DROP TYPE "public"."enum_bishops_links_link_type";
  DROP TYPE "public"."enum_bishops_documents_document_type";
  DROP TYPE "public"."enum_bishops_honorific";
  DROP TYPE "public"."enum_bishops_date_of_birth_precision";
  DROP TYPE "public"."enum_bishops_date_of_death_precision";
  DROP TYPE "public"."enum_bishops_term_end_reason";
  DROP TYPE "public"."enum_bishops_appointing_authority";
  DROP TYPE "public"."enum_bishops_status";
  DROP TYPE "public"."enum__bishops_v_version_milestones_people_role";
  DROP TYPE "public"."enum__bishops_v_version_milestones_documents_document_type";
  DROP TYPE "public"."enum__bishops_v_version_milestones_links_link_type";
  DROP TYPE "public"."enum__bishops_v_version_milestones_milestone_type";
  DROP TYPE "public"."enum__bishops_v_version_milestones_date_precision";
  DROP TYPE "public"."enum__bishops_v_version_milestones_end_date_precision";
  DROP TYPE "public"."enum__bishops_v_version_honors_category";
  DROP TYPE "public"."enum__bishops_v_version_honors_date_precision";
  DROP TYPE "public"."enum__bishops_v_version_pastoral_priorities_status";
  DROP TYPE "public"."enum__bishops_v_version_links_link_type";
  DROP TYPE "public"."enum__bishops_v_version_documents_document_type";
  DROP TYPE "public"."enum__bishops_v_version_honorific";
  DROP TYPE "public"."enum__bishops_v_version_date_of_birth_precision";
  DROP TYPE "public"."enum__bishops_v_version_date_of_death_precision";
  DROP TYPE "public"."enum__bishops_v_version_term_end_reason";
  DROP TYPE "public"."enum__bishops_v_version_appointing_authority";
  DROP TYPE "public"."enum__bishops_v_version_status";
  DROP TYPE "public"."enum__bishops_v_published_locale";`)
}
