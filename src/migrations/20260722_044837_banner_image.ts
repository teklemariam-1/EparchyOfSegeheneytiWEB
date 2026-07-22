import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "banner_settings" ADD COLUMN "image_image_id" integer;
  ALTER TABLE "banner_settings" ADD COLUMN "image_overlay_opacity" numeric DEFAULT 65;
  ALTER TABLE "banner_settings" ADD CONSTRAINT "banner_settings_image_image_id_media_id_fk" FOREIGN KEY ("image_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "banner_settings_image_image_image_idx" ON "banner_settings" USING btree ("image_image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "banner_settings" DROP CONSTRAINT "banner_settings_image_image_id_media_id_fk";
  
  DROP INDEX "banner_settings_image_image_image_idx";
  ALTER TABLE "banner_settings" DROP COLUMN "image_image_id";
  ALTER TABLE "banner_settings" DROP COLUMN "image_overlay_opacity";`)
}
