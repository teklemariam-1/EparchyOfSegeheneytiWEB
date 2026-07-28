import { NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload/client'

export const dynamic = 'force-dynamic'

function page(title: string, body: string): NextResponse {
  return new NextResponse(
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
     <body style="font-family:system-ui,sans-serif;max-width:34rem;margin:4rem auto;padding:0 1.5rem;color:#231a18;text-align:center">
       <h1 style="color:#5d1827;font-size:1.4rem">${title}</h1>
       <p style="line-height:1.6">${body}</p>
       <p><a href="/" style="color:#5d1827;font-weight:600">Return to the site</a></p>
     </body></html>`,
    { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } },
  )
}

/**
 * One-click unsubscribe. Every broadcast email embeds this link with the
 * subscriber's stable token. Required for a legitimate mailing list.
 */
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get('token')
  if (!token) return page('Invalid link', 'This unsubscribe link is missing its token.')

  try {
    const payload = await getPayload()
    const found = await payload.find({
      collection: 'subscribers',
      where: { unsubscribeToken: { equals: token } },
      limit: 1,
      overrideAccess: true,
    } as any)

    const doc = found.docs[0] as any
    if (!doc) {
      return page('Already unsubscribed', 'This address is not on our list, or has already been removed.')
    }

    if (doc.status !== 'unsubscribed') {
      await payload.update({
        collection: 'subscribers',
        id: doc.id,
        overrideAccess: true,
        data: { status: 'unsubscribed', unsubscribedAt: new Date().toISOString() } as any,
      })
    }

    return page(
      'Unsubscribed',
      'You have been removed from the Eparchy of Segheneyti mailing list and will no longer receive emails.',
    )
  } catch (err) {
    console.error('[newsletter] unsubscribe error', err)
    return page('Something went wrong', 'We could not process that just now. Please try again later.')
  }
}
