import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages" DROP COLUMN "status";
  ALTER TABLE "_pages_v" DROP COLUMN "version_status";
  ALTER TABLE "news" DROP COLUMN "status";
  ALTER TABLE "_news_v" DROP COLUMN "version_status";
  ALTER TABLE "events" DROP COLUMN "status";
  ALTER TABLE "_events_v" DROP COLUMN "version_status";
  ALTER TABLE "pope_messages" DROP COLUMN "status";
  ALTER TABLE "_pope_messages_v" DROP COLUMN "version_status";
  ALTER TABLE "bishop_messages" DROP COLUMN "status";
  ALTER TABLE "_bishop_messages_v" DROP COLUMN "version_status";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages" ADD COLUMN "status" "enum_pages_status" DEFAULT 'draft';
  ALTER TABLE "_pages_v" ADD COLUMN "version_status" "enum__pages_v_version_status" DEFAULT 'draft';
  ALTER TABLE "news" ADD COLUMN "status" "enum_news_status" DEFAULT 'draft';
  ALTER TABLE "_news_v" ADD COLUMN "version_status" "enum__news_v_version_status" DEFAULT 'draft';
  ALTER TABLE "events" ADD COLUMN "status" "enum_events_status" DEFAULT 'draft';
  ALTER TABLE "_events_v" ADD COLUMN "version_status" "enum__events_v_version_status" DEFAULT 'draft';
  ALTER TABLE "pope_messages" ADD COLUMN "status" "enum_pope_messages_status" DEFAULT 'draft';
  ALTER TABLE "_pope_messages_v" ADD COLUMN "version_status" "enum__pope_messages_v_version_status" DEFAULT 'draft';
  ALTER TABLE "bishop_messages" ADD COLUMN "status" "enum_bishop_messages_status" DEFAULT 'draft';
  ALTER TABLE "_bishop_messages_v" ADD COLUMN "version_status" "enum__bishop_messages_v_version_status" DEFAULT 'draft';`)
}
