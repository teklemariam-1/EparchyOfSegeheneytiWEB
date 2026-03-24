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
import { RichText } from '@/components/shared/RichText'
import { getLocale } from 'next-intl/server'
import { getEventBySlug, getAllEventSlugs, getEventsList } from '@/lib/payload/queries'

export const revalidate = 300

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return getAllEventSlugs()
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const ev = await getEventBySlug(slug)
  return buildMetadata({
    title: ev?.seo?.title ?? ev?.title ?? `Event — ${slug}`,
    description: ev?.seo?.description ?? ev?.excerpt,
    path: `/events/${slug}`,
  })
}

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const [ev, { docs: upcoming }] = await Promise.all([
    getEventBySlug(slug, locale),
    getEventsList({ upcoming: true, limit: 4, locale }),
  ])

  if (!ev) notFound()

  const typeLabel = ev.eventType
    ? ev.eventType.charAt(0).toUpperCase() + ev.eventType.slice(1).replace(/-/g, ' ')
    : 'Event'
  const start = new Date(ev.startDate)
  const dateLabel = ev.endDate ? formatDateRange(ev.startDate, ev.endDate) : formatDate(ev.startDate)
  const ventue = ev.location?.venue ?? ev.location?.city ?? ''
  const address = ev.location?.address ?? ''

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
              {/* Featured image */}
              {ev.featuredImage?.url && (
                <div className="mb-6 relative h-60 md:h-80 rounded-xl overflow-hidden">
                  <Image
                    src={ev.featuredImage.url}
                    alt={ev.featuredImage.alt}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 1024px) 100vw, 66vw"
                  />
                </div>
              )}

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
                </div>
              </div>

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
