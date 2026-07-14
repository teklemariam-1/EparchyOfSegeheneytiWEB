import { z } from 'zod'

/**
 * Server environment validation.
 *
 * Required secrets must never silently fall back to empty strings — an empty
 * PAYLOAD_SECRET means a forgeable JWT, and an empty DATABASE_URI means a
 * misconfigured deploy that "works" until it doesn't. In production we fail
 * fast; in development/CI (where `payload generate:types` may run without a
 * full environment) we warn and continue so tooling isn't blocked.
 */

const isProd = process.env.NODE_ENV === 'production'

const schema = z.object({
  DATABASE_URI: z.string().min(1, 'DATABASE_URI is required'),
  PAYLOAD_SECRET: z
    .string()
    .min(32, 'PAYLOAD_SECRET must be at least 32 characters (generate with: openssl rand -base64 32)'),
})

export type ServerEnv = z.infer<typeof schema>

function loadEnv(): ServerEnv {
  const parsed = schema.safeParse({
    DATABASE_URI: process.env.DATABASE_URI,
    PAYLOAD_SECRET: process.env.PAYLOAD_SECRET,
  })

  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  • ${i.path.join('.')}: ${i.message}`).join('\n')
    const message = `Invalid or missing environment variables:\n${issues}`

    if (isProd) {
      // Fail fast — never boot production with an empty secret / DB string.
      throw new Error(`[env] ${message}`)
    }

    console.warn(`[env] ⚠ ${message}\n[env] Continuing with fallback values (non-production only).`)
    return {
      DATABASE_URI: process.env.DATABASE_URI ?? '',
      PAYLOAD_SECRET: process.env.PAYLOAD_SECRET ?? '',
    }
  }

  return parsed.data
}

export const env = loadEnv()
