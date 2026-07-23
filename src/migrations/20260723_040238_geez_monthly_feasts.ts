import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "geez_monthly_feasts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"day" numeric NOT NULL,
  	"name" varchar NOT NULL,
  	"icon" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "geez_monthly_feasts_id" integer;
  CREATE UNIQUE INDEX "geez_monthly_feasts_day_idx" ON "geez_monthly_feasts" USING btree ("day");
  CREATE INDEX "geez_monthly_feasts_updated_at_idx" ON "geez_monthly_feasts" USING btree ("updated_at");
  CREATE INDEX "geez_monthly_feasts_created_at_idx" ON "geez_monthly_feasts" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_geez_monthly_feasts_fk" FOREIGN KEY ("geez_monthly_feasts_id") REFERENCES "public"."geez_monthly_feasts"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_geez_monthly_feasts_id_idx" ON "payload_locked_documents_rels" USING btree ("geez_monthly_feasts_id");`)

  // ── Seed: recurring monthly commemorations (from the eparchy's
  //    monthly liturgical calendar) ─────────────────────────────────────────
  await db.execute(sql`
    INSERT INTO "geez_monthly_feasts" ("day", "name", "icon") VALUES
    (1,  'ባሕቲ', '✝'),
    (3,  'በኣታ', '🕊'),
    (5,  'ሓወርያ', '✝'),
    (7,  'ስላሴ', '✝'),
    (12, 'ሚካኤል', '😇'),
    (15, 'ቅዱስ እስቲፋኖስ ፣ ቅዱስ ያዕቆብ', '✝'),
    (16, 'ኪዳነ ምሕረት', '🕊'),
    (19, 'ገብርኤል', '😇'),
    (21, 'በዓለማርያም', '🕊'),
    (23, 'ቅዱስ ጊዮርጊስ ፣ ብጹዕ ገብረሚካኤል', '✝'),
    (24, 'ቅዱስ ያዕቆብ ፣ ቅዱስ ፍራንቸስኮ', '✝'),
    (26, 'ቅዱስ ዮሴፍ', '✝'),
    (27, 'መድኃኔ ዓለም', '✝'),
    (29, 'በዓለ እግዚኣብሔር', '✝')`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "geez_monthly_feasts" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "geez_monthly_feasts" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_geez_monthly_feasts_fk";
  
  DROP INDEX "payload_locked_documents_rels_geez_monthly_feasts_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "geez_monthly_feasts_id";`)
}
