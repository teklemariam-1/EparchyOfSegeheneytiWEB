import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "homepage" ADD COLUMN "bishop_message_photo_id" integer;
  ALTER TABLE "homepage_locales" ADD COLUMN "bishop_message_bishop_name" varchar;
  ALTER TABLE "homepage_locales" ADD COLUMN "bishop_message_bishop_title" varchar;
  ALTER TABLE "homepage" ADD CONSTRAINT "homepage_bishop_message_photo_id_media_id_fk" FOREIGN KEY ("bishop_message_photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "homepage_bishop_message_bishop_message_photo_idx" ON "homepage" USING btree ("bishop_message_photo_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "homepage" DROP CONSTRAINT "homepage_bishop_message_photo_id_media_id_fk";
  
  DROP INDEX "homepage_bishop_message_bishop_message_photo_idx";
  ALTER TABLE "homepage" DROP COLUMN "bishop_message_photo_id";
  ALTER TABLE "homepage_locales" DROP COLUMN "bishop_message_bishop_name";
  ALTER TABLE "homepage_locales" DROP COLUMN "bishop_message_bishop_title";`)
}
