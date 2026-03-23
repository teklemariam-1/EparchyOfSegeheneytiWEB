import Link from 'next/link'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { formatDate } from '@/lib/formatters/date'

const MOCK_EVENTS = [
  {
    id: '1',
    title: 'Palm Sunday Procession',
    startDate: '2026-03-29T07:00:00Z',
    location: 'Cathedral of Segeneyti',
    slug: 'palm-sunday-2026',
  },
  {
    id: '2',
    title: 'Easter Vigil Mass',
    startDate: '2026-04-04T20:00:00Z',
    location: 'All Parishes',
    slug: 'easter-vigil-2026',
  },
  {
    id: '3',
    title: 'Youth Conference 2026',
    startDate: '2026-05-10T09:00:00Z',
    location: 'Segeneyti Youth Center',
    slug: 'youth-conference-2026',
  },
]

export function UpcomingEventsSection() {
  return (
    <Section className="bg-parchment" aria-labelledby="events-section-title">
      <Container>
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-sm font-semibold text-gold-600 uppercase tracking-widest mb-1">
              Mark Your Calendar
            </p>
            <h2
              id="events-section-title"
              className="text-3xl md:text-4xl font-serif font-bold text-maroon-900"
            >
              Upcoming Events
            </h2>
            <div className="divider-gold mt-3" />
          </div>
          <Link href="/events" className="btn-ghost hidden sm:inline-flex">
            All Events →
          </Link>
        </div>

        <div className="space-y-4">
          {MOCK_EVENTS.map((event) => {
            const eventDate = new Date(event.startDate)
            const day = eventDate.getDate()
            const month = new Intl.DateTimeFormat('en', { month: 'short' }).format(eventDate)
            const time = new Intl.DateTimeFormat('en', {
              hour: 'numeric',
              minute: '2-digit',
            }).format(eventDate)

            return (
              <Link
                key={event.id}
                href={`/events/${event.slug}`}
                className="group flex items-start gap-5 p-5 bg-white rounded-xl shadow-card hover:shadow-card-hover border border-charcoal-100 transition-all"
              >
                {/* Date badge */}
                <div className="flex-shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-maroon-800 text-white">
                  <span className="text-xl font-bold leading-none">{day}</span>
                  <span className="text-xs font-medium text-maroon-200 uppercase">{month}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-charcoal-900 font-serif group-hover:text-maroon-800 transition-colors truncate">
                    {event.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-charcoal-500">
                    <span className="flex items-center gap-1">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 1 1-20 0 10 10 0 0 1 20 0z" />
                      </svg>
                      {time}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0 1 15 0z" />
                      </svg>
                      {event.location}
                    </span>
                  </div>
                </div>

                <svg
                  className="h-5 w-5 text-charcoal-300 group-hover:text-maroon-600 transition-colors shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            )
          })}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link href="/events" className="btn-secondary">
            All Events
          </Link>
        </div>
      </Container>
    </Section>
  )
}
