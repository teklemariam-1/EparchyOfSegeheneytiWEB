import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Written idempotently (IF NOT EXISTS / duplicate_object guards) rather than
 * as generated: this database has also been dev-mode pushed, so any of these
 * columns may already exist when the migration runs.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  DO $$ BEGIN
    CREATE TYPE "public"."enum_news_translation_status" AS ENUM('auto', 'failed', 'source');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum__news_v_version_translation_status" AS ENUM('auto', 'failed', 'source');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum_pope_messages_translation_status" AS ENUM('auto', 'failed', 'source');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN
    CREATE TYPE "public"."enum__pope_messages_v_version_translation_status" AS ENUM('auto', 'failed', 'source');
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  ALTER TABLE "news" ADD COLUMN IF NOT EXISTS "translation_status" "enum_news_translation_status";
  ALTER TABLE "news" ADD COLUMN IF NOT EXISTS "source_title" varchar;
  ALTER TABLE "news" ADD COLUMN IF NOT EXISTS "source_summary" varchar;
  ALTER TABLE "_news_v" ADD COLUMN IF NOT EXISTS "version_translation_status" "enum__news_v_version_translation_status";
  ALTER TABLE "_news_v" ADD COLUMN IF NOT EXISTS "version_source_title" varchar;
  ALTER TABLE "_news_v" ADD COLUMN IF NOT EXISTS "version_source_summary" varchar;
  ALTER TABLE "feed_sources" ADD COLUMN IF NOT EXISTS "auto_translate" boolean DEFAULT true;
  ALTER TABLE "pope_messages" ADD COLUMN IF NOT EXISTS "translation_status" "enum_pope_messages_translation_status";
  ALTER TABLE "pope_messages" ADD COLUMN IF NOT EXISTS "source_title" varchar;
  ALTER TABLE "pope_messages" ADD COLUMN IF NOT EXISTS "source_summary" varchar;
  ALTER TABLE "_pope_messages_v" ADD COLUMN IF NOT EXISTS "version_translation_status" "enum__pope_messages_v_version_translation_status";
  ALTER TABLE "_pope_messages_v" ADD COLUMN IF NOT EXISTS "version_source_title" varchar;
  ALTER TABLE "_pope_messages_v" ADD COLUMN IF NOT EXISTS "version_source_summary" varchar;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "news" DROP COLUMN IF EXISTS "translation_status";
  ALTER TABLE "news" DROP COLUMN IF EXISTS "source_title";
  ALTER TABLE "news" DROP COLUMN IF EXISTS "source_summary";
  ALTER TABLE "_news_v" DROP COLUMN IF EXISTS "version_translation_status";
  ALTER TABLE "_news_v" DROP COLUMN IF EXISTS "version_source_title";
  ALTER TABLE "_news_v" DROP COLUMN IF EXISTS "version_source_summary";
  ALTER TABLE "feed_sources" DROP COLUMN IF EXISTS "auto_translate";
  ALTER TABLE "pope_messages" DROP COLUMN IF EXISTS "translation_status";
  ALTER TABLE "pope_messages" DROP COLUMN IF EXISTS "source_title";
  ALTER TABLE "pope_messages" DROP COLUMN IF EXISTS "source_summary";
  ALTER TABLE "_pope_messages_v" DROP COLUMN IF EXISTS "version_translation_status";
  ALTER TABLE "_pope_messages_v" DROP COLUMN IF EXISTS "version_source_title";
  ALTER TABLE "_pope_messages_v" DROP COLUMN IF EXISTS "version_source_summary";
  DROP TYPE IF EXISTS "public"."enum_news_translation_status";
  DROP TYPE IF EXISTS "public"."enum__news_v_version_translation_status";
  DROP TYPE IF EXISTS "public"."enum_pope_messages_translation_status";
  DROP TYPE IF EXISTS "public"."enum__pope_messages_v_version_translation_status";`)
}
