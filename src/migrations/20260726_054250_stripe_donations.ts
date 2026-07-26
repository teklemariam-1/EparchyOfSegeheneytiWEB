import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Stripe card donations + a real manual-transfer flow.
 *
 * Hand-corrected after generation. The generated version was not safe to run
 * against a table that already holds donations, in two ways, and both would
 * have failed in production while passing in a fresh dev database:
 *
 *  1. `ADD COLUMN "amount_minor" numeric NOT NULL` with no default aborts the
 *     moment any row exists. It is added nullable, backfilled from `amount`
 *     using each row's own currency exponent, and only then made NOT NULL.
 *
 *  2. The status enum is replaced, and the old values `received`/`cancelled`
 *     are not in the new set. Casting `'received'::enum_donations_status` would
 *     error out. Existing values are mapped first — `received` is what the old
 *     flow called a settled gift, so it becomes `succeeded`.
 *
 * `provider_ref` is dropped: it was a single untyped "external payment id"
 * field, now replaced by the typed stripe_session_id / stripe_payment_intent_id
 * / stripe_charge_id columns. `stripe_publishable_key` is dropped because
 * Stripe key material now lives only in environment variables — a key in a
 * globals row is a key in every database backup.
 */

/** Minor-unit multiplier per currency, matching lib/donations/amounts.ts. */
const MINOR_UNIT_FACTOR = sql`CASE
    WHEN upper("currency") IN ('BIF','CLP','DJF','GNF','JPY','KMF','KRW','MGA','PYG','RWF','UGX','VND','VUV','XAF','XOF','XPF') THEN 1
    WHEN upper("currency") IN ('BHD','JOD','KWD','OMR','TND') THEN 1000
    ELSE 100
  END`

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // ── New types and tables ──────────────────────────────────────────────────
  await db.execute(sql`
    CREATE TYPE "public"."enum_donations_locale" AS ENUM('en', 'ti');
    CREATE TYPE "public"."enum_stripe_events_status" AS ENUM('received', 'processed', 'ignored', 'failed');
  `)

  // Adding an enum value is its own statement: Postgres forbids using a newly
  // added value in the same transaction that adds it, so keeping it separate
  // makes the constraint obvious rather than incidental.
  await db.execute(sql`ALTER TYPE "public"."enum_donation_settings_provider" ADD VALUE IF NOT EXISTS 'both';`)

  await db.execute(sql`
    CREATE TABLE "stripe_events" (
      "id" serial PRIMARY KEY NOT NULL,
      "event_id" varchar NOT NULL,
      "type" varchar NOT NULL,
      "status" "enum_stripe_events_status" DEFAULT 'received' NOT NULL,
      "donation_id" integer,
      "livemode" boolean DEFAULT false,
      "error" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE "donation_settings_stripe_currencies" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "code" varchar,
      "label" varchar
    );
  `)

  // ── Donation status lifecycle ─────────────────────────────────────────────
  // pending → succeeded | failed | refunded | disputed, plus `cancelled` kept
  // for manual pledges staff abandon.
  await db.execute(sql`
    ALTER TABLE "donations" ALTER COLUMN "status" DROP DEFAULT;
    ALTER TABLE "donations" ALTER COLUMN "status" SET DATA TYPE text;
    UPDATE "donations" SET "status" = 'succeeded' WHERE "status" = 'received';
    DROP TYPE "public"."enum_donations_status";
    CREATE TYPE "public"."enum_donations_status" AS ENUM('pending', 'succeeded', 'failed', 'refunded', 'disputed', 'cancelled');
    ALTER TABLE "donations" ALTER COLUMN "status" SET DATA TYPE "public"."enum_donations_status" USING "status"::"public"."enum_donations_status";
    ALTER TABLE "donations" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."enum_donations_status";
  `)

  // ── Money: the canonical integer amount ───────────────────────────────────
  await db.execute(sql`ALTER TABLE "donations" ADD COLUMN "amount_minor" numeric;`)
  await db.execute(sql`
    UPDATE "donations"
    SET "amount_minor" = ROUND("amount" * ${MINOR_UNIT_FACTOR})
    WHERE "amount_minor" IS NULL;
  `)
  // Any row whose amount was null/zero cannot produce a valid minor amount;
  // there should be none (amount is NOT NULL), but the guard means the NOT NULL
  // below can never abort a production migration.
  await db.execute(sql`UPDATE "donations" SET "amount_minor" = 0 WHERE "amount_minor" IS NULL;`)
  await db.execute(sql`ALTER TABLE "donations" ALTER COLUMN "amount_minor" SET NOT NULL;`)

  // ── Remaining donation columns ────────────────────────────────────────────
  await db.execute(sql`
    ALTER TABLE "donations" ADD COLUMN "locale" "enum_donations_locale" DEFAULT 'en';
    ALTER TABLE "donations" ADD COLUMN "stripe_session_id" varchar;
    ALTER TABLE "donations" ADD COLUMN "stripe_payment_intent_id" varchar;
    ALTER TABLE "donations" ADD COLUMN "stripe_charge_id" varchar;
    ALTER TABLE "donations" ADD COLUMN "stripe_customer_id" varchar;
    ALTER TABLE "donations" ADD COLUMN "stripe_subscription_id" varchar;
    ALTER TABLE "donations" ADD COLUMN "stripe_event_id" varchar;
    ALTER TABLE "donations" ADD COLUMN "refunded_amount_minor" numeric;
    ALTER TABLE "donations" ADD COLUMN "failure_reason" varchar;
    ALTER TABLE "donations" ADD COLUMN "confirmed_at" timestamp(3) with time zone;
  `)

  // A pre-existing donation that was already settled should carry a confirmed
  // timestamp rather than looking like it settled the moment of this deploy.
  await db.execute(sql`
    UPDATE "donations" SET "confirmed_at" = "updated_at"
    WHERE "status" = 'succeeded' AND "confirmed_at" IS NULL;
  `)

  // ── Settings ──────────────────────────────────────────────────────────────
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "stripe_events_id" integer;
    ALTER TABLE "donation_settings" ADD COLUMN "prefer_manual_for_countries" varchar DEFAULT 'ER';
    ALTER TABLE "donation_settings" ADD COLUMN "public_transfer_details_account_holder" varchar;
    ALTER TABLE "donation_settings" ADD COLUMN "public_transfer_details_bank_name" varchar;
    ALTER TABLE "donation_settings" ADD COLUMN "public_transfer_details_account_number" varchar;
    ALTER TABLE "donation_settings" ADD COLUMN "public_transfer_details_swift" varchar;
    ALTER TABLE "donation_settings" ADD COLUMN "stripe_statement_descriptor" varchar;
    ALTER TABLE "donation_settings_locales" ADD COLUMN "stripe_account_notice" varchar;
  `)

  // ── Constraints and indexes ───────────────────────────────────────────────
  await db.execute(sql`
    ALTER TABLE "stripe_events" ADD CONSTRAINT "stripe_events_donation_id_donations_id_fk" FOREIGN KEY ("donation_id") REFERENCES "public"."donations"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "donation_settings_stripe_currencies" ADD CONSTRAINT "donation_settings_stripe_currencies_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."donation_settings"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_stripe_events_fk" FOREIGN KEY ("stripe_events_id") REFERENCES "public"."stripe_events"("id") ON DELETE cascade ON UPDATE no action;
  `)

  await db.execute(sql`
    CREATE UNIQUE INDEX "stripe_events_event_id_idx" ON "stripe_events" USING btree ("event_id");
    CREATE INDEX "stripe_events_type_idx" ON "stripe_events" USING btree ("type");
    CREATE INDEX "stripe_events_donation_idx" ON "stripe_events" USING btree ("donation_id");
    CREATE INDEX "stripe_events_updated_at_idx" ON "stripe_events" USING btree ("updated_at");
    CREATE INDEX "stripe_events_created_at_idx" ON "stripe_events" USING btree ("created_at");
    CREATE INDEX "donation_settings_stripe_currencies_order_idx" ON "donation_settings_stripe_currencies" USING btree ("_order");
    CREATE INDEX "donation_settings_stripe_currencies_parent_id_idx" ON "donation_settings_stripe_currencies" USING btree ("_parent_id");
    CREATE INDEX "donations_reference_idx" ON "donations" USING btree ("reference");
    CREATE INDEX "donations_stripe_session_id_idx" ON "donations" USING btree ("stripe_session_id");
    CREATE INDEX "donations_stripe_payment_intent_id_idx" ON "donations" USING btree ("stripe_payment_intent_id");
    CREATE INDEX "payload_locked_documents_rels_stripe_events_id_idx" ON "payload_locked_documents_rels" USING btree ("stripe_events_id");
  `)

  // ── Superseded columns ────────────────────────────────────────────────────
  await db.execute(sql`
    ALTER TABLE "donations" DROP COLUMN IF EXISTS "provider_ref";
    ALTER TABLE "donation_settings" DROP COLUMN IF EXISTS "stripe_publishable_key";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "stripe_events" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "donation_settings_stripe_currencies" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_stripe_events_fk";
    DROP TABLE "stripe_events" CASCADE;
    DROP TABLE "donation_settings_stripe_currencies" CASCADE;
  `)

  // Collapse the new lifecycle back onto the old three values before the cast,
  // for the same reason up() maps in the other direction. This is lossy — a
  // refunded or disputed gift becomes "cancelled" — which is unavoidable when
  // rolling back to a schema that cannot express those states.
  await db.execute(sql`
    ALTER TABLE "donations" ALTER COLUMN "status" DROP DEFAULT;
    ALTER TABLE "donations" ALTER COLUMN "status" SET DATA TYPE text;
    UPDATE "donations" SET "status" = 'received' WHERE "status" = 'succeeded';
    UPDATE "donations" SET "status" = 'cancelled' WHERE "status" IN ('failed', 'refunded', 'disputed');
    DROP TYPE "public"."enum_donations_status";
    CREATE TYPE "public"."enum_donations_status" AS ENUM('pending', 'received', 'cancelled');
    ALTER TABLE "donations" ALTER COLUMN "status" SET DATA TYPE "public"."enum_donations_status" USING "status"::"public"."enum_donations_status";
    ALTER TABLE "donations" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."enum_donations_status";
  `)

  await db.execute(sql`
    ALTER TABLE "donation_settings" ALTER COLUMN "provider" DROP DEFAULT;
    ALTER TABLE "donation_settings" ALTER COLUMN "provider" SET DATA TYPE text;
    UPDATE "donation_settings" SET "provider" = 'manual' WHERE "provider" = 'both';
    DROP TYPE "public"."enum_donation_settings_provider";
    CREATE TYPE "public"."enum_donation_settings_provider" AS ENUM('manual', 'stripe');
    ALTER TABLE "donation_settings" ALTER COLUMN "provider" SET DATA TYPE "public"."enum_donation_settings_provider" USING "provider"::"public"."enum_donation_settings_provider";
    ALTER TABLE "donation_settings" ALTER COLUMN "provider" SET DEFAULT 'manual'::"public"."enum_donation_settings_provider";
  `)

  await db.execute(sql`
    DROP INDEX IF EXISTS "donations_reference_idx";
    DROP INDEX IF EXISTS "donations_stripe_session_id_idx";
    DROP INDEX IF EXISTS "donations_stripe_payment_intent_id_idx";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_stripe_events_id_idx";
    ALTER TABLE "donations" ADD COLUMN "provider_ref" varchar;
    ALTER TABLE "donation_settings" ADD COLUMN "stripe_publishable_key" varchar;
    ALTER TABLE "donations" DROP COLUMN "amount_minor";
    ALTER TABLE "donations" DROP COLUMN "locale";
    ALTER TABLE "donations" DROP COLUMN "stripe_session_id";
    ALTER TABLE "donations" DROP COLUMN "stripe_payment_intent_id";
    ALTER TABLE "donations" DROP COLUMN "stripe_charge_id";
    ALTER TABLE "donations" DROP COLUMN "stripe_customer_id";
    ALTER TABLE "donations" DROP COLUMN "stripe_subscription_id";
    ALTER TABLE "donations" DROP COLUMN "stripe_event_id";
    ALTER TABLE "donations" DROP COLUMN "refunded_amount_minor";
    ALTER TABLE "donations" DROP COLUMN "failure_reason";
    ALTER TABLE "donations" DROP COLUMN "confirmed_at";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "stripe_events_id";
    ALTER TABLE "donation_settings" DROP COLUMN "prefer_manual_for_countries";
    ALTER TABLE "donation_settings" DROP COLUMN "public_transfer_details_account_holder";
    ALTER TABLE "donation_settings" DROP COLUMN "public_transfer_details_bank_name";
    ALTER TABLE "donation_settings" DROP COLUMN "public_transfer_details_account_number";
    ALTER TABLE "donation_settings" DROP COLUMN "public_transfer_details_swift";
    ALTER TABLE "donation_settings" DROP COLUMN "stripe_statement_descriptor";
    ALTER TABLE "donation_settings_locales" DROP COLUMN "stripe_account_notice";
    DROP TYPE "public"."enum_donations_locale";
    DROP TYPE "public"."enum_stripe_events_status";
  `)
}
