import { createHmac } from 'node:crypto'

/**
 * Derives a stable, non-reversible client identifier for rate limiting.
 *
 * Raw IPs are never persisted anywhere in this application — `visitor-stats`
 * holds no PII and the rate-limit table must not become the place that changes.
 * We HMAC the address with PAYLOAD_SECRET (a server-only key) and keep 128 bits
 * of it, so:
 *
 *  - the same visitor maps to the same bucket within a window (rate limiting works),
 *  - the stored value cannot be reversed to an IP by anyone reading the table,
 *  - and rotating PAYLOAD_SECRET invalidates every historical identifier.
 *
 * A plain SHA-256 of an IP would NOT be safe here: the IPv4 space is small
 * enough to exhaust in seconds, so an unkeyed digest is effectively reversible.
 * The keyed HMAC is what makes this a pseudonym rather than an obfuscation.
 */

/** Trusted client-IP headers, in order. On Vercel the first is set by the platform. */
const IP_HEADERS = ['x-vercel-forwarded-for', 'x-real-ip', 'x-forwarded-for'] as const

/** Extracts the client IP from request headers, or undefined when unavailable. */
export function clientIp(headers: Headers): string | undefined {
  for (const name of IP_HEADERS) {
    const raw = headers.get(name)
    if (!raw) continue
    // x-forwarded-for is a comma-separated chain; the left-most entry is the
    // original client. On Vercel the platform rewrites this header, so an
    // attacker cannot inject a spoofed left-most entry.
    const first = raw.split(',')[0]?.trim()
    if (first) return first
  }
  return undefined
}

/**
 * Keyed, truncated digest of an IP — safe to persist.
 *
 * Returns `anonymous` when no IP is available, so callers always get a usable
 * bucket key. That bucket is shared by all header-less callers, which is the
 * conservative choice: it rate-limits them collectively rather than exempting them.
 */
export function hashIp(ip: string | undefined): string {
  if (!ip) return 'anonymous'
  const secret = process.env.PAYLOAD_SECRET ?? 'insecure-development-fallback'
  return createHmac('sha256', secret).update(ip).digest('hex').slice(0, 32)
}

/** Convenience: hashed client identifier straight from a request's headers. */
export function clientKey(headers: Headers): string {
  return hashIp(clientIp(headers))
}
