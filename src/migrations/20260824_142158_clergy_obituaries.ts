import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_clergy_obituaries_assignments_role" AS ENUM('ምክትል ቆሞስ', 'ቆሞስ', 'ኣገልጋሊ', 'ንዕረፍቲ', 'other');
  CREATE TYPE "public"."enum_clergy_obituaries_honorific" AS ENUM('ቀሺ', 'ኣባ', 'መልኣከ ሰላም', 'ሊቀ ካህናት', 'other');
  CREATE TYPE "public"."enum_clergy_obituaries_ordination_church" AS ENUM('catholic', 'orthodox', 'other');
  CREATE TYPE "public"."enum_clergy_obituaries_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__clergy_obituaries_v_version_assignments_role" AS ENUM('ምክትል ቆሞስ', 'ቆሞስ', 'ኣገልጋሊ', 'ንዕረፍቲ', 'other');
  CREATE TYPE "public"."enum__clergy_obituaries_v_version_honorific" AS ENUM('ቀሺ', 'ኣባ', 'መልኣከ ሰላም', 'ሊቀ ካህናት', 'other');
  CREATE TYPE "public"."enum__clergy_obituaries_v_version_ordination_church" AS ENUM('catholic', 'orthodox', 'other');
  CREATE TYPE "public"."enum__clergy_obituaries_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__clergy_obituaries_v_published_locale" AS ENUM('en', 'ti');
  ALTER TYPE "public"."enum_users_permissions_grant" ADD VALUE 'clergy-obituaries.create' BEFORE 'publications.create';
  ALTER TYPE "public"."enum_users_permissions_grant" ADD VALUE 'clergy-obituaries.update' BEFORE 'publications.create';
  ALTER TYPE "public"."enum_users_permissions_grant" ADD VALUE 'clergy-obituaries.delete' BEFORE 'publications.create';
  ALTER TYPE "public"."enum_users_permissions_grant" ADD VALUE 'clergy-obituaries.publish' BEFORE 'publications.create';
  ALTER TYPE "public"."enum_users_permissions_revoke" ADD VALUE 'clergy-obituaries.create' BEFORE 'publications.create';
  ALTER TYPE "public"."enum_users_permissions_revoke" ADD VALUE 'clergy-obituaries.update' BEFORE 'publications.create';
  ALTER TYPE "public"."enum_users_permissions_revoke" ADD VALUE 'clergy-obituaries.delete' BEFORE 'publications.create';
  ALTER TYPE "public"."enum_users_permissions_revoke" ADD VALUE 'clergy-obituaries.publish' BEFORE 'publications.create';
  CREATE TABLE "clergy_obituaries_marriage_children" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar
  );
  
  CREATE TABLE "clergy_obituaries_assignments_achievements" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "clergy_obituaries_assignments" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"sort_date" timestamp(3) with time zone,
  	"period_display" varchar,
  	"role" "enum_clergy_obituaries_assignments_role",
  	"role_other" varchar,
  	"parish_name" varchar,
  	"place" varchar,
  	"parish_id" integer,
  	"sentence_override" varchar
  );
  
  CREATE TABLE "clergy_obituaries_virtues" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "clergy_obituaries_scripture_reflections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"reference" varchar,
  	"text" varchar
  );
  
  CREATE TABLE "clergy_obituaries" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"publish_at" timestamp(3) with time zone,
  	"honorific" "enum_clergy_obituaries_honorific",
  	"honorific_other" varchar,
  	"full_name" varchar,
  	"photo_id" integer,
  	"birth_date" timestamp(3) with time zone,
  	"father_name" varchar,
  	"mother_name" varchar,
  	"related_priest_id" integer,
  	"death_date" timestamp(3) with time zone,
  	"age_at_death" numeric,
  	"place_of_death" varchar,
  	"is_married" boolean DEFAULT false,
  	"marriage_marriage_date" timestamp(3) with time zone,
  	"marriage_spouse_name" varchar,
  	"marriage_spouse_deceased" boolean DEFAULT false,
  	"diaconate_date" timestamp(3) with time zone,
  	"diaconate_bishop" varchar,
  	"diaconate_place" varchar,
  	"ordination_date" timestamp(3) with time zone,
  	"ordination_bishop" varchar,
  	"ordination_place" varchar,
  	"ordination_church" "enum_clergy_obituaries_ordination_church" DEFAULT 'catholic',
  	"full_communion_year" numeric,
  	"full_communion_authorizing_bishop" varchar,
  	"religious_order" varchar,
  	"retirement_year" numeric,
  	"retirement_place" varchar,
  	"character_verse_reference" varchar DEFAULT 'ምሳሌ 14፥14',
  	"character_verse_text" varchar DEFAULT 'ሕያዎት ሰባት ከም ግብሮም ዓስቦም ክስዕቦም እዩ',
  	"funeral_date" timestamp(3) with time zone,
  	"presiding_bishop" varchar DEFAULT 'ብጹዕ ኣቡነ ፍቕረማርያም ሓጎስ ጳጳስ ሰበኻ ሰገነይቲ',
  	"burial_church" varchar,
  	"burial_town" varchar,
  	"opening_verse_reference" varchar DEFAULT 'ምሳሌ 10፥7',
  	"opening_verse_text" varchar DEFAULT 'ሕያዎት ሰባት ብሕያውነቶም ይዝከሩ',
  	"ordination_hymn_geez" varchar DEFAULT 'ለካህናቲከ እግዚኦ ለካህናቲከ እለ ኣሥመሩከ፡ ትቤሎሙ ባኡ ጽርሐ መቅደስከ ኅበ ይኅድር ኃይለ ስብሐቲከ',
  	"ordination_hymn_tigrinya" varchar DEFAULT 'ኦ ጎይታ ነቶም ዘሐጎስኻ ኣገልገልቲ ካህናትካ፡ ናብቲ ሓይልኻን ክብርኻን ዝሓድረሉ ኣደራሽ መቕደስካ እትዉ ኢኻ ትብሎም',
  	"mourning_closed" boolean DEFAULT true,
  	"mourning_closed_text" varchar DEFAULT 'ሰበኻ ከኣ ሓዘንና ኣብዚ ከምዝዓጸና ንሕብር።',
  	"slug" varchar,
  	"published_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_clergy_obituaries_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "clergy_obituaries_locales" (
  	"birth_place" varchar,
  	"opening_paragraph" jsonb DEFAULT '{"root":{"type":"root","format":"","indent":0,"version":1,"direction":null,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"direction":null,"children":[{"type":"text","text":"ሎሚ ኣብ ⟨ዘመነ/ወቕቲ⟩፡ … ነዞም ኣብዛ ምድሪ’ዚኣ ብ\"ሠናይ ገድሊ\" ዝተጋደሉ፡ ልኡኽ እግዚኣብሔር ዝኾኑ፡ ኣቦና ⟨መዓርግን ስምን⟩ ካብዛ ታህዋኽን ሸበድበድን ዝመልኣ ምድሪ፡ ኣብ መበል ⟨ዕድመ⟩ ዕድመኦም ነፋንዎም ኣሎና።","format":0,"style":"","mode":"normal","detail":0,"version":1}]}]}}'::jsonb,
  	"retirement_description" jsonb,
  	"character_summary" jsonb DEFAULT '{"root":{"type":"root","format":"","indent":0,"version":1,"direction":null,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"direction":null,"children":[{"type":"text","text":"ብሕጽር ዝበለ እተን ብጹዓን ነዳያን ዝብላ 8ተ ብጽዕነታት ኣብ ሕይወቶም ዘንጸባርቓ ኢየን።","format":0,"style":"","mode":"normal","detail":0,"version":1}]}]}}'::jsonb,
  	"hope_statement" jsonb DEFAULT '{"root":{"type":"root","format":"","indent":0,"version":1,"direction":null,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"direction":null,"children":[{"type":"text","text":"ናይቶም ለዋሃት ሰባት ዓስቢ፡ ርስቲ ቅዱሳን፡ ሰማያዊ ሓጎስ፡ ዓይኒ ዘይረኣየቶ፡ እዝኒ ዘይሰማዓቶ፡ ልቢ ዘይሓለኖ ሰማያዊ ዓስቢ ከም ዝስዕቦም እምነትናን ተስፋናን ኢዩ።","format":0,"style":"","mode":"normal","detail":0,"version":1}]}]}}'::jsonb,
  	"funeral_description" jsonb DEFAULT '{"root":{"type":"root","format":"","indent":0,"version":1,"direction":null,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"direction":null,"children":[{"type":"text","text":"ዓበይቲ ካህናት ብጾቶምን ነኣሽቱ ካህናት ደቆምን ኩሎም ውሉደ ክህነት፡ ካህናትን ደናግልን ምእመናንን ቤተሰብን ኣብ ዝተሳተፍዎ","format":0,"style":"","mode":"normal","detail":0,"version":1}]}]}}'::jsonb,
  	"acknowledgements" jsonb DEFAULT '{"root":{"type":"root","format":"","indent":0,"version":1,"direction":null,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"direction":null,"children":[{"type":"text","text":"ንኹሉኹም ኣብዚ ቀብሪ ኣቦና ዝተሳተፍኩም፡ ሕሰም ኣይትርከቡ የቐንየልና እናበልና ብስም ሰበኻ ሰገነይትን ቤተሰብን የቐንየልና ንብል።","format":0,"style":"","mode":"normal","detail":0,"version":1}]}]}}'::jsonb,
  	"condolence_prayer" jsonb DEFAULT '{"root":{"type":"root","format":"","indent":0,"version":1,"direction":null,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"direction":null,"children":[{"type":"text","text":"ንሰበኻ ከምኦም ዝበሉ ሕያዎትን ቅዱሳትን ካህናት ይልኣኸልና፡ ንቤተሰብ ከኣ ጽንዓት ይሃብ ንብል።","format":0,"style":"","mode":"normal","detail":0,"version":1}]}]}}'::jsonb,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_clergy_obituaries_v_version_marriage_children" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_clergy_obituaries_v_version_assignments_achievements" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_clergy_obituaries_v_version_assignments" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"sort_date" timestamp(3) with time zone,
  	"period_display" varchar,
  	"role" "enum__clergy_obituaries_v_version_assignments_role",
  	"role_other" varchar,
  	"parish_name" varchar,
  	"place" varchar,
  	"parish_id" integer,
  	"sentence_override" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_clergy_obituaries_v_version_virtues" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_clergy_obituaries_v_version_scripture_reflections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"reference" varchar,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_clergy_obituaries_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_publish_at" timestamp(3) with time zone,
  	"version_honorific" "enum__clergy_obituaries_v_version_honorific",
  	"version_honorific_other" varchar,
  	"version_full_name" varchar,
  	"version_photo_id" integer,
  	"version_birth_date" timestamp(3) with time zone,
  	"version_father_name" varchar,
  	"version_mother_name" varchar,
  	"version_related_priest_id" integer,
  	"version_death_date" timestamp(3) with time zone,
  	"version_age_at_death" numeric,
  	"version_place_of_death" varchar,
  	"version_is_married" boolean DEFAULT false,
  	"version_marriage_marriage_date" timestamp(3) with time zone,
  	"version_marriage_spouse_name" varchar,
  	"version_marriage_spouse_deceased" boolean DEFAULT false,
  	"version_diaconate_date" timestamp(3) with time zone,
  	"version_diaconate_bishop" varchar,
  	"version_diaconate_place" varchar,
  	"version_ordination_date" timestamp(3) with time zone,
  	"version_ordination_bishop" varchar,
  	"version_ordination_place" varchar,
  	"version_ordination_church" "enum__clergy_obituaries_v_version_ordination_church" DEFAULT 'catholic',
  	"version_full_communion_year" numeric,
  	"version_full_communion_authorizing_bishop" varchar,
  	"version_religious_order" varchar,
  	"version_retirement_year" numeric,
  	"version_retirement_place" varchar,
  	"version_character_verse_reference" varchar DEFAULT 'ምሳሌ 14፥14',
  	"version_character_verse_text" varchar DEFAULT 'ሕያዎት ሰባት ከም ግብሮም ዓስቦም ክስዕቦም እዩ',
  	"version_funeral_date" timestamp(3) with time zone,
  	"version_presiding_bishop" varchar DEFAULT 'ብጹዕ ኣቡነ ፍቕረማርያም ሓጎስ ጳጳስ ሰበኻ ሰገነይቲ',
  	"version_burial_church" varchar,
  	"version_burial_town" varchar,
  	"version_opening_verse_reference" varchar DEFAULT 'ምሳሌ 10፥7',
  	"version_opening_verse_text" varchar DEFAULT 'ሕያዎት ሰባት ብሕያውነቶም ይዝከሩ',
  	"version_ordination_hymn_geez" varchar DEFAULT 'ለካህናቲከ እግዚኦ ለካህናቲከ እለ ኣሥመሩከ፡ ትቤሎሙ ባኡ ጽርሐ መቅደስከ ኅበ ይኅድር ኃይለ ስብሐቲከ',
  	"version_ordination_hymn_tigrinya" varchar DEFAULT 'ኦ ጎይታ ነቶም ዘሐጎስኻ ኣገልገልቲ ካህናትካ፡ ናብቲ ሓይልኻን ክብርኻን ዝሓድረሉ ኣደራሽ መቕደስካ እትዉ ኢኻ ትብሎም',
  	"version_mourning_closed" boolean DEFAULT true,
  	"version_mourning_closed_text" varchar DEFAULT 'ሰበኻ ከኣ ሓዘንና ኣብዚ ከምዝዓጸና ንሕብር።',
  	"version_slug" varchar,
  	"version_published_at" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__clergy_obituaries_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__clergy_obituaries_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_clergy_obituaries_v_locales" (
  	"version_birth_place" varchar,
  	"version_opening_paragraph" jsonb DEFAULT '{"root":{"type":"root","format":"","indent":0,"version":1,"direction":null,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"direction":null,"children":[{"type":"text","text":"ሎሚ ኣብ ⟨ዘመነ/ወቕቲ⟩፡ … ነዞም ኣብዛ ምድሪ’ዚኣ ብ\"ሠናይ ገድሊ\" ዝተጋደሉ፡ ልኡኽ እግዚኣብሔር ዝኾኑ፡ ኣቦና ⟨መዓርግን ስምን⟩ ካብዛ ታህዋኽን ሸበድበድን ዝመልኣ ምድሪ፡ ኣብ መበል ⟨ዕድመ⟩ ዕድመኦም ነፋንዎም ኣሎና።","format":0,"style":"","mode":"normal","detail":0,"version":1}]}]}}'::jsonb,
  	"version_retirement_description" jsonb,
  	"version_character_summary" jsonb DEFAULT '{"root":{"type":"root","format":"","indent":0,"version":1,"direction":null,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"direction":null,"children":[{"type":"text","text":"ብሕጽር ዝበለ እተን ብጹዓን ነዳያን ዝብላ 8ተ ብጽዕነታት ኣብ ሕይወቶም ዘንጸባርቓ ኢየን።","format":0,"style":"","mode":"normal","detail":0,"version":1}]}]}}'::jsonb,
  	"version_hope_statement" jsonb DEFAULT '{"root":{"type":"root","format":"","indent":0,"version":1,"direction":null,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"direction":null,"children":[{"type":"text","text":"ናይቶም ለዋሃት ሰባት ዓስቢ፡ ርስቲ ቅዱሳን፡ ሰማያዊ ሓጎስ፡ ዓይኒ ዘይረኣየቶ፡ እዝኒ ዘይሰማዓቶ፡ ልቢ ዘይሓለኖ ሰማያዊ ዓስቢ ከም ዝስዕቦም እምነትናን ተስፋናን ኢዩ።","format":0,"style":"","mode":"normal","detail":0,"version":1}]}]}}'::jsonb,
  	"version_funeral_description" jsonb DEFAULT '{"root":{"type":"root","format":"","indent":0,"version":1,"direction":null,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"direction":null,"children":[{"type":"text","text":"ዓበይቲ ካህናት ብጾቶምን ነኣሽቱ ካህናት ደቆምን ኩሎም ውሉደ ክህነት፡ ካህናትን ደናግልን ምእመናንን ቤተሰብን ኣብ ዝተሳተፍዎ","format":0,"style":"","mode":"normal","detail":0,"version":1}]}]}}'::jsonb,
  	"version_acknowledgements" jsonb DEFAULT '{"root":{"type":"root","format":"","indent":0,"version":1,"direction":null,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"direction":null,"children":[{"type":"text","text":"ንኹሉኹም ኣብዚ ቀብሪ ኣቦና ዝተሳተፍኩም፡ ሕሰም ኣይትርከቡ የቐንየልና እናበልና ብስም ሰበኻ ሰገነይትን ቤተሰብን የቐንየልና ንብል።","format":0,"style":"","mode":"normal","detail":0,"version":1}]}]}}'::jsonb,
  	"version_condolence_prayer" jsonb DEFAULT '{"root":{"type":"root","format":"","indent":0,"version":1,"direction":null,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"direction":null,"children":[{"type":"text","text":"ንሰበኻ ከምኦም ዝበሉ ሕያዎትን ቅዱሳትን ካህናት ይልኣኸልና፡ ንቤተሰብ ከኣ ጽንዓት ይሃብ ንብል።","format":0,"style":"","mode":"normal","detail":0,"version":1}]}]}}'::jsonb,
  	"version_seo_meta_title" varchar,
  	"version_seo_meta_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "clergy_obituaries_id" integer;
  ALTER TABLE "clergy_obituaries_marriage_children" ADD CONSTRAINT "clergy_obituaries_marriage_children_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."clergy_obituaries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "clergy_obituaries_assignments_achievements" ADD CONSTRAINT "clergy_obituaries_assignments_achievements_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."clergy_obituaries_assignments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "clergy_obituaries_assignments" ADD CONSTRAINT "clergy_obituaries_assignments_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "clergy_obituaries_assignments" ADD CONSTRAINT "clergy_obituaries_assignments_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."clergy_obituaries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "clergy_obituaries_virtues" ADD CONSTRAINT "clergy_obituaries_virtues_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."clergy_obituaries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "clergy_obituaries_scripture_reflections" ADD CONSTRAINT "clergy_obituaries_scripture_reflections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."clergy_obituaries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "clergy_obituaries" ADD CONSTRAINT "clergy_obituaries_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "clergy_obituaries" ADD CONSTRAINT "clergy_obituaries_related_priest_id_priests_id_fk" FOREIGN KEY ("related_priest_id") REFERENCES "public"."priests"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "clergy_obituaries_locales" ADD CONSTRAINT "clergy_obituaries_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."clergy_obituaries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_clergy_obituaries_v_version_marriage_children" ADD CONSTRAINT "_clergy_obituaries_v_version_marriage_children_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_clergy_obituaries_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_clergy_obituaries_v_version_assignments_achievements" ADD CONSTRAINT "_clergy_obituaries_v_version_assignments_achievements_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_clergy_obituaries_v_version_assignments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_clergy_obituaries_v_version_assignments" ADD CONSTRAINT "_clergy_obituaries_v_version_assignments_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_clergy_obituaries_v_version_assignments" ADD CONSTRAINT "_clergy_obituaries_v_version_assignments_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_clergy_obituaries_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_clergy_obituaries_v_version_virtues" ADD CONSTRAINT "_clergy_obituaries_v_version_virtues_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_clergy_obituaries_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_clergy_obituaries_v_version_scripture_reflections" ADD CONSTRAINT "_clergy_obituaries_v_version_scripture_reflections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_clergy_obituaries_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_clergy_obituaries_v" ADD CONSTRAINT "_clergy_obituaries_v_parent_id_clergy_obituaries_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."clergy_obituaries"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_clergy_obituaries_v" ADD CONSTRAINT "_clergy_obituaries_v_version_photo_id_media_id_fk" FOREIGN KEY ("version_photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_clergy_obituaries_v" ADD CONSTRAINT "_clergy_obituaries_v_version_related_priest_id_priests_id_fk" FOREIGN KEY ("version_related_priest_id") REFERENCES "public"."priests"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_clergy_obituaries_v_locales" ADD CONSTRAINT "_clergy_obituaries_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_clergy_obituaries_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "clergy_obituaries_marriage_children_order_idx" ON "clergy_obituaries_marriage_children" USING btree ("_order");
  CREATE INDEX "clergy_obituaries_marriage_children_parent_id_idx" ON "clergy_obituaries_marriage_children" USING btree ("_parent_id");
  CREATE INDEX "clergy_obituaries_assignments_achievements_order_idx" ON "clergy_obituaries_assignments_achievements" USING btree ("_order");
  CREATE INDEX "clergy_obituaries_assignments_achievements_parent_id_idx" ON "clergy_obituaries_assignments_achievements" USING btree ("_parent_id");
  CREATE INDEX "clergy_obituaries_assignments_achievements_locale_idx" ON "clergy_obituaries_assignments_achievements" USING btree ("_locale");
  CREATE INDEX "clergy_obituaries_assignments_order_idx" ON "clergy_obituaries_assignments" USING btree ("_order");
  CREATE INDEX "clergy_obituaries_assignments_parent_id_idx" ON "clergy_obituaries_assignments" USING btree ("_parent_id");
  CREATE INDEX "clergy_obituaries_assignments_parish_idx" ON "clergy_obituaries_assignments" USING btree ("parish_id");
  CREATE INDEX "clergy_obituaries_virtues_order_idx" ON "clergy_obituaries_virtues" USING btree ("_order");
  CREATE INDEX "clergy_obituaries_virtues_parent_id_idx" ON "clergy_obituaries_virtues" USING btree ("_parent_id");
  CREATE INDEX "clergy_obituaries_virtues_locale_idx" ON "clergy_obituaries_virtues" USING btree ("_locale");
  CREATE INDEX "clergy_obituaries_scripture_reflections_order_idx" ON "clergy_obituaries_scripture_reflections" USING btree ("_order");
  CREATE INDEX "clergy_obituaries_scripture_reflections_parent_id_idx" ON "clergy_obituaries_scripture_reflections" USING btree ("_parent_id");
  CREATE INDEX "clergy_obituaries_publish_at_idx" ON "clergy_obituaries" USING btree ("publish_at");
  CREATE INDEX "clergy_obituaries_photo_idx" ON "clergy_obituaries" USING btree ("photo_id");
  CREATE INDEX "clergy_obituaries_related_priest_idx" ON "clergy_obituaries" USING btree ("related_priest_id");
  CREATE UNIQUE INDEX "clergy_obituaries_slug_idx" ON "clergy_obituaries" USING btree ("slug");
  CREATE INDEX "clergy_obituaries_published_at_idx" ON "clergy_obituaries" USING btree ("published_at");
  CREATE INDEX "clergy_obituaries_updated_at_idx" ON "clergy_obituaries" USING btree ("updated_at");
  CREATE INDEX "clergy_obituaries_created_at_idx" ON "clergy_obituaries" USING btree ("created_at");
  CREATE INDEX "clergy_obituaries__status_idx" ON "clergy_obituaries" USING btree ("_status");
  CREATE UNIQUE INDEX "clergy_obituaries_locales_locale_parent_id_unique" ON "clergy_obituaries_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_clergy_obituaries_v_version_marriage_children_order_idx" ON "_clergy_obituaries_v_version_marriage_children" USING btree ("_order");
  CREATE INDEX "_clergy_obituaries_v_version_marriage_children_parent_id_idx" ON "_clergy_obituaries_v_version_marriage_children" USING btree ("_parent_id");
  CREATE INDEX "_clergy_obituaries_v_version_assignments_achievements_order_idx" ON "_clergy_obituaries_v_version_assignments_achievements" USING btree ("_order");
  CREATE INDEX "_clergy_obituaries_v_version_assignments_achievements_parent_id_idx" ON "_clergy_obituaries_v_version_assignments_achievements" USING btree ("_parent_id");
  CREATE INDEX "_clergy_obituaries_v_version_assignments_achievements_locale_idx" ON "_clergy_obituaries_v_version_assignments_achievements" USING btree ("_locale");
  CREATE INDEX "_clergy_obituaries_v_version_assignments_order_idx" ON "_clergy_obituaries_v_version_assignments" USING btree ("_order");
  CREATE INDEX "_clergy_obituaries_v_version_assignments_parent_id_idx" ON "_clergy_obituaries_v_version_assignments" USING btree ("_parent_id");
  CREATE INDEX "_clergy_obituaries_v_version_assignments_parish_idx" ON "_clergy_obituaries_v_version_assignments" USING btree ("parish_id");
  CREATE INDEX "_clergy_obituaries_v_version_virtues_order_idx" ON "_clergy_obituaries_v_version_virtues" USING btree ("_order");
  CREATE INDEX "_clergy_obituaries_v_version_virtues_parent_id_idx" ON "_clergy_obituaries_v_version_virtues" USING btree ("_parent_id");
  CREATE INDEX "_clergy_obituaries_v_version_virtues_locale_idx" ON "_clergy_obituaries_v_version_virtues" USING btree ("_locale");
  CREATE INDEX "_clergy_obituaries_v_version_scripture_reflections_order_idx" ON "_clergy_obituaries_v_version_scripture_reflections" USING btree ("_order");
  CREATE INDEX "_clergy_obituaries_v_version_scripture_reflections_parent_id_idx" ON "_clergy_obituaries_v_version_scripture_reflections" USING btree ("_parent_id");
  CREATE INDEX "_clergy_obituaries_v_parent_idx" ON "_clergy_obituaries_v" USING btree ("parent_id");
  CREATE INDEX "_clergy_obituaries_v_version_version_publish_at_idx" ON "_clergy_obituaries_v" USING btree ("version_publish_at");
  CREATE INDEX "_clergy_obituaries_v_version_version_photo_idx" ON "_clergy_obituaries_v" USING btree ("version_photo_id");
  CREATE INDEX "_clergy_obituaries_v_version_version_related_priest_idx" ON "_clergy_obituaries_v" USING btree ("version_related_priest_id");
  CREATE INDEX "_clergy_obituaries_v_version_version_slug_idx" ON "_clergy_obituaries_v" USING btree ("version_slug");
  CREATE INDEX "_clergy_obituaries_v_version_version_published_at_idx" ON "_clergy_obituaries_v" USING btree ("version_published_at");
  CREATE INDEX "_clergy_obituaries_v_version_version_updated_at_idx" ON "_clergy_obituaries_v" USING btree ("version_updated_at");
  CREATE INDEX "_clergy_obituaries_v_version_version_created_at_idx" ON "_clergy_obituaries_v" USING btree ("version_created_at");
  CREATE INDEX "_clergy_obituaries_v_version_version__status_idx" ON "_clergy_obituaries_v" USING btree ("version__status");
  CREATE INDEX "_clergy_obituaries_v_created_at_idx" ON "_clergy_obituaries_v" USING btree ("created_at");
  CREATE INDEX "_clergy_obituaries_v_updated_at_idx" ON "_clergy_obituaries_v" USING btree ("updated_at");
  CREATE INDEX "_clergy_obituaries_v_snapshot_idx" ON "_clergy_obituaries_v" USING btree ("snapshot");
  CREATE INDEX "_clergy_obituaries_v_published_locale_idx" ON "_clergy_obituaries_v" USING btree ("published_locale");
  CREATE INDEX "_clergy_obituaries_v_latest_idx" ON "_clergy_obituaries_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_clergy_obituaries_v_locales_locale_parent_id_unique" ON "_clergy_obituaries_v_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_clergy_obituaries_fk" FOREIGN KEY ("clergy_obituaries_id") REFERENCES "public"."clergy_obituaries"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_clergy_obituaries_id_idx" ON "payload_locked_documents_rels" USING btree ("clergy_obituaries_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "clergy_obituaries_marriage_children" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "clergy_obituaries_assignments_achievements" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "clergy_obituaries_assignments" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "clergy_obituaries_virtues" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "clergy_obituaries_scripture_reflections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "clergy_obituaries" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "clergy_obituaries_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_clergy_obituaries_v_version_marriage_children" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_clergy_obituaries_v_version_assignments_achievements" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_clergy_obituaries_v_version_assignments" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_clergy_obituaries_v_version_virtues" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_clergy_obituaries_v_version_scripture_reflections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_clergy_obituaries_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_clergy_obituaries_v_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "clergy_obituaries_marriage_children" CASCADE;
  DROP TABLE "clergy_obituaries_assignments_achievements" CASCADE;
  DROP TABLE "clergy_obituaries_assignments" CASCADE;
  DROP TABLE "clergy_obituaries_virtues" CASCADE;
  DROP TABLE "clergy_obituaries_scripture_reflections" CASCADE;
  DROP TABLE "clergy_obituaries" CASCADE;
  DROP TABLE "clergy_obituaries_locales" CASCADE;
  DROP TABLE "_clergy_obituaries_v_version_marriage_children" CASCADE;
  DROP TABLE "_clergy_obituaries_v_version_assignments_achievements" CASCADE;
  DROP TABLE "_clergy_obituaries_v_version_assignments" CASCADE;
  DROP TABLE "_clergy_obituaries_v_version_virtues" CASCADE;
  DROP TABLE "_clergy_obituaries_v_version_scripture_reflections" CASCADE;
  DROP TABLE "_clergy_obituaries_v" CASCADE;
  DROP TABLE "_clergy_obituaries_v_locales" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_clergy_obituaries_fk";
  
  ALTER TABLE "users_permissions_grant" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum_users_permissions_grant";
  CREATE TYPE "public"."enum_users_permissions_grant" AS ENUM('news.create', 'news.update', 'news.delete', 'news.publish', 'pages.create', 'pages.update', 'pages.delete', 'pages.publish', 'pope-messages.create', 'pope-messages.update', 'pope-messages.delete', 'pope-messages.publish', 'bishop-messages.create', 'bishop-messages.update', 'bishop-messages.delete', 'bishop-messages.publish', 'bishops.view', 'bishops.create', 'bishops.edit', 'bishops.delete', 'bishops.publish', 'bishops.set_active', 'apps.create', 'apps.update', 'apps.delete', 'apps.publish', 'offices.create', 'offices.update', 'offices.delete', 'offices.publish', 'events.create', 'events.update', 'events.delete', 'events.publish', 'events.manage-own', 'publications.create', 'publications.update', 'publications.delete', 'magazines.create', 'magazines.update', 'magazines.delete', 'archives.create', 'archives.update', 'archives.delete', 'priests.create', 'priests.update', 'priests.delete', 'vicariates.create', 'vicariates.update', 'vicariates.delete', 'schools.create', 'schools.update', 'schools.delete', 'clinics.create', 'clinics.update', 'clinics.delete', 'parishes.create', 'parishes.update', 'parishes.delete', 'parishes.update-own', 'ministries.create', 'ministries.update', 'ministries.delete', 'children-programs.create', 'children-programs.update', 'children-programs.delete', 'small-christian-communities.create', 'small-christian-communities.update', 'small-christian-communities.delete', 'small-christian-communities.manage-own', 'news-categories.manage', 'event-types.manage', 'geez-calendar.manage', 'geez-calendar.import', 'media.upload', 'media.delete', 'media.view-restricted', 'feed-sources.manage', 'subscribers.view', 'subscribers.manage', 'subscribers.delete', 'visitor-stats.view', 'visitor-stats.delete', 'contact-submissions.view', 'contact-submissions.manage', 'contact-submissions.publish-qa', 'contact-submissions.delete', 'sacramental-requests.view', 'sacramental-requests.manage', 'sacramental-requests.delete', 'mass-intentions.view', 'mass-intentions.manage', 'mass-intentions.delete', 'donations.view', 'donations.manage', 'donations.config', 'donations.delete', 'users.view', 'users.manage', 'audit-log.view', 'system.maintenance-mode', 'globals.site-settings.edit', 'globals.header.edit', 'globals.footer.edit', 'globals.homepage.edit', 'globals.navigation.edit', 'globals.about-page.edit', 'globals.banner-settings.edit', 'globals.donation-settings.edit', 'globals.pope-settings.edit');
  ALTER TABLE "users_permissions_grant" ALTER COLUMN "value" SET DATA TYPE "public"."enum_users_permissions_grant" USING "value"::"public"."enum_users_permissions_grant";
  ALTER TABLE "users_permissions_revoke" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum_users_permissions_revoke";
  CREATE TYPE "public"."enum_users_permissions_revoke" AS ENUM('news.create', 'news.update', 'news.delete', 'news.publish', 'pages.create', 'pages.update', 'pages.delete', 'pages.publish', 'pope-messages.create', 'pope-messages.update', 'pope-messages.delete', 'pope-messages.publish', 'bishop-messages.create', 'bishop-messages.update', 'bishop-messages.delete', 'bishop-messages.publish', 'bishops.view', 'bishops.create', 'bishops.edit', 'bishops.delete', 'bishops.publish', 'bishops.set_active', 'apps.create', 'apps.update', 'apps.delete', 'apps.publish', 'offices.create', 'offices.update', 'offices.delete', 'offices.publish', 'events.create', 'events.update', 'events.delete', 'events.publish', 'events.manage-own', 'publications.create', 'publications.update', 'publications.delete', 'magazines.create', 'magazines.update', 'magazines.delete', 'archives.create', 'archives.update', 'archives.delete', 'priests.create', 'priests.update', 'priests.delete', 'vicariates.create', 'vicariates.update', 'vicariates.delete', 'schools.create', 'schools.update', 'schools.delete', 'clinics.create', 'clinics.update', 'clinics.delete', 'parishes.create', 'parishes.update', 'parishes.delete', 'parishes.update-own', 'ministries.create', 'ministries.update', 'ministries.delete', 'children-programs.create', 'children-programs.update', 'children-programs.delete', 'small-christian-communities.create', 'small-christian-communities.update', 'small-christian-communities.delete', 'small-christian-communities.manage-own', 'news-categories.manage', 'event-types.manage', 'geez-calendar.manage', 'geez-calendar.import', 'media.upload', 'media.delete', 'media.view-restricted', 'feed-sources.manage', 'subscribers.view', 'subscribers.manage', 'subscribers.delete', 'visitor-stats.view', 'visitor-stats.delete', 'contact-submissions.view', 'contact-submissions.manage', 'contact-submissions.publish-qa', 'contact-submissions.delete', 'sacramental-requests.view', 'sacramental-requests.manage', 'sacramental-requests.delete', 'mass-intentions.view', 'mass-intentions.manage', 'mass-intentions.delete', 'donations.view', 'donations.manage', 'donations.config', 'donations.delete', 'users.view', 'users.manage', 'audit-log.view', 'system.maintenance-mode', 'globals.site-settings.edit', 'globals.header.edit', 'globals.footer.edit', 'globals.homepage.edit', 'globals.navigation.edit', 'globals.about-page.edit', 'globals.banner-settings.edit', 'globals.donation-settings.edit', 'globals.pope-settings.edit');
  ALTER TABLE "users_permissions_revoke" ALTER COLUMN "value" SET DATA TYPE "public"."enum_users_permissions_revoke" USING "value"::"public"."enum_users_permissions_revoke";
  DROP INDEX "payload_locked_documents_rels_clergy_obituaries_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "clergy_obituaries_id";
  DROP TYPE "public"."enum_clergy_obituaries_assignments_role";
  DROP TYPE "public"."enum_clergy_obituaries_honorific";
  DROP TYPE "public"."enum_clergy_obituaries_ordination_church";
  DROP TYPE "public"."enum_clergy_obituaries_status";
  DROP TYPE "public"."enum__clergy_obituaries_v_version_assignments_role";
  DROP TYPE "public"."enum__clergy_obituaries_v_version_honorific";
  DROP TYPE "public"."enum__clergy_obituaries_v_version_ordination_church";
  DROP TYPE "public"."enum__clergy_obituaries_v_version_status";
  DROP TYPE "public"."enum__clergy_obituaries_v_published_locale";`)
}
