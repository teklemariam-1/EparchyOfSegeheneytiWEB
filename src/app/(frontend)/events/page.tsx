import type { Metadata } from 'next'
import { Suspense } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { EventCard, type EventCardData } from '@/features/events/EventCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { FilterBar } from '@/components/shared/FilterBar'
import { getLocale, getTranslations } from 'next-intl/server'
import { getEventsList, getEventTypes } from '@/lib/payload/queries'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = buildMetadata({
  title: 'Events',
  description: 'Upcoming liturgical celebrations, community gatherings, and special occasions in the Catholic Eparchy of Segeneyti.',
  path: '/events',
})

/** Fallback if the Event Types collection is empty/unreachable. */
const DEFAULT_TYPES = [
  { value: 'liturgical', label: 'Liturgical' },
  { value: 'feast', label: 'Feast Day' },
  { value: 'youth', label: 'Youth' },
  { value: 'community', label: 'Community' },
  { value: 'education', label: 'Education' },
  { value: 'social', label: 'Social Ministry' },
  { value: 'pilgrimage', label: 'Pilgrimage' },
  { value: 'conference', label: 'Conference' },
]

function toCard(ev: Awaited<ReturnType<typeof getEventsList>>['docs'][number], isPast = false): EventCardData {
  return {
    slug: ev.slug,
    title: ev.title,
    excerpt: ev.excerpt ?? '',
    eventType: ev.eventType ?? 'community',
    startDate: ev.startDate,
    endDate: ev.endDate,
    location: ev.location?.venue ?? ev.location?.city,
    imageUrl: ev.featuredImage?.url,
    isPast,
  }
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>
}) {
  const { type } = await searchParams
  const locale = await getLocale()
  const t = await getTranslations('events')
  const [{ docs: upcoming }, { docs: past }, managedTypes] = await Promise.all([
    getEventsList({ upcoming: true, limit: 12, eventType: type, locale }),
    getEventsList({ upcoming: false, limit: 8, eventType: type, locale }),
    getEventTypes(),
  ])

  // Filter buttons come from the admin-managed Event Types collection.
  const filterOptions = [
    { value: 'all', label: 'All' },
    ...(managedTypes.length ? managedTypes : DEFAULT_TYPES),
  ]
  const isFiltered = Boolean(type && type !== 'all')

  const upcomingCards = upcoming.map((ev) => toCard(ev, false))
  // Past = events with startDate in the past
  const now = new Date()
  const pastCards = past
    .filter((ev) => new Date(ev.startDate) < now)
    .map((ev) => toCard(ev, true))

  return (
    <>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        breadcrumbs={[{ label: t('title') }]}
      />

      {/* ── Upcoming ─────────────────────────────────────────────── */}
      <Section className="bg-white">
        <Container>
          <Suspense fallback={<div className="h-12 mb-8" />}>
            <FilterBar options={filterOptions} paramName="type" />
          </Suspense>

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-serif font-semibold text-charcoal-900">
              Upcoming Events
            </h2>
            {upcomingCards.length > 0 && (
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                {upcomingCards.length} scheduled
              </span>
            )}
          </div>

          {upcomingCards.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {upcomingCards.map((ev) => (
                <EventCard key={ev.slug} event={ev} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No upcoming events"
              description={
                isFiltered
                  ? 'No upcoming events of this type — try another filter.'
                  : 'Check back soon for the next Eparchy events.'
              }
            />
          )}
        </Container>
      </Section>

      {/* ── Past ─────────────────────────────────────────────────── */}
      {pastCards.length > 0 && (
        <Section className="bg-parchment-50">
          <Container>
            <h2 className="text-xl font-serif font-semibold text-charcoal-900 mb-6">
              Past Events
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {pastCards.map((ev) => (
                <EventCard key={ev.slug} event={ev} />
              ))}
            </div>
          </Container>
        </Section>
      )}
    </>
  )
}
