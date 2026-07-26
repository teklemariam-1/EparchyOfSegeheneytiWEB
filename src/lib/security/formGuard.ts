import { headers } from 'next/headers'
import { clientIp, hashIp } from './clientId'
import { consume } from './rateLimit'
import { verifyFormToken } from './formToken'
import { verifyTurnstile } from './turnstile'

/**
 * The shared abuse checks for every public form (contact, newsletter, donate).
 *
 * Layered on purpose, cheapest first, because each catches a different class of
 * submitter:
 *
 *  1. honeypot     — the `company` field; catches naive form-fillers (checked by
 *                    the caller, since a filled honeypot means "pretend success")
 *  2. timing       — a signed render timestamp; catches anything that submits
 *                    instantly, including scripts that post the form directly
 *  3. rate limit   — per hashed client; caps how much any one source can send
 *                    even if it passes everything else
 *  4. Turnstile    — optional, staff-toggleable; catches the rest
 *
 * Nothing here stores an IP. The rate-limit key is an HMAC (see ./clientId) and
 * the raw address is passed to Cloudflare in-memory only, never persisted.
 */

/** Keys into the `forms` message catalogue (messages/en.json, messages/ti.json). */
export type FormRejectionKey = 'formExpired' | 'rateLimited' | 'challengeFailed'

export type FormOutcome =
  | { ok: true }
  /** Pretend it worked. Used where telling the truth would teach a bot something. */
  | { ok: false; silent: true }
  /**
   * Show this to the person. `messageKey` is what the form renders (translated
   * client-side); `message` is the English fallback for any caller without a
   * translator to hand.
   */
  | { ok: false; silent: false; messageKey: FormRejectionKey; message: string }

export interface FormGuardOptions {
  /** Names the rate-limit bucket, e.g. 'contact'. */
  action: string
  /** Submissions allowed per window from one client. */
  limit: number
  windowSeconds: number
  formData: FormData
}

/**
 * Run every shared check. Returns `{ ok: true }` when the submission should be
 * processed.
 *
 * Rate limiting here FAILS OPEN: if the counter is unavailable, a visitor can
 * still contact the eparchy. These forms are moderated by a human and the
 * honeypot/timing checks remain in force, so the cost of an outage letting spam
 * through is lower than the cost of silencing real people. The auth endpoints
 * make the opposite trade (see ./authGuard).
 */
export async function guardFormSubmission(options: FormGuardOptions): Promise<FormOutcome> {
  const { action, limit, windowSeconds, formData } = options

  // ── Timing ────────────────────────────────────────────────────────────────
  const verdict = verifyFormToken(formData.get('formToken'))
  if (verdict === 'too-fast') {
    // Silent: a bot told "too fast" simply adds a delay and retries.
    return { ok: false, silent: true }
  }
  if (verdict === 'expired') {
    return {
      ok: false,
      silent: false,
      messageKey: 'formExpired',
      message: 'This form was open too long. Please reload the page and send it again.',
    }
  }
  // 'missing' and 'invalid' are NOT rejected. A cached page, a browser that
  // strips hidden fields, or a form rendered before this shipped would all fail
  // here, and refusing a real person's message is worse than admitting a bot
  // that still has to clear the rate limit and Turnstile below.

  // `headers()` throws outside a request scope (unit tests, and any future
  // non-request caller). Degrade to an unidentified client rather than failing
  // the submission — the limiter then buckets these together, which is the
  // conservative reading of "we do not know who this is".
  let ip: string | undefined
  try {
    ip = clientIp(await headers())
  } catch {
    ip = undefined
  }

  // ── Rate limit ────────────────────────────────────────────────────────────
  const rate = await consume(`form:${action}:${hashIp(ip)}`, { limit, windowSeconds, failOpen: true })
  if (!rate.allowed) {
    return {
      ok: false,
      silent: false,
      messageKey: 'rateLimited',
      message: 'You have sent several messages already. Please wait a few minutes and try again.',
    }
  }

  // ── Turnstile (only when staff have switched it on) ───────────────────────
  const passed = await verifyTurnstile(formData.get('cf-turnstile-response'), ip)
  if (!passed) {
    return {
      ok: false,
      silent: false,
      messageKey: 'challengeFailed',
      message: 'We could not verify that you are human. Please reload the page and try again.',
    }
  }

  return { ok: true }
}
