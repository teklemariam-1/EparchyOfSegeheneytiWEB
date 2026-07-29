# Known issues

Things that are wrong, understood, and not yet fixed. Each entry says what was
already ruled out, so nobody repeats the diagnosis.

---

## Soft 404: `notFound()` answers with HTTP 200

**Found:** 2026-07-28 · **Next.js 15.2.9** · affects the whole app, not one page.

A request for a page that exists as a *route* but has no *record* renders the
not-found UI with status **200** instead of 404:

| Request | Status | Correct? |
|---|---|---|
| `/news/no-such-article` | 200 | ✗ |
| `/parishes/no-such-parish` | 200 | ✗ |
| `/eparchs` (fewer than 2 Eparchs, deliberate `notFound()`) | 200 | ✗ |
| `/totally-missing-page` (no route at all) | 404 | ✓ |

**Why it matters:** search engines treat a 200 as a real page, so these get
indexed as thin duplicates of the not-found screen. It also means uptime and
smoke checks cannot distinguish "missing" from "fine".

### Ruled out

- **Calling `notFound()` earlier, in `generateMetadata`.** `generateMetadata`
  runs before the response is flushed, so this was the obvious candidate. Tried
  on `/news/[slug]`, rebuilt, retested: still 200. The call is still there — it
  stops the page advertising metadata for an article that does not exist — but
  it does not change the status.
- **A missing not-found boundary.** `src/app/(frontend)/not-found.tsx` exists and
  renders correctly; only the status is wrong.
- **Routing.** Genuinely unmatched routes still 404 properly, so Next's own
  not-found path works. It is specifically `notFound()` raised from inside a
  rendered page.

### Not yet tried

All 23 pages that call `notFound()` also set `export const dynamic =
'force-dynamic'`, so the two could not be separated without changing rendering
behaviour. The remaining suspicion is that the dynamic render has already
committed the response by the time `notFound()` is raised. Worth testing against
a newer Next.js before building a workaround.

**Confirmed on Vercel, 2026-07-29** — this is not a local-runtime artefact:

```
curl -o /dev/null -w '%{http_code}' \
  https://eparchy-of-segeheneyti-web.vercel.app/news/no-such-article
200
```

So production is serving missing articles as 200 with the not-found UI, and
search engines will index them. That closes the one open question in this entry;
trying a newer Next.js is the next step.

A middleware that checks existence and rewrites would work, but it duplicates
every lookup and should be a last resort.

---

## ~~A fabricated sample Eparch was written to the production database~~ — RESOLVED

**Found:** 2026-07-28 · **Confirmed live:** 2026-07-28 · **Resolved:** 2026-07-29

It was real, and it was public. Production served this in the JSON-LD on
`/bishop`, which is the structured data search engines read:

```
"@type":"Person","name":"Abune Mekonnen Tesfay"
```

It has since been deleted and replaced with the actual sitting Eparch. The
`bishops` table now holds one record — `abune-fqremariam-hagos`, active and
published — and the live page reads `"name":"Abune Fkremariam Hagos"`.

The account below is kept because the mechanism that allowed it is only partly
closed; see "Still not fixed".

(The original note said this could not be verified because the environment had
no outbound network. That was wrong — both the live site and the Neon database
were reachable, which is how the record was confirmed and later verified gone.)

While producing the screenshots for the bishops module, a sample record was
seeded through `--env-file=.env.local`. That file's `DATABASE_URI` points at the
**production** Neon host (see [local-development.md](local-development.md)), so
the record was almost certainly created on the live database rather than a local
one:

| Field | Value |
|---|---|
| `slug` | `abune-mekonnen-tesfay` |
| `fullName` | Abune Mekonnen Tesfay *(invented)* |
| `isActive` | `true` — marks him the **sitting Eparch** |
| `_status` | `published` |

Everything in it is invented: the biography, eleven milestones, an honorary
doctorate, a gallery. It also carries a milestone titled `WITHHELD EXAMPLE`
(deliberately `isPublic: false`, used to prove the withholding path).

**Why it matters:** `isActive` is what every public surface reads. If this record
is live, `/bishop`, the homepage block, the About page and the JSON-LD `Person`
schema are all naming a bishop who does not exist, on the website of a real
eparchy.

### What to do

Delete it through the admin UI — **Magisterium → Bishops → Abune Mekonnen
Tesfay → Delete**. A deliberate human deletion is right here; it is one record on
a live database.

`npx tsx scripts/unseed.ts` already lists this slug, but it calls
`assertLocalDatabase` and will refuse to run against Neon. That refusal is
correct and should not be worked around.

### Already fixed, so it cannot recur

- `scripts/assertLocalDatabase.ts` now guards `seed` and `unseed`, and
  `payload.config.ts` refuses dev schema-push against a non-local host
  (`798a799`).
- The unguarded throwaway script that did this (`scripts/tmp-seed-bishop.ts`) has
  been deleted.

### Still not fixed

`.env.local` continues to point at the production host. Until it is repointed at
`localhost`, `npm run dev` still reads and writes production data — the guard
stops schema-push and seeding, not ordinary editing through the running app.
