import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { EventCard, type EventCardData } from '@/features/events/EventCard'
import type { EventListItem, HomepageGlobal } from '@/lib/payload/queries'

interface Props {
  config?: HomepageGlobal['upcomingEvents']
  events: EventListItem[]
}

/**
 * "Upcoming Events" on the home page.
 *
 * Rebuilt on the shared EventCard rather than keeping its own markup. The old
 * block was a text list — no featured image at all — and it carried three
 * problems that the card had already solved:
 *
 *  - It formatted dates with `new Date(...).getDate()` and a hardcoded `'en'`
 *    locale, so the day shown was the SERVER's day rather than Asmara's, and a
 *    Tigrinya reader got English month names. `dateParts` inside the card pins
 *    the eparchy's timezone, which is also what the ICS feed uses.
 *  - Every string was an English literal, so neither heading nor "All Day" ever
 *    translated.
 *  - No image, on the one page where the eparchy is showing its face.
 *
 * The lead event gets the wide card when staff have pinned one, matching the
 * events page so the two read as the same site.
 */
export async function UpcomingEventsSection({ config, events }: Props) {
  if (config?.enabled === false) return null

  const t = await getTranslations('events')
  const heading = config?.heading ?? t('defaultHeading')

  const toCard = (event: EventListItem): EventCardData => ({
    slug: event.slug,
    title: event.title,
    excerpt: event.excerpt ?? '',
    eventType: event.eventType ?? 'community',
    startDate: event.startDate,
    endDate: event.endDate,
    location: event.location?.venue ?? event.location?.city,
    imageUrl: event.featuredImage?.url,
    isFeatured: event.isFeatured,
  })

  const cards = events.map(toCard)
  const hasLead = cards[0]?.isFeatured === true
  const leadCard = hasLead ? cards[0] : null
  // Three across reads as a row; without the lead there is room for one more.
  const gridCards = hasLead ? cards.slice(1, 4) : cards.slice(0, 3)

  return (
    <Section className="bg-parchment" aria-labelledby="events-section-title">
      <Container>
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <p className="mb-1 text-sm font-semibold uppercase tracking-widest text-gold-600">
              {t('eyebrow')}
            </p>
            <h2
              id="events-section-title"
              className="font-serif text-3xl font-bold text-maroon-900 md:text-4xl"
            >
              {heading}
            </h2>
            <div className="divider-gold mt-3" />
          </div>
          <Link href="/events" className="btn-ghost hidden shrink-0 sm:inline-flex">
            {t('allEvents')} →
          </Link>
        </div>

        {!cards.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gold-50">
              <svg
                className="h-8 w-8 text-gold-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                />
              </svg>
            </div>
            <p className="text-base text-charcoal-500">{t('homeEmptyTitle')}</p>
            <p className="mt-1 text-sm text-charcoal-400">{t('homeEmptyBody')}</p>
          </div>
        ) : (
          <>
            {leadCard && (
              <div className="mb-6">
                <EventCard event={leadCard} variant="feature" featuredLabel={t('featured')} />
              </div>
            )}

            {gridCards.length > 0 && (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {gridCards.map((event) => (
                  <EventCard key={event.slug} event={event} />
                ))}
              </div>
            )}

            <div className="mt-8 text-center sm:hidden">
              <Link href="/events" className="btn-secondary">
                {t('allEvents')}
              </Link>
            </div>
          </>
        )}
      </Container>
    </Section>
  )
}
