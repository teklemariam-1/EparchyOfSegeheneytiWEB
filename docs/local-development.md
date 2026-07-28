# Local development

## Your database must be local. It currently is not.

On 2026-07-28 we found that `.env.local`'s `DATABASE_URI` pointed at the
**production Neon host** — the same database the live site uses:

```
ep-empty-hill-anfy1wmi.c-6.us-east-1.aws.neon.tech
```

So `npm run dev` was running against production. That is how the bishops schema
reached the live database with no migration record: Drizzle's dev schema-push
created 17 enum types and 56 tables there, and the next real deploy then failed
on `already exists`. It is also how a test that pinned a news article to the
magazine hero slot ended up doing so on the live site.

`.env.example` has always specified a local URL. The working file drifted.

## Fix it once

A PostgreSQL 18 server is already running on `localhost:5432`. You need its
`postgres` password — the one set during installation.

```bash
# 1. Create the database
createdb -h localhost -U postgres eparchy_dev
# (or:  psql -h localhost -U postgres -c "CREATE DATABASE eparchy_dev;")

# 2. Point .env.local at it — replace PASSWORD with the local one
DATABASE_URI=postgresql://postgres:PASSWORD@localhost:5432/eparchy_dev

# 3. Build the schema from the migrations
npm run migrate

# 4. Optional: fill it with sample content
npx tsx scripts/seed.ts
```

`PAYLOAD_SECRET` in `.env.local` can stay as it is. Note that it also derives
the encryption key for stored secrets, so a local database seeded under a
different secret will not decrypt values copied from production — which is a
feature, not a problem.

## How you will know it worked

Start the app. **No warning** should appear. If you see this, `DATABASE_URI` is
still remote:

```
[payload-db] ⚠ Schema push is DISABLED: DATABASE_URI is not a local database.
```

And the destructive scripts should run rather than refuse:

```
[unseed] REFUSING TO RUN.
  DATABASE_URI points at: ep-empty-hill-anfy1wmi.c-6.us-east-1.aws.neon.tech
```

## The guards, and why they behave this way

Two independent checks, both using the same strict allow-list of loopback hosts
(`localhost`, `127.0.0.1`, `::1`, `host.docker.internal`). Anything unset,
unparseable, or remote is treated as remote — the failure mode is "refuse",
never "proceed against an unexpected host".

| Guard | Where | Stops |
|---|---|---|
| Schema push | `payload.config.ts` | Dev-mode schema writes reaching a remote database |
| Destructive scripts | `scripts/assertLocalDatabase.ts` | `seed.ts` / `unseed.ts` writing or deleting remote data |

They cover different things. The push guard stops **schema** changes; the script
guard stops **data** changes. Neither stops ordinary application reads and
writes — if `DATABASE_URI` is remote, the admin panel still edits live content.
Only a genuinely local `DATABASE_URI` makes that safe.

### The escape hatch

Seeding a fresh staging database is legitimate:

```bash
ALLOW_REMOTE_DB=1 npx tsx scripts/seed.ts
```

It has to be typed on the command line. That is the point — it cannot happen by
loading the wrong env file.

## About `.env.vercel.local`

`vercel env pull` writes it, and it holds live Neon credentials. It is
gitignored, so nothing leaks into history, but anything that loads it is talking
to production. The guards above now cover schema and seed scripts; they do not
cover a script you write yourself. If you do not need it day to day, keep it
outside the repository.

## Working against production deliberately

Sometimes you genuinely need to, to read live data. Do it explicitly, per
command, rather than by changing `.env.local`:

```bash
DATABASE_URI="$(grep -m1 '^POSTGRES_URL_NON_POOLING=' .env.vercel.local | cut -d= -f2-)" \
  npx tsx scripts/some-read-only-script.ts
```

That way the default stays safe and the exception is visible in your shell
history.
