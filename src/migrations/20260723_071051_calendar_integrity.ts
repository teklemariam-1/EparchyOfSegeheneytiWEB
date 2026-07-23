import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Calendar integrity fixes:
 *
 * 1. Unifies the month slugs of geez-calendar-entries with the canonical
 *    GEEZ_MONTHS constants used everywhere else (tikmt → tikimit,
 *    miyazya → miyazia, pagume → paguemen), so the two calendar collections
 *    can be joined and share labels.
 * 2. Deletes the phantom "ጳጉሜን 6" day (2026-09-11). 2018 E.C. is not an
 *    Ethiopic leap year (leap ⇔ year % 4 === 3), so Paguemen has 5 days,
 *    Sep 6–10 2026; the printed book carries six Paguemen texts because the
 *    6th day exists in leap years, and its own Gregorian column ends Sep 10.
 *    Sep 11 2026 is Meskerem 1, 2019 E.C.
 * 3. Adds uniqueness guarantees ahead of multi-year imports: one row per
 *    Ge'ez date and one row per Gregorian calendar day.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "geez_calendar_entries" ALTER COLUMN "geez_date_month" SET DATA TYPE text;
  UPDATE "geez_calendar_entries" SET "geez_date_month" = CASE "geez_date_month"
    WHEN 'tikmt' THEN 'tikimit'
    WHEN 'miyazya' THEN 'miyazia'
    WHEN 'pagume' THEN 'paguemen'
    ELSE "geez_date_month" END;
  DROP TYPE "public"."enum_geez_calendar_entries_geez_date_month";
  CREATE TYPE "public"."enum_geez_calendar_entries_geez_date_month" AS ENUM('meskerem', 'tikimit', 'hidar', 'tahsas', 'tir', 'yekatit', 'megabit', 'miyazia', 'ginbot', 'sene', 'hamle', 'nehase', 'paguemen');
  ALTER TABLE "geez_calendar_entries" ALTER COLUMN "geez_date_month" SET DATA TYPE "public"."enum_geez_calendar_entries_geez_date_month" USING "geez_date_month"::"public"."enum_geez_calendar_entries_geez_date_month";
  DELETE FROM "geez_calendar_days" WHERE "geez_year" = 2018 AND "month" = 'paguemen' AND "day" = 6;
  CREATE UNIQUE INDEX "geezYear_month_day_idx" ON "geez_calendar_days" USING btree ("geez_year","month","day");
  CREATE UNIQUE INDEX "geez_calendar_days_gregorian_day_idx" ON "geez_calendar_days" USING btree (((timezone('UTC', "gregorian_date"))::date));`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "geez_calendar_entries" ALTER COLUMN "geez_date_month" SET DATA TYPE text;
  UPDATE "geez_calendar_entries" SET "geez_date_month" = CASE "geez_date_month"
    WHEN 'tikimit' THEN 'tikmt'
    WHEN 'miyazia' THEN 'miyazya'
    WHEN 'paguemen' THEN 'pagume'
    ELSE "geez_date_month" END;
  DROP TYPE "public"."enum_geez_calendar_entries_geez_date_month";
  CREATE TYPE "public"."enum_geez_calendar_entries_geez_date_month" AS ENUM('meskerem', 'tikmt', 'hidar', 'tahsas', 'tir', 'yekatit', 'megabit', 'miyazya', 'ginbot', 'sene', 'hamle', 'nehase', 'pagume');
  ALTER TABLE "geez_calendar_entries" ALTER COLUMN "geez_date_month" SET DATA TYPE "public"."enum_geez_calendar_entries_geez_date_month" USING "geez_date_month"::"public"."enum_geez_calendar_entries_geez_date_month";
  DROP INDEX "geez_calendar_days_gregorian_day_idx";
  DROP INDEX "geezYear_month_day_idx";
  INSERT INTO "geez_calendar_days" ("geez_label", "month", "day", "geez_year", "gregorian_date", "readings", "antiphon", "deceased_clergy", "events")
  VALUES ('ጳጉሜን 6', 'paguemen', 6, 2018, '2026-09-11', '2ቆሮ 5፡17-ፍ፣ 2ጴጥ3፡8-ፍ ግሓ 17፡30-ፍ  ሉቃ 13፡1-10', 'ወተዚያነዉ እምዕለት ዕለተ ኣድኅኖቶ፣ ወንግርዎሙ ለአሕዛብ ስብሐቲሁ፣ ወለኲሎሙ ኣሕዛብ ተአምሪሁ።', NULL, NULL);`)
}
