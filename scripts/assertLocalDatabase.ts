/**
 * Refuses to run a destructive script against a database that is not local.
 *
 * The schema-push guard in payload.config stops dev-mode SCHEMA writes reaching
 * production. It does nothing about DATA: `scripts/seed.ts` writes documents and
 * `scripts/unseed.ts` deletes them, and either one pointed at production would
 * be a bad afternoon. This working tree contains .env.vercel.local with live
 * Neon credentials, so that is one stray `set -a; . .env.vercel.local` away.
 *
 * Same strict allow-list as payload.config: anything unset, unparseable or
 * remote is refused, so the failure mode is "the script stops" rather than "the
 * script runs somewhere unexpected".
 */

const LOCAL_HOSTS = ['localhost', '127.0.0.1', '::1', '[::1]', 'host.docker.internal']

export function isLocalDatabase(connectionString: string | undefined): boolean {
  if (!connectionString) return false
  try {
    return LOCAL_HOSTS.includes(new URL(connectionString).hostname.toLowerCase())
  } catch {
    return false
  }
}

/**
 * Call at the top of any script that writes or deletes data.
 *
 * `ALLOW_REMOTE_DB=1` is the deliberate escape hatch — seeding a fresh staging
 * database is legitimate. It has to be typed on the command line, which is the
 * point: it cannot happen by loading the wrong env file.
 */
export function assertLocalDatabase(scriptName: string): void {
  const uri = process.env.DATABASE_URI
  if (isLocalDatabase(uri)) return

  if (process.env.ALLOW_REMOTE_DB === '1') {
    console.warn(
      `[${scriptName}] ⚠ Running against a REMOTE database because ALLOW_REMOTE_DB=1 was set.`,
    )
    return
  }

  let host = 'unset or unparseable'
  try {
    if (uri) host = new URL(uri).hostname
  } catch {
    // keep the placeholder
  }

  console.error(
    `\n[${scriptName}] REFUSING TO RUN.\n\n` +
      `  DATABASE_URI points at: ${host}\n` +
      `  This script writes or deletes data, and that is not a local database.\n\n` +
      `  If this is genuinely intended (seeding a fresh staging database, say),\n` +
      `  re-run it with ALLOW_REMOTE_DB=1.\n`,
  )
  process.exit(1)
}
