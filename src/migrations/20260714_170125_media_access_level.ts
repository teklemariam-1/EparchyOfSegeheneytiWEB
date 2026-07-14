import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_media_access_level" AS ENUM('public', 'restricted');
  ALTER TABLE "media" ADD COLUMN "access_level" "enum_media_access_level" DEFAULT 'public' NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "media" DROP COLUMN "access_level";
  DROP TYPE "public"."enum_media_access_level";`)
}
