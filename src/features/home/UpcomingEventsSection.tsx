import Link from 'next/link'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import type { EventListItem, HomepageGlobal } from '@/lib/payload/queries'

interface Props {
  config?: HomepageGlobal['upcomingEvents']
  events: EventListItem[]
}

function EmptyEventsState() {
  return (
    <div className="py-16 flex flex-col items-center justify-center text-center">
      <div className="h-16 w-16 rounded-full bg-gold-50 flex items-center justify-center mb-4">
        <svg className="h-8 w-8 text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
        </svg>
      </div>
      <p className="text-charcoal-500 text-base">No upcoming events at this time.</p>
      <p className="text-charcoal-400 text-sm mt-1">All scheduled events will appear here.</p>
    </div>
  )
}

export function UpcomingEventsSection({ config, events }: Props) {
  if (config?.enabled === false) return null

  const heading = config?.heading ?? 'Upcoming Events'

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
              {heading}
            </h2>
            <div className="divider-gold mt-3" />
          </div>
          <Link href="/events" className="btn-ghost hidden sm:inline-flex">
            All Events →
          </Link>
        </div>

        {!events.length ? (
          <EmptyEventsState />
        ) : (
          <>
          <div className="space-y-4">
          {events.map((event) => {
            const eventDate = new Date(event.startDate)
            const day = eventDate.getDate()
            const month = new Intl.DateTimeFormat('en', { month: 'short' }).format(eventDate)
            const time = event.isAllDay
              ? 'All Day'
              : new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(eventDate)
            const venue = event.location?.venue ?? event.location?.city ?? ''

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
                    {venue && (
                      <span className="flex items-center gap-1">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0 1 15 0z" />
                        </svg>
                        {venue}
                      </span>
                    )}
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
          </>
        )}
      </Container>
    </Section>
  )
}
