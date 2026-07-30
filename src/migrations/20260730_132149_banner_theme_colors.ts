import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_banner_settings_schedule_theme" ADD VALUE IF NOT EXISTS 'marian-blue' BEFORE 'custom';
  ALTER TYPE "public"."enum_banner_settings_schedule_theme" ADD VALUE IF NOT EXISTS 'sky-blue' BEFORE 'custom';
  ALTER TYPE "public"."enum_banner_settings_schedule_theme" ADD VALUE IF NOT EXISTS 'forest-green' BEFORE 'custom';
  ALTER TYPE "public"."enum_banner_settings_schedule_theme" ADD VALUE IF NOT EXISTS 'royal-gold' BEFORE 'custom';
  ALTER TYPE "public"."enum_banner_settings_schedule_theme" ADD VALUE IF NOT EXISTS 'charcoal' BEFORE 'custom';
  ALTER TYPE "public"."enum_banner_settings_theme" ADD VALUE IF NOT EXISTS 'marian-blue' BEFORE 'custom';
  ALTER TYPE "public"."enum_banner_settings_theme" ADD VALUE IF NOT EXISTS 'sky-blue' BEFORE 'custom';
  ALTER TYPE "public"."enum_banner_settings_theme" ADD VALUE IF NOT EXISTS 'forest-green' BEFORE 'custom';
  ALTER TYPE "public"."enum_banner_settings_theme" ADD VALUE IF NOT EXISTS 'royal-gold' BEFORE 'custom';
  ALTER TYPE "public"."enum_banner_settings_theme" ADD VALUE IF NOT EXISTS 'charcoal' BEFORE 'custom';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "banner_settings_schedule" ALTER COLUMN "theme" SET DATA TYPE text;
  ALTER TABLE "banner_settings_schedule" ALTER COLUMN "theme" SET DEFAULT 'advent'::text;
  DROP TYPE "public"."enum_banner_settings_schedule_theme";
  CREATE TYPE "public"."enum_banner_settings_schedule_theme" AS ENUM('default', 'advent', 'christmas', 'lent', 'holy-week', 'easter', 'pentecost', 'custom');
  ALTER TABLE "banner_settings_schedule" ALTER COLUMN "theme" SET DEFAULT 'advent'::"public"."enum_banner_settings_schedule_theme";
  ALTER TABLE "banner_settings_schedule" ALTER COLUMN "theme" SET DATA TYPE "public"."enum_banner_settings_schedule_theme" USING "theme"::"public"."enum_banner_settings_schedule_theme";
  ALTER TABLE "banner_settings" ALTER COLUMN "theme" SET DATA TYPE text;
  ALTER TABLE "banner_settings" ALTER COLUMN "theme" SET DEFAULT 'default'::text;
  DROP TYPE "public"."enum_banner_settings_theme";
  CREATE TYPE "public"."enum_banner_settings_theme" AS ENUM('default', 'advent', 'christmas', 'lent', 'holy-week', 'easter', 'pentecost', 'custom');
  ALTER TABLE "banner_settings" ALTER COLUMN "theme" SET DEFAULT 'default'::"public"."enum_banner_settings_theme";
  ALTER TABLE "banner_settings" ALTER COLUMN "theme" SET DATA TYPE "public"."enum_banner_settings_theme" USING "theme"::"public"."enum_banner_settings_theme";`)
}
