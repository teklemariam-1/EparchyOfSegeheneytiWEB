import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "parishes" ADD COLUMN "vicariate_id" integer;
  ALTER TABLE "parishes" ADD CONSTRAINT "parishes_vicariate_id_vicariates_id_fk" FOREIGN KEY ("vicariate_id") REFERENCES "public"."vicariates"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "parishes_vicariate_idx" ON "parishes" USING btree ("vicariate_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "parishes" DROP CONSTRAINT "parishes_vicariate_id_vicariates_id_fk";
  
  DROP INDEX "parishes_vicariate_idx";
  ALTER TABLE "parishes" DROP COLUMN "vicariate_id";`)
}
