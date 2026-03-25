import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."_locales" AS ENUM('en', 'ti');
  CREATE TYPE "public"."enum_users_role" AS ENUM('super-admin', 'chancery-editor', 'parish-editor', 'youth-editor', 'catechist-editor', 'media-editor');
  CREATE TYPE "public"."enum_media_category" AS ENUM('general', 'event', 'parish', 'clergy', 'document');
  CREATE TYPE "public"."enum_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__pages_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__pages_v_published_locale" AS ENUM('en', 'ti');
  CREATE TYPE "public"."enum_news_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_news_category" AS ENUM('eparchy', 'vatican', 'pastoral', 'community', 'social', 'announcement');
  CREATE TYPE "public"."enum__news_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__news_v_version_category" AS ENUM('eparchy', 'vatican', 'pastoral', 'community', 'social', 'announcement');
  CREATE TYPE "public"."enum__news_v_published_locale" AS ENUM('en', 'ti');
  CREATE TYPE "public"."enum_events_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_events_event_type" AS ENUM('liturgical', 'feast', 'youth', 'community', 'education', 'social', 'pilgrimage', 'conference', 'other');
  CREATE TYPE "public"."enum__events_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__events_v_version_event_type" AS ENUM('liturgical', 'feast', 'youth', 'community', 'education', 'social', 'pilgrimage', 'conference', 'other');
  CREATE TYPE "public"."enum__events_v_published_locale" AS ENUM('en', 'ti');
  CREATE TYPE "public"."enum_parishes_mass_times_day" AS ENUM('Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday');
  CREATE TYPE "public"."enum_parishes_mass_times_language" AS ENUM('Tigrinya', 'English', 'Arabic', 'Other');
  CREATE TYPE "public"."enum_parishes_vicariate" AS ENUM('segeneyti', 'adi-keyih', 'dekemhare', 'adi-ugri', 'diaspora');
  CREATE TYPE "public"."enum_ministries_status" AS ENUM('active', 'inactive');
  CREATE TYPE "public"."enum_ministries_type" AS ENUM('youth-council', 'catechists', 'children', 'small-christian-community', 'lay-apostolate', 'caritas', 'women-league', 'men-league', 'choir', 'other');
  CREATE TYPE "public"."enum_priests_title" AS ENUM('Rev. Fr.', 'Msgr.', 'Bishop', 'Archbishop', 'Cardinal', 'Deacon', 'Brother', 'Sister');
  CREATE TYPE "public"."enum_priests_status" AS ENUM('active', 'retired', 'deceased', 'on-leave');
  CREATE TYPE "public"."enum_pope_messages_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_pope_messages_document_type" AS ENUM('encyclical', 'apostolic-exhortation', 'apostolic-letter', 'apostolic-constitution', 'message', 'homily', 'audience', 'other');
  CREATE TYPE "public"."enum__pope_messages_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__pope_messages_v_version_document_type" AS ENUM('encyclical', 'apostolic-exhortation', 'apostolic-letter', 'apostolic-constitution', 'message', 'homily', 'audience', 'other');
  CREATE TYPE "public"."enum__pope_messages_v_published_locale" AS ENUM('en', 'ti');
  CREATE TYPE "public"."enum_bishop_messages_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_bishop_messages_message_type" AS ENUM('pastoral-letter', 'homily', 'encyclical-response', 'christmas', 'easter', 'extraordinary', 'general');
  CREATE TYPE "public"."enum__bishop_messages_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__bishop_messages_v_version_message_type" AS ENUM('pastoral-letter', 'homily', 'encyclical-response', 'christmas', 'easter', 'extraordinary', 'general');
  CREATE TYPE "public"."enum__bishop_messages_v_published_locale" AS ENUM('en', 'ti');
  CREATE TYPE "public"."enum_publications_category" AS ENUM('pastoral', 'liturgical', 'educational', 'youth', 'social', 'official', 'prayer', 'other');
  CREATE TYPE "public"."enum_publications_language" AS ENUM('ti', 'en', 'ar', 'it', 'multi');
  CREATE TYPE "public"."enum_archives_files_language" AS ENUM('ti', 'en', 'ar', 'it', 'other');
  CREATE TYPE "public"."enum_archives_category" AS ENUM('official', 'pastoral', 'historical', 'correspondence', 'council', 'reports', 'other');
  CREATE TYPE "public"."enum_archives_access_level" AS ENUM('public', 'restricted');
  CREATE TYPE "public"."enum_schools_status" AS ENUM('active', 'inactive');
  CREATE TYPE "public"."enum_schools_level" AS ENUM('kindergarten', 'primary', 'middle', 'secondary', 'vocational', 'higher', 'combined');
  CREATE TYPE "public"."enum_clinics_status" AS ENUM('active', 'inactive');
  CREATE TYPE "public"."enum_clinics_facility_type" AS ENUM('hospital', 'health-centre', 'clinic', 'dispensary', 'pharmacy', 'mother-child');
  CREATE TYPE "public"."enum_children_programs_status" AS ENUM('active', 'inactive', 'seasonal');
  CREATE TYPE "public"."enum_small_christian_communities_status" AS ENUM('active', 'inactive');
  CREATE TYPE "public"."enum_small_christian_communities_meeting_day" AS ENUM('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday');
  CREATE TYPE "public"."enum_geez_calendar_entries_feast_rank" AS ENUM('major', 'minor', 'memorial', 'optional-memorial', 'fasting', 'ordinary');
  CREATE TYPE "public"."enum_geez_calendar_entries_liturgical_color" AS ENUM('white', 'red', 'purple', 'green', 'black', 'gold');
  CREATE TYPE "public"."enum_geez_calendar_entries_geez_date_month" AS ENUM('meskerem', 'tikmt', 'hidar', 'tahsas', 'tir', 'yekatit', 'megabit', 'miyazya', 'ginbot', 'sene', 'hamle', 'nehase', 'pagume');
  CREATE TYPE "public"."enum_contact_submissions_status" AS ENUM('new', 'read', 'replied', 'archived');
  CREATE TYPE "public"."enum_header_announcement_banner_style" AS ENUM('info', 'warning', 'urgent');
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"first_name" varchar NOT NULL,
  	"last_name" varchar NOT NULL,
  	"role" "enum_users_role" DEFAULT 'parish-editor' NOT NULL,
  	"assigned_parish_id" integer,
  	"profile_photo_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"credit" varchar,
  	"category" "enum_media_category" DEFAULT 'general',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_hero_url" varchar,
  	"sizes_hero_width" numeric,
  	"sizes_hero_height" numeric,
  	"sizes_hero_mime_type" varchar,
  	"sizes_hero_filesize" numeric,
  	"sizes_hero_filename" varchar,
  	"sizes_og_url" varchar,
  	"sizes_og_width" numeric,
  	"sizes_og_height" numeric,
  	"sizes_og_mime_type" varchar,
  	"sizes_og_filesize" numeric,
  	"sizes_og_filename" varchar
  );
  
  CREATE TABLE "media_locales" (
  	"alt" varchar,
  	"caption" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"status" "enum_pages_status" DEFAULT 'draft',
  	"hero_image_id" integer,
  	"seo_og_image_id" integer,
  	"seo_no_index" boolean DEFAULT false,
  	"published_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_pages_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "pages_locales" (
  	"title" varchar,
  	"hero_heading" varchar,
  	"hero_subheading" varchar,
  	"content" jsonb,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_slug" varchar,
  	"version_status" "enum__pages_v_version_status" DEFAULT 'draft',
  	"version_hero_image_id" integer,
  	"version_seo_og_image_id" integer,
  	"version_seo_no_index" boolean DEFAULT false,
  	"version_published_at" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__pages_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__pages_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_pages_v_locales" (
  	"version_title" varchar,
  	"version_hero_heading" varchar,
  	"version_hero_subheading" varchar,
  	"version_content" jsonb,
  	"version_seo_meta_title" varchar,
  	"version_seo_meta_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "news_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tag" varchar
  );
  
  CREATE TABLE "news" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"status" "enum_news_status" DEFAULT 'draft',
  	"published_at" timestamp(3) with time zone,
  	"category" "enum_news_category" DEFAULT 'eparchy',
  	"featured_image_id" integer,
  	"author_id" integer,
  	"seo_og_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_news_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "news_locales" (
  	"title" varchar,
  	"excerpt" varchar,
  	"body" jsonb,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "news_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"news_id" integer
  );
  
  CREATE TABLE "_news_v_version_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"tag" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_news_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_slug" varchar,
  	"version_status" "enum__news_v_version_status" DEFAULT 'draft',
  	"version_published_at" timestamp(3) with time zone,
  	"version_category" "enum__news_v_version_category" DEFAULT 'eparchy',
  	"version_featured_image_id" integer,
  	"version_author_id" integer,
  	"version_seo_og_image_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__news_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__news_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_news_v_locales" (
  	"version_title" varchar,
  	"version_excerpt" varchar,
  	"version_body" jsonb,
  	"version_seo_meta_title" varchar,
  	"version_seo_meta_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_news_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"news_id" integer
  );
  
  CREATE TABLE "events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"status" "enum_events_status" DEFAULT 'draft',
  	"event_type" "enum_events_event_type" DEFAULT 'liturgical',
  	"featured_image_id" integer,
  	"start_date" timestamp(3) with time zone,
  	"end_date" timestamp(3) with time zone,
  	"is_all_day" boolean DEFAULT false,
  	"location_address" varchar,
  	"location_google_maps_url" varchar,
  	"parish_id" integer,
  	"organizer_id" integer,
  	"is_recurring" boolean DEFAULT false,
  	"geez_calendar_ref_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_events_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "events_locales" (
  	"title" varchar,
  	"excerpt" varchar,
  	"description" jsonb,
  	"location_name" varchar,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_events_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_slug" varchar,
  	"version_status" "enum__events_v_version_status" DEFAULT 'draft',
  	"version_event_type" "enum__events_v_version_event_type" DEFAULT 'liturgical',
  	"version_featured_image_id" integer,
  	"version_start_date" timestamp(3) with time zone,
  	"version_end_date" timestamp(3) with time zone,
  	"version_is_all_day" boolean DEFAULT false,
  	"version_location_address" varchar,
  	"version_location_google_maps_url" varchar,
  	"version_parish_id" integer,
  	"version_organizer_id" integer,
  	"version_is_recurring" boolean DEFAULT false,
  	"version_geez_calendar_ref_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__events_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__events_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_events_v_locales" (
  	"version_title" varchar,
  	"version_excerpt" varchar,
  	"version_description" jsonb,
  	"version_location_name" varchar,
  	"version_seo_meta_title" varchar,
  	"version_seo_meta_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "parishes_mass_times" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"day" "enum_parishes_mass_times_day",
  	"time" varchar,
  	"language" "enum_parishes_mass_times_language",
  	"notes" varchar
  );
  
  CREATE TABLE "parishes_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL
  );
  
  CREATE TABLE "parishes_gallery_locales" (
  	"caption" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "parishes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"vicariate" "enum_parishes_vicariate",
  	"region" varchar,
  	"featured_image_id" integer,
  	"feast_date" varchar,
  	"pastor_id" integer,
  	"contact_phone" varchar,
  	"contact_email" varchar,
  	"contact_address" varchar,
  	"contact_map_url" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "parishes_locales" (
  	"name" varchar NOT NULL,
  	"patron" varchar,
  	"description" jsonb,
  	"history" jsonb,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "ministries_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL
  );
  
  CREATE TABLE "ministries_gallery_locales" (
  	"caption" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "ministries" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"status" "enum_ministries_status" DEFAULT 'active' NOT NULL,
  	"type" "enum_ministries_type" NOT NULL,
  	"featured_image_id" integer,
  	"parish_id" integer,
  	"leader_name" varchar,
  	"leader_phone" varchar,
  	"leader_email" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "ministries_locales" (
  	"name" varchar NOT NULL,
  	"description" jsonb,
  	"mission" varchar,
  	"meeting_info_schedule" varchar,
  	"meeting_info_venue" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "priests_education" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"institution" varchar NOT NULL,
  	"degree" varchar,
  	"year" numeric
  );
  
  CREATE TABLE "priests" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"full_name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"title" "enum_priests_title" DEFAULT 'Rev. Fr.' NOT NULL,
  	"status" "enum_priests_status" DEFAULT 'active' NOT NULL,
  	"photo_id" integer,
  	"ordination_date" timestamp(3) with time zone,
  	"birth_date" timestamp(3) with time zone,
  	"contact_email" varchar,
  	"contact_phone" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "priests_locales" (
  	"assignment" varchar,
  	"bio" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "priests_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"parishes_id" integer
  );
  
  CREATE TABLE "pope_messages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"status" "enum_pope_messages_status" DEFAULT 'draft',
  	"published_at" timestamp(3) with time zone,
  	"document_type" "enum_pope_messages_document_type" DEFAULT 'message',
  	"featured_image_id" integer,
  	"document_id" integer,
  	"source_url" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_pope_messages_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "pope_messages_locales" (
  	"title" varchar,
  	"excerpt" varchar,
  	"body" jsonb,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pope_messages_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_slug" varchar,
  	"version_status" "enum__pope_messages_v_version_status" DEFAULT 'draft',
  	"version_published_at" timestamp(3) with time zone,
  	"version_document_type" "enum__pope_messages_v_version_document_type" DEFAULT 'message',
  	"version_featured_image_id" integer,
  	"version_document_id" integer,
  	"version_source_url" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__pope_messages_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__pope_messages_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_pope_messages_v_locales" (
  	"version_title" varchar,
  	"version_excerpt" varchar,
  	"version_body" jsonb,
  	"version_seo_meta_title" varchar,
  	"version_seo_meta_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "bishop_messages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"status" "enum_bishop_messages_status" DEFAULT 'draft',
  	"published_at" timestamp(3) with time zone,
  	"message_type" "enum_bishop_messages_message_type" DEFAULT 'general',
  	"featured_image_id" integer,
  	"document_id" integer,
  	"is_featured" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_bishop_messages_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "bishop_messages_locales" (
  	"title" varchar,
  	"excerpt" varchar,
  	"body" jsonb,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_bishop_messages_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_slug" varchar,
  	"version_status" "enum__bishop_messages_v_version_status" DEFAULT 'draft',
  	"version_published_at" timestamp(3) with time zone,
  	"version_message_type" "enum__bishop_messages_v_version_message_type" DEFAULT 'general',
  	"version_featured_image_id" integer,
  	"version_document_id" integer,
  	"version_is_featured" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__bishop_messages_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__bishop_messages_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_bishop_messages_v_locales" (
  	"version_title" varchar,
  	"version_excerpt" varchar,
  	"version_body" jsonb,
  	"version_seo_meta_title" varchar,
  	"version_seo_meta_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "publications" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"category" "enum_publications_category" DEFAULT 'other' NOT NULL,
  	"language" "enum_publications_language" DEFAULT 'ti',
  	"published_at" timestamp(3) with time zone,
  	"cover_image_id" integer,
  	"file_id" integer NOT NULL,
  	"file_size" varchar,
  	"page_count" numeric,
  	"is_featured" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "publications_locales" (
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "magazines_featured_articles" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"page_number" numeric,
  	"author" varchar
  );
  
  CREATE TABLE "magazines_featured_articles_locales" (
  	"article_title" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "magazines" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"published_at" timestamp(3) with time zone NOT NULL,
  	"cover_image_id" integer,
  	"issue_number" numeric,
  	"year" numeric NOT NULL,
  	"volume" numeric,
  	"document_id" integer NOT NULL,
  	"is_featured" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "magazines_locales" (
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "archives_files" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"file_id" integer NOT NULL,
  	"language" "enum_archives_files_language" DEFAULT 'ti'
  );
  
  CREATE TABLE "archives_files_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "archives_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tag" varchar
  );
  
  CREATE TABLE "archives" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"year" numeric NOT NULL,
  	"category" "enum_archives_category" NOT NULL,
  	"access_level" "enum_archives_access_level" DEFAULT 'public' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "archives_locales" (
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "schools_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL
  );
  
  CREATE TABLE "schools_gallery_locales" (
  	"caption" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "schools" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"status" "enum_schools_status" DEFAULT 'active' NOT NULL,
  	"level" "enum_schools_level" NOT NULL,
  	"featured_image_id" integer,
  	"parish_id" integer,
  	"contact_address" varchar,
  	"contact_phone" varchar,
  	"contact_email" varchar,
  	"principal_name" varchar,
  	"founded_year" numeric,
  	"student_count" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "schools_locales" (
  	"name" varchar NOT NULL,
  	"description" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "clinics_services" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "clinics_services_locales" (
  	"service_name" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "clinics_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL
  );
  
  CREATE TABLE "clinics_gallery_locales" (
  	"caption" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "clinics" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"status" "enum_clinics_status" DEFAULT 'active' NOT NULL,
  	"facility_type" "enum_clinics_facility_type" NOT NULL,
  	"featured_image_id" integer,
  	"parish_id" integer,
  	"contact_address" varchar,
  	"contact_phone" varchar,
  	"contact_email" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "clinics_locales" (
  	"name" varchar NOT NULL,
  	"description" jsonb,
  	"opening_hours" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "children_programs_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL
  );
  
  CREATE TABLE "children_programs_gallery_locales" (
  	"caption" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "children_programs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"status" "enum_children_programs_status" DEFAULT 'active' NOT NULL,
  	"age_group" varchar,
  	"featured_image_id" integer,
  	"parish_id" integer,
  	"coordinator_name" varchar,
  	"coordinator_phone" varchar,
  	"coordinator_email" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "children_programs_locales" (
  	"name" varchar NOT NULL,
  	"description" jsonb,
  	"curriculum" jsonb,
  	"schedule" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "small_christian_communities" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"status" "enum_small_christian_communities_status" DEFAULT 'active' NOT NULL,
  	"parish_id" integer NOT NULL,
  	"coordinator_name" varchar,
  	"coordinator_phone" varchar,
  	"meeting_day" "enum_small_christian_communities_meeting_day",
  	"member_count" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "small_christian_communities_locales" (
  	"name" varchar NOT NULL,
  	"description" jsonb,
  	"neighborhood_area" varchar,
  	"meeting_schedule" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "geez_calendar_entries" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"is_fasting" boolean DEFAULT false,
  	"feast_rank" "enum_geez_calendar_entries_feast_rank",
  	"liturgical_color" "enum_geez_calendar_entries_liturgical_color",
  	"geez_date_month" "enum_geez_calendar_entries_geez_date_month" NOT NULL,
  	"geez_date_day" numeric NOT NULL,
  	"gregorian_equivalent_month" numeric,
  	"gregorian_equivalent_day" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "geez_calendar_entries_locales" (
  	"title" varchar NOT NULL,
  	"saint" varchar,
  	"description" jsonb,
  	"readings_first_reading" varchar,
  	"readings_psalm" varchar,
  	"readings_gospel" varchar,
  	"fasting_notes" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "geez_calendar_entries_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"events_id" integer
  );
  
  CREATE TABLE "contact_submissions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"phone" varchar,
  	"subject" varchar NOT NULL,
  	"message" varchar NOT NULL,
  	"status" "enum_contact_submissions_status" DEFAULT 'new' NOT NULL,
  	"submitted_at" timestamp(3) with time zone,
  	"admin_notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"media_id" integer,
  	"pages_id" integer,
  	"news_id" integer,
  	"events_id" integer,
  	"parishes_id" integer,
  	"ministries_id" integer,
  	"priests_id" integer,
  	"pope_messages_id" integer,
  	"bishop_messages_id" integer,
  	"publications_id" integer,
  	"magazines_id" integer,
  	"archives_id" integer,
  	"schools_id" integer,
  	"clinics_id" integer,
  	"children_programs_id" integer,
  	"small_christian_communities_id" integer,
  	"geez_calendar_entries_id" integer,
  	"contact_submissions_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"site_name" varchar DEFAULT 'Eparchy of Segeneyti' NOT NULL,
  	"logo_id" integer,
  	"logo_dark_id" integer,
  	"favicon_id" integer,
  	"default_og_image_id" integer,
  	"contact_email" varchar,
  	"contact_phone" varchar,
  	"contact_fax" varchar,
  	"contact_address_street" varchar,
  	"contact_address_city" varchar DEFAULT 'Segeneyti',
  	"contact_address_region" varchar DEFAULT 'Southern Debub',
  	"contact_address_country" varchar DEFAULT 'Eritrea',
  	"contact_address_po_box" varchar,
  	"contact_map_embed_url" varchar,
  	"social_links_facebook" varchar,
  	"social_links_youtube" varchar,
  	"social_links_twitter" varchar,
  	"social_links_telegram" varchar,
  	"social_links_instagram" varchar,
  	"analytics_google_analytics_id" varchar,
  	"analytics_google_tag_manager_id" varchar,
  	"maintenance_mode" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "site_settings_locales" (
  	"tagline" varchar,
  	"site_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "header_utility_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar NOT NULL,
  	"icon" varchar
  );
  
  CREATE TABLE "header_utility_links_locales" (
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "header" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"logo_id" integer,
  	"announcement_banner_enabled" boolean DEFAULT false,
  	"announcement_banner_link" varchar,
  	"announcement_banner_style" "enum_header_announcement_banner_style" DEFAULT 'info',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "header_locales" (
  	"logo_alt" varchar,
  	"announcement_banner_message" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "footer_columns_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar NOT NULL,
  	"new_tab" boolean DEFAULT false
  );
  
  CREATE TABLE "footer_columns_links_locales" (
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "footer_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "footer_columns_locales" (
  	"heading" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "footer_bottom_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "footer_bottom_links_locales" (
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "footer" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"show_social_links" boolean DEFAULT true,
  	"newsletter_signup_enabled" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "footer_locales" (
  	"copyright_text" varchar,
  	"newsletter_signup_heading" varchar,
  	"newsletter_signup_subtext" varchar,
  	"newsletter_signup_placeholder" varchar,
  	"newsletter_signup_button_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "homepage_quick_links_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar NOT NULL,
  	"icon" varchar
  );
  
  CREATE TABLE "homepage_quick_links_links_locales" (
  	"label" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "homepage" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"hero_background_image_id" integer,
  	"hero_primary_cta_url" varchar,
  	"hero_secondary_cta_url" varchar,
  	"bishop_message_enabled" boolean DEFAULT true,
  	"bishop_message_featured_message_id" integer,
  	"latest_news_enabled" boolean DEFAULT true,
  	"latest_news_count" numeric DEFAULT 3,
  	"upcoming_events_enabled" boolean DEFAULT true,
  	"upcoming_events_count" numeric DEFAULT 3,
  	"quick_links_enabled" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "homepage_locales" (
  	"hero_headline" varchar,
  	"hero_subheading" varchar,
  	"hero_primary_cta_label" varchar,
  	"hero_secondary_cta_label" varchar,
  	"bishop_message_section_heading" varchar,
  	"bishop_message_section_subtext" varchar,
  	"latest_news_section_heading" varchar,
  	"upcoming_events_section_heading" varchar,
  	"quick_links_section_heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "homepage_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"news_id" integer
  );
  
  CREATE TABLE "navigation_main_nav_children" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar NOT NULL,
  	"icon" varchar,
  	"open_in_new_tab" boolean DEFAULT false
  );
  
  CREATE TABLE "navigation_main_nav_children_locales" (
  	"label" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "navigation_main_nav" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar,
  	"open_in_new_tab" boolean DEFAULT false
  );
  
  CREATE TABLE "navigation_main_nav_locales" (
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "navigation_mobile_extra" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar NOT NULL,
  	"highlight" boolean DEFAULT false
  );
  
  CREATE TABLE "navigation_mobile_extra_locales" (
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "navigation" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users" ADD CONSTRAINT "users_assigned_parish_id_parishes_id_fk" FOREIGN KEY ("assigned_parish_id") REFERENCES "public"."parishes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "users" ADD CONSTRAINT "users_profile_photo_id_media_id_fk" FOREIGN KEY ("profile_photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "media_locales" ADD CONSTRAINT "media_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages" ADD CONSTRAINT "pages_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages" ADD CONSTRAINT "pages_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_locales" ADD CONSTRAINT "pages_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_parent_id_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_hero_image_id_media_id_fk" FOREIGN KEY ("version_hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_locales" ADD CONSTRAINT "_pages_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "news_tags" ADD CONSTRAINT "news_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "news" ADD CONSTRAINT "news_featured_image_id_media_id_fk" FOREIGN KEY ("featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "news" ADD CONSTRAINT "news_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "news" ADD CONSTRAINT "news_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "news_locales" ADD CONSTRAINT "news_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "news_rels" ADD CONSTRAINT "news_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "news_rels" ADD CONSTRAINT "news_rels_news_fk" FOREIGN KEY ("news_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_news_v_version_tags" ADD CONSTRAINT "_news_v_version_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_news_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_news_v" ADD CONSTRAINT "_news_v_parent_id_news_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."news"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_news_v" ADD CONSTRAINT "_news_v_version_featured_image_id_media_id_fk" FOREIGN KEY ("version_featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_news_v" ADD CONSTRAINT "_news_v_version_author_id_users_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_news_v" ADD CONSTRAINT "_news_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_news_v_locales" ADD CONSTRAINT "_news_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_news_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_news_v_rels" ADD CONSTRAINT "_news_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_news_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_news_v_rels" ADD CONSTRAINT "_news_v_rels_news_fk" FOREIGN KEY ("news_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events" ADD CONSTRAINT "events_featured_image_id_media_id_fk" FOREIGN KEY ("featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events" ADD CONSTRAINT "events_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events" ADD CONSTRAINT "events_organizer_id_users_id_fk" FOREIGN KEY ("organizer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events" ADD CONSTRAINT "events_geez_calendar_ref_id_geez_calendar_entries_id_fk" FOREIGN KEY ("geez_calendar_ref_id") REFERENCES "public"."geez_calendar_entries"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events_locales" ADD CONSTRAINT "events_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_parent_id_events_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_version_featured_image_id_media_id_fk" FOREIGN KEY ("version_featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_version_parish_id_parishes_id_fk" FOREIGN KEY ("version_parish_id") REFERENCES "public"."parishes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_version_organizer_id_users_id_fk" FOREIGN KEY ("version_organizer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_version_geez_calendar_ref_id_geez_calendar_entries_id_fk" FOREIGN KEY ("version_geez_calendar_ref_id") REFERENCES "public"."geez_calendar_entries"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v_locales" ADD CONSTRAINT "_events_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_events_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "parishes_mass_times" ADD CONSTRAINT "parishes_mass_times_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."parishes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "parishes_gallery" ADD CONSTRAINT "parishes_gallery_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "parishes_gallery" ADD CONSTRAINT "parishes_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."parishes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "parishes_gallery_locales" ADD CONSTRAINT "parishes_gallery_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."parishes_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "parishes" ADD CONSTRAINT "parishes_featured_image_id_media_id_fk" FOREIGN KEY ("featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "parishes" ADD CONSTRAINT "parishes_pastor_id_priests_id_fk" FOREIGN KEY ("pastor_id") REFERENCES "public"."priests"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "parishes_locales" ADD CONSTRAINT "parishes_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."parishes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ministries_gallery" ADD CONSTRAINT "ministries_gallery_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ministries_gallery" ADD CONSTRAINT "ministries_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."ministries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ministries_gallery_locales" ADD CONSTRAINT "ministries_gallery_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."ministries_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ministries" ADD CONSTRAINT "ministries_featured_image_id_media_id_fk" FOREIGN KEY ("featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ministries" ADD CONSTRAINT "ministries_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ministries_locales" ADD CONSTRAINT "ministries_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."ministries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "priests_education" ADD CONSTRAINT "priests_education_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."priests"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "priests" ADD CONSTRAINT "priests_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "priests_locales" ADD CONSTRAINT "priests_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."priests"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "priests_rels" ADD CONSTRAINT "priests_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."priests"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "priests_rels" ADD CONSTRAINT "priests_rels_parishes_fk" FOREIGN KEY ("parishes_id") REFERENCES "public"."parishes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pope_messages" ADD CONSTRAINT "pope_messages_featured_image_id_media_id_fk" FOREIGN KEY ("featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pope_messages" ADD CONSTRAINT "pope_messages_document_id_media_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pope_messages_locales" ADD CONSTRAINT "pope_messages_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pope_messages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pope_messages_v" ADD CONSTRAINT "_pope_messages_v_parent_id_pope_messages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pope_messages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pope_messages_v" ADD CONSTRAINT "_pope_messages_v_version_featured_image_id_media_id_fk" FOREIGN KEY ("version_featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pope_messages_v" ADD CONSTRAINT "_pope_messages_v_version_document_id_media_id_fk" FOREIGN KEY ("version_document_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pope_messages_v_locales" ADD CONSTRAINT "_pope_messages_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pope_messages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "bishop_messages" ADD CONSTRAINT "bishop_messages_featured_image_id_media_id_fk" FOREIGN KEY ("featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "bishop_messages" ADD CONSTRAINT "bishop_messages_document_id_media_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "bishop_messages_locales" ADD CONSTRAINT "bishop_messages_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."bishop_messages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_bishop_messages_v" ADD CONSTRAINT "_bishop_messages_v_parent_id_bishop_messages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."bishop_messages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_bishop_messages_v" ADD CONSTRAINT "_bishop_messages_v_version_featured_image_id_media_id_fk" FOREIGN KEY ("version_featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_bishop_messages_v" ADD CONSTRAINT "_bishop_messages_v_version_document_id_media_id_fk" FOREIGN KEY ("version_document_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_bishop_messages_v_locales" ADD CONSTRAINT "_bishop_messages_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_bishop_messages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "publications" ADD CONSTRAINT "publications_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "publications" ADD CONSTRAINT "publications_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "publications_locales" ADD CONSTRAINT "publications_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."publications"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "magazines_featured_articles" ADD CONSTRAINT "magazines_featured_articles_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."magazines"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "magazines_featured_articles_locales" ADD CONSTRAINT "magazines_featured_articles_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."magazines_featured_articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "magazines" ADD CONSTRAINT "magazines_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "magazines" ADD CONSTRAINT "magazines_document_id_media_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "magazines_locales" ADD CONSTRAINT "magazines_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."magazines"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "archives_files" ADD CONSTRAINT "archives_files_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "archives_files" ADD CONSTRAINT "archives_files_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."archives"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "archives_files_locales" ADD CONSTRAINT "archives_files_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."archives_files"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "archives_tags" ADD CONSTRAINT "archives_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."archives"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "archives_locales" ADD CONSTRAINT "archives_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."archives"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "schools_gallery" ADD CONSTRAINT "schools_gallery_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "schools_gallery" ADD CONSTRAINT "schools_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "schools_gallery_locales" ADD CONSTRAINT "schools_gallery_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."schools_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "schools" ADD CONSTRAINT "schools_featured_image_id_media_id_fk" FOREIGN KEY ("featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "schools" ADD CONSTRAINT "schools_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "schools_locales" ADD CONSTRAINT "schools_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "clinics_services" ADD CONSTRAINT "clinics_services_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "clinics_services_locales" ADD CONSTRAINT "clinics_services_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."clinics_services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "clinics_gallery" ADD CONSTRAINT "clinics_gallery_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "clinics_gallery" ADD CONSTRAINT "clinics_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "clinics_gallery_locales" ADD CONSTRAINT "clinics_gallery_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."clinics_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "clinics" ADD CONSTRAINT "clinics_featured_image_id_media_id_fk" FOREIGN KEY ("featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "clinics" ADD CONSTRAINT "clinics_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "clinics_locales" ADD CONSTRAINT "clinics_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "children_programs_gallery" ADD CONSTRAINT "children_programs_gallery_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "children_programs_gallery" ADD CONSTRAINT "children_programs_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."children_programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "children_programs_gallery_locales" ADD CONSTRAINT "children_programs_gallery_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."children_programs_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "children_programs" ADD CONSTRAINT "children_programs_featured_image_id_media_id_fk" FOREIGN KEY ("featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "children_programs" ADD CONSTRAINT "children_programs_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "children_programs_locales" ADD CONSTRAINT "children_programs_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."children_programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "small_christian_communities" ADD CONSTRAINT "small_christian_communities_parish_id_parishes_id_fk" FOREIGN KEY ("parish_id") REFERENCES "public"."parishes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "small_christian_communities_locales" ADD CONSTRAINT "small_christian_communities_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."small_christian_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "geez_calendar_entries_locales" ADD CONSTRAINT "geez_calendar_entries_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."geez_calendar_entries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "geez_calendar_entries_rels" ADD CONSTRAINT "geez_calendar_entries_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."geez_calendar_entries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "geez_calendar_entries_rels" ADD CONSTRAINT "geez_calendar_entries_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_news_fk" FOREIGN KEY ("news_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parishes_fk" FOREIGN KEY ("parishes_id") REFERENCES "public"."parishes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_ministries_fk" FOREIGN KEY ("ministries_id") REFERENCES "public"."ministries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_priests_fk" FOREIGN KEY ("priests_id") REFERENCES "public"."priests"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pope_messages_fk" FOREIGN KEY ("pope_messages_id") REFERENCES "public"."pope_messages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_bishop_messages_fk" FOREIGN KEY ("bishop_messages_id") REFERENCES "public"."bishop_messages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_publications_fk" FOREIGN KEY ("publications_id") REFERENCES "public"."publications"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_magazines_fk" FOREIGN KEY ("magazines_id") REFERENCES "public"."magazines"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_archives_fk" FOREIGN KEY ("archives_id") REFERENCES "public"."archives"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_schools_fk" FOREIGN KEY ("schools_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_clinics_fk" FOREIGN KEY ("clinics_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_children_programs_fk" FOREIGN KEY ("children_programs_id") REFERENCES "public"."children_programs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_small_christian_communities_fk" FOREIGN KEY ("small_christian_communities_id") REFERENCES "public"."small_christian_communities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_geez_calendar_entries_fk" FOREIGN KEY ("geez_calendar_entries_id") REFERENCES "public"."geez_calendar_entries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_contact_submissions_fk" FOREIGN KEY ("contact_submissions_id") REFERENCES "public"."contact_submissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_logo_dark_id_media_id_fk" FOREIGN KEY ("logo_dark_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_favicon_id_media_id_fk" FOREIGN KEY ("favicon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_default_og_image_id_media_id_fk" FOREIGN KEY ("default_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings_locales" ADD CONSTRAINT "site_settings_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "header_utility_links" ADD CONSTRAINT "header_utility_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."header"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "header_utility_links_locales" ADD CONSTRAINT "header_utility_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."header_utility_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "header" ADD CONSTRAINT "header_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "header_locales" ADD CONSTRAINT "header_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."header"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_columns_links" ADD CONSTRAINT "footer_columns_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_columns_links_locales" ADD CONSTRAINT "footer_columns_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer_columns_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_columns" ADD CONSTRAINT "footer_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_columns_locales" ADD CONSTRAINT "footer_columns_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_bottom_links" ADD CONSTRAINT "footer_bottom_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_bottom_links_locales" ADD CONSTRAINT "footer_bottom_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer_bottom_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_locales" ADD CONSTRAINT "footer_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_quick_links_links" ADD CONSTRAINT "homepage_quick_links_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_quick_links_links_locales" ADD CONSTRAINT "homepage_quick_links_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_quick_links_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage" ADD CONSTRAINT "homepage_hero_background_image_id_media_id_fk" FOREIGN KEY ("hero_background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage" ADD CONSTRAINT "homepage_bishop_message_featured_message_id_bishop_messages_id_fk" FOREIGN KEY ("bishop_message_featured_message_id") REFERENCES "public"."bishop_messages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_locales" ADD CONSTRAINT "homepage_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_news_fk" FOREIGN KEY ("news_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_main_nav_children" ADD CONSTRAINT "navigation_main_nav_children_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_main_nav"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_main_nav_children_locales" ADD CONSTRAINT "navigation_main_nav_children_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_main_nav_children"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_main_nav" ADD CONSTRAINT "navigation_main_nav_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_main_nav_locales" ADD CONSTRAINT "navigation_main_nav_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_main_nav"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_mobile_extra" ADD CONSTRAINT "navigation_mobile_extra_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_mobile_extra_locales" ADD CONSTRAINT "navigation_mobile_extra_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation_mobile_extra"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_assigned_parish_idx" ON "users" USING btree ("assigned_parish_id");
  CREATE INDEX "users_profile_photo_idx" ON "users" USING btree ("profile_photo_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_hero_sizes_hero_filename_idx" ON "media" USING btree ("sizes_hero_filename");
  CREATE INDEX "media_sizes_og_sizes_og_filename_idx" ON "media" USING btree ("sizes_og_filename");
  CREATE UNIQUE INDEX "media_locales_locale_parent_id_unique" ON "media_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "pages_slug_idx" ON "pages" USING btree ("slug");
  CREATE INDEX "pages_hero_image_idx" ON "pages" USING btree ("hero_image_id");
  CREATE INDEX "pages_seo_seo_og_image_idx" ON "pages" USING btree ("seo_og_image_id");
  CREATE INDEX "pages_updated_at_idx" ON "pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "pages" USING btree ("created_at");
  CREATE INDEX "pages__status_idx" ON "pages" USING btree ("_status");
  CREATE UNIQUE INDEX "pages_locales_locale_parent_id_unique" ON "pages_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_parent_idx" ON "_pages_v" USING btree ("parent_id");
  CREATE INDEX "_pages_v_version_version_slug_idx" ON "_pages_v" USING btree ("version_slug");
  CREATE INDEX "_pages_v_version_version_hero_image_idx" ON "_pages_v" USING btree ("version_hero_image_id");
  CREATE INDEX "_pages_v_version_seo_version_seo_og_image_idx" ON "_pages_v" USING btree ("version_seo_og_image_id");
  CREATE INDEX "_pages_v_version_version_updated_at_idx" ON "_pages_v" USING btree ("version_updated_at");
  CREATE INDEX "_pages_v_version_version_created_at_idx" ON "_pages_v" USING btree ("version_created_at");
  CREATE INDEX "_pages_v_version_version__status_idx" ON "_pages_v" USING btree ("version__status");
  CREATE INDEX "_pages_v_created_at_idx" ON "_pages_v" USING btree ("created_at");
  CREATE INDEX "_pages_v_updated_at_idx" ON "_pages_v" USING btree ("updated_at");
  CREATE INDEX "_pages_v_snapshot_idx" ON "_pages_v" USING btree ("snapshot");
  CREATE INDEX "_pages_v_published_locale_idx" ON "_pages_v" USING btree ("published_locale");
  CREATE INDEX "_pages_v_latest_idx" ON "_pages_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_pages_v_locales_locale_parent_id_unique" ON "_pages_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "news_tags_order_idx" ON "news_tags" USING btree ("_order");
  CREATE INDEX "news_tags_parent_id_idx" ON "news_tags" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "news_slug_idx" ON "news" USING btree ("slug");
  CREATE INDEX "news_published_at_idx" ON "news" USING btree ("published_at");
  CREATE INDEX "news_featured_image_idx" ON "news" USING btree ("featured_image_id");
  CREATE INDEX "news_author_idx" ON "news" USING btree ("author_id");
  CREATE INDEX "news_seo_seo_og_image_idx" ON "news" USING btree ("seo_og_image_id");
  CREATE INDEX "news_updated_at_idx" ON "news" USING btree ("updated_at");
  CREATE INDEX "news_created_at_idx" ON "news" USING btree ("created_at");
  CREATE INDEX "news__status_idx" ON "news" USING btree ("_status");
  CREATE UNIQUE INDEX "news_locales_locale_parent_id_unique" ON "news_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "news_rels_order_idx" ON "news_rels" USING btree ("order");
  CREATE INDEX "news_rels_parent_idx" ON "news_rels" USING btree ("parent_id");
  CREATE INDEX "news_rels_path_idx" ON "news_rels" USING btree ("path");
  CREATE INDEX "news_rels_news_id_idx" ON "news_rels" USING btree ("news_id");
  CREATE INDEX "_news_v_version_tags_order_idx" ON "_news_v_version_tags" USING btree ("_order");
  CREATE INDEX "_news_v_version_tags_parent_id_idx" ON "_news_v_version_tags" USING btree ("_parent_id");
  CREATE INDEX "_news_v_parent_idx" ON "_news_v" USING btree ("parent_id");
  CREATE INDEX "_news_v_version_version_slug_idx" ON "_news_v" USING btree ("version_slug");
  CREATE INDEX "_news_v_version_version_published_at_idx" ON "_news_v" USING btree ("version_published_at");
  CREATE INDEX "_news_v_version_version_featured_image_idx" ON "_news_v" USING btree ("version_featured_image_id");
  CREATE INDEX "_news_v_version_version_author_idx" ON "_news_v" USING btree ("version_author_id");
  CREATE INDEX "_news_v_version_seo_version_seo_og_image_idx" ON "_news_v" USING btree ("version_seo_og_image_id");
  CREATE INDEX "_news_v_version_version_updated_at_idx" ON "_news_v" USING btree ("version_updated_at");
  CREATE INDEX "_news_v_version_version_created_at_idx" ON "_news_v" USING btree ("version_created_at");
  CREATE INDEX "_news_v_version_version__status_idx" ON "_news_v" USING btree ("version__status");
  CREATE INDEX "_news_v_created_at_idx" ON "_news_v" USING btree ("created_at");
  CREATE INDEX "_news_v_updated_at_idx" ON "_news_v" USING btree ("updated_at");
  CREATE INDEX "_news_v_snapshot_idx" ON "_news_v" USING btree ("snapshot");
  CREATE INDEX "_news_v_published_locale_idx" ON "_news_v" USING btree ("published_locale");
  CREATE INDEX "_news_v_latest_idx" ON "_news_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_news_v_locales_locale_parent_id_unique" ON "_news_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_news_v_rels_order_idx" ON "_news_v_rels" USING btree ("order");
  CREATE INDEX "_news_v_rels_parent_idx" ON "_news_v_rels" USING btree ("parent_id");
  CREATE INDEX "_news_v_rels_path_idx" ON "_news_v_rels" USING btree ("path");
  CREATE INDEX "_news_v_rels_news_id_idx" ON "_news_v_rels" USING btree ("news_id");
  CREATE UNIQUE INDEX "events_slug_idx" ON "events" USING btree ("slug");
  CREATE INDEX "events_featured_image_idx" ON "events" USING btree ("featured_image_id");
  CREATE INDEX "events_parish_idx" ON "events" USING btree ("parish_id");
  CREATE INDEX "events_organizer_idx" ON "events" USING btree ("organizer_id");
  CREATE INDEX "events_geez_calendar_ref_idx" ON "events" USING btree ("geez_calendar_ref_id");
  CREATE INDEX "events_updated_at_idx" ON "events" USING btree ("updated_at");
  CREATE INDEX "events_created_at_idx" ON "events" USING btree ("created_at");
  CREATE INDEX "events__status_idx" ON "events" USING btree ("_status");
  CREATE UNIQUE INDEX "events_locales_locale_parent_id_unique" ON "events_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_events_v_parent_idx" ON "_events_v" USING btree ("parent_id");
  CREATE INDEX "_events_v_version_version_slug_idx" ON "_events_v" USING btree ("version_slug");
  CREATE INDEX "_events_v_version_version_featured_image_idx" ON "_events_v" USING btree ("version_featured_image_id");
  CREATE INDEX "_events_v_version_version_parish_idx" ON "_events_v" USING btree ("version_parish_id");
  CREATE INDEX "_events_v_version_version_organizer_idx" ON "_events_v" USING btree ("version_organizer_id");
  CREATE INDEX "_events_v_version_version_geez_calendar_ref_idx" ON "_events_v" USING btree ("version_geez_calendar_ref_id");
  CREATE INDEX "_events_v_version_version_updated_at_idx" ON "_events_v" USING btree ("version_updated_at");
  CREATE INDEX "_events_v_version_version_created_at_idx" ON "_events_v" USING btree ("version_created_at");
  CREATE INDEX "_events_v_version_version__status_idx" ON "_events_v" USING btree ("version__status");
  CREATE INDEX "_events_v_created_at_idx" ON "_events_v" USING btree ("created_at");
  CREATE INDEX "_events_v_updated_at_idx" ON "_events_v" USING btree ("updated_at");
  CREATE INDEX "_events_v_snapshot_idx" ON "_events_v" USING btree ("snapshot");
  CREATE INDEX "_events_v_published_locale_idx" ON "_events_v" USING btree ("published_locale");
  CREATE INDEX "_events_v_latest_idx" ON "_events_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_events_v_locales_locale_parent_id_unique" ON "_events_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "parishes_mass_times_order_idx" ON "parishes_mass_times" USING btree ("_order");
  CREATE INDEX "parishes_mass_times_parent_id_idx" ON "parishes_mass_times" USING btree ("_parent_id");
  CREATE INDEX "parishes_gallery_order_idx" ON "parishes_gallery" USING btree ("_order");
  CREATE INDEX "parishes_gallery_parent_id_idx" ON "parishes_gallery" USING btree ("_parent_id");
  CREATE INDEX "parishes_gallery_image_idx" ON "parishes_gallery" USING btree ("image_id");
  CREATE UNIQUE INDEX "parishes_gallery_locales_locale_parent_id_unique" ON "parishes_gallery_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "parishes_slug_idx" ON "parishes" USING btree ("slug");
  CREATE INDEX "parishes_featured_image_idx" ON "parishes" USING btree ("featured_image_id");
  CREATE INDEX "parishes_pastor_idx" ON "parishes" USING btree ("pastor_id");
  CREATE INDEX "parishes_updated_at_idx" ON "parishes" USING btree ("updated_at");
  CREATE INDEX "parishes_created_at_idx" ON "parishes" USING btree ("created_at");
  CREATE UNIQUE INDEX "parishes_locales_locale_parent_id_unique" ON "parishes_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "ministries_gallery_order_idx" ON "ministries_gallery" USING btree ("_order");
  CREATE INDEX "ministries_gallery_parent_id_idx" ON "ministries_gallery" USING btree ("_parent_id");
  CREATE INDEX "ministries_gallery_image_idx" ON "ministries_gallery" USING btree ("image_id");
  CREATE UNIQUE INDEX "ministries_gallery_locales_locale_parent_id_unique" ON "ministries_gallery_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "ministries_slug_idx" ON "ministries" USING btree ("slug");
  CREATE INDEX "ministries_featured_image_idx" ON "ministries" USING btree ("featured_image_id");
  CREATE INDEX "ministries_parish_idx" ON "ministries" USING btree ("parish_id");
  CREATE INDEX "ministries_updated_at_idx" ON "ministries" USING btree ("updated_at");
  CREATE INDEX "ministries_created_at_idx" ON "ministries" USING btree ("created_at");
  CREATE UNIQUE INDEX "ministries_locales_locale_parent_id_unique" ON "ministries_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "priests_education_order_idx" ON "priests_education" USING btree ("_order");
  CREATE INDEX "priests_education_parent_id_idx" ON "priests_education" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "priests_slug_idx" ON "priests" USING btree ("slug");
  CREATE INDEX "priests_photo_idx" ON "priests" USING btree ("photo_id");
  CREATE INDEX "priests_updated_at_idx" ON "priests" USING btree ("updated_at");
  CREATE INDEX "priests_created_at_idx" ON "priests" USING btree ("created_at");
  CREATE UNIQUE INDEX "priests_locales_locale_parent_id_unique" ON "priests_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "priests_rels_order_idx" ON "priests_rels" USING btree ("order");
  CREATE INDEX "priests_rels_parent_idx" ON "priests_rels" USING btree ("parent_id");
  CREATE INDEX "priests_rels_path_idx" ON "priests_rels" USING btree ("path");
  CREATE INDEX "priests_rels_parishes_id_idx" ON "priests_rels" USING btree ("parishes_id");
  CREATE UNIQUE INDEX "pope_messages_slug_idx" ON "pope_messages" USING btree ("slug");
  CREATE INDEX "pope_messages_published_at_idx" ON "pope_messages" USING btree ("published_at");
  CREATE INDEX "pope_messages_featured_image_idx" ON "pope_messages" USING btree ("featured_image_id");
  CREATE INDEX "pope_messages_document_idx" ON "pope_messages" USING btree ("document_id");
  CREATE INDEX "pope_messages_updated_at_idx" ON "pope_messages" USING btree ("updated_at");
  CREATE INDEX "pope_messages_created_at_idx" ON "pope_messages" USING btree ("created_at");
  CREATE INDEX "pope_messages__status_idx" ON "pope_messages" USING btree ("_status");
  CREATE UNIQUE INDEX "pope_messages_locales_locale_parent_id_unique" ON "pope_messages_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pope_messages_v_parent_idx" ON "_pope_messages_v" USING btree ("parent_id");
  CREATE INDEX "_pope_messages_v_version_version_slug_idx" ON "_pope_messages_v" USING btree ("version_slug");
  CREATE INDEX "_pope_messages_v_version_version_published_at_idx" ON "_pope_messages_v" USING btree ("version_published_at");
  CREATE INDEX "_pope_messages_v_version_version_featured_image_idx" ON "_pope_messages_v" USING btree ("version_featured_image_id");
  CREATE INDEX "_pope_messages_v_version_version_document_idx" ON "_pope_messages_v" USING btree ("version_document_id");
  CREATE INDEX "_pope_messages_v_version_version_updated_at_idx" ON "_pope_messages_v" USING btree ("version_updated_at");
  CREATE INDEX "_pope_messages_v_version_version_created_at_idx" ON "_pope_messages_v" USING btree ("version_created_at");
  CREATE INDEX "_pope_messages_v_version_version__status_idx" ON "_pope_messages_v" USING btree ("version__status");
  CREATE INDEX "_pope_messages_v_created_at_idx" ON "_pope_messages_v" USING btree ("created_at");
  CREATE INDEX "_pope_messages_v_updated_at_idx" ON "_pope_messages_v" USING btree ("updated_at");
  CREATE INDEX "_pope_messages_v_snapshot_idx" ON "_pope_messages_v" USING btree ("snapshot");
  CREATE INDEX "_pope_messages_v_published_locale_idx" ON "_pope_messages_v" USING btree ("published_locale");
  CREATE INDEX "_pope_messages_v_latest_idx" ON "_pope_messages_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_pope_messages_v_locales_locale_parent_id_unique" ON "_pope_messages_v_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "bishop_messages_slug_idx" ON "bishop_messages" USING btree ("slug");
  CREATE INDEX "bishop_messages_published_at_idx" ON "bishop_messages" USING btree ("published_at");
  CREATE INDEX "bishop_messages_featured_image_idx" ON "bishop_messages" USING btree ("featured_image_id");
  CREATE INDEX "bishop_messages_document_idx" ON "bishop_messages" USING btree ("document_id");
  CREATE INDEX "bishop_messages_updated_at_idx" ON "bishop_messages" USING btree ("updated_at");
  CREATE INDEX "bishop_messages_created_at_idx" ON "bishop_messages" USING btree ("created_at");
  CREATE INDEX "bishop_messages__status_idx" ON "bishop_messages" USING btree ("_status");
  CREATE UNIQUE INDEX "bishop_messages_locales_locale_parent_id_unique" ON "bishop_messages_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_bishop_messages_v_parent_idx" ON "_bishop_messages_v" USING btree ("parent_id");
  CREATE INDEX "_bishop_messages_v_version_version_slug_idx" ON "_bishop_messages_v" USING btree ("version_slug");
  CREATE INDEX "_bishop_messages_v_version_version_published_at_idx" ON "_bishop_messages_v" USING btree ("version_published_at");
  CREATE INDEX "_bishop_messages_v_version_version_featured_image_idx" ON "_bishop_messages_v" USING btree ("version_featured_image_id");
  CREATE INDEX "_bishop_messages_v_version_version_document_idx" ON "_bishop_messages_v" USING btree ("version_document_id");
  CREATE INDEX "_bishop_messages_v_version_version_updated_at_idx" ON "_bishop_messages_v" USING btree ("version_updated_at");
  CREATE INDEX "_bishop_messages_v_version_version_created_at_idx" ON "_bishop_messages_v" USING btree ("version_created_at");
  CREATE INDEX "_bishop_messages_v_version_version__status_idx" ON "_bishop_messages_v" USING btree ("version__status");
  CREATE INDEX "_bishop_messages_v_created_at_idx" ON "_bishop_messages_v" USING btree ("created_at");
  CREATE INDEX "_bishop_messages_v_updated_at_idx" ON "_bishop_messages_v" USING btree ("updated_at");
  CREATE INDEX "_bishop_messages_v_snapshot_idx" ON "_bishop_messages_v" USING btree ("snapshot");
  CREATE INDEX "_bishop_messages_v_published_locale_idx" ON "_bishop_messages_v" USING btree ("published_locale");
  CREATE INDEX "_bishop_messages_v_latest_idx" ON "_bishop_messages_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_bishop_messages_v_locales_locale_parent_id_unique" ON "_bishop_messages_v_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "publications_slug_idx" ON "publications" USING btree ("slug");
  CREATE INDEX "publications_published_at_idx" ON "publications" USING btree ("published_at");
  CREATE INDEX "publications_cover_image_idx" ON "publications" USING btree ("cover_image_id");
  CREATE INDEX "publications_file_idx" ON "publications" USING btree ("file_id");
  CREATE INDEX "publications_updated_at_idx" ON "publications" USING btree ("updated_at");
  CREATE INDEX "publications_created_at_idx" ON "publications" USING btree ("created_at");
  CREATE UNIQUE INDEX "publications_locales_locale_parent_id_unique" ON "publications_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "magazines_featured_articles_order_idx" ON "magazines_featured_articles" USING btree ("_order");
  CREATE INDEX "magazines_featured_articles_parent_id_idx" ON "magazines_featured_articles" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "magazines_featured_articles_locales_locale_parent_id_unique" ON "magazines_featured_articles_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "magazines_slug_idx" ON "magazines" USING btree ("slug");
  CREATE INDEX "magazines_published_at_idx" ON "magazines" USING btree ("published_at");
  CREATE INDEX "magazines_cover_image_idx" ON "magazines" USING btree ("cover_image_id");
  CREATE INDEX "magazines_document_idx" ON "magazines" USING btree ("document_id");
  CREATE INDEX "magazines_updated_at_idx" ON "magazines" USING btree ("updated_at");
  CREATE INDEX "magazines_created_at_idx" ON "magazines" USING btree ("created_at");
  CREATE UNIQUE INDEX "magazines_locales_locale_parent_id_unique" ON "magazines_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "archives_files_order_idx" ON "archives_files" USING btree ("_order");
  CREATE INDEX "archives_files_parent_id_idx" ON "archives_files" USING btree ("_parent_id");
  CREATE INDEX "archives_files_file_idx" ON "archives_files" USING btree ("file_id");
  CREATE UNIQUE INDEX "archives_files_locales_locale_parent_id_unique" ON "archives_files_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "archives_tags_order_idx" ON "archives_tags" USING btree ("_order");
  CREATE INDEX "archives_tags_parent_id_idx" ON "archives_tags" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "archives_slug_idx" ON "archives" USING btree ("slug");
  CREATE INDEX "archives_year_idx" ON "archives" USING btree ("year");
  CREATE INDEX "archives_updated_at_idx" ON "archives" USING btree ("updated_at");
  CREATE INDEX "archives_created_at_idx" ON "archives" USING btree ("created_at");
  CREATE UNIQUE INDEX "archives_locales_locale_parent_id_unique" ON "archives_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "schools_gallery_order_idx" ON "schools_gallery" USING btree ("_order");
  CREATE INDEX "schools_gallery_parent_id_idx" ON "schools_gallery" USING btree ("_parent_id");
  CREATE INDEX "schools_gallery_image_idx" ON "schools_gallery" USING btree ("image_id");
  CREATE UNIQUE INDEX "schools_gallery_locales_locale_parent_id_unique" ON "schools_gallery_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "schools_slug_idx" ON "schools" USING btree ("slug");
  CREATE INDEX "schools_featured_image_idx" ON "schools" USING btree ("featured_image_id");
  CREATE INDEX "schools_parish_idx" ON "schools" USING btree ("parish_id");
  CREATE INDEX "schools_updated_at_idx" ON "schools" USING btree ("updated_at");
  CREATE INDEX "schools_created_at_idx" ON "schools" USING btree ("created_at");
  CREATE UNIQUE INDEX "schools_locales_locale_parent_id_unique" ON "schools_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "clinics_services_order_idx" ON "clinics_services" USING btree ("_order");
  CREATE INDEX "clinics_services_parent_id_idx" ON "clinics_services" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "clinics_services_locales_locale_parent_id_unique" ON "clinics_services_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "clinics_gallery_order_idx" ON "clinics_gallery" USING btree ("_order");
  CREATE INDEX "clinics_gallery_parent_id_idx" ON "clinics_gallery" USING btree ("_parent_id");
  CREATE INDEX "clinics_gallery_image_idx" ON "clinics_gallery" USING btree ("image_id");
  CREATE UNIQUE INDEX "clinics_gallery_locales_locale_parent_id_unique" ON "clinics_gallery_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "clinics_slug_idx" ON "clinics" USING btree ("slug");
  CREATE INDEX "clinics_featured_image_idx" ON "clinics" USING btree ("featured_image_id");
  CREATE INDEX "clinics_parish_idx" ON "clinics" USING btree ("parish_id");
  CREATE INDEX "clinics_updated_at_idx" ON "clinics" USING btree ("updated_at");
  CREATE INDEX "clinics_created_at_idx" ON "clinics" USING btree ("created_at");
  CREATE UNIQUE INDEX "clinics_locales_locale_parent_id_unique" ON "clinics_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "children_programs_gallery_order_idx" ON "children_programs_gallery" USING btree ("_order");
  CREATE INDEX "children_programs_gallery_parent_id_idx" ON "children_programs_gallery" USING btree ("_parent_id");
  CREATE INDEX "children_programs_gallery_image_idx" ON "children_programs_gallery" USING btree ("image_id");
  CREATE UNIQUE INDEX "children_programs_gallery_locales_locale_parent_id_unique" ON "children_programs_gallery_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "children_programs_slug_idx" ON "children_programs" USING btree ("slug");
  CREATE INDEX "children_programs_featured_image_idx" ON "children_programs" USING btree ("featured_image_id");
  CREATE INDEX "children_programs_parish_idx" ON "children_programs" USING btree ("parish_id");
  CREATE INDEX "children_programs_updated_at_idx" ON "children_programs" USING btree ("updated_at");
  CREATE INDEX "children_programs_created_at_idx" ON "children_programs" USING btree ("created_at");
  CREATE UNIQUE INDEX "children_programs_locales_locale_parent_id_unique" ON "children_programs_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "small_christian_communities_slug_idx" ON "small_christian_communities" USING btree ("slug");
  CREATE INDEX "small_christian_communities_parish_idx" ON "small_christian_communities" USING btree ("parish_id");
  CREATE INDEX "small_christian_communities_updated_at_idx" ON "small_christian_communities" USING btree ("updated_at");
  CREATE INDEX "small_christian_communities_created_at_idx" ON "small_christian_communities" USING btree ("created_at");
  CREATE UNIQUE INDEX "small_christian_communities_locales_locale_parent_id_unique" ON "small_christian_communities_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "geez_calendar_entries_slug_idx" ON "geez_calendar_entries" USING btree ("slug");
  CREATE INDEX "geez_calendar_entries_updated_at_idx" ON "geez_calendar_entries" USING btree ("updated_at");
  CREATE INDEX "geez_calendar_entries_created_at_idx" ON "geez_calendar_entries" USING btree ("created_at");
  CREATE UNIQUE INDEX "geez_calendar_entries_locales_locale_parent_id_unique" ON "geez_calendar_entries_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "geez_calendar_entries_rels_order_idx" ON "geez_calendar_entries_rels" USING btree ("order");
  CREATE INDEX "geez_calendar_entries_rels_parent_idx" ON "geez_calendar_entries_rels" USING btree ("parent_id");
  CREATE INDEX "geez_calendar_entries_rels_path_idx" ON "geez_calendar_entries_rels" USING btree ("path");
  CREATE INDEX "geez_calendar_entries_rels_events_id_idx" ON "geez_calendar_entries_rels" USING btree ("events_id");
  CREATE INDEX "contact_submissions_updated_at_idx" ON "contact_submissions" USING btree ("updated_at");
  CREATE INDEX "contact_submissions_created_at_idx" ON "contact_submissions" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("pages_id");
  CREATE INDEX "payload_locked_documents_rels_news_id_idx" ON "payload_locked_documents_rels" USING btree ("news_id");
  CREATE INDEX "payload_locked_documents_rels_events_id_idx" ON "payload_locked_documents_rels" USING btree ("events_id");
  CREATE INDEX "payload_locked_documents_rels_parishes_id_idx" ON "payload_locked_documents_rels" USING btree ("parishes_id");
  CREATE INDEX "payload_locked_documents_rels_ministries_id_idx" ON "payload_locked_documents_rels" USING btree ("ministries_id");
  CREATE INDEX "payload_locked_documents_rels_priests_id_idx" ON "payload_locked_documents_rels" USING btree ("priests_id");
  CREATE INDEX "payload_locked_documents_rels_pope_messages_id_idx" ON "payload_locked_documents_rels" USING btree ("pope_messages_id");
  CREATE INDEX "payload_locked_documents_rels_bishop_messages_id_idx" ON "payload_locked_documents_rels" USING btree ("bishop_messages_id");
  CREATE INDEX "payload_locked_documents_rels_publications_id_idx" ON "payload_locked_documents_rels" USING btree ("publications_id");
  CREATE INDEX "payload_locked_documents_rels_magazines_id_idx" ON "payload_locked_documents_rels" USING btree ("magazines_id");
  CREATE INDEX "payload_locked_documents_rels_archives_id_idx" ON "payload_locked_documents_rels" USING btree ("archives_id");
  CREATE INDEX "payload_locked_documents_rels_schools_id_idx" ON "payload_locked_documents_rels" USING btree ("schools_id");
  CREATE INDEX "payload_locked_documents_rels_clinics_id_idx" ON "payload_locked_documents_rels" USING btree ("clinics_id");
  CREATE INDEX "payload_locked_documents_rels_children_programs_id_idx" ON "payload_locked_documents_rels" USING btree ("children_programs_id");
  CREATE INDEX "payload_locked_documents_rels_small_christian_communitie_idx" ON "payload_locked_documents_rels" USING btree ("small_christian_communities_id");
  CREATE INDEX "payload_locked_documents_rels_geez_calendar_entries_id_idx" ON "payload_locked_documents_rels" USING btree ("geez_calendar_entries_id");
  CREATE INDEX "payload_locked_documents_rels_contact_submissions_id_idx" ON "payload_locked_documents_rels" USING btree ("contact_submissions_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "site_settings_logo_idx" ON "site_settings" USING btree ("logo_id");
  CREATE INDEX "site_settings_logo_dark_idx" ON "site_settings" USING btree ("logo_dark_id");
  CREATE INDEX "site_settings_favicon_idx" ON "site_settings" USING btree ("favicon_id");
  CREATE INDEX "site_settings_default_og_image_idx" ON "site_settings" USING btree ("default_og_image_id");
  CREATE UNIQUE INDEX "site_settings_locales_locale_parent_id_unique" ON "site_settings_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "header_utility_links_order_idx" ON "header_utility_links" USING btree ("_order");
  CREATE INDEX "header_utility_links_parent_id_idx" ON "header_utility_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "header_utility_links_locales_locale_parent_id_unique" ON "header_utility_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "header_logo_idx" ON "header" USING btree ("logo_id");
  CREATE UNIQUE INDEX "header_locales_locale_parent_id_unique" ON "header_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "footer_columns_links_order_idx" ON "footer_columns_links" USING btree ("_order");
  CREATE INDEX "footer_columns_links_parent_id_idx" ON "footer_columns_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "footer_columns_links_locales_locale_parent_id_unique" ON "footer_columns_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "footer_columns_order_idx" ON "footer_columns" USING btree ("_order");
  CREATE INDEX "footer_columns_parent_id_idx" ON "footer_columns" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "footer_columns_locales_locale_parent_id_unique" ON "footer_columns_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "footer_bottom_links_order_idx" ON "footer_bottom_links" USING btree ("_order");
  CREATE INDEX "footer_bottom_links_parent_id_idx" ON "footer_bottom_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "footer_bottom_links_locales_locale_parent_id_unique" ON "footer_bottom_links_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "footer_locales_locale_parent_id_unique" ON "footer_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_quick_links_links_order_idx" ON "homepage_quick_links_links" USING btree ("_order");
  CREATE INDEX "homepage_quick_links_links_parent_id_idx" ON "homepage_quick_links_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "homepage_quick_links_links_locales_locale_parent_id_unique" ON "homepage_quick_links_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_hero_hero_background_image_idx" ON "homepage" USING btree ("hero_background_image_id");
  CREATE INDEX "homepage_bishop_message_bishop_message_featured_message_idx" ON "homepage" USING btree ("bishop_message_featured_message_id");
  CREATE UNIQUE INDEX "homepage_locales_locale_parent_id_unique" ON "homepage_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_rels_order_idx" ON "homepage_rels" USING btree ("order");
  CREATE INDEX "homepage_rels_parent_idx" ON "homepage_rels" USING btree ("parent_id");
  CREATE INDEX "homepage_rels_path_idx" ON "homepage_rels" USING btree ("path");
  CREATE INDEX "homepage_rels_news_id_idx" ON "homepage_rels" USING btree ("news_id");
  CREATE INDEX "navigation_main_nav_children_order_idx" ON "navigation_main_nav_children" USING btree ("_order");
  CREATE INDEX "navigation_main_nav_children_parent_id_idx" ON "navigation_main_nav_children" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "navigation_main_nav_children_locales_locale_parent_id_unique" ON "navigation_main_nav_children_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "navigation_main_nav_order_idx" ON "navigation_main_nav" USING btree ("_order");
  CREATE INDEX "navigation_main_nav_parent_id_idx" ON "navigation_main_nav" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "navigation_main_nav_locales_locale_parent_id_unique" ON "navigation_main_nav_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "navigation_mobile_extra_order_idx" ON "navigation_mobile_extra" USING btree ("_order");
  CREATE INDEX "navigation_mobile_extra_parent_id_idx" ON "navigation_mobile_extra" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "navigation_mobile_extra_locales_locale_parent_id_unique" ON "navigation_mobile_extra_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "media_locales" CASCADE;
  DROP TABLE "pages" CASCADE;
  DROP TABLE "pages_locales" CASCADE;
  DROP TABLE "_pages_v" CASCADE;
  DROP TABLE "_pages_v_locales" CASCADE;
  DROP TABLE "news_tags" CASCADE;
  DROP TABLE "news" CASCADE;
  DROP TABLE "news_locales" CASCADE;
  DROP TABLE "news_rels" CASCADE;
  DROP TABLE "_news_v_version_tags" CASCADE;
  DROP TABLE "_news_v" CASCADE;
  DROP TABLE "_news_v_locales" CASCADE;
  DROP TABLE "_news_v_rels" CASCADE;
  DROP TABLE "events" CASCADE;
  DROP TABLE "events_locales" CASCADE;
  DROP TABLE "_events_v" CASCADE;
  DROP TABLE "_events_v_locales" CASCADE;
  DROP TABLE "parishes_mass_times" CASCADE;
  DROP TABLE "parishes_gallery" CASCADE;
  DROP TABLE "parishes_gallery_locales" CASCADE;
  DROP TABLE "parishes" CASCADE;
  DROP TABLE "parishes_locales" CASCADE;
  DROP TABLE "ministries_gallery" CASCADE;
  DROP TABLE "ministries_gallery_locales" CASCADE;
  DROP TABLE "ministries" CASCADE;
  DROP TABLE "ministries_locales" CASCADE;
  DROP TABLE "priests_education" CASCADE;
  DROP TABLE "priests" CASCADE;
  DROP TABLE "priests_locales" CASCADE;
  DROP TABLE "priests_rels" CASCADE;
  DROP TABLE "pope_messages" CASCADE;
  DROP TABLE "pope_messages_locales" CASCADE;
  DROP TABLE "_pope_messages_v" CASCADE;
  DROP TABLE "_pope_messages_v_locales" CASCADE;
  DROP TABLE "bishop_messages" CASCADE;
  DROP TABLE "bishop_messages_locales" CASCADE;
  DROP TABLE "_bishop_messages_v" CASCADE;
  DROP TABLE "_bishop_messages_v_locales" CASCADE;
  DROP TABLE "publications" CASCADE;
  DROP TABLE "publications_locales" CASCADE;
  DROP TABLE "magazines_featured_articles" CASCADE;
  DROP TABLE "magazines_featured_articles_locales" CASCADE;
  DROP TABLE "magazines" CASCADE;
  DROP TABLE "magazines_locales" CASCADE;
  DROP TABLE "archives_files" CASCADE;
  DROP TABLE "archives_files_locales" CASCADE;
  DROP TABLE "archives_tags" CASCADE;
  DROP TABLE "archives" CASCADE;
  DROP TABLE "archives_locales" CASCADE;
  DROP TABLE "schools_gallery" CASCADE;
  DROP TABLE "schools_gallery_locales" CASCADE;
  DROP TABLE "schools" CASCADE;
  DROP TABLE "schools_locales" CASCADE;
  DROP TABLE "clinics_services" CASCADE;
  DROP TABLE "clinics_services_locales" CASCADE;
  DROP TABLE "clinics_gallery" CASCADE;
  DROP TABLE "clinics_gallery_locales" CASCADE;
  DROP TABLE "clinics" CASCADE;
  DROP TABLE "clinics_locales" CASCADE;
  DROP TABLE "children_programs_gallery" CASCADE;
  DROP TABLE "children_programs_gallery_locales" CASCADE;
  DROP TABLE "children_programs" CASCADE;
  DROP TABLE "children_programs_locales" CASCADE;
  DROP TABLE "small_christian_communities" CASCADE;
  DROP TABLE "small_christian_communities_locales" CASCADE;
  DROP TABLE "geez_calendar_entries" CASCADE;
  DROP TABLE "geez_calendar_entries_locales" CASCADE;
  DROP TABLE "geez_calendar_entries_rels" CASCADE;
  DROP TABLE "contact_submissions" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "site_settings" CASCADE;
  DROP TABLE "site_settings_locales" CASCADE;
  DROP TABLE "header_utility_links" CASCADE;
  DROP TABLE "header_utility_links_locales" CASCADE;
  DROP TABLE "header" CASCADE;
  DROP TABLE "header_locales" CASCADE;
  DROP TABLE "footer_columns_links" CASCADE;
  DROP TABLE "footer_columns_links_locales" CASCADE;
  DROP TABLE "footer_columns" CASCADE;
  DROP TABLE "footer_columns_locales" CASCADE;
  DROP TABLE "footer_bottom_links" CASCADE;
  DROP TABLE "footer_bottom_links_locales" CASCADE;
  DROP TABLE "footer" CASCADE;
  DROP TABLE "footer_locales" CASCADE;
  DROP TABLE "homepage_quick_links_links" CASCADE;
  DROP TABLE "homepage_quick_links_links_locales" CASCADE;
  DROP TABLE "homepage" CASCADE;
  DROP TABLE "homepage_locales" CASCADE;
  DROP TABLE "homepage_rels" CASCADE;
  DROP TABLE "navigation_main_nav_children" CASCADE;
  DROP TABLE "navigation_main_nav_children_locales" CASCADE;
  DROP TABLE "navigation_main_nav" CASCADE;
  DROP TABLE "navigation_main_nav_locales" CASCADE;
  DROP TABLE "navigation_mobile_extra" CASCADE;
  DROP TABLE "navigation_mobile_extra_locales" CASCADE;
  DROP TABLE "navigation" CASCADE;
  DROP TYPE "public"."_locales";
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_media_category";
  DROP TYPE "public"."enum_pages_status";
  DROP TYPE "public"."enum__pages_v_version_status";
  DROP TYPE "public"."enum__pages_v_published_locale";
  DROP TYPE "public"."enum_news_status";
  DROP TYPE "public"."enum_news_category";
  DROP TYPE "public"."enum__news_v_version_status";
  DROP TYPE "public"."enum__news_v_version_category";
  DROP TYPE "public"."enum__news_v_published_locale";
  DROP TYPE "public"."enum_events_status";
  DROP TYPE "public"."enum_events_event_type";
  DROP TYPE "public"."enum__events_v_version_status";
  DROP TYPE "public"."enum__events_v_version_event_type";
  DROP TYPE "public"."enum__events_v_published_locale";
  DROP TYPE "public"."enum_parishes_mass_times_day";
  DROP TYPE "public"."enum_parishes_mass_times_language";
  DROP TYPE "public"."enum_parishes_vicariate";
  DROP TYPE "public"."enum_ministries_status";
  DROP TYPE "public"."enum_ministries_type";
  DROP TYPE "public"."enum_priests_title";
  DROP TYPE "public"."enum_priests_status";
  DROP TYPE "public"."enum_pope_messages_status";
  DROP TYPE "public"."enum_pope_messages_document_type";
  DROP TYPE "public"."enum__pope_messages_v_version_status";
  DROP TYPE "public"."enum__pope_messages_v_version_document_type";
  DROP TYPE "public"."enum__pope_messages_v_published_locale";
  DROP TYPE "public"."enum_bishop_messages_status";
  DROP TYPE "public"."enum_bishop_messages_message_type";
  DROP TYPE "public"."enum__bishop_messages_v_version_status";
  DROP TYPE "public"."enum__bishop_messages_v_version_message_type";
  DROP TYPE "public"."enum__bishop_messages_v_published_locale";
  DROP TYPE "public"."enum_publications_category";
  DROP TYPE "public"."enum_publications_language";
  DROP TYPE "public"."enum_archives_files_language";
  DROP TYPE "public"."enum_archives_category";
  DROP TYPE "public"."enum_archives_access_level";
  DROP TYPE "public"."enum_schools_status";
  DROP TYPE "public"."enum_schools_level";
  DROP TYPE "public"."enum_clinics_status";
  DROP TYPE "public"."enum_clinics_facility_type";
  DROP TYPE "public"."enum_children_programs_status";
  DROP TYPE "public"."enum_small_christian_communities_status";
  DROP TYPE "public"."enum_small_christian_communities_meeting_day";
  DROP TYPE "public"."enum_geez_calendar_entries_feast_rank";
  DROP TYPE "public"."enum_geez_calendar_entries_liturgical_color";
  DROP TYPE "public"."enum_geez_calendar_entries_geez_date_month";
  DROP TYPE "public"."enum_contact_submissions_status";
  DROP TYPE "public"."enum_header_announcement_banner_style";`)
}
