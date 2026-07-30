import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_priests_milestones_milestone_type" AS ENUM('birth', 'baptism', 'seminary', 'diaconate-ordination', 'priestly-ordination', 'pastoral-assignment', 'further-studies', 'curial-role', 'retirement', 'other');
  CREATE TYPE "public"."enum_priests_milestones_date_precision" AS ENUM('exact', 'month', 'year', 'approximate');
  CREATE TABLE "priests_milestones" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"milestone_type" "enum_priests_milestones_milestone_type" DEFAULT 'pastoral-assignment' NOT NULL,
  	"is_public" boolean DEFAULT true,
  	"date" timestamp(3) with time zone,
  	"date_precision" "enum_priests_milestones_date_precision" DEFAULT 'exact',
  	"parish_id" integer
  );
  
  CREATE TABLE "priests_milestones_locales" (
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "priests_galleries_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"is_public" boolean DEFAULT true
  );
  
  CREATE TABLE "priests_galleries_images_locales" (
  	"caption" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "priests_galleries" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"is_public" boolean DEFAULT true
  );
  
  CREATE TABLE "priests_galleries_locales" (
  	"title" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  ALTER TABLE "priests" ADD COLUMN "visibility_show_bio" boolean DEFAULT true;
  ALTER TABLE "priests" ADD COLUMN "visibility_show_milestones" boolean DEFAULT true;
  ALTER TABLE "priests" ADD COLUMN "visibility_show_education" boolean DEFAULT true;
  ALTER TABLE "priests" ADD COLUMN "visibility_show_galleries" boolean DEFAULT true;
  ALTER TABLE "priests" ADD COLUMN "visibility_show_dates" boolean DEFAULT true;
  ALTER TABLE "priests" ADD COLUMN "visibility_show_contact" boolean DEFAULT false;
  ALTER TABLE "priests_milestones" ADD CONSTRAINT "priests_milestones_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "priests_milestones" ADD CONSTRAINT "priests_milestones_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."priests"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "priests_milestones_locales" ADD CONSTRAINT "priests_milestones_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."priests_milestones"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "priests_galleries_images" ADD CONSTRAINT "priests_galleries_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "priests_galleries_images" ADD CONSTRAINT "priests_galleries_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."priests_galleries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "priests_galleries_images_locales" ADD CONSTRAINT "priests_galleries_images_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."priests_galleries_images"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "priests_galleries" ADD CONSTRAINT "priests_galleries_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."priests"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "priests_galleries_locales" ADD CONSTRAINT "priests_galleries_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."priests_galleries"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "priests_milestones_order_idx" ON "priests_milestones" USING btree ("_order");
  CREATE INDEX "priests_milestones_parent_id_idx" ON "priests_milestones" USING btree ("_parent_id");
  CREATE INDEX "priests_milestones_parish_idx" ON "priests_milestones" USING btree ("parish_id");
  CREATE UNIQUE INDEX "priests_milestones_locales_locale_parent_id_unique" ON "priests_milestones_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "priests_galleries_images_order_idx" ON "priests_galleries_images" USING btree ("_order");
  CREATE INDEX "priests_galleries_images_parent_id_idx" ON "priests_galleries_images" USING btree ("_parent_id");
  CREATE INDEX "priests_galleries_images_image_idx" ON "priests_galleries_images" USING btree ("image_id");
  CREATE UNIQUE INDEX "priests_galleries_images_locales_locale_parent_id_unique" ON "priests_galleries_images_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "priests_galleries_order_idx" ON "priests_galleries" USING btree ("_order");
  CREATE INDEX "priests_galleries_parent_id_idx" ON "priests_galleries" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "priests_galleries_locales_locale_parent_id_unique" ON "priests_galleries_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "priests_milestones" CASCADE;
  DROP TABLE "priests_milestones_locales" CASCADE;
  DROP TABLE "priests_galleries_images" CASCADE;
  DROP TABLE "priests_galleries_images_locales" CASCADE;
  DROP TABLE "priests_galleries" CASCADE;
  DROP TABLE "priests_galleries_locales" CASCADE;
  ALTER TABLE "priests" DROP COLUMN "visibility_show_bio";
  ALTER TABLE "priests" DROP COLUMN "visibility_show_milestones";
  ALTER TABLE "priests" DROP COLUMN "visibility_show_education";
  ALTER TABLE "priests" DROP COLUMN "visibility_show_galleries";
  ALTER TABLE "priests" DROP COLUMN "visibility_show_dates";
  ALTER TABLE "priests" DROP COLUMN "visibility_show_contact";
  DROP TYPE "public"."enum_priests_milestones_milestone_type";
  DROP TYPE "public"."enum_priests_milestones_date_precision";`)
}
