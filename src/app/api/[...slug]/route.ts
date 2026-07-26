import { REST_DELETE, REST_GET, REST_PATCH, REST_POST, REST_PUT } from '@payloadcms/next/routes'
import config from '@payload-config'
import { withAuthProtection } from '@/lib/security/authGuard'

export const maxDuration = 60

export const GET = REST_GET(config)
// Payload serves login / forgot-password / reset-password through this same
// catch-all, so this wrapper is the only place that can rate-limit them, hold
// every auth response to a constant floor (no timing oracle for valid admin
// addresses), and log failures. Non-auth POSTs pass straight through.
export const POST = withAuthProtection(REST_POST(config))
export const DELETE = REST_DELETE(config)
export const PATCH = REST_PATCH(config)
export const PUT = REST_PUT(config)
