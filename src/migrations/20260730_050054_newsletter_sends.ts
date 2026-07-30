import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "newsletter_sends" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"news_id" integer NOT NULL,
  	"subject" varchar NOT NULL,
  	"sent_at" timestamp(3) with time zone NOT NULL,
  	"sent_by_id" integer,
  	"recipient_count" numeric NOT NULL,
  	"failure_count" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "newsletter_sends_id" integer;
  ALTER TABLE "newsletter_sends" ADD CONSTRAINT "newsletter_sends_news_id_news_id_fk" FOREIGN KEY ("news_id") REFERENCES "public"."news"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "newsletter_sends" ADD CONSTRAINT "newsletter_sends_sent_by_id_users_id_fk" FOREIGN KEY ("sent_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "newsletter_sends_news_idx" ON "newsletter_sends" USING btree ("news_id");
  CREATE INDEX "newsletter_sends_sent_by_idx" ON "newsletter_sends" USING btree ("sent_by_id");
  CREATE INDEX "newsletter_sends_updated_at_idx" ON "newsletter_sends" USING btree ("updated_at");
  CREATE INDEX "newsletter_sends_created_at_idx" ON "newsletter_sends" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_newsletter_sends_fk" FOREIGN KEY ("newsletter_sends_id") REFERENCES "public"."newsletter_sends"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_newsletter_sends_id_idx" ON "payload_locked_documents_rels" USING btree ("newsletter_sends_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "newsletter_sends" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "newsletter_sends" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_newsletter_sends_fk";
  
  DROP INDEX "payload_locked_documents_rels_newsletter_sends_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "newsletter_sends_id";`)
}
