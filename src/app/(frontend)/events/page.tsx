import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { EventCard, type EventCardData } from '@/features/events/EventCard'
import { EmptyState } from '@/components/shared/EmptyState'

export const revalidate = 300

export const metadata: Metadata = buildMetadata({
  title: 'Events',
  description: 'Upcoming liturgical celebrations, community gatherings, and special occasions in the Catholic Eparchy of Segeneyti.',
  path: '/events',
})

// Mock data — real fetch via Payload in Stage 5
const UPCOMING: EventCardData[] = [
  {
    slug: 'feast-of-st-michael-2025',
    title: 'Feast of Saint Michael the Archangel',
    excerpt: 'The patron feast of Segeneyti Cathedral. Solemn Mass, procession, and community celebrations throughout the day.',
    eventType: 'liturgical',
    startDate: '2025-01-12T08:00:00Z',
    location: 'Segeneyti Cathedral',
  },
  {
    slug: 'diocesan-clergy-retreat-2025',
    title: 'Annual Clergy Retreat',
    excerpt: 'All eparchial priests are invited to the annual retreat led by a guest retreat master. Registration required.',
    eventType: 'retreat',
    startDate: '2025-01-20T07:00:00Z',
    endDate: '2025-01-24T18:00:00Z',
    location: 'Comboni House, Asmara',
  },
  {
    slug: 'ordination-diaconate-2025',
    title: 'Ordination to the Diaconate',
    excerpt: 'Three seminarians will be ordained deacons by the Bishop of Segeneyti. Family and faithful are warmly invited.',
    eventType: 'ordination',
    startDate: '2025-02-08T09:00:00Z',
    location: 'Segeneyti Cathedral',
  },
  {
    slug: 'lenten-youth-retreat-2025',
    title: 'Lenten Youth Retreat — "Walk in the Light"',
    excerpt: 'The annual diocesan youth retreat, open to all young people aged 16–30. Workshops, testimonies, and Eucharistic adoration.',
    eventType: 'youth',
    startDate: '2025-03-07T08:00:00Z',
    endDate: '2025-03-09T17:00:00Z',
    location: 'Adi Keyih Parish Centre',
  },
  {
    slug: 'pilgrimage-qohaito-2025',
    title: 'Annual Pilgrimage to Qohaito',
    excerpt: 'The traditional pilgrimage to the ancient ruins of Qohaito, blending historical reflection and Marian prayer.',
    eventType: 'pilgrimage',
    startDate: '2025-04-26T06:00:00Z',
    location: 'Qohaito, Eritrea',
  },
]

const PAST: EventCardData[] = [
  {
    slug: 'youth-day-segeneyti-2024',
    title: 'Diocesan Youth Day 2024',
    excerpt: 'Over 800 young people gathered in Segeneyti around the theme "Walk in the Light."',
    eventType: 'youth',
    startDate: '2024-11-15T08:00:00Z',
    location: 'Segeneyti',
    isPast: true,
  },
  {
    slug: 'synod-autumn-2024',
    title: "Bishops' Conference Autumn Synod",
    excerpt: 'The Eritrean Catholic Bishops concluded their autumn plenary with a joint communiqué.',
    eventType: 'diocesan',
    startDate: '2024-11-04T09:00:00Z',
    endDate: '2024-11-06T17:00:00Z',
    location: 'Asmara',
    isPast: true,
  },
]

export default function EventsPage() {
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
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
              {UPCOMING.length} scheduled
            </span>
          </div>

          {UPCOMING.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {UPCOMING.map((ev) => (
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
      <Section className="bg-parchment-50">
        <Container>
          <h2 className="text-xl font-serif font-semibold text-charcoal-900 mb-6">
            Past Events
          </h2>

          {PAST.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {PAST.map((ev) => (
                <EventCard key={ev.slug} event={ev} />
              ))}
            </div>
          ) : (
            <EmptyState title="No past events recorded" description="" />
          )}
        </Container>
      </Section>
    </>
  )
}
