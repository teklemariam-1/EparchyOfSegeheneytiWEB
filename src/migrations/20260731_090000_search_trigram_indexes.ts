import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Make search indexable.
 *
 * Payload compiles a `like` filter to `column ILIKE '%term%'`. A leading
 * wildcard means a B-tree index cannot be used at all, so every search was a
 * sequential scan of every searched column of every collection — survivable
 * while the tables were small, and the reason a typeahead was not viable: the
 * cost would have been paid per keystroke.
 *
 * `pg_trgm` fixes that for LATIN text: it indexes overlapping three-character
 * sequences, which lets Postgres satisfy an unanchored substring match from an
 * index. Measured on a 50,000-row table, an English search went from a 15-18ms
 * sequential scan to a 3ms bitmap index scan.
 *
 * It does NOT help Tigrinya, and that is not a mistake in this migration.
 * This Postgres classifies no Ethiopic character as alphanumeric —
 * `show_trgm('ሰገነይቲ')` returns the empty set — so there are no trigrams to
 * index. Verified across the builtin and ICU locale providers, and Arabic
 * behaves identically, so it affects every non-Latin script rather than Ge'ez
 * alone. Ge'ez search therefore remains a sequential scan; at present volumes
 * that costs well under a millisecond. See docs/search.md for the measurements
 * and the point at which this needs revisiting.
 *
 * The indexes are still worth creating: English is a large share of both the
 * content and the queries, and the gap widens as the tables grow.
 *
 * Indexes are created NOT concurrently: Payload runs migrations inside a
 * transaction, and CONCURRENTLY is illegal there. At this table size the write
 * lock is brief.
 *
 * Every statement is idempotent. This database has been schema-pushed in the
 * past, so "already exists" is a real possibility rather than a theoretical one.
 */

/** Every column the search registry actually reads. Keep the two in step. */
const SEARCHED_COLUMNS: [table: string, column: string][] = [
  ['news_locales', 'title'],
  ['news_locales', 'excerpt'],
  ['events_locales', 'title'],
  ['events_locales', 'excerpt'],
  ['bishop_messages_locales', 'title'],
  ['bishop_messages_locales', 'excerpt'],
  ['pope_messages_locales', 'title'],
  ['pope_messages_locales', 'excerpt'],
  ['parishes_locales', 'name'],
  ['parishes', 'region'],
  ['ministries_locales', 'name'],
  ['publications_locales', 'title'],
  ['publications_locales', 'description'],
  ['priests', 'full_name'],
  ['priests_locales', 'assignment'],
  ['offices_locales', 'name'],
  ['offices_locales', 'tagline'],
  ['vicariates_locales', 'name'],
  ['vicariates_locales', 'description'],
]

const indexName = (table: string, column: string) => `${table}_${column}_trgm_idx`

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pg_trgm;`)

  for (const [table, column] of SEARCHED_COLUMNS) {
    // Two guards, both learned the hard way. A column named here may not exist
    // in every environment; and it may exist as JSONB, because rich-text fields
    // are stored as Lexical documents — `gin_trgm_ops` rejects those outright,
    // which aborts the entire migration and therefore the entire deploy.
    // Skipping such a column beats failing the release for one index.
    await db.execute(
      sql.raw(`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = '${table}' AND column_name = '${column}'
              AND data_type IN ('character varying', 'text')
          ) THEN
            EXECUTE 'CREATE INDEX IF NOT EXISTS "${indexName(table, column)}" ON "${table}" USING gin ("${column}" gin_trgm_ops)';
          END IF;
        END $$;
      `),
    )
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const [table, column] of SEARCHED_COLUMNS) {
    await db.execute(sql.raw(`DROP INDEX IF EXISTS "${indexName(table, column)}";`))
  }
  // The extension is deliberately left in place: other things may come to rely
  // on it, and dropping it would cascade away any index that did.
}
