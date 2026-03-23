import { getPayload as getPayloadBase } from 'payload'
import config from '@payload-config'

/**
 * Returns a cached Payload instance.
 *
 * In Next.js App Router, importing this function in a Server Component
 * or route handler is safe and efficient — Payload's config is loaded
 * once per Node.js process and the DB pool is reused across requests.
 */
export async function getPayload() {
  return getPayloadBase({ config })
}
