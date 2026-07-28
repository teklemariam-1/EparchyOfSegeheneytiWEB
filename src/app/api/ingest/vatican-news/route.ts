import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload/client'
import {
  probeFeed,
  buildDraftBody,
  VATICAN_NEWS_FEEDS,
  type FeedItem,
  type VaticanFeedKey,
} from '@/lib/ingest/vaticanNews'
import { slugify } from '@/lib/formatters/slug'
import { safeFetch } from '@/lib/ingest/safeFetch'
import { hasPermission, type AuthUser } from '@/lib/permissions/resolve'

/** Length-safe, constant-time string comparison for the bearer token. */
function timingSafeStrEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return timingSafeEqual(ab, bb)
}

/**
 * A URL-safe slug for an imported item.
 *
 * `slugify` only handles Latin text, so a Tigrinya/Ge'ez title reduces to an
 * empty string and the required `slug` field then fails validation — every
 * Tigrinya import errored on this. Vatican News URLs carry a Latin slug in
 * their path even for Tigrinya articles
 * (…/2026-07/pope-leo-montecassino-abbey.html), so fall back to that, and to a
 * timestamp only if the URL yields nothing either.
 */
function deriveSlug(title: string, link: string): string {
  // "Usable" means it actually reads as a slug: at least a few characters and
  // containing letters. A Ge'ez title with one embedded Latin numeral (Leo
  // "14") slugifies to "14" — truthy but useless — so a bare truthiness check
  // is not enough; prefer the URL's canonical Latin slug in that case.
  const usable = (s: string) => s.length >= 3 && /[a-z]/.test(s)

  const fromTitle = slugify(title)
  if (usable(fromTitle)) return fromTitle

  try {
    const path = new URL(link).pathname
    const last = path.split('/').filter(Boolean).pop() ?? ''
    const fromUrl = slugify(last.replace(/\.(html?|php|aspx)$/i, ''))
    if (usable(fromUrl)) return fromUrl
  } catch {
    // fall through
  }

  // Last resort: keep any weak title slug rather than nothing, else timestamp.
  return fromTitle || `imported-${Date.now()}`
}

/** A feed to pull from — either a configured FeedSource or a built-in fallback. */
interface ResolvedSource {
  id?: string
  name: string
  url: string
  target: 'news' | 'pope-messages'
  category: string
  documentType: string
  consecutiveFailures: number
}

/**
 * Feeds to import from.
 *
 * Reads the FeedSources collection so staff can add, edit and disable sources
 * without a deploy. If none are configured — a fresh install, or someone
 * disabled them all — fall back to the built-in Vatican News feed so the job
 * still does something useful rather than silently importing nothing.
 */
function builtInSource(key: VaticanFeedKey = 'all'): ResolvedSource {
  return {
    name: 'Vatican News',
    url: VATICAN_NEWS_FEEDS[key],
    target: 'news',
    category: 'vatican',
    documentType: 'message',
    consecutiveFailures: 0,
  }
}

