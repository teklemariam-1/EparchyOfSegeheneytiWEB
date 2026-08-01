import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/formatters/date'
import { RichText } from '@/components/shared/RichText'
import { JsonLd } from '@/components/seo/JsonLd'
import { articleSchema } from '@/lib/seo/structuredData'
import { ReadingProgress } from '@/components/shared/ReadingProgress'
import { ShareButtons } from '@/components/shared/ShareButtons'
import { VideoEmbed } from '@/components/shared/VideoEmbed'
import { readingTimeFromLexical } from '@/lib/reading-time'
import { ArticleSidebar, type SidebarSection } from '@/features/articles/ArticleSidebar'
import { getLocale, getTranslations } from 'next-intl/server'
import {
  getNewsBySlug,
  getNewsList,
  getNewsCategories,
  getMostViewedNews,
  getUpcomingEvents,
  getMediaGallery,
  getBishopMessagesList,
  getPopeMessagesList,
  getAdjacent,
} from '@/lib/payload/queries'

// This page resolves the active locale from the NEXT_LOCALE cookie, so it can
// never be statically generated. Marking it dynamic prevents Next from trying
// to prerender it on-demand, which failed with DYNAMIC_SERVER_USAGE (500) for
// any document created after the last deploy.
export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const article = await getNewsBySlug(slug)
  // Bail out before fabricating metadata for an article that does not exist —
  // without this the page advertises a title like "News — no-such-article".
  //
  // NOTE: this does NOT fix the response status. On Next 15.2.9 these pages
  // answer a missing slug with the not-found UI but HTTP 200 (a soft 404),
  // whether notFound() is called here or in the component below; it was tried
  // in both places. Unmatched routes with no page at all still 404 correctly.
  // See docs/known-issues.md for what has been ruled out.
  if (!article) notFound()
  return buildMetadata({
    title: article?.seo?.title ?? article?.title ?? `News — ${slug}`,
    description: article?.seo?.description ?? article?.excerpt,
    // Falls back to the featured image, then to the site default, so a shared
    // link is never imageless just because nobody filled in the SEO group.
    image: article?.seo?.ogImage?.url ?? article?.featuredImage?.url,
    path: `/news/${slug}`,
  })
}

