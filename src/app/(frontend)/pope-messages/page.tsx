import type { Metadata } from 'next'
import Image from 'next/image'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { EmptyState } from '@/components/shared/EmptyState'
import { SegmentedFilter, type Segment } from '@/components/shared/SegmentedFilter'
import { MagazineCard } from '@/components/shared/MagazineCard'
import { getLocale, getTranslations } from 'next-intl/server'
import {
  getPopeMessagesPage,
  getPopeMessageTypeCounts,
  getPopeSettings,
  type PopeSettingsData,
} from '@/lib/payload/queries'

// Reads the locale cookie via getLocale(), so this page can never be
// statically generated: the ISR prerender baked an empty list (the data fetch
// fails outside a request scope and the [] fallback was cached), leaving
// published messages invisible here while detail pages showed them.
export const dynamic = 'force-dynamic'

/** Full-width magazine cards — 8 per page keeps the page a comfortable length. */
const PAGE_SIZE = 8

export const metadata: Metadata = buildMetadata({
  title: 'Messages from the Holy Father',
  description:
    'Papal encyclicals, apostolic exhortations, letters, and messages from the Holy Father, shared with the faithful of the Catholic Eparchy of Segheneyti.',
  path: '/pope-messages',
})

/** Order fixed by the collection's select options; the filter follows it. */
const DOCUMENT_TYPES = [
  'encyclical',
  'apostolic-exhortation',
  'apostolic-letter',
  'apostolic-constitution',
  'message',
  'homily',
  'audience',
  'other',
] as const

function formatDate(iso?: string) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default async function PopeMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; type?: string }>
}) {
  const { page: pageParam, type: typeParam } = await searchParams
  const currentPage = Number(pageParam) || 1
  // Only known types filter; an unknown ?type falls back to "all" instead of 404ing.
  const activeType = DOCUMENT_TYPES.includes(typeParam as any) ? typeParam : undefined
  const locale = await getLocale()
  const t = await getTranslations('popeMessages')

  const [{ docs: messages, meta }, typeCounts, pope] = await Promise.all([
    getPopeMessagesPage({ limit: PAGE_SIZE, page: currentPage, locale, documentType: activeType }),
    getPopeMessageTypeCounts(),
    getPopeSettings(locale),
  ])

  const href = (opts: { type?: string; page?: number }) => {
    const params = new URLSearchParams()
    if (opts.type) params.set('type', opts.type)
    if (opts.page && opts.page > 1) params.set('page', String(opts.page))
    const qs = params.toString()
    return qs ? `/pope-messages?${qs}` : '/pope-messages'
  }

  const totalCount = Object.values(typeCounts).reduce((a, b) => a + b, 0)
  const segments: Segment[] = [
    { value: 'all', label: t('all'), count: totalCount, href: href({}), active: !activeType },
    // Only types that actually have published documents get a segment.
    ...DOCUMENT_TYPES.filter((type) => (typeCounts[type] ?? 0) > 0).map((type) => ({
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
          {pope.name && <CurrentPopeCard pope={pope} t={t} />}

          <SegmentedFilter segments={segments} ariaLabel={t('filterLabel')} />

          {messages.length === 0 ? (
            <EmptyState
              title="No documents yet"
              description="Papal documents and messages will appear here once published in the CMS."
            />
          ) : (
            <div className="mx-auto max-w-5xl space-y-5">
              {messages.map((msg) => (
                <MagazineCard
                  key={msg.id}
                  href={`/pope-messages/${msg.slug}`}
                  badge={
                    msg.documentType && DOCUMENT_TYPES.includes(msg.documentType as any)
                      ? t(`types.${msg.documentType}`)
                      : (msg.documentType ?? 'Document')
                  }
                  title={msg.title}
                  excerpt={msg.excerpt}
                  dateISO={msg.publishedAt}
                  dateLabel={formatDate(msg.publishedAt)}
                  image={msg.featuredImage}
                  hasPdf={Boolean(msg.pdfUrl)}
                  tone="gold"
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

// ─── Current Pope ──────────────────────────────────────────────────────────────

function CurrentPopeCard({
  pope,
  t,
}: {
  pope: PopeSettingsData
  t: (key: string, values?: Record<string, string | number | Date>) => string
}) {
  const elected = formatDate(pope.electedAt)

  return (
    <div className="mb-10 flex flex-col sm:flex-row gap-6 rounded-2xl border border-gold-200 bg-gold-50/50 p-6 sm:p-8">
      {pope.photo?.url && (
        <div className="relative h-48 w-40 shrink-0 self-center sm:self-start overflow-hidden rounded-xl border border-gold-200 bg-white">
          <Image
            src={pope.photo.url}
            alt={pope.photo.alt || pope.name || ''}
            fill
            sizes="160px"
            className="object-cover object-top"
          />
        </div>
      )}

      <div className="min-w-0 text-center sm:text-left">
        <p className="text-xs font-semibold uppercase tracking-wider text-gold-800 mb-1">
          {t('currentPopeHeading')}
        </p>
        <h2 className="font-serif text-2xl font-semibold text-charcoal-900">{pope.name}</h2>
        {pope.title && <p className="mt-1 text-sm text-maroon-700">{pope.title}</p>}
        {elected && (
          <p className="mt-1 text-xs text-charcoal-400">{t('since', { date: elected })}</p>
        )}
        {pope.bio && <p className="mt-3 text-sm leading-relaxed text-charcoal-600">{pope.bio}</p>}
        {pope.vaticanUrl && (
          <a
            href={pope.vaticanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-sm font-medium text-maroon-700 hover:text-maroon-800 underline underline-offset-2"
          >
            {t('vaticanProfile')}
          </a>
        )}
      </div>
    </div>
  )
}
