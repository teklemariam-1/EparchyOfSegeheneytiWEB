import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { Badge } from '@/components/ui/Badge'
import { formatDate, formatDateRange } from '@/lib/formatters/date'
import Link from 'next/link'

export const revalidate = 300

interface Props {
  params: Promise<{ slug: string }>
}

type EventDetail = {
  title: string
  eventType: string
  startDate: string
  endDate?: string
  isAllDay: boolean
  location?: string
  address?: string
  mapUrl?: string
  description: string[]
  geezCalendarNote?: string
  contactEmail?: string
}

const MOCK_EVENTS: Record<string, EventDetail> = {
  'feast-of-st-michael-2025': {
    title: 'Feast of Saint Michael the Archangel',
    eventType: 'liturgical',
    startDate: '2025-01-12T08:00:00Z',
    isAllDay: false,
    location: 'Segeneyti Cathedral',
    address: 'Segeneyti, Southern Zoba, Eritrea',
    description: [
      'The Feast of Saint Michael the Archangel is the principal patronal feast of Segeneyti Cathedral and one of the most significant celebrations in the liturgical calendar of the Eparchy.',
      'The solemnities begin with the Vigil Mass on the evening before. The feast day itself opens with Lauds sung in Ge\'ez and culminates in a Solemn Pontifical Mass presided over by the Bishop, followed by a colourful procession through the streets of Segeneyti.',
      'All parishioners and pilgrims from across the Eparchy are warmly welcome. Traditional food stalls and cultural performances accompany the community celebrations throughout the afternoon.',
    ],
    geezCalendarNote: 'Corresponding to Tahsas 4 in the Ge\'ez calendar year 2017 E.C.',
    contactEmail: 'segeneyti.cathedral@eparchy.er',
  },
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const ev = MOCK_EVENTS[slug]
  return buildMetadata({
    title: ev?.title ?? `Event — ${slug}`,
    description: ev?.description[0],
    path: `/events/${slug}`,
  })
}

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params
  const ev: EventDetail = MOCK_EVENTS[slug] ?? {
    title: decodeURIComponent(slug).replace(/-/g, ' '),
    eventType: 'diocesan',
    startDate: new Date().toISOString(),
    isAllDay: false,
    description: ['Full event details will be available once this page is connected to the CMS in Stage 5.'],
  }

  const typeLabel = ev.eventType.charAt(0).toUpperCase() + ev.eventType.slice(1).replace(/-/g, ' ')
  const start = new Date(ev.startDate)
  const dateLabel = ev.endDate ? formatDateRange(ev.startDate, ev.endDate) : formatDate(ev.startDate)

  return (
    <>
      <PageHeader
        title={ev.title}
        breadcrumbs={[{ label: 'Events', href: '/events' }, { label: ev.title }]}
      />

      <Section className="bg-white">
        <Container>
          <div className="grid lg:grid-cols-3 gap-10">
            {/* Main detail */}
            <article className="lg:col-span-2">
              {/* Event hero card */}
              <div className="mb-8 rounded-xl bg-parchment-50 border border-parchment-200 p-6 flex flex-col sm:flex-row gap-6 items-start">
                {/* Big date */}
                <div className="shrink-0 flex flex-col items-center rounded-xl bg-maroon-800 text-white px-6 py-4 min-w-[80px] text-center">
                  <span className="text-xs font-medium uppercase tracking-wide text-maroon-200">
                    {start.toLocaleDateString('en-US', { month: 'short' })}
                  </span>
                  <span className="text-4xl font-bold leading-none my-1">{start.getDate()}</span>
                  <span className="text-xs text-maroon-200">{start.getFullYear()}</span>
                </div>

                <div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <Badge variant="maroon">{typeLabel}</Badge>
                    {ev.isAllDay && <Badge variant="gold">All day</Badge>}
                  </div>
                  <p className="text-sm font-medium text-charcoal-700">
                    📅 {dateLabel}
                    {!ev.isAllDay && (
                      <span className="text-charcoal-400">
                        {' '}at {start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </p>
                  {ev.location && (
                    <p className="mt-1 text-sm text-charcoal-600">
                      📍 {ev.location}
                      {ev.address && <span className="text-charcoal-400"> · {ev.address}</span>}
                    </p>
                  )}
                  {ev.geezCalendarNote && (
                    <p className="mt-2 text-xs text-gold-700 font-medium">
                      🌙 {ev.geezCalendarNote}
                    </p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="prose prose-eparchy max-w-none">
                {ev.description.map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>

              {/* Back link */}
              <div className="mt-10 border-t border-charcoal-100 pt-6">
                <Link
                  href="/events"
                  className="text-sm font-medium text-maroon-700 hover:text-maroon-900 transition-colors"
                >
                  ← All Events
                </Link>
              </div>
            </article>

            {/* Sidebar */}
            <aside className="space-y-6">
              {/* Contact */}
              {ev.contactEmail && (
                <div className="card p-5">
                  <h3 className="font-serif text-sm font-semibold text-charcoal-900 mb-3 uppercase tracking-wide">
                    Contact
                  </h3>
                  <a
                    href={`mailto:${ev.contactEmail}`}
                    className="text-sm text-maroon-700 hover:underline break-all"
                  >
                    {ev.contactEmail}
                  </a>
                </div>
              )}

              {/* Map placeholder */}
              {ev.location && (
                <div className="card overflow-hidden">
                  <div className="h-40 bg-parchment-100 flex items-center justify-center">
                    <p className="text-xs text-charcoal-400 text-center px-4">
                      Map embed will be available in Stage 5.<br />
                      <span className="font-medium text-charcoal-600">{ev.location}</span>
                    </p>
                  </div>
                  {ev.mapUrl && (
                    <div className="p-3">
                      <a
                        href={ev.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-maroon-700 hover:underline"
                      >
                        View on Google Maps →
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Ge'ez calendar CTA */}
              <div className="rounded-xl bg-maroon-50 border border-maroon-100 p-5">
                <h3 className="font-serif text-sm font-semibold text-charcoal-900 mb-2">
                  Ge'ez Calendar
                </h3>
                <p className="text-xs text-charcoal-600 mb-3 leading-relaxed">
                  Explore feasts and fasts in the traditional Ge'ez liturgical calendar.
                </p>
                <Link href="/geez-calendar" className="text-xs font-semibold text-maroon-700 hover:text-maroon-900 transition-colors">
                  Open Calendar →
                </Link>
              </div>
            </aside>
          </div>
        </Container>
      </Section>
    </>
  )
}
