import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "news" ADD COLUMN "source_url" varchar;
  ALTER TABLE "news" ADD COLUMN "source_name" varchar;
  ALTER TABLE "_news_v" ADD COLUMN "version_source_url" varchar;
  ALTER TABLE "_news_v" ADD COLUMN "version_source_name" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "news" DROP COLUMN "source_url";
  ALTER TABLE "news" DROP COLUMN "source_name";
  ALTER TABLE "_news_v" DROP COLUMN "version_source_url";
  ALTER TABLE "_news_v" DROP COLUMN "version_source_name";`)
}
