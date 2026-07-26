import * as Sentry from '@sentry/nextjs'
import { getPayload } from '../payload/client'
import { writeAudit } from '../permissions/audit'
import { clientKey } from './clientId'
import { consume } from './rateLimit'

/**
 * Rate limiting, timing normalization, and failure logging for Payload's
 * built-in auth endpoints.
 *
 * Payload mounts login / forgot-password / reset-password itself under
 * /api/[...slug], so there is no collection hook that sees a WRONG PASSWORD
 * attempt (beforeLogin only runs once credentials already verified). Wrapping
 * the REST handler is therefore the only place that can see, count, and slow
 * down failed attempts.
 *
 * Payload's own `maxLoginAttempts` locks a single account after 5 failures.
 * That does nothing against spraying one password across many accounts, which
 * is what automated probing actually does — hence the per-client limit here.
 */

/** Per-endpoint budgets. All FAIL CLOSED: no counter, no auth request served. */
const AUTH_LIMITS: Record<string, { limit: number; windowSeconds: number }> = {
  login: { limit: 10, windowSeconds: 600 },
  'forgot-password': { limit: 5, windowSeconds: 900 },
  'reset-password': { limit: 10, windowSeconds: 900 },
}

/**
 * Floor for auth responses, in milliseconds.
 *
 * Without it, a login for an address that does not exist returns as soon as the
 * lookup misses, while a real address pays for a bcrypt comparison — a timing
 * oracle that enumerates valid admin emails. Both paths now take at least this
 * long. 600ms sits above a typical bcrypt round on Vercel's hardware with room
 * to spare; raise it if the cost factor ever goes up.
 */
const MIN_AUTH_RESPONSE_MS = 600

/** Failed logins from one client within the window before Sentry is notified. */
const FAILED_LOGIN_ALERT_THRESHOLD = 10

/** Which auth action a request targets, if any. */
export function authActionFor(pathname: string, method: string): string | null {
  if (method.toUpperCase() !== 'POST') return null
  const match = /\/api\/[^/]+\/(login|forgot-password|reset-password)\/?$/.exec(pathname)
  return match?.[1] ?? null
}

/** Resolves no earlier than `ms` from now, whatever the wrapped work does. */
async function notFasterThan<T>(work: Promise<T>, ms: number): Promise<T> {
  const [result] = await Promise.all([work, new Promise((r) => setTimeout(r, ms))])
  return result
}

/**
 * The attempted identifier, read from a CLONE so the real handler still gets an
 * unconsumed body. Capped, and only ever written to the audit log — never
 * echoed back to the caller, which would itself confirm what was tried.
 */
async function attemptedEmail(req: Request): Promise<string | undefined> {
  try {
    const body = (await req.clone().json()) as { email?: unknown }
    const email = typeof body?.email === 'string' ? body.email.trim().slice(0, 254) : undefined
    return email || undefined
  } catch {
    return undefined
  }
}

/**
 * Record a failed login and, past a threshold, raise it to Sentry.
 *
 * Deliberately DETECTION, not prevention: the request has already been refused
 * by the time this runs. Stores a hashed client key and the attempted address —
 * never a raw IP.
 */
async function recordFailedLogin(req: Request, client: string): Promise<void> {
  try {
    const email = await attemptedEmail(req)
    const userAgent = req.headers.get('user-agent')?.slice(0, 200) ?? 'none'
    const payload = await getPayload()

    await writeAudit(payload, {
      action: 'auth.login-failed',
      targetCollection: 'users',
      summary: `Failed login for ${email ?? 'unknown address'} — client ${client.slice(0, 12)}…, agent: ${userAgent}`,
    })

    // Counter separate from the request limiter so it survives past the point
    // where requests start being refused; alerts exactly on the crossing.
    const failures = await consume(`login-fail:${client}`, {
      limit: FAILED_LOGIN_ALERT_THRESHOLD,
      windowSeconds: 900,
      failOpen: true,
    })
    if (failures.count === FAILED_LOGIN_ALERT_THRESHOLD + 1) {
      Sentry.captureMessage(
        `Repeated failed admin logins: ${FAILED_LOGIN_ALERT_THRESHOLD}+ in 15 minutes from one client`,
        { level: 'warning', tags: { area: 'auth' }, extra: { client: client.slice(0, 12), userAgent } },
      )
    }
  } catch {
    // Detection must never break the response the visitor already has coming.
  }
}

type RouteHandler = (req: Request, context: any) => Promise<Response> | Response

/**
 * Wraps Payload's REST POST handler with the protections above. Non-auth
 * requests pass through untouched, so the CMS API keeps its normal behaviour
 * and cost.
 */
export function withAuthProtection(handler: RouteHandler): RouteHandler {
  return async (req: Request, context: any) => {
    const action = authActionFor(new URL(req.url).pathname, req.method)
    if (!action) return handler(req, context)

    const client = clientKey(req.headers)
    const budget = AUTH_LIMITS[action]!

    // FAIL CLOSED: if the limiter cannot count, refuse. A database outage must
    // not silently become an unlimited brute-force window.
    const limit = await consume(`auth:${action}:${client}`, { ...budget, failOpen: false })
    if (!limit.allowed) {
      return notFasterThan(
        Promise.resolve(
          new Response(JSON.stringify({ errors: [{ message: 'Too many attempts. Please try again later.' }] }), {
            status: 429,
            headers: {
              'content-type': 'application/json',
              'retry-after': String(limit.retryAfterSeconds),
            },
          }),
        ),
        MIN_AUTH_RESPONSE_MS,
      )
    }

    const response = await notFasterThan(
      Promise.resolve(handler(req, context)),
      MIN_AUTH_RESPONSE_MS,
    )

    if (action === 'login' && response.status >= 400) {
      // Not awaited on the response path — logging must not delay the reply.
      void recordFailedLogin(req, client)
    }

    return response
  }
}
