import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_news_review_status" AS ENUM('pending', 'approved', 'rejected');
  CREATE TYPE "public"."enum__news_v_version_review_status" AS ENUM('pending', 'approved', 'rejected');
  ALTER TABLE "news" ADD COLUMN "is_imported" boolean DEFAULT false;
  ALTER TABLE "news" ADD COLUMN "imported_at" timestamp(3) with time zone;
  ALTER TABLE "news" ADD COLUMN "review_status" "enum_news_review_status" DEFAULT 'pending';
  ALTER TABLE "_news_v" ADD COLUMN "version_is_imported" boolean DEFAULT false;
  ALTER TABLE "_news_v" ADD COLUMN "version_imported_at" timestamp(3) with time zone;
  ALTER TABLE "_news_v" ADD COLUMN "version_review_status" "enum__news_v_version_review_status" DEFAULT 'pending';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "news" DROP COLUMN "is_imported";
  ALTER TABLE "news" DROP COLUMN "imported_at";
  ALTER TABLE "news" DROP COLUMN "review_status";
  ALTER TABLE "_news_v" DROP COLUMN "version_is_imported";
  ALTER TABLE "_news_v" DROP COLUMN "version_imported_at";
  ALTER TABLE "_news_v" DROP COLUMN "version_review_status";
  DROP TYPE "public"."enum_news_review_status";
  DROP TYPE "public"."enum__news_v_version_review_status";`)
}
