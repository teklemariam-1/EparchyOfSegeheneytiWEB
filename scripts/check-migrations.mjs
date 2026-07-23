/**
 * Post-migrate verifier for CI.
 *
 * `payload migrate` once exited 0 without applying a pending migration,
 * deploying the app against a schema it did not have. This asserts the truth
 * deterministically instead of parsing migrate:status output: it compares the
 * migration files in src/migrations against the names recorded in the
 * payload_migrations table, and exits non-zero if any are missing.
 *
 * Pure Node (no TS loader needed): migration names are the .ts filenames
 * without extension, which is exactly what Payload records in `name`.
 *
 * Usage: node scripts/check-migrations.mjs   (needs DATABASE_URI)
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Client } from 'pg'

const url = process.env.DATABASE_URI
if (!url) {
  console.error('check-migrations: DATABASE_URI is not set')
  process.exit(2)
}

// Host only — never print credentials.
try {
  console.log(`check-migrations: target host ${new URL(url).host}`)
} catch {
  console.log('check-migrations: DATABASE_URI unparseable as URL')
}

const migrationsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/migrations')
const expected = fs
  .readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.ts') && f !== 'index.ts')
  .map((f) => f.replace(/\.ts$/, ''))

const client = new Client({
  connectionString: url,
  ssl: url.includes('sslmode=require') || url.includes('neon.tech') ? { rejectUnauthorized: false } : undefined,
  connectionTimeoutMillis: 20_000,
  query_timeout: 20_000,
})

try {
  await client.connect()
  const { rows } = await client.query('SELECT name FROM payload_migrations')
  const applied = new Set(rows.map((r) => r.name))
  const pending = expected.filter((name) => !applied.has(name))

  console.log(`check-migrations: ${expected.length} migration files, ${applied.size} applied`)
  if (pending.length > 0) {
    console.error('check-migrations: PENDING migrations not applied:')
    for (const name of pending) console.error(`  • ${name}`)
    process.exitCode = 1
  } else {
    console.log('check-migrations: all migrations applied ✓')
  }
} catch (err) {
  console.error('check-migrations: verification query failed:', err.message)
  process.exitCode = 1
} finally {
  await client.end().catch(() => {})
}
