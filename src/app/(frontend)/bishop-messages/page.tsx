import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { EmptyState } from '@/components/shared/EmptyState'
import { SegmentedFilter, type Segment } from '@/components/shared/SegmentedFilter'
import { MagazineCard } from '@/components/shared/MagazineCard'
import { getLocale, getTranslations } from 'next-intl/server'
import { getBishopMessagesPage, getBishopMessageTypeCounts } from '@/lib/payload/queries'

// Reads the locale cookie via getLocale(), so this page can never be
// statically generated (same empty-prerender failure the pope-messages list
// hit). Data-layer caching still applies via cachedQuery.
export const dynamic = 'force-dynamic'

/** Full-width magazine cards — 8 per page keeps the page a comfortable length. */
const PAGE_SIZE = 8

export const metadata: Metadata = buildMetadata({
  title: "Bishop's Messages",
  description:
    "Pastoral letters, homilies, Christmas and Easter messages from the Bishop of the Catholic Eparchy of Segheneyti.",
  path: '/bishop-messages',
})

/** Order fixed by the collection's select options; the filter follows it. */
const MESSAGE_TYPES = [
  'pastoral-letter',
  'homily',
  'encyclical-response',
  'christmas',
  'easter',
  'extraordinary',
  'general',
] as const

function formatDate(iso?: string) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default async function BishopMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; type?: string }>
}) {
  const { page: pageParam, type: typeParam } = await searchParams
  const currentPage = Number(pageParam) || 1
  // Only known types filter; an unknown ?type falls back to "all" instead of 404ing.
  const activeType = MESSAGE_TYPES.includes(typeParam as any) ? typeParam : undefined
  const locale = await getLocale()
  const t = await getTranslations('bishopMessages')

  const [{ docs: messages, meta }, typeCounts] = await Promise.all([
    getBishopMessagesPage({ limit: PAGE_SIZE, page: currentPage, locale, messageType: activeType }),
    getBishopMessageTypeCounts(),
  ])

  const href = (opts: { type?: string; page?: number }) => {
    const params = new URLSearchParams()
    if (opts.type) params.set('type', opts.type)
    if (opts.page && opts.page > 1) params.set('page', String(opts.page))
    const qs = params.toString()
    return qs ? `/bishop-messages?${qs}` : '/bishop-messages'
  }

  const totalCount = Object.values(typeCounts).reduce((a, b) => a + b, 0)
  const segments: Segment[] = [
    { value: 'all', label: t('all'), count: totalCount, href: href({}), active: !activeType },
    // Only types that actually have published messages get a segment.
    ...MESSAGE_TYPES.filter((type) => (typeCounts[type] ?? 0) > 0).map((type) => ({
      value: type,
      label: t(`types.${type}`),
      count: typeCounts[type],
      href: href({ type }),
      active: activeType === type,
    })),
  ]

  return (
    <>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        breadcrumbs={[{ label: t('title') }]}
      />

      <Section className="bg-white">
        <Container>
          <SegmentedFilter segments={segments} ariaLabel={t('filterLabel')} />

          {messages.length === 0 ? (
            <EmptyState
              title="No messages yet"
              description="Bishop's messages will appear here once published in the CMS."
            />
          ) : (
            <div className="mx-auto max-w-5xl space-y-5">
              {messages.map((msg) => (
                <MagazineCard
                  key={msg.id}
                  href={`/bishop-messages/${msg.slug}`}
                  badge={
                    msg.messageType && MESSAGE_TYPES.includes(msg.messageType as any)
                      ? t(`types.${msg.messageType}`)
                      : (msg.messageType ?? 'Message')
                  }
                  title={msg.title}
                  excerpt={msg.excerpt}
                  dateISO={msg.publishedAt}
                  dateLabel={formatDate(msg.publishedAt)}
                  image={msg.featuredImage}
                  hasPdf={Boolean(msg.pdfUrl)}
                  featuredLabel={msg.isFeatured ? t('featured') : undefined}
                  tone="maroon"
                />
              ))}
            </div>
          )}

          {meta.totalPages > 1 && (
            <div className="mt-10 flex justify-center gap-2">
              {meta.hasPrevPage && (
                <a
                  href={href({ type: activeType, page: meta.page - 1 })}
                  className="rounded border border-charcoal-200 px-4 py-2 text-sm text-charcoal-500 hover:border-maroon-300 hover:text-maroon-700 transition-colors"
                >
                  ← {t('previous')}
                </a>
              )}
              <span className="rounded border border-maroon-700 bg-maroon-800 px-4 py-2 text-sm text-white">
                {meta.page} / {meta.totalPages}
              </span>
              {meta.hasNextPage && (
                <a
                  href={href({ type: activeType, page: meta.page + 1 })}
                  className="rounded border border-charcoal-200 px-4 py-2 text-sm text-charcoal-500 hover:border-maroon-300 hover:text-maroon-700 transition-colors"
                >
                  {t('next')} →
                </a>
              )}
            </div>
          )}
        </Container>
      </Section>
    </>
  )
}
