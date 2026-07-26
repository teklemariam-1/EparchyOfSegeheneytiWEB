import { getPayload } from '../payload/client'
import { decrypt } from '../crypto/fieldEncryption'

/**
 * Cloudflare Turnstile verification for the public forms.
 *
 * Chosen over reCAPTCHA deliberately: it is free at any volume, needs no
 * Google account, and — the reason that matters for a church — it does not
 * hand Google a record of every visitor who fills in a contact form. Most
 * visitors are never shown an interactive challenge at all.
 *
 * Runtime-toggleable from site-settings so staff can switch it off themselves
 * if it causes friction for visitors on poor connections, without a deploy.
 * When disabled or unconfigured, verification returns `true` — the honeypot,
 * timing check, and rate limits are still in force, so the forms degrade to
 * their previous protection rather than to nothing.
 */

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

/** How long to wait on Cloudflare before giving up. */
const TIMEOUT_MS = 5_000

export interface TurnstileConfig {
  enabled: boolean
  siteKey?: string
}

/** Public half of the config, safe to send to the browser. */
export async function getTurnstileConfig(): Promise<TurnstileConfig> {
  try {
    const payload = await getPayload()
    const settings = (await payload.findGlobal({ slug: 'site-settings' } as any)) as any
    const security = settings?.security
    const siteKey = String(security?.turnstileSiteKey ?? '').trim()
    return { enabled: Boolean(security?.turnstileEnabled) && Boolean(siteKey), siteKey: siteKey || undefined }
  } catch {
    // Settings unreadable — treat the challenge as off rather than blocking
    // every form submission on the site.
    return { enabled: false }
  }
}

/**
 * Verify a Turnstile response token.
 *
 * FAILS OPEN on a network error or timeout: Cloudflare being unreachable must
 * not mean nobody can contact the eparchy. That is a deliberate availability
 * choice for public forms — the auth endpoints, where the trade runs the other
 * way, fail closed instead (see ./authGuard).
 */
export async function verifyTurnstile(token: unknown, remoteIp?: string): Promise<boolean> {
  let secret: string
  try {
    const payload = await getPayload()
    // `revealSecrets` opts out of the field's masking hook; without it the
    // stored key comes back as asterisks and every verification would fail.
    const settings = (await payload.findGlobal({
      slug: 'site-settings',
      overrideAccess: true,
      context: { revealSecrets: true },
    } as any)) as any
    const security = settings?.security
    if (!security?.turnstileEnabled) return true

    const stored = String(security?.turnstileSecretKey ?? '')
    if (!stored) return true
    secret = decrypt(stored)
  } catch {
    return true
  }

  if (typeof token !== 'string' || token === '') return false

  try {
    const body = new URLSearchParams({ secret, response: token })
    if (remoteIp) body.set('remoteip', remoteIp)

    const res = await fetch(VERIFY_URL, {
      method: 'POST',
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    const data = (await res.json()) as { success?: boolean }
    return data?.success === true
  } catch (err) {
    console.error('[turnstile] verification unreachable — allowing submission', err)
    return true
  }
}
