import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { RichText } from '@/components/shared/RichText'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { ReadingProgress } from '@/components/shared/ReadingProgress'
import { ShareButtons } from '@/components/shared/ShareButtons'
import { readingTimeFromLexical } from '@/lib/reading-time'
import { ArticleSidebar, type SidebarSection } from '@/features/articles/ArticleSidebar'
import { getLocale, getTranslations } from 'next-intl/server'
import {
  getBishopMessageBySlug,
  getBishopMessagesList,
  getMostViewedBishopMessages,
  getNewsList,
  getAdjacent,
} from '@/lib/payload/queries'

// This page resolves the active locale from the NEXT_LOCALE cookie, so it can
// never be statically generated. Marking it dynamic prevents Next from trying
// to prerender it on-demand, which failed with DYNAMIC_SERVER_USAGE (500) for
// any document created after the last deploy.
export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const msg = await getBishopMessageBySlug(slug)
  if (!msg) return {}
  return buildMetadata({
    title: msg.seo?.title ?? msg.title,
    description: msg.seo?.description ?? msg.excerpt,
    path: `/bishop-messages/${msg.slug}`,
    image: msg.seo?.ogImage?.url ?? msg.featuredImage?.url,
  })
}

const MESSAGE_TYPE_LABELS: Record<string, string> = {
  'pastoral-letter': 'Pastoral Letter',
  homily: 'Homily',
  'encyclical-response': 'Encyclical Response',
  christmas: 'Christmas Message',
  easter: 'Easter Message',
  extraordinary: 'Extraordinary Announcement',
  general: 'Message',
}

