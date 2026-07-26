import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "footer_bottom_links" ADD COLUMN "new_tab" boolean DEFAULT false;`)

  // The renderer treats a falsy value as "same tab", but keep the stored data
  // honest so the admin checkbox never renders indeterminate on existing rows.
  await db.execute(
    sql`UPDATE "footer_bottom_links" SET "new_tab" = false WHERE "new_tab" IS NULL`,
  )
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "footer_bottom_links" DROP COLUMN "new_tab";`)
}
