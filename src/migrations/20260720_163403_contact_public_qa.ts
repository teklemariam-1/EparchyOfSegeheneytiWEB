import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "contact_submissions_locales" (
  	"public_q_a_public_question" varchar,
  	"public_q_a_answer" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "contact_submissions" ADD COLUMN "public_q_a_is_public" boolean DEFAULT false;
  ALTER TABLE "contact_submissions" ADD COLUMN "public_q_a_published_at" timestamp(3) with time zone;
  ALTER TABLE "contact_submissions_locales" ADD CONSTRAINT "contact_submissions_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."contact_submissions"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "contact_submissions_locales_locale_parent_id_unique" ON "contact_submissions_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "contact_submissions_locales" CASCADE;
  ALTER TABLE "contact_submissions" DROP COLUMN "public_q_a_is_public";
  ALTER TABLE "contact_submissions" DROP COLUMN "public_q_a_published_at";`)
}
