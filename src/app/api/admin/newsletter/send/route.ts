import { NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload/client'
import { hasPermission, type AuthUser } from '@/lib/permissions/resolve'
import { sendArticleToSubscribers } from '@/lib/newsletter/send'

/**
 * POST /api/admin/newsletter/send  { newsId }
 *
 * Gated by `subscribers.manage` — sending to the list IS managing the list,
 * and reusing the existing permission means no enum migration. The real
 * safety property (one send per article, ever) lives in the send library's
 * dedupe, not here.
 */

export const dynamic = 'force-dynamic'
// The loop emails every subscriber sequentially; the default 10s is not enough
// once the list grows.
export const maxDuration = 60

export async function POST(req: Request) {
  const payload = await getPayload()
  const { user } = await payload.auth({ headers: req.headers as Headers })
  const authUser = user as AuthUser | null

  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(authUser, 'subscribers.manage')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let newsId: unknown
  try {
    newsId = ((await req.json()) as { newsId?: unknown })?.newsId
  } catch {
    newsId = undefined
  }
  if (typeof newsId !== 'string' && typeof newsId !== 'number') {
    return NextResponse.json({ error: 'Provide { newsId }.' }, { status: 400 })
  }

  const result = await sendArticleToSubscribers(payload as never, {
    newsId,
    actorId: authUser.id,
  })

  if (!result.ok) {
    const status = result.reason === 'not-found' ? 404 : 409
    return NextResponse.json(result, { status })
  }
  return NextResponse.json(result)
}
