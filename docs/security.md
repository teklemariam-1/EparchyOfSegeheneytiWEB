# Security operations

How this site is protected, what each control actually stops, and what to do
when it is under attack. Written for whoever is on call — including someone who
did not build it.

The honest summary: everything here raises the cost of automated abuse. None of
it stops a determined human. Aim for "not worth the effort", not "impossible".

---

## 1. What runs where

| Control | Lives in | Stops | Only detects |
|---|---|---|---|
| Bot signature filter | `src/lib/security/bots.ts` | Declared crawlers polluting analytics | Bots that lie about their user-agent |
| Rate limiter | `src/lib/security/rateLimit.ts` + `rate_limits` table | Floods from one client | Distributed floods from many IPs |
| Auth guard | `src/lib/security/authGuard.ts` | Password spraying, login timing oracle | — |
| Form guard | `src/lib/security/formGuard.ts` | Instant submits, form floods | A patient bot that waits 2 seconds |
| Turnstile | `src/lib/security/turnstile.ts`, toggled in site-settings | Most commodity form bots | Human-driven abuse |
| Security headers | `next.config.ts` | Clickjacking, MIME sniffing, XSS payload delivery | — |
| Vercel WAF | Vercel dashboard (see §5) | Path probing, known-bad ASNs, volumetric attacks | — |

### Deliberate failure directions

The two halves of the system fail in **opposite** directions, on purpose:

- **Auth endpoints fail CLOSED.** If the rate-limit table is unreachable, login
  is refused. A database outage must not become an unlimited brute-force window.
- **Analytics and public forms fail OPEN.** If the same table is unreachable,
  visits are still counted and people can still contact the eparchy. Silencing
  real visitors is a worse outcome than admitting some spam.

If you change one of these, change it knowingly — the `failOpen` flag is a
required argument at every call site so this decision can never be made by
default.

---

## 2. Analytics integrity

`visitor-stats` holds **no personal data** and must stay that way. It is daily
aggregate counters only: no IP, no user-agent, no cookie, no per-person row.

Protections on `POST /api/track`:

1. A well-formed JSON body is required. An unparseable body used to be treated
   as a session ping, so a bare `curl -X POST /api/track` counted as a visit.
2. Same-origin only — another site cannot drive counters from real browsers.
3. Declared crawlers are counted under the `bot` dimension, not the human ones.
4. 60 requests per minute per hashed client.
5. Country comes only from `x-vercel-ip-country`, validated as two letters.
   `cf-ipcountry` is **not** trusted: this site is not behind Cloudflare, so that
   header was pure client input and could mint arbitrary country rows.

`?q=` search terms are filtered the same way (`src/lib/payload/searchStats.ts`) —
that path writes a row per distinct term and is reachable by plain GET.

### Reading the numbers

- `country: Unknown` means **no geo header at all**, not "VPN". A VPN user
  reports their exit node's country. A rise in `Unknown` is a bot signal.
- A forged/empty session ping increments `country:Unknown`, `device:desktop`,
  `source:direct`, and `language:unknown` **exactly once each**. If those four
  move together on the same day, you are looking at automation, not people.
- Rows written before 2026-07-26 predate this filtering and include bot traffic.
  They were not deleted — they are the only history there is.

**Do not geo-block by country.** The audience is heavily diaspora — Eritreans in
Europe, North America, the Gulf, Israel, and Ethiopia — very often behind VPNs.
Act on behaviour, never on geography.

---

## 3. Admin authentication

| Setting | Value | Where |
|---|---|---|
| Account lockout | 5 attempts, 15 min | `collections/Users` — `maxLoginAttempts` |
| Session length | 2 hours | `collections/Users` — `tokenExpiration` |
| Cookies | `httpOnly`, `secure` in production, `sameSite: Lax` | `collections/Users` — `auth.cookies` |
| API keys | Off | `useAPIKey: false` |
| Login rate limit | 10 per 10 min per client | `authGuard.ts` |
| Forgot-password | 5 per 15 min per client | `authGuard.ts` |
| Response floor | 600 ms on all auth responses | `authGuard.ts` |

`sameSite` is `Lax` rather than `Strict` deliberately: `Strict` strips the cookie
from the top-level navigation that follows a password-reset link, locking people
out of their own reset email.

**Why the response floor exists:** a login for a non-existent address returns as
soon as the lookup misses, while a real address pays for a bcrypt comparison.
That difference enumerates valid admin emails. Both paths now take at least
600 ms. If bcrypt's cost factor is ever raised, raise this too.

### Failed logins

Written to the `audit-log` collection as `auth.login-failed` with the attempted
address, a **hashed** client key, and the user-agent. Ten failures from one
client in 15 minutes raises a Sentry warning tagged `area: auth`.

This is **detection, not prevention** — the request was already refused. Its
purpose is telling you an attack is happening.

### Two-factor authentication — not implemented

A deliberate scoped follow-up, not an oversight. Payload v3 ships no TOTP, so
doing it properly means: a custom auth strategy, an encrypted secret field, a QR
enrolment screen, recovery codes, and a lockout-recovery path for an eparchy
that may have a single super-admin. A half-built version — say, TOTP with no
recovery codes — would lock the eparchy out of its own site the first time
someone replaces their phone. Until it is built, the mitigations are the account
lockout, the per-client login limit, and the failed-login alert above.

