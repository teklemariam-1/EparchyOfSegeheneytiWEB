import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_homepage_hero_overlay_color" AS ENUM('maroon', 'charcoal', 'green', 'navy', 'gold', 'custom', 'none');
  ALTER TABLE "homepage" ADD COLUMN "hero_overlay_color" "enum_homepage_hero_overlay_color" DEFAULT 'maroon';
  ALTER TABLE "homepage" ADD COLUMN "hero_overlay_custom_color" varchar;
  ALTER TABLE "homepage" ADD COLUMN "hero_overlay_opacity" numeric DEFAULT 65;
  ALTER TABLE "homepage" ADD COLUMN "hero_overlay_darken_bottom" boolean DEFAULT true;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "homepage" DROP COLUMN "hero_overlay_color";
  ALTER TABLE "homepage" DROP COLUMN "hero_overlay_custom_color";
  ALTER TABLE "homepage" DROP COLUMN "hero_overlay_opacity";
  ALTER TABLE "homepage" DROP COLUMN "hero_overlay_darken_bottom";
  DROP TYPE "public"."enum_homepage_hero_overlay_color";`)
}
