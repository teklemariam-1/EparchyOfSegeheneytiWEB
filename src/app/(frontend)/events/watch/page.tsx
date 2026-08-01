import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { EmptyState } from '@/components/shared/EmptyState'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { getLocale, getTranslations } from 'next-intl/server'
import { getEventsList } from '@/lib/payload/queries'
import { VideoEmbed } from '@/components/shared/VideoEmbed'
import { dateParts } from '@/lib/formatters/eventTime'

export const dynamic = 'force-dynamic'

/**
 * The liturgy archive — past celebrations that were streamed.
 *
 * For someone who could not be in Segheneyti for Fasika, this is the closest
 * thing to having been there. It is deliberately a filtered view of Events
 * rather than a second collection: a liturgy is already an event, and giving it
 * a separate home would mean staff maintaining the same celebration twice.
 *
 * Page size is a multiple of the desktop column count so a full page never
 * leaves a gap in the grid — the same rule the news listing follows.
 */
const PAGE_SIZE = 12

export const metadata: Metadata = buildMetadata({
  title: 'Watch',
  description: 'Recorded liturgies and celebrations from the Catholic Eparchy of Segheneyti.',
  path: '/events/watch',
})

export default async function WatchPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await searchParams
  const currentPage = Number(pageParam) || 1
  const locale = await getLocale()
  const [t, tn] = await Promise.all([getTranslations('events'), getTranslations('nav')])

  const { docs, meta } = await getEventsList({
    limit: PAGE_SIZE,
    page: currentPage,
    locale,
    withVideo: true,
  })

  return (
    <>
      <PageHeader
        title={t('watchTitle')}
        subtitle={t('watchSubtitle')}
        breadcrumbs={[
          { label: tn('home'), href: '/' },
          { label: t('title'), href: '/events' },
          { label: t('watchTitle') },
        ]}
      />

      <Section className="bg-white">
        <Container>
          {docs.length === 0 ? (
            <EmptyState title={t('watchEmptyTitle')} description={t('watchEmptyDescription')} />
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {docs.map((ev) => {
                const parts = dateParts(ev.startDate, locale)
                return (
                  <article key={ev.slug} className="flex flex-col">
                    <VideoEmbed
                      url={ev.videoUrl}
                      title={ev.title}
                      fallbackLabel={t('watchOnProvider')}
                    />
                    <h2 className="mt-3 font-serif text-base font-semibold leading-snug text-charcoal-900">
                      <Link
                        href={`/events/${ev.slug}`}
                        className="transition-colors hover:text-maroon-800"
                      >
                        {ev.title}
                      </Link>
                    </h2>
                    {parts && (
                      // Eparchy-zone date, matching every other surface.
                      <time className="mt-1 text-xs text-charcoal-500" dateTime={ev.startDate}>
                        {parts.day} {parts.month} {parts.year}
                      </time>
                    )}
                  </article>
                )
              })}
            </div>
          )}

          {meta.totalPages > 1 && (
            <div className="mt-10 flex justify-center gap-2">
              {meta.hasPrevPage && (
                <a
                  href={`/events/watch${meta.page - 1 > 1 ? `?page=${meta.page - 1}` : ''}`}
                  className="rounded border border-charcoal-200 px-4 py-2 text-sm text-charcoal-500 transition-colors hover:border-maroon-300 hover:text-maroon-700"
                >
                  ← {t('previous')}
                </a>
              )}
              <span className="rounded border border-maroon-700 bg-maroon-800 px-4 py-2 text-sm text-white">
                {meta.page} / {meta.totalPages}
              </span>
              {meta.hasNextPage && (
                <a
                  href={`/events/watch?page=${meta.page + 1}`}
                  className="rounded border border-charcoal-200 px-4 py-2 text-sm text-charcoal-500 transition-colors hover:border-maroon-300 hover:text-maroon-700"
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
