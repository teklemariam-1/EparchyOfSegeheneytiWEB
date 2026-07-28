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
a newer Next.js before building a workaround — and worth checking whether this
reproduces on Vercel, since local `npm start` and Vercel's runtime differ.

A middleware that checks existence and rewrites would work, but it duplicates
every lookup and should be a last resort.
