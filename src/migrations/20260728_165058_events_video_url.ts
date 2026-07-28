import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" ALTER COLUMN "site_name" SET DEFAULT 'Eparchy of Segheneyti';
  ALTER TABLE "site_settings" ALTER COLUMN "contact_address_city" SET DEFAULT 'Segheneyti';
  ALTER TABLE "events" ADD COLUMN "video_url" varchar;
  ALTER TABLE "_events_v" ADD COLUMN "version_video_url" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" ALTER COLUMN "site_name" SET DEFAULT 'Eparchy of Segeneyti';
  ALTER TABLE "site_settings" ALTER COLUMN "contact_address_city" SET DEFAULT 'Segeneyti';
  ALTER TABLE "events" DROP COLUMN "video_url";
  ALTER TABLE "_events_v" DROP COLUMN "version_video_url";`)
}
