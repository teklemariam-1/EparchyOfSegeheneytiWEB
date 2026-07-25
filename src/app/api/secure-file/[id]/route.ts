import { getPayload } from '@/lib/payload/client'
import { hasPermission, type AuthUser } from '@/lib/permissions/resolve'

/**
 * Access-controlled download for media assets.
 *
 * Production stores files on Vercel Blob, whose object URLs are public. The
 * app never hands out the raw Blob URL for a `restricted` asset (queries strip
 * it), but this route is the enforcement point: it verifies the requester is a
 * signed-in elevated user before redirecting to the file. Public assets pass
 * straight through, so this URL is a safe, stable link for any media id.
 *
 * GET /api/secure-file/<mediaId>
 *   public asset      → 307 redirect to the file
 *   restricted asset  → 307 for users with media.view-restricted, else 403
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  let payload
  try {
    payload = await getPayload()
  } catch {
    return new Response('Service unavailable', { status: 503 })
  }

  let media: { url?: string | null; accessLevel?: string | null } | null = null
  try {
    const doc = await payload.findByID({ collection: 'media', id, overrideAccess: true, depth: 0 })
    media = doc as unknown as { url?: string | null; accessLevel?: string | null }
  } catch {
    media = null
  }

  if (!media?.url) {
    return new Response('Not found', { status: 404 })
  }

  if (media.accessLevel === 'restricted') {
    let authUser: AuthUser | null = null
    try {
      const { user } = await payload.auth({ headers: req.headers as Headers })
      authUser = user as AuthUser | null
    } catch {
      authUser = null
    }
    if (!hasPermission(authUser, 'media.view-restricted')) {
      return new Response('Forbidden — this document requires authorization.', { status: 403 })
    }
  }

  // Redirect to the actual file. Restricted responses are non-cacheable so a
  // shared/CDN cache can never serve them to a later unauthorized request.
  return new Response(null, {
    status: 307,
    headers: {
      Location: media.url,
      'Cache-Control':
        media.accessLevel === 'restricted' ? 'private, no-store' : 'public, max-age=3600',
    },
  })
}