async function resolveSources(
  payload: Awaited<ReturnType<typeof getPayload>>,
  feedParam: string | null,
): Promise<ResolvedSource[]> {
  // `?feed=pope|world` still targets a specific built-in Vatican feed, so those
  // bookmarked URLs keep working. Everything else — including `feed=all` (used
  // by the cron and the admin button) and no param at all — now iterates the
  // FeedSources collection. This is the core fix: previously `feed=all` mapped
  // to the single built-in English feed and the configured sources (Tigrinya
  // etc.) were NEVER fetched by any shipped trigger.
  if (feedParam === 'pope' || feedParam === 'world') {
    return [builtInSource(feedParam as VaticanFeedKey)]
  }

  try {
    const result = await payload.find({
      collection: 'feed-sources',
      where: { enabled: { equals: true } },
      limit: 50,
      depth: 0,
      overrideAccess: true,
    } as any)

    const sources: ResolvedSource[] = (result.docs as any[])
      .map((d) => ({
        id: String(d.id),
        name: d.name,
        url: String(d.url ?? '').trim(),
        target: (d.target === 'pope-messages' ? 'pope-messages' : 'news') as ResolvedSource['target'],
        category: d.category ?? 'vatican',
        documentType: d.documentType ?? 'message',
        consecutiveFailures: Number(d.consecutiveFailures ?? 0),
      }))
      .filter((s) => s.url)

    if (sources.length > 0) return sources
  } catch {
    // Collection missing (pre-migration) — fall through to the built-in feed.
  }

  // Fresh install / all sources disabled: still do something useful.
  return [builtInSource('all')]
}

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
    const res = await safeFetch(imageUrl, {
      headers: { 'User-Agent': 'EparchyOfSegheneyti-NewsBot/1.0' },
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
  const viaCron = Boolean(secret) && timingSafeStrEqual(auth, `Bearer ${secret}`)

  let authorized = viaCron
  if (!authorized) {
    const { user } = await (await getPayload()).auth({ headers: req.headers as Headers })
    // Feed ingestion is managing feed sources + creating news drafts, so gate on
    // feed-sources.manage (held by chancery-and-above by default).
    authorized = hasPermission(user as AuthUser | null, 'feed-sources.manage')
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
  const feedParam = url.searchParams.get('feed')
  const limit = Math.min(Number(url.searchParams.get('limit')) || 15, 50)
  const from = url.searchParams.get('from') ?? undefined
  const to = url.searchParams.get('to') ?? undefined
  // Dry-run: probe every configured source and return a diagnostic report
  // (status, format, item count, error) WITHOUT importing anything.
  const diagnose = ['1', 'true', 'yes'].includes(
    (url.searchParams.get('diagnose') ?? '').toLowerCase(),
  )

  try {
    const payload = await getPayload()
    const sources = await resolveSources(payload, feedParam)

    if (diagnose) {
      const report = []
      for (const source of sources) {
        const probe = await probeFeed(source.url, limit, { from, to })
        report.push({
          source: source.name,
          url: source.url,
          finalUrl: probe.finalUrl !== source.url ? probe.finalUrl : undefined,
          httpStatus: probe.httpStatus,
          format: probe.format,
          items: probe.itemCount,
          ok: probe.ok,
          error: probe.error,
        })
        await stampSource(payload, source, probe, { created: 0, skipped: 0 })
      }
      return NextResponse.json({ ok: true, diagnose: true, sources: report })
    }

    let created = 0
    let skipped = 0
    const errors: string[] = []
    const perSource: Array<{
      source: string
      url?: string
      httpStatus?: number | null
      format?: string
      items?: number
      created: number
      skipped: number
      error?: string
    }> = []

    for (const source of sources) {
      let sourceCreated = 0
      let sourceSkipped = 0

      // One unreachable or malformed feed must not abort the others. Record the
      // failure against that source and carry on.
      const probe = await probeFeed(source.url, limit, { from, to })
      if (!probe.ok) {
        const msg = (probe.error ?? 'unknown error').slice(0, 140)
        errors.push(`${source.name}: ${msg}`)
        perSource.push({
          source: source.name,
          url: source.url,
          httpStatus: probe.httpStatus,
          format: probe.format,
          items: 0,
          created: 0,
          skipped: 0,
          error: msg,
        })
        await stampSource(payload, source, probe, { created: 0, skipped: 0 })
        continue
      }
      const items: FeedItem[] = probe.items

      for (const item of items) {
        try {
          const collection = source.target
          // Dedupe on the original article URL (covers drafts, published and
          // rejected items alike) AND on the slug the title would generate —
          // an editor may already have written the same story by hand, and slug
          // is unique, so creating it would fail validation.
          const slug = deriveSlug(item.title, item.link)
          const existing = await payload.find({
            collection,
            where: {
              or: [
                { sourceUrl: { equals: item.link } },
                { slug: { equals: slug } },
              ],
            },
            limit: 1,
            depth: 0,
            overrideAccess: true,
          } as any)

          if (existing.totalDocs > 0) {
            sourceSkipped++
            continue
          }

          const featuredImage = item.imageUrl
            ? await importImage(payload, item.imageUrl, item.title)
            : null

          // Papal documents and news articles have different shapes; only the
          // fields each collection actually defines are sent.
          const shared = {
            title: item.title,
            // Pass the derived slug explicitly. The collection's slug hook only
            // auto-fills from the (Latin) title, which is empty for Tigrinya, so
            // without this the required field stays blank and validation fails.
            slug,
            excerpt: item.summary,
            publishedAt: item.publishedAt,
            ...(featuredImage ? { featuredImage } : {}),
            sourceUrl: item.link,
            _status: 'draft',
          }

          const data =
            collection === 'pope-messages'
              ? {
                  ...shared,
                  body: buildDraftBody(item.summary, item.link, source.name),
                  documentType: source.documentType,
                }
              : {
                  ...shared,
                  body: buildDraftBody(item.summary, item.link, source.name),
                  category: source.category,
                  sourceName: source.name,
                  isImported: true,
                  importedAt: new Date().toISOString(),
                  reviewStatus: 'pending',
                }

          await payload.create({
            collection,
            locale: 'en',
            overrideAccess: true,
            draft: true,
            data: data as any,
          })
          sourceCreated++
        } catch (err) {
          // A unique-constraint hit means an equivalent item already exists —
          // most often the auto-generated slug collides with one an editor wrote
          // by hand. That is a duplicate, not a failure.
          const msg = String(err)
          if (/unique|duplicate|already exists/i.test(msg)) {
            sourceSkipped++
          } else {
            errors.push(`${item.link}: ${msg.slice(0, 140)}`)
          }
        }
      }

      created += sourceCreated
      skipped += sourceSkipped
      perSource.push({
        source: source.name,
        url: source.url,
        httpStatus: probe.httpStatus,
        format: probe.format,
        items: probe.itemCount,
        created: sourceCreated,
        skipped: sourceSkipped,
      })
      await stampSource(payload, source, probe, {
        created: sourceCreated,
        skipped: sourceSkipped,
      })
    }

    return NextResponse.json({
      ok: true,
      sources: perSource,
      ...(from || to ? { window: { from: from ?? null, to: to ?? null } } : {}),
      fetched: perSource.length,
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

/**
 * Record the outcome on the source so staff can see per-source health in admin.
 *
 * Tracks consecutive failures so the health column distinguishes a one-off blip
 * (degraded) from a source that is consistently broken (failing after 3).
 */
async function stampSource(
  payload: Awaited<ReturnType<typeof getPayload>>,
  source: ResolvedSource,
  probe: { ok: boolean; httpStatus: number | null; format: string; itemCount: number; error?: string },
  counts: { created: number; skipped: number },
): Promise<void> {
  if (!source.id) return

  const failures = probe.ok ? 0 : source.consecutiveFailures + 1
  const healthStatus = probe.ok ? 'healthy' : failures >= 3 ? 'failing' : 'degraded'
  const lastStatus = probe.ok
    ? `${counts.created} created, ${counts.skipped} skipped (${probe.itemCount} in feed, ${probe.format.toUpperCase()})`
    : `Failed: ${(probe.error ?? 'unknown error').slice(0, 140)}`

  try {
    await payload.update({
      collection: 'feed-sources',
      id: source.id,
      overrideAccess: true,
      data: {
        lastFetchedAt: new Date().toISOString(),
        lastStatus,
        lastError: probe.ok ? null : (probe.error ?? 'unknown error').slice(0, 200),
        healthStatus,
        consecutiveFailures: failures,
        feedFormat: probe.format,
        lastItemCount: probe.ok ? probe.itemCount : source.consecutiveFailures ? undefined : 0,
      } as any,
    })
  } catch {
    // Reporting must never fail the import itself.
  }
}

/** GET mirrors POST so Vercel Cron (which issues GET) can trigger the same job. */
export async function GET(req: Request) {
  return POST(req)
}
