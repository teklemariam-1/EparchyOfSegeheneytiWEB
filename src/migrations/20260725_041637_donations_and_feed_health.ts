import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_feed_sources_health_status" AS ENUM('unknown', 'healthy', 'degraded', 'failing');
  CREATE TYPE "public"."enum_donations_frequency" AS ENUM('one-time', 'monthly');
  CREATE TYPE "public"."enum_donations_status" AS ENUM('pending', 'received', 'cancelled');
  CREATE TYPE "public"."enum_donations_provider" AS ENUM('manual', 'stripe');
  CREATE TYPE "public"."enum_donation_settings_provider" AS ENUM('manual', 'stripe');
  CREATE TABLE "donations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"donor_name" varchar NOT NULL,
  	"donor_email" varchar NOT NULL,
  	"amount" numeric NOT NULL,
  	"currency" varchar DEFAULT 'ERN' NOT NULL,
  	"frequency" "enum_donations_frequency" DEFAULT 'one-time',
  	"message" varchar,
  	"anonymous" boolean DEFAULT false,
  	"status" "enum_donations_status" DEFAULT 'pending' NOT NULL,
  	"provider" "enum_donations_provider" DEFAULT 'manual',
  	"provider_ref" varchar,
  	"reference" varchar,
  	"submitted_at" timestamp(3) with time zone,
  	"admin_notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "donation_settings_preset_amounts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"amount" numeric NOT NULL
  );
  
  CREATE TABLE "donation_settings_currencies" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"code" varchar NOT NULL,
  	"label" varchar
  );
  
  CREATE TABLE "donation_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"enabled" boolean DEFAULT false,
  	"provider" "enum_donation_settings_provider" DEFAULT 'manual',
  	"default_currency" varchar DEFAULT 'ERN',
  	"min_amount" numeric DEFAULT 1,
  	"max_amount" numeric,
  	"allow_custom_amount" boolean DEFAULT true,
  	"allow_recurring" boolean DEFAULT true,
  	"receiving_account_account_holder" varchar,
  	"receiving_account_bank_or_provider" varchar,
  	"receiving_account_account_number" varchar,
  	"receiving_account_reference_note" varchar,
  	"stripe_publishable_key" varchar,
  	"last_changed_by_id" integer,
  	"last_changed_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "donation_settings_locales" (
  	"intro" varchar,
  	"manual_instructions" varchar,
  	"thank_you" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "feed_sources" ADD COLUMN "health_status" "enum_feed_sources_health_status" DEFAULT 'unknown';
  ALTER TABLE "feed_sources" ADD COLUMN "feed_format" varchar;
  ALTER TABLE "feed_sources" ADD COLUMN "last_item_count" numeric;
  ALTER TABLE "feed_sources" ADD COLUMN "consecutive_failures" numeric DEFAULT 0;
  ALTER TABLE "feed_sources" ADD COLUMN "last_error" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "donations_id" integer;
  ALTER TABLE "donation_settings_preset_amounts" ADD CONSTRAINT "donation_settings_preset_amounts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."donation_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "donation_settings_currencies" ADD CONSTRAINT "donation_settings_currencies_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."donation_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "donation_settings" ADD CONSTRAINT "donation_settings_last_changed_by_id_users_id_fk" FOREIGN KEY ("last_changed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "donation_settings_locales" ADD CONSTRAINT "donation_settings_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."donation_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "donations_updated_at_idx" ON "donations" USING btree ("updated_at");
  CREATE INDEX "donations_created_at_idx" ON "donations" USING btree ("created_at");
  CREATE INDEX "donation_settings_preset_amounts_order_idx" ON "donation_settings_preset_amounts" USING btree ("_order");
  CREATE INDEX "donation_settings_preset_amounts_parent_id_idx" ON "donation_settings_preset_amounts" USING btree ("_parent_id");
  CREATE INDEX "donation_settings_currencies_order_idx" ON "donation_settings_currencies" USING btree ("_order");
  CREATE INDEX "donation_settings_currencies_parent_id_idx" ON "donation_settings_currencies" USING btree ("_parent_id");
  CREATE INDEX "donation_settings_last_changed_by_idx" ON "donation_settings" USING btree ("last_changed_by_id");
  CREATE UNIQUE INDEX "donation_settings_locales_locale_parent_id_unique" ON "donation_settings_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_donations_fk" FOREIGN KEY ("donations_id") REFERENCES "public"."donations"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_donations_id_idx" ON "payload_locked_documents_rels" USING btree ("donations_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "donations" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "donation_settings_preset_amounts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "donation_settings_currencies" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "donation_settings" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "donation_settings_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "donations" CASCADE;
  DROP TABLE "donation_settings_preset_amounts" CASCADE;
  DROP TABLE "donation_settings_currencies" CASCADE;
  DROP TABLE "donation_settings" CASCADE;
  DROP TABLE "donation_settings_locales" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_donations_fk";
  
  DROP INDEX "payload_locked_documents_rels_donations_id_idx";
  ALTER TABLE "feed_sources" DROP COLUMN "health_status";
  ALTER TABLE "feed_sources" DROP COLUMN "feed_format";
  ALTER TABLE "feed_sources" DROP COLUMN "last_item_count";
  ALTER TABLE "feed_sources" DROP COLUMN "consecutive_failures";
  ALTER TABLE "feed_sources" DROP COLUMN "last_error";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "donations_id";
  DROP TYPE "public"."enum_feed_sources_health_status";
  DROP TYPE "public"."enum_donations_frequency";
  DROP TYPE "public"."enum_donations_status";
  DROP TYPE "public"."enum_donations_provider";
  DROP TYPE "public"."enum_donation_settings_provider";`)
}
