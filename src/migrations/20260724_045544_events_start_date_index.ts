import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE INDEX "events_start_date_idx" ON "events" USING btree ("start_date");
  CREATE INDEX "_events_v_version_version_start_date_idx" ON "_events_v" USING btree ("version_start_date");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "events_start_date_idx";
  DROP INDEX "_events_v_version_version_start_date_idx";`)
}
