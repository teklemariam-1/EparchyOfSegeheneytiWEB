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
 * Confirm a newsletter subscription (double opt-in step two).
 *
 * Looks the token up rather than trusting an email in the URL, so a link can
 * only confirm the address it was actually issued for.
 */
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get('token')
  if (!token) return page('Invalid link', 'This confirmation link is missing its token.')

  try {
    const payload = await getPayload()
    const found = await payload.find({
      collection: 'subscribers',
      where: { confirmationToken: { equals: token } },
      limit: 1,
      overrideAccess: true,
    } as any)

    const doc = found.docs[0] as any
    if (!doc) {
      return page(
        'Link expired',
        'This confirmation link is no longer valid. You may have already confirmed, or the link expired. Please subscribe again if needed.',
      )
    }

    if (doc.status !== 'confirmed') {
      await payload.update({
        collection: 'subscribers',
        id: doc.id,
        overrideAccess: true,
        // Clear the one-time token so the link cannot be replayed.
        data: { status: 'confirmed', confirmedAt: new Date().toISOString(), confirmationToken: null } as any,
      })
    }

    return page(
      'Subscription confirmed',
      'Thank you — your email is confirmed. You will now receive news and updates from the Eparchy of Segheneyti.',
    )
  } catch (err) {
    console.error('[newsletter] confirm error', err)
    return page('Something went wrong', 'We could not confirm your subscription just now. Please try again later.')
  }
}
