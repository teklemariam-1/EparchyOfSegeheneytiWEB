import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "banner_settings" ALTER COLUMN "image_overlay_opacity" SET DEFAULT 0;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "banner_settings" ALTER COLUMN "image_overlay_opacity" SET DEFAULT 65;`)
}
