import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "site_settings_offices" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"phone" varchar,
  	"email" varchar
  );
  
  CREATE TABLE "site_settings_offices_locales" (
  	"name" varchar NOT NULL,
  	"role" varchar,
  	"address" varchar,
  	"hours" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "about_page_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar NOT NULL
  );
  
  CREATE TABLE "about_page_stats_locales" (
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "about_page_pillars_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icon" varchar
  );
  
  CREATE TABLE "about_page_pillars_items_locales" (
  	"title" varchar NOT NULL,
  	"body" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "about_page_timeline_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"year" varchar NOT NULL
  );
  
  CREATE TABLE "about_page_timeline_items_locales" (
  	"label" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "about_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "about_page_locales" (
  	"mission_heading" varchar,
  	"mission_intro" varchar,
  	"mission_body" varchar,
  	"pillars_heading" varchar,
  	"timeline_heading" varchar,
  	"geez_heading" varchar,
  	"geez_body" varchar,
  	"geez_cta_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "site_settings_offices" ADD CONSTRAINT "site_settings_offices_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_offices_locales" ADD CONSTRAINT "site_settings_offices_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings_offices"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_page_stats" ADD CONSTRAINT "about_page_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_page_stats_locales" ADD CONSTRAINT "about_page_stats_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about_page_stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_page_pillars_items" ADD CONSTRAINT "about_page_pillars_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_page_pillars_items_locales" ADD CONSTRAINT "about_page_pillars_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about_page_pillars_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_page_timeline_items" ADD CONSTRAINT "about_page_timeline_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_page_timeline_items_locales" ADD CONSTRAINT "about_page_timeline_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about_page_timeline_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_page_locales" ADD CONSTRAINT "about_page_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about_page"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "site_settings_offices_order_idx" ON "site_settings_offices" USING btree ("_order");
  CREATE INDEX "site_settings_offices_parent_id_idx" ON "site_settings_offices" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "site_settings_offices_locales_locale_parent_id_unique" ON "site_settings_offices_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "about_page_stats_order_idx" ON "about_page_stats" USING btree ("_order");
  CREATE INDEX "about_page_stats_parent_id_idx" ON "about_page_stats" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "about_page_stats_locales_locale_parent_id_unique" ON "about_page_stats_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "about_page_pillars_items_order_idx" ON "about_page_pillars_items" USING btree ("_order");
  CREATE INDEX "about_page_pillars_items_parent_id_idx" ON "about_page_pillars_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "about_page_pillars_items_locales_locale_parent_id_unique" ON "about_page_pillars_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "about_page_timeline_items_order_idx" ON "about_page_timeline_items" USING btree ("_order");
  CREATE INDEX "about_page_timeline_items_parent_id_idx" ON "about_page_timeline_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "about_page_timeline_items_locales_locale_parent_id_unique" ON "about_page_timeline_items_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "about_page_locales_locale_parent_id_unique" ON "about_page_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "site_settings_offices" CASCADE;
  DROP TABLE "site_settings_offices_locales" CASCADE;
  DROP TABLE "about_page_stats" CASCADE;
  DROP TABLE "about_page_stats_locales" CASCADE;
  DROP TABLE "about_page_pillars_items" CASCADE;
  DROP TABLE "about_page_pillars_items_locales" CASCADE;
  DROP TABLE "about_page_timeline_items" CASCADE;
  DROP TABLE "about_page_timeline_items_locales" CASCADE;
  DROP TABLE "about_page" CASCADE;
  DROP TABLE "about_page_locales" CASCADE;`)
}
