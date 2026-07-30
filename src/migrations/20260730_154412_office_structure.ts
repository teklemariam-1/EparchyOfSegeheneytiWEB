import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "offices" ADD COLUMN "structure_parent_id" integer;
  ALTER TABLE "offices" ADD COLUMN "structure_structure_order" numeric;
  ALTER TABLE "_offices_v" ADD COLUMN "version_structure_parent_id" integer;
  ALTER TABLE "_offices_v" ADD COLUMN "version_structure_structure_order" numeric;
  ALTER TABLE "offices" ADD CONSTRAINT "offices_structure_parent_id_offices_id_fk" FOREIGN KEY ("structure_parent_id") REFERENCES "public"."offices"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_offices_v" ADD CONSTRAINT "_offices_v_version_structure_parent_id_offices_id_fk" FOREIGN KEY ("version_structure_parent_id") REFERENCES "public"."offices"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "offices_structure_structure_parent_idx" ON "offices" USING btree ("structure_parent_id");
  CREATE INDEX "_offices_v_version_structure_version_structure_parent_idx" ON "_offices_v" USING btree ("version_structure_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "offices" DROP CONSTRAINT "offices_structure_parent_id_offices_id_fk";
  
  ALTER TABLE "_offices_v" DROP CONSTRAINT "_offices_v_version_structure_parent_id_offices_id_fk";
  
  DROP INDEX "offices_structure_structure_parent_idx";
  DROP INDEX "_offices_v_version_structure_version_structure_parent_idx";
  ALTER TABLE "offices" DROP COLUMN "structure_parent_id";
  ALTER TABLE "offices" DROP COLUMN "structure_structure_order";
  ALTER TABLE "_offices_v" DROP COLUMN "version_structure_parent_id";
  ALTER TABLE "_offices_v" DROP COLUMN "version_structure_structure_order";`)
}
