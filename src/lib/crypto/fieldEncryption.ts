import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto'
import { env } from '../env'

/**
 * Field-level encryption for sensitive settings (e.g. a donation receiving
 * account number) so they are never stored in plaintext at rest.
 *
 * AES-256-GCM with a key derived from PAYLOAD_SECRET via scrypt. GCM gives us
 * authenticated encryption (tamper-evident). The stored format is:
 *
 *   enc:v1:<iv-base64>:<authTag-base64>:<ciphertext-base64>
 *
 * `decrypt` returns any value lacking the `enc:v1:` prefix unchanged, so a field
 * that already holds plaintext (or a masked placeholder) is tolerated rather
 * than throwing — important when a value is saved before this was introduced.
 */

const PREFIX = 'enc:v1:'
// App-level, non-secret salt. The secret is PAYLOAD_SECRET; the salt only needs
// to be stable so the derived key is reproducible across restarts.
const SALT = 'eparchy-donation-field-v1'

let cachedKey: Buffer | null = null
function key(): Buffer {
  if (cachedKey) return cachedKey
  const secret = env.PAYLOAD_SECRET || 'insecure-dev-secret-please-set-PAYLOAD_SECRET'
  cachedKey = scryptSync(secret, SALT, 32)
  return cachedKey
}

export function isEncrypted(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith(PREFIX)
}

export function encrypt(plain: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key(), iv)
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${PREFIX}${iv.toString('base64')}:${tag.toString('base64')}:${enc.toString('base64')}`
}

export function decrypt(value: string): string {
  if (!isEncrypted(value)) return value // tolerate plaintext / masked values
  const [, , ivB64, tagB64, dataB64] = value.split(':')
  if (!ivB64 || !tagB64 || !dataB64) return ''
  try {
    const decipher = createDecipheriv('aes-256-gcm', key(), Buffer.from(ivB64, 'base64'))
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'))
    return Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]).toString('utf8')
  } catch {
    return ''
  }
}

/** Last 4 characters of a value (decrypting first if needed), digits/letters only. */
export function last4(value: string): string {
  const plain = isEncrypted(value) ? decrypt(value) : value
  const cleaned = plain.replace(/\s+/g, '')
  return cleaned.slice(-4)
}

/** A masked display form, e.g. "••••1234". Never reveals more than the last 4. */
export function mask(value: string | null | undefined): string {
  if (!value) return ''
  const tail = last4(value)
  return tail ? `••••${tail}` : ''
}

/** True when a submitted value is a masked placeholder rather than a real edit. */
export function isMasked(value: unknown): boolean {
  return typeof value === 'string' && value.includes('••••')
}
