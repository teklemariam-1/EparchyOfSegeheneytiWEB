import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { Badge } from '@/components/ui/Badge'
import { formatDate, formatDateRange } from '@/lib/formatters/date'
import { dateParts } from '@/lib/formatters/eventTime'
import { EventTime } from '@/features/events/EventTime'
import { LiturgyVideo } from '@/features/events/LiturgyVideo'
import { ShareButtons } from '@/components/shared/ShareButtons'
import { RichText } from '@/components/shared/RichText'
import { JsonLd } from '@/components/seo/JsonLd'
import { eventSchema } from '@/lib/seo/structuredData'
import { getLocale, getTranslations } from 'next-intl/server'
import { getEventBySlug,  getEventsList } from '@/lib/payload/queries'
import { AddToCalendar } from '@/features/calendar-sync/AddToCalendar'

// This page resolves the active locale from the NEXT_LOCALE cookie, so it can
// never be statically generated. Marking it dynamic prevents Next from trying
// to prerender it on-demand, which failed with DYNAMIC_SERVER_USAGE (500) for
// any document created after the last deploy.
export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const ev = await getEventBySlug(slug)
  return buildMetadata({
    title: ev?.seo?.title ?? ev?.title ?? `Event — ${slug}`,
    description: ev?.seo?.description ?? ev?.excerpt,
    image: ev?.seo?.ogImage?.url ?? ev?.featuredImage?.url,
    path: `/events/${slug}`,
  })
}

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const t = await getTranslations('events')
  const tCal = await getTranslations('calendar')
  const [ev, { docs: upcoming }] = await Promise.all([
    getEventBySlug(slug, locale),
    getEventsList({ upcoming: true, limit: 4, locale }),
  ])

  if (!ev) notFound()

  const typeLabel = ev.eventType
    ? ev.eventType.charAt(0).toUpperCase() + ev.eventType.slice(1).replace(/-/g, ' ')
    : 'Event'
  const startParts = dateParts(ev.startDate, locale)
  const dateLabel = ev.endDate ? formatDateRange(ev.startDate, ev.endDate) : formatDate(ev.startDate)
  const ventue = ev.location?.venue ?? ev.location?.city ?? ''
  const address = ev.location?.address ?? ''

  return (
    <>
      <JsonLd
        data={eventSchema({
          title: ev.title,
          description: ev.excerpt,
          startDate: ev.startDate,
          endDate: ev.endDate,
          location: ventue || address || undefined,
          imageUrl: ev.featuredImage?.url,
          slug,
        })}
      />
      <PageHeader
        title={ev.title}
        breadcrumbs={[{ label: 'Events', href: '/events' }, { label: ev.title }]}
      />

      <Section className="bg-white">
        <Container>
          <div className="grid lg:grid-cols-3 gap-10">
            {/* Main detail */}
            <article className="lg:col-span-2">
              {/* Featured image — uncropped, at the uploaded aspect ratio.
                  See the note on the news detail page. */}
              {ev.featuredImage?.url && (
                <div className="mb-6 rounded-xl overflow-hidden bg-parchment-100">
                  <Image
                    src={ev.featuredImage.url}
                    alt={ev.featuredImage.alt}
                    width={ev.featuredImage.width ?? 1600}
                    height={ev.featuredImage.height ?? 900}
                    className="w-full h-auto max-h-[75vh] object-contain"
                    priority
                    sizes="(max-width: 1024px) 100vw, 66vw"
                  />
                </div>
              )}

              {/* Event hero card */}
              <div className="mb-8 rounded-xl bg-parchment-50 border border-parchment-200 p-6 flex flex-col sm:flex-row gap-6 items-start">
                {/* Big date */}
                <div className="shrink-0 flex flex-col items-center rounded-xl bg-maroon-800 text-white px-6 py-4 min-w-[80px] text-center">
                  {/* Eparchy-zone parts. getDate()/getFullYear() read the
                      RENDERER's zone, which put a 01:00 Asmara liturgy on the
                      previous day and disagreed with the ICS feed. */}
                  <span className="text-xs font-medium uppercase tracking-wide text-maroon-200">
                    {startParts?.month}
                  </span>
                  <span className="text-4xl font-bold leading-none my-1">{startParts?.day}</span>
                  <span className="text-xs text-maroon-200">{startParts?.year}</span>
                </div>

                <div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <Badge variant="maroon">{typeLabel}</Badge>
                    {ev.isAllDay && <Badge variant="gold">{t('allDay')}</Badge>}
                  </div>
                  <p className="text-sm font-medium text-charcoal-700">
                    📅 {dateLabel}
                    {/* All-day events carry no meaningful instant, so they are
                        never converted to a reader's zone — that is what shifts
                        a feast to the wrong date. */}
                    {!ev.isAllDay && (
                      <span className="text-charcoal-400">
                        {' '}
                        <EventTime
                          iso={ev.startDate}
                          locale={locale}
                          anchorLabel={(time) => t('timeInAsmara', { time })}
                          viewerLabel={(time) => t('timeYourLocal', { time })}
                        />
                      </span>
                    )}
                  </p>
                  {ventue && (
                    <p className="mt-1 text-sm text-charcoal-600">
                      📍 {ventue}
                      {address && <span className="text-charcoal-400"> · {address}</span>}
                    </p>
                  )}
                  {ev.parish && (
                    <p className="mt-1 text-xs text-charcoal-500">
                      Parish:{' '}
                      <Link href={`/parishes/${ev.parish.slug}`} className="text-maroon-700 hover:underline">
                        {ev.parish.title}
                      </Link>
                    </p>
                  )}
                  <div className="mt-3">
                    <AddToCalendar
                      event={{
                        title: ev.title,
                        start: ev.isAllDay ? ev.startDate.slice(0, 10) : ev.startDate,
                        end: ev.endDate
                          ? ev.isAllDay
                            ? ev.endDate.slice(0, 10)
                            : ev.endDate
                          : undefined,
                        allDay: Boolean(ev.isAllDay),
                        description: ev.excerpt,
                        location: [ventue, address].filter(Boolean).join(', ') || undefined,
                      }}
                      icsHref={`/api/calendar/event/${slug}.ics`}
                      labels={{ google: tCal('addToCalendar'), ics: tCal('downloadIcs') }}
                    />
                  </div>
                </div>
              </div>

              {/* Sharing an event — "come to the Fasika liturgy", with the
                  watch link — is the diaspora share that matters most, and the
                  message pages already carry this same row. */}
              <div className="mb-6">
                <ShareButtons title={ev.title} />
              </div>

              {/* The stream or recording, above the text: someone who came to
                  watch should not have to scroll past the description to find
                  it. Renders nothing at all when there is no usable link. */}
              <LiturgyVideo
                url={ev.videoUrl}
                title={ev.title}
                fallbackLabel={t('watchOnProvider')}
                className="mb-6"
              />

              {/* Rich text description */}
              {ev.description ? (
                <RichText data={ev.description} />
              ) : ev.excerpt ? (
                <div className="prose prose-eparchy max-w-none">
                  <p>{ev.excerpt}</p>
                </div>
              ) : null}

              {/* Registration */}
              {ev.registrationUrl && (
                <div className="mt-8 p-5 rounded-xl bg-gold-50 border border-gold-200">
                  <p className="text-sm font-medium text-charcoal-800 mb-3">Registration required for this event.</p>
                  <a
                    href={ev.registrationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-gold"
                  >
                    Register Now →
                  </a>
                </div>
              )}

              {/* Back link */}
              <div className="mt-10 border-t border-charcoal-100 pt-6">
                <Link href="/events" className="text-sm font-medium text-maroon-700 hover:text-maroon-900 transition-colors">
                  ← All Events
                </Link>
              </div>
            </article>

            {/* Sidebar */}
            <aside className="space-y-6">
              {/* Upcoming events */}
              {upcoming.filter((u) => u.slug !== slug).length > 0 && (
                <div className="card p-5">
                  <h3 className="font-serif text-sm font-semibold text-charcoal-900 mb-3 uppercase tracking-wide">
                    More Events
                  </h3>
                  <ul className="divide-y divide-charcoal-100">
                    {upcoming
                      .filter((u) => u.slug !== slug)
                      .slice(0, 3)
                      .map((u) => (
                        <li key={u.slug} className="py-3">
                          <Link href={`/events/${u.slug}`} className="text-sm font-medium text-charcoal-700 hover:text-maroon-700 transition-colors line-clamp-2">
                            {u.title}
                          </Link>
                          <p className="text-xs text-charcoal-400 mt-0.5">
                            {formatDate(u.startDate, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              {/* Ge'ez calendar CTA */}
              <div className="rounded-xl bg-maroon-50 border border-maroon-100 p-5">
                <h3 className="font-serif text-sm font-semibold text-charcoal-900 mb-2">
                  Ge&apos;ez Calendar
                </h3>
                <p className="text-xs text-charcoal-600 mb-3 leading-relaxed">
                  Explore feasts and fasts in the traditional Ge&apos;ez liturgical calendar.
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
