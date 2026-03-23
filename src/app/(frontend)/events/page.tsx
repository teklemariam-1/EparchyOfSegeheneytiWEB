import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { EventCard, type EventCardData } from '@/features/events/EventCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { getEventsList } from '@/lib/payload/queries'

export const revalidate = 300

export const metadata: Metadata = buildMetadata({
  title: 'Events',
  description: 'Upcoming liturgical celebrations, community gatherings, and special occasions in the Catholic Eparchy of Segeneyti.',
  path: '/events',
})

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

export default async function EventsPage() {
  const [{ docs: upcoming }, { docs: past }] = await Promise.all([
    getEventsList({ upcoming: true, limit: 12 }),
    getEventsList({ upcoming: false, limit: 8 }),
  ])

  const upcomingCards = upcoming.map((ev) => toCard(ev, false))
  // Past = events with startDate in the past
  const now = new Date()
  const pastCards = past
    .filter((ev) => new Date(ev.startDate) < now)
    .map((ev) => toCard(ev, true))

  return (
    <>
      <PageHeader
        title="Events"
        subtitle="Liturgical celebrations, community gatherings, and special occasions across the Eparchy."
        breadcrumbs={[{ label: 'Events' }]}
      />

      {/* ── Upcoming ─────────────────────────────────────────────── */}
      <Section className="bg-white">
        <Container>
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
              description="Check back soon for the next Eparchy events."
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


