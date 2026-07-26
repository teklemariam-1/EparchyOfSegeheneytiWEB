import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Signed form-render timestamp — the submission-timing check.
 *
 * A human needs seconds to read a form and type into it; a script posts the
 * moment it parses the page. Comparing "rendered at" to "submitted at" catches
 * that, but only if the timestamp cannot simply be rewritten — an unsigned
 * hidden field is worth nothing, since the bot controls every field it posts.
 * So the server signs the render time with PAYLOAD_SECRET and verifies the
 * signature before trusting the value.
 *
 * The upper bound matters too: it stops a token being minted once and replayed
 * for weeks by a script that has learned to wait.
 */

/** Faster than this and it was not typed by a person. */
const MIN_FILL_MS = 1_500

/** A form left open longer than this must be re-rendered. */
const MAX_AGE_MS = 2 * 60 * 60 * 1000 // 2 hours

function sign(issuedAt: string): string {
  const secret = process.env.PAYLOAD_SECRET ?? 'insecure-development-fallback'
  return createHmac('sha256', secret).update(issuedAt).digest('base64url')
}

/** Mint a token for a form being rendered now. Embed as a hidden field. */
export function issueFormToken(now: number = Date.now()): string {
  const issuedAt = String(now)
  return `${issuedAt}.${sign(issuedAt)}`
}

export type FormTokenVerdict = 'ok' | 'missing' | 'invalid' | 'too-fast' | 'expired'

/**
 * Verify a submitted token.
 *
 * Returns a verdict rather than a boolean so the caller can decide what each
 * failure means — the forms treat 'too-fast' as silent-accept (like the
 * honeypot, so the bot learns nothing) but ask a human to retry an 'expired'
 * form.
 */
export function verifyFormToken(token: unknown, now: number = Date.now()): FormTokenVerdict {
  if (typeof token !== 'string' || token === '') return 'missing'

  const [issuedAt, signature] = token.split('.')
  if (!issuedAt || !signature) return 'invalid'

  const expected = sign(issuedAt)
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  // Constant-time, and length-checked first because timingSafeEqual throws on
  // a length mismatch.
  if (a.length !== b.length || !timingSafeEqual(a, b)) return 'invalid'

  const issued = Number(issuedAt)
  if (!Number.isFinite(issued)) return 'invalid'

  const age = now - issued
  // A negative age means a clock skew or a forged-but-correctly-signed future
  // timestamp; neither is a real submission.
  if (age < MIN_FILL_MS) return 'too-fast'
  if (age > MAX_AGE_MS) return 'expired'
  return 'ok'
}
