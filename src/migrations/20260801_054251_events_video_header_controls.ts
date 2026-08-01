import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_header_utility_links_icon" AS ENUM('none', 'phone', 'mail', 'location', 'clock');
  -- The icon column was free text inviting any Lucide name. Anything outside
  -- the new list would make the cast below fail and take the whole deploy with
  -- it, so unrecognised values become NULL first — they rendered nothing
  -- anyway, which is precisely why this became a closed list.
  UPDATE "header_utility_links" SET "icon" = NULL
   WHERE "icon" IS NOT NULL AND "icon" NOT IN ('none','phone','mail','location','clock');
  ALTER TABLE "header_utility_links" ALTER COLUMN "icon" SET DEFAULT 'none'::"public"."enum_header_utility_links_icon";
  ALTER TABLE "header_utility_links" ALTER COLUMN "icon" SET DATA TYPE "public"."enum_header_utility_links_icon" USING "icon"::"public"."enum_header_utility_links_icon";
  ALTER TABLE "news" ADD COLUMN "video_url" varchar;
  ALTER TABLE "_news_v" ADD COLUMN "version_video_url" varchar;
  ALTER TABLE "events" ADD COLUMN "is_featured" boolean DEFAULT false;
  ALTER TABLE "_events_v" ADD COLUMN "version_is_featured" boolean DEFAULT false;
  ALTER TABLE "offices_updates" ADD COLUMN "video_url" varchar;
  ALTER TABLE "_offices_v_version_updates" ADD COLUMN "video_url" varchar;
  ALTER TABLE "header" ADD COLUMN "actions_show_search" boolean DEFAULT true;
  ALTER TABLE "header" ADD COLUMN "actions_show_donate" boolean DEFAULT true;
  ALTER TABLE "header" ADD COLUMN "actions_show_settings" boolean DEFAULT true;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "header_utility_links" ALTER COLUMN "icon" SET DATA TYPE varchar;
  ALTER TABLE "header_utility_links" ALTER COLUMN "icon" DROP DEFAULT;
  ALTER TABLE "news" DROP COLUMN "video_url";
  ALTER TABLE "_news_v" DROP COLUMN "version_video_url";
  ALTER TABLE "events" DROP COLUMN "is_featured";
  ALTER TABLE "_events_v" DROP COLUMN "version_is_featured";
  ALTER TABLE "offices_updates" DROP COLUMN "video_url";
  ALTER TABLE "_offices_v_version_updates" DROP COLUMN "video_url";
  ALTER TABLE "header" DROP COLUMN "actions_show_search";
  ALTER TABLE "header" DROP COLUMN "actions_show_donate";
  ALTER TABLE "header" DROP COLUMN "actions_show_settings";
  DROP TYPE "public"."enum_header_utility_links_icon";`)
}
