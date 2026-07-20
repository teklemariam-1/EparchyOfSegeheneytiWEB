import { NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload/client'
import { fetchVaticanNews, buildDraftBody, type VaticanFeedKey } from '@/lib/ingest/vaticanNews'
import { slugify } from '@/lib/formatters/slug'

const MAX_IMAGE_BYTES = 10_000_000

/**
 * Download the feed's thumbnail and store it as a Media doc.
 *
 * Best-effort: a missing or oversized image must never stop an article from
 * being imported, so every failure resolves to null and the editor can attach
 * their own image instead.
 */
async function importImage(
  payload: Awaited<ReturnType<typeof getPayload>>,
  imageUrl: string,
  title: string,
): Promise<string | null> {
  try {
    const res = await fetch(imageUrl, {
      headers: { 'User-Agent': 'EparchyOfSegeneyti-NewsBot/1.0' },
      cache: 'no-store',
    })
    if (!res.ok) return null

    const mimetype = res.headers.get('content-type')?.split(';')[0]?.trim() ?? ''
    if (!mimetype.startsWith('image/')) return null

    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length === 0 || buf.length > MAX_IMAGE_BYTES) return null

    const ext = mimetype.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg'
    const name = `vatican-news-${slugify(title).slice(0, 60) || Date.now()}.${ext}`

    const media = await payload.create({
      collection: 'media',
      overrideAccess: true,
      data: {
        alt: title,
        credit: 'Vatican News',
        category: 'general',
        accessLevel: 'public',
      } as any,
      file: { data: buf, mimetype, name, size: buf.length },
    })
    return String(media.id)
  } catch {
    return null
  }
}

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Ingest the latest Vatican News items as News DRAFTS for editorial review.
 *
 * Nothing is ever published automatically: every item lands as a draft with
 * reviewStatus="pending" so an editor reads it, edits it, and decides. Items are
 * deduplicated on sourceUrl, which also means an item marked "rejected" is never
 * pulled back in on a later run.
 *
 * Auth: Bearer token matching CRON_SECRET (Vercel Cron sends this automatically),
 * or an authenticated admin session for the "Fetch latest news" button.
 *
 * Schedule note: vercel.json runs this daily. Vercel's Hobby plan rejects any
 * sub-daily cron expression *at deploy time*, which fails the entire
 * deployment rather than just the cron -- do not set e.g. "0 * /6 * * *" there
 * without first confirming the plan allows it. To ingest more often, drive this
 * endpoint from an external scheduler with the CRON_SECRET bearer token.
 */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET

  // Two callers, two credentials:
  //   - Vercel Cron sends `Authorization: Bearer $CRON_SECRET`.
  //   - The "Fetch latest news" button in /admin runs in a staff member's
  //     browser, which must never see CRON_SECRET, so it authenticates with
  //     the Payload session cookie it already has.
  const auth = req.headers.get('authorization') ?? ''
  const viaCron = Boolean(secret) && auth === `Bearer ${secret}`

  let authorized = viaCron
  if (!authorized) {
    const { user } = await (await getPayload()).auth({ headers: req.headers as Headers })
    const role = (user as { role?: string } | null)?.role
    // Mirrors News.access.create (isChanceryOrAbove) — anyone who could create
    // these drafts by hand may also import them.
    authorized = role === 'super-admin' || role === 'chancery-editor'
  }

  if (!authorized) {
    if (!secret) {
      return NextResponse.json(
        { error: 'CRON_SECRET is not configured on the server.' },
        { status: 500 },
      )
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const feed = (url.searchParams.get('feed') ?? 'all') as VaticanFeedKey
  const limit = Math.min(Number(url.searchParams.get('limit')) || 15, 50)
  const from = url.searchParams.get('from') ?? undefined
  const to = url.searchParams.get('to') ?? undefined

  try {
    const items = await fetchVaticanNews(feed, limit, { from, to })
    const payload = await getPayload()

    let created = 0
    let skipped = 0
    const errors: string[] = []

    for (const item of items) {
      try {
        // Dedupe on the original article URL (covers drafts, published and
        // rejected items alike) AND on the slug the title would generate —
        // an editor may already have written the same story by hand, and slug
        // is unique, so creating it would fail validation.
        const slug = slugify(item.title)
        const existing = await payload.find({
          collection: 'news',
          where: {
            or: [
              { sourceUrl: { equals: item.link } },
              ...(slug ? [{ slug: { equals: slug } }] : []),
            ],
          },
          limit: 1,
          depth: 0,
          overrideAccess: true,
        } as any)

        if (existing.totalDocs > 0) {
          skipped++
          continue
        }

        const featuredImage = item.imageUrl
          ? await importImage(payload, item.imageUrl, item.title)
          : null

        await payload.create({
          collection: 'news',
          locale: 'en',
          overrideAccess: true,
          draft: true,
          data: {
            title: item.title,
            excerpt: item.summary,
            body: buildDraftBody(item.summary, item.link),
            category: 'vatican',
            publishedAt: item.publishedAt,
            ...(featuredImage ? { featuredImage } : {}),
            sourceUrl: item.link,
            sourceName: 'Vatican News',
            isImported: true,
            importedAt: new Date().toISOString(),
            reviewStatus: 'pending',
            _status: 'draft',
          } as any,
        })
        created++
      } catch (err) {
        // A unique-constraint hit means an equivalent article already exists —
        // most often the auto-generated slug collides with one an editor wrote
        // by hand. That is a duplicate, not a failure.
        const msg = String(err)
        if (/unique|duplicate|already exists/i.test(msg)) {
          skipped++
        } else {
          errors.push(`${item.link}: ${msg.slice(0, 140)}`)
        }
      }
    }

    return NextResponse.json({
      ok: true,
      feed,
      ...(from || to ? { window: { from: from ?? null, to: to ?? null } } : {}),
      fetched: items.length,
      created,
      skipped,
      ...(errors.length ? { errors } : {}),
    })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err).slice(0, 300) },
      { status: 502 },
    )
  }
}

/** GET mirrors POST so Vercel Cron (which issues GET) can trigger the same job. */
export async function GET(req: Request) {
  return POST(req)
}
