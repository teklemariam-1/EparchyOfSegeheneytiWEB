import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "events" ADD COLUMN "is_cancelled" boolean DEFAULT false;
  ALTER TABLE "_events_v" ADD COLUMN "version_is_cancelled" boolean DEFAULT false;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "events" DROP COLUMN "is_cancelled";
  ALTER TABLE "_events_v" DROP COLUMN "version_is_cancelled";`)
}