---

## 4. Public forms

Four layers, cheapest first, on contact / newsletter / donate:

1. **Honeypot** — the `company` field. Filled means silent fake success.
2. **Timing** — a server-signed render timestamp from `/api/form-token`;
   submissions under 1.5 s are silently discarded. Signed with `PAYLOAD_SECRET`,
   so a bot cannot simply rewrite the hidden field.
3. **Rate limit** — contact 5/10 min, newsletter 3/15 min, donate 5/15 min.
   Newsletter is tightest because it **sends mail to an attacker-chosen
   address** — unlimited, that is an inbox-bombing tool with our domain on it.
4. **Turnstile** — off by default; see below.

A missing or malformed form token is **not** rejected — a cached page or a
privacy extension could strip it, and refusing a real person's message costs
more than admitting a bot that still faces layers 3 and 4.

### Turnstile

Chosen over reCAPTCHA: free at any volume, and it does not report every visitor
who fills in a contact form to Google — which matters for a church.

To enable: Cloudflare dashboard → Turnstile → create a widget for the domain,
then in the admin under **Settings → Site Settings → Bot protection**, tick
*Turnstile enabled* and paste both keys. The secret key is encrypted at rest and
displayed masked. **No deploy or env var is needed** — staff can switch it off
themselves if it causes friction for visitors on poor connections. The other
three layers stay active either way.

---

## 5. Vercel WAF

Configured in the dashboard (Project → Firewall), **not** in code — Vercel has no
supported config-as-code for these rules. They are recorded here so they can be
rebuilt from scratch.

### Rules to configure

| # | Name | Condition | Action |
|---|---|---|---|
| 1 | Block CMS probing | Path matches `/wp-admin*`, `/wp-login*`, `/xmlrpc.php`, `/wordpress*`, `/wp-content*` | Deny |
| 2 | Block secret probing | Path matches `/.env*`, `/.git*`, `/config.json`, `/.aws*`, `/backup*`, `/*.sql` | Deny |
| 3 | Block shell probing | Path matches `/shell*`, `/cgi-bin*`, `/vendor/phpunit*` | Deny |
| 4 | Challenge admin | Path starts `/admin` **and** JA4 fingerprint is not a known browser | Challenge |
| 5 | Rate-limit admin login | Path `/api/users/login`, > 20 requests / 10 min per IP | Challenge |
| 6 | Rate-limit the API | Path starts `/api/`, > 200 requests / min per IP | Challenge |

Rules 1–3 are the highest-value ones: this site is Next.js and has never had a
PHP or WordPress route, so **any** request to those paths is hostile by
definition. There is no false-positive risk.

Rules 5 and 6 duplicate the application limiter on purpose — the WAF blocks at
the edge before a serverless function is invoked, so it costs nothing and works
even if the database is down.

Do **not** add a country rule. See §2.

### Under active attack

1. **Vercel dashboard → Firewall → Attack Challenge Mode → On.** Every visitor
   gets a browser challenge before reaching the app. Real people see a one-off
   interstitial; scripted clients are stopped dead.
2. Expect it to break: RSS/ICS feed subscribers, the Vatican News cron ingest,
   and any uptime monitor. Add a bypass rule for `/api/ingest/*` carrying the
   correct `Authorization` header if the ingest must keep running.
3. Turn it **off** once traffic normalises — it costs real visitors a step, and
   people on slow Eritrean connections feel it most.
4. Then check `audit-log` for `auth.login-failed` and Sentry for `area: auth`
   to see whether the admin was actually targeted or it was only noise.

---

## 6. Cron and ingest

`/api/ingest/vatican-news` requires `Authorization: Bearer $CRON_SECRET`,
compared in constant time, and **fails closed** when `CRON_SECRET` is unset — an
unconfigured server refuses the route rather than opening it. A signed-in user
holding `feed-sources.manage` may also trigger it from the admin.

Verify after any env change:

```bash
curl -i https://www.segeneyti.org/api/ingest/vatican-news   # expect 401
```

---

## 7. Environment variables

No new variables were introduced by this work. The controls above rely on:

| Variable | Used for | Notes |
|---|---|---|
| `PAYLOAD_SECRET` | JWT signing, field encryption, **IP hashing**, form-token signing | ≥32 chars, enforced at boot by `src/lib/env.ts` |
| `CRON_SECRET` | Ingest bearer token | Absent = route refuses everything |
| `NEXT_PUBLIC_SITE_URL` | Same-origin check on `/api/track` | Must match the live host or the check is skipped |

Rotating `PAYLOAD_SECRET` invalidates every session, every rate-limit bucket, and
every outstanding form token, and makes encrypted fields unreadable. It is not a
routine operation.

---

## 8. Privacy commitments

These are design commitments, not implementation details. Breaking one is a
decision to take deliberately:

- `visitor-stats` never holds personal data.
- Raw IP addresses are **never persisted**. They exist in memory for the length
  of a request, and only a keyed HMAC is stored (`src/lib/security/clientId.ts`).
  A plain hash would not be enough — the IPv4 space is small enough to reverse by
  brute force in seconds, so the keyed HMAC is what makes it a pseudonym.
- The audit log stores that a secret-bearing field changed, never its value.
- No third-party analytics or tracking is loaded for visitors beyond what staff
  explicitly configure in site-settings.