function formatDate(iso?: string) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default async function BishopMessageDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const locale = await getLocale()
  const t = await getTranslations('common')
  const msg = await getBishopMessageBySlug(slug, locale)
  if (!msg) notFound()

  const [allMessages, mostViewed, announcements, latestNews, adjacent] = await Promise.all([
    getBishopMessagesList(20, locale),
    getMostViewedBishopMessages(4, locale),
    getNewsList({ limit: 4, category: 'announcement', locale }).then((r) => r.docs),
    getNewsList({ limit: 3, locale }).then((r) => r.docs),
    getAdjacent('bishop-messages', msg.publishedAt, locale),
  ])

  const typeLabel = msg.messageType
    ? (MESSAGE_TYPE_LABELS[msg.messageType] ?? msg.messageType)
    : 'Message'
  const readingMinutes = readingTimeFromLexical(msg.content)

  const sections: SidebarSection[] = [
    {
      title: 'Related Messages',
      items: allMessages
        .filter((m) => m.slug !== slug && m.messageType === msg.messageType)
        .slice(0, 4)
        .map((m) => ({ href: `/bishop-messages/${m.slug}`, title: m.title, date: m.publishedAt })),
    },
    {
      title: 'Most Read Messages',
      items: mostViewed
        .filter((m) => m.slug !== slug)
        .map((m) => ({ href: `/bishop-messages/${m.slug}`, title: m.title, date: m.publishedAt, views: m.views })),
    },
    {
      title: 'Recent Messages',
      items: allMessages
        .filter((m) => m.slug !== slug)
        .slice(0, 4)
        .map((m) => ({ href: `/bishop-messages/${m.slug}`, title: m.title, date: m.publishedAt })),
    },
    {
      title: 'Diocesan Announcements',
      items: announcements.map((n) => ({
        href: `/news/${n.slug}`,
        title: n.title,
        date: n.publishedAt,
        imageUrl: n.featuredImage?.url ?? null,
      })),
    },
    {
      title: 'Suggested Reading',
      items: latestNews.map((n) => ({
        href: `/news/${n.slug}`,
        title: n.title,
        date: n.publishedAt,
        imageUrl: n.featuredImage?.url ?? null,
      })),
    },
  ]

  return (
    <>
      <ReadingProgress />
      <PageHeader
        title={typeLabel}
        breadcrumbs={[
          { label: "Bishop's Messages", href: '/bishop-messages' },
          { label: typeLabel },
        ]}
      />

      <Section className="bg-white">
        <Container>
          <div className="grid gap-10 lg:grid-cols-4">
            <article className="lg:col-span-3">
              {/* Featured image */}
              {msg.featuredImage && (
                <div className="mb-8 w-full overflow-hidden rounded-2xl bg-parchment-100">
                  <Image
                    src={msg.featuredImage.url}
                    alt={msg.featuredImage.alt}
                    width={msg.featuredImage.width ?? 1600}
                    height={msg.featuredImage.height ?? 900}
                    className="h-auto max-h-[75vh] w-full object-contain"
                    priority
                    sizes="(max-width: 1024px) 100vw, 75vw"
                  />
                </div>
              )}

              {/* Header */}
              <header className="mb-6">
                <span className="mb-4 inline-block rounded-full border border-maroon-200 bg-maroon-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-maroon-800">
                  {typeLabel}
                </span>
                <h1 className="mb-3 font-serif text-3xl font-bold leading-tight text-charcoal-900">
                  {msg.title}
                </h1>
                {msg.excerpt && (
                  <p className="mb-4 text-lg leading-relaxed text-charcoal-600">{msg.excerpt}</p>
                )}
                <div className="flex flex-wrap items-center gap-3 text-sm text-charcoal-400">
                  {msg.publishedAt && <time dateTime={msg.publishedAt}>{formatDate(msg.publishedAt)}</time>}
                  {readingMinutes && <span>· ⏱ {readingMinutes} min read</span>}
                </div>
              </header>

              <div className="mb-8">
                <ShareButtons title={msg.title} />
              </div>

              <hr className="divider-gold mb-8" />

              {/* Body */}
              {msg.content ? (
                <div className="mb-10">
                  <RichText data={msg.content} />
                </div>
              ) : (
                <p className="mb-10 italic text-charcoal-500">
                  The full text is available via the download link below.
                </p>
              )}

              {/* PDF download */}
              {msg.pdfUrl && (
                <div className="mt-8 flex items-center justify-between gap-4 rounded-xl border border-gold-200 bg-gold-50 px-6 py-4 print:hidden">
                  <div>
                    <p className="text-sm font-semibold text-charcoal-900">{t('downloadPDF')}</p>
                    <p className="text-xs text-charcoal-500">Full text of this message as a PDF.</p>
                  </div>
                  <a
                    href={msg.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex shrink-0 items-center gap-2 rounded-lg bg-maroon-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-maroon-700"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download
                  </a>
                </div>
              )}

              {/* Previous / next */}
              {(adjacent.prev || adjacent.next) && (
                <nav aria-label="More messages" className="mt-10 grid gap-4 border-t border-charcoal-100 pt-6 sm:grid-cols-2 print:hidden">
                  {adjacent.prev ? (
                    <Link href={`/bishop-messages/${adjacent.prev.slug}`} className="group rounded-xl border border-charcoal-100 p-4 transition-colors hover:border-maroon-300">
                      <span className="text-xs uppercase tracking-wide text-charcoal-400">← Older</span>
                      <span className="mt-1 line-clamp-2 block text-sm font-medium text-charcoal-800 group-hover:text-maroon-800">
                        {adjacent.prev.title}
                      </span>
                    </Link>
                  ) : (
                    <span />
                  )}
                  {adjacent.next && (
                    <Link href={`/bishop-messages/${adjacent.next.slug}`} className="group rounded-xl border border-charcoal-100 p-4 text-right transition-colors hover:border-maroon-300">
                      <span className="text-xs uppercase tracking-wide text-charcoal-400">Newer →</span>
                      <span className="mt-1 line-clamp-2 block text-sm font-medium text-charcoal-800 group-hover:text-maroon-800">
                        {adjacent.next.title}
                      </span>
                    </Link>
                  )}
                </nav>
              )}

              {/* Back link */}
              <div className="mt-8 print:hidden">
                <Link
                  href="/bishop-messages"
                  className="inline-flex items-center gap-2 text-sm font-medium text-maroon-700 transition-colors hover:text-maroon-900"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  All Bishop&apos;s Messages
                </Link>
              </div>
            </article>

            <div className="lg:col-span-1">
              <ArticleSidebar sections={sections} />
            </div>
          </div>
        </Container>
      </Section>
    </>
  )
}
