import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages" ADD COLUMN "publish_at" timestamp(3) with time zone;
  ALTER TABLE "_pages_v" ADD COLUMN "version_publish_at" timestamp(3) with time zone;
  ALTER TABLE "news" ADD COLUMN "publish_at" timestamp(3) with time zone;
  ALTER TABLE "_news_v" ADD COLUMN "version_publish_at" timestamp(3) with time zone;
  ALTER TABLE "events" ADD COLUMN "publish_at" timestamp(3) with time zone;
  ALTER TABLE "_events_v" ADD COLUMN "version_publish_at" timestamp(3) with time zone;
  ALTER TABLE "offices" ADD COLUMN "publish_at" timestamp(3) with time zone;
  ALTER TABLE "_offices_v" ADD COLUMN "version_publish_at" timestamp(3) with time zone;
  ALTER TABLE "pope_messages" ADD COLUMN "publish_at" timestamp(3) with time zone;
  ALTER TABLE "_pope_messages_v" ADD COLUMN "version_publish_at" timestamp(3) with time zone;
  ALTER TABLE "bishops" ADD COLUMN "publish_at" timestamp(3) with time zone;
  ALTER TABLE "_bishops_v" ADD COLUMN "version_publish_at" timestamp(3) with time zone;
  ALTER TABLE "bishop_messages" ADD COLUMN "publish_at" timestamp(3) with time zone;
  ALTER TABLE "_bishop_messages_v" ADD COLUMN "version_publish_at" timestamp(3) with time zone;
  ALTER TABLE "apps" ADD COLUMN "publish_at" timestamp(3) with time zone;
  ALTER TABLE "_apps_v" ADD COLUMN "version_publish_at" timestamp(3) with time zone;
  CREATE INDEX "pages_publish_at_idx" ON "pages" USING btree ("publish_at");
  CREATE INDEX "_pages_v_version_version_publish_at_idx" ON "_pages_v" USING btree ("version_publish_at");
  CREATE INDEX "news_publish_at_idx" ON "news" USING btree ("publish_at");
  CREATE INDEX "_news_v_version_version_publish_at_idx" ON "_news_v" USING btree ("version_publish_at");
  CREATE INDEX "events_publish_at_idx" ON "events" USING btree ("publish_at");
  CREATE INDEX "_events_v_version_version_publish_at_idx" ON "_events_v" USING btree ("version_publish_at");
  CREATE INDEX "offices_publish_at_idx" ON "offices" USING btree ("publish_at");
  CREATE INDEX "_offices_v_version_version_publish_at_idx" ON "_offices_v" USING btree ("version_publish_at");
  CREATE INDEX "pope_messages_publish_at_idx" ON "pope_messages" USING btree ("publish_at");
  CREATE INDEX "_pope_messages_v_version_version_publish_at_idx" ON "_pope_messages_v" USING btree ("version_publish_at");
  CREATE INDEX "bishops_publish_at_idx" ON "bishops" USING btree ("publish_at");
  CREATE INDEX "_bishops_v_version_version_publish_at_idx" ON "_bishops_v" USING btree ("version_publish_at");
  CREATE INDEX "bishop_messages_publish_at_idx" ON "bishop_messages" USING btree ("publish_at");
  CREATE INDEX "_bishop_messages_v_version_version_publish_at_idx" ON "_bishop_messages_v" USING btree ("version_publish_at");
  CREATE INDEX "apps_publish_at_idx" ON "apps" USING btree ("publish_at");
  CREATE INDEX "_apps_v_version_version_publish_at_idx" ON "_apps_v" USING btree ("version_publish_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "pages_publish_at_idx";
  DROP INDEX "_pages_v_version_version_publish_at_idx";
  DROP INDEX "news_publish_at_idx";
  DROP INDEX "_news_v_version_version_publish_at_idx";
  DROP INDEX "events_publish_at_idx";
  DROP INDEX "_events_v_version_version_publish_at_idx";
  DROP INDEX "offices_publish_at_idx";
  DROP INDEX "_offices_v_version_version_publish_at_idx";
  DROP INDEX "pope_messages_publish_at_idx";
  DROP INDEX "_pope_messages_v_version_version_publish_at_idx";
  DROP INDEX "bishops_publish_at_idx";
  DROP INDEX "_bishops_v_version_version_publish_at_idx";
  DROP INDEX "bishop_messages_publish_at_idx";
  DROP INDEX "_bishop_messages_v_version_version_publish_at_idx";
  DROP INDEX "apps_publish_at_idx";
  DROP INDEX "_apps_v_version_version_publish_at_idx";
  ALTER TABLE "pages" DROP COLUMN "publish_at";
  ALTER TABLE "_pages_v" DROP COLUMN "version_publish_at";
  ALTER TABLE "news" DROP COLUMN "publish_at";
  ALTER TABLE "_news_v" DROP COLUMN "version_publish_at";
  ALTER TABLE "events" DROP COLUMN "publish_at";
  ALTER TABLE "_events_v" DROP COLUMN "version_publish_at";
  ALTER TABLE "offices" DROP COLUMN "publish_at";
  ALTER TABLE "_offices_v" DROP COLUMN "version_publish_at";
  ALTER TABLE "pope_messages" DROP COLUMN "publish_at";
  ALTER TABLE "_pope_messages_v" DROP COLUMN "version_publish_at";
  ALTER TABLE "bishops" DROP COLUMN "publish_at";
  ALTER TABLE "_bishops_v" DROP COLUMN "version_publish_at";
  ALTER TABLE "bishop_messages" DROP COLUMN "publish_at";
  ALTER TABLE "_bishop_messages_v" DROP COLUMN "version_publish_at";
  ALTER TABLE "apps" DROP COLUMN "publish_at";
  ALTER TABLE "_apps_v" DROP COLUMN "version_publish_at";`)
}