export default async function NewsDetailPage({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const tc = await getTranslations('common')
  const article = await getNewsBySlug(slug, locale)
  if (!article) notFound()

  const [
    { docs: latest },
    relatedByCategory,
    mostViewed,
    eparchyNews,
    events,
    categories,
    { docs: recentMedia },
    bishopMsgs,
    popeMsgs,
    adjacent,
  ] = await Promise.all([
    getNewsList({ limit: 5, locale }),
    article.category
      ? getNewsList({ limit: 5, category: article.category, locale }).then((r) => r.docs)
      : Promise.resolve([]),
    getMostViewedNews(4, locale),
    getNewsList({ limit: 5, category: 'eparchy', locale }).then((r) => r.docs),
    getUpcomingEvents(4, locale),
    getNewsCategories(),
    getMediaGallery({ limit: 6 }),
    getBishopMessagesList(2, locale),
    getPopeMessagesList(2, locale),
    getAdjacent('news', article.publishedAt, locale),
  ])

  const categoryLabel =
    categories.find((c) => c.value === article.category)?.label ??
    (article.category ? article.category.charAt(0).toUpperCase() + article.category.slice(1) : 'News')
  const readingMinutes = readingTimeFromLexical(article.content)

  const toRow = (r: { slug: string; title: string; publishedAt?: string; featuredImage?: { url: string } | null }) => ({
    href: `/news/${r.slug}`,
    title: r.title,
    date: r.publishedAt,
    imageUrl: r.featuredImage?.url ?? null,
  })

  const sections: SidebarSection[] = [
    {
      title: 'Related News',
      items: relatedByCategory.filter((r) => r.slug !== slug).slice(0, 4).map(toRow),
    },
    {
      title: 'Most Read',
      items: mostViewed
        .filter((r) => r.slug !== slug)
        .map((r) => ({ ...toRow(r), views: r.views })),
    },
    {
      title: 'Latest News',
      items: latest.filter((r) => r.slug !== slug).slice(0, 4).map(toRow),
    },
    {
      title: 'Eparchy News',
      items: article.category === 'eparchy' ? [] : eparchyNews.filter((r) => r.slug !== slug).slice(0, 4).map(toRow),
    },
    {
      title: 'Suggested Reading',
      items: [
        ...bishopMsgs.map((m) => ({ href: `/bishop-messages/${m.slug}`, title: m.title, date: m.publishedAt })),
        ...popeMsgs.map((m) => ({ href: `/pope-messages/${m.slug}`, title: m.title, date: m.publishedAt })),
      ],
    },
  ]

  return (
    <>
      <ReadingProgress />
      {article.publishedAt && (
        <JsonLd
          data={articleSchema({
            title: article.title,
            description: article.excerpt,
            imageUrl: article.featuredImage?.url,
            publishedAt: article.publishedAt,
            slug,
          })}
        />
      )}
      <PageHeader
        title={article.title}
        breadcrumbs={[{ label: 'News', href: '/news' }, { label: article.title }]}
      />

      <Section className="bg-white">
        <Container>
          <div className="grid gap-10 lg:grid-cols-4">
            {/* Main article (~75%) */}
            <article className="lg:col-span-3">
              {/* Meta row */}
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <Badge variant="maroon">{categoryLabel}</Badge>
                {article.publishedAt && (
                  <time className="text-sm text-charcoal-400" dateTime={article.publishedAt}>
                    {formatDate(article.publishedAt)}
                  </time>
                )}
                {article.author && (
                  <>
                    <span className="text-sm text-charcoal-400">·</span>
                    <span className="text-sm text-charcoal-500">By {article.author}</span>
                  </>
                )}
                {readingMinutes && (
                  <>
                    <span className="text-sm text-charcoal-400">·</span>
                    <span className="text-sm text-charcoal-500">⏱ {readingMinutes} min read</span>
                  </>
                )}
              </div>

              <div className="mb-6">
                <ShareButtons title={article.title} />
              </div>

              {/* The video, when there is one, takes the place of the featured
                  image at the top: a reader who came for the recording should
                  not have to scroll past a still of the same event to reach it.
                  Renders nothing when the link is absent or unplayable. */}
              <VideoEmbed
                url={article.videoUrl}
                title={article.title}
                fallbackLabel={tc('watchOnProvider')}
                className="mb-8"
              />

              {/* Featured image, shown uncropped at the uploaded aspect ratio. */}
              {article.videoUrl ? null : article.featuredImage?.url ? (
                <div className="mb-8 overflow-hidden rounded-xl bg-parchment-100">
                  <Image
                    src={article.featuredImage.url}
                    alt={article.featuredImage.alt}
                    width={article.featuredImage.width ?? 1600}
                    height={article.featuredImage.height ?? 900}
                    className="h-auto max-h-[75vh] w-full object-contain"
                    priority
                    sizes="(max-width: 1024px) 100vw, 75vw"
                  />
                </div>
              ) : (
                <div className="mb-8 flex h-64 items-center justify-center rounded-xl bg-parchment-100 md:h-80">
                  <svg className="h-16 w-16 text-maroon-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}

              {/* Rich text content */}
              {article.content ? (
                <RichText data={article.content} />
              ) : article.excerpt ? (
                <div className="prose prose-eparchy max-w-none">
                  <p className="lead">{article.excerpt}</p>
                </div>
              ) : null}

              {/* Photo gallery — uncropped, one per row, captions beneath. */}
              {article.gallery && article.gallery.length > 0 && (
                <div className="mt-10 space-y-6">
                  {article.gallery.map((item, i) => (
                    <figure key={i}>
                      <div className="overflow-hidden rounded-xl bg-parchment-100">
                        <Image
                          src={item.image.url}
                          alt={item.image.alt || item.caption || article.title}
                          width={item.image.width ?? 1600}
                          height={item.image.height ?? 900}
                          className="h-auto max-h-[75vh] w-full object-contain"
                          sizes="(max-width: 1024px) 100vw, 75vw"
                        />
                      </div>
                      {item.caption && (
                        <figcaption className="mt-2 text-sm text-charcoal-500">{item.caption}</figcaption>
                      )}
                    </figure>
                  ))}
                </div>
              )}

              {/* Source attribution (optional) */}
              {article.sourceUrl && (
                <p className="mt-8 text-sm text-charcoal-500">
                  Source:{' '}
                  <a
                    href={article.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="font-medium text-maroon-700 underline underline-offset-2 transition-colors hover:text-maroon-900"
                  >
                    {article.sourceName || hostnameOf(article.sourceUrl)}
                  </a>
                </p>
              )}

              {/* Tags */}
              {article.tags && article.tags.length > 0 && (
                <div className="mt-8 flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <Badge key={tag} variant="neutral">{tag}</Badge>
                  ))}
                </div>
              )}

              {/* Previous / next article navigation */}
              {(adjacent.prev || adjacent.next) && (
                <nav
                  aria-label="More news"
                  className="mt-10 grid gap-4 border-t border-charcoal-100 pt-6 sm:grid-cols-2 print:hidden"
                >
                  {adjacent.prev ? (
                    <Link href={`/news/${adjacent.prev.slug}`} className="group rounded-xl border border-charcoal-100 p-4 transition-colors hover:border-maroon-300">
                      <span className="text-xs uppercase tracking-wide text-charcoal-400">← Older</span>
                      <span className="mt-1 line-clamp-2 block text-sm font-medium text-charcoal-800 group-hover:text-maroon-800">
                        {adjacent.prev.title}
                      </span>
                    </Link>
                  ) : (
                    <span />
                  )}
                  {adjacent.next && (
                    <Link href={`/news/${adjacent.next.slug}`} className="group rounded-xl border border-charcoal-100 p-4 text-right transition-colors hover:border-maroon-300">
                      <span className="text-xs uppercase tracking-wide text-charcoal-400">Newer →</span>
                      <span className="mt-1 line-clamp-2 block text-sm font-medium text-charcoal-800 group-hover:text-maroon-800">
                        {adjacent.next.title}
                      </span>
                    </Link>
                  )}
                </nav>
              )}

              <div className="mt-8 print:hidden">
                <Link href="/news" className="text-sm font-medium text-maroon-700 transition-colors hover:text-maroon-900">
                  ← Back to News
                </Link>
              </div>
            </article>

            {/* Sidebar (~25%) */}
            <div className="lg:col-span-1">
              <ArticleSidebar
                sections={sections}
                events={{ title: 'Upcoming Events', items: events }}
                categories={{
                  title: 'Categories',
                  items: categories,
                  hrefFor: (v) => `/news?category=${v}`,
                }}
                recentMedia={{ title: 'Recent Media', items: recentMedia, href: '/media' }}
              />
            </div>
          </div>
        </Container>
      </Section>
    </>
  )
}
