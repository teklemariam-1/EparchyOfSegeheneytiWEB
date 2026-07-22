import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_banner_settings_schedule_theme" AS ENUM('default', 'advent', 'christmas', 'lent', 'holy-week', 'easter', 'pentecost', 'custom');
  CREATE TYPE "public"."enum_banner_settings_mode" AS ENUM('manual', 'scheduled');
  CREATE TYPE "public"."enum_banner_settings_theme" AS ENUM('default', 'advent', 'christmas', 'lent', 'holy-week', 'easter', 'pentecost', 'custom');
  CREATE TABLE "banner_settings_schedule" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"theme" "enum_banner_settings_schedule_theme" DEFAULT 'advent',
  	"start_date" timestamp(3) with time zone,
  	"end_date" timestamp(3) with time zone
  );
  
  CREATE TABLE "banner_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"mode" "enum_banner_settings_mode" DEFAULT 'manual',
  	"theme" "enum_banner_settings_theme" DEFAULT 'default',
  	"custom_background" varchar,
  	"custom_subtitle_color" varchar,
  	"custom_accent_color" varchar,
  	"custom_pattern_opacity" numeric,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "banner_settings_schedule" ADD CONSTRAINT "banner_settings_schedule_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."banner_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "banner_settings_schedule_order_idx" ON "banner_settings_schedule" USING btree ("_order");
  CREATE INDEX "banner_settings_schedule_parent_id_idx" ON "banner_settings_schedule" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "banner_settings_schedule" CASCADE;
  DROP TABLE "banner_settings" CASCADE;
  DROP TYPE "public"."enum_banner_settings_schedule_theme";
  DROP TYPE "public"."enum_banner_settings_mode";
  DROP TYPE "public"."enum_banner_settings_theme";`)
}
