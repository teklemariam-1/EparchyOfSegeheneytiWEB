import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { RichText } from '@/components/shared/RichText'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { getLocale } from 'next-intl/server'
import { getOfficeBySlug } from '@/lib/payload/queries'

// Locale comes from the NEXT_LOCALE cookie — cannot be statically generated.
export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

function fmtDate(iso?: string) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const office = await getOfficeBySlug(slug)
  if (!office) return {}
  return buildMetadata({
    title: office.name,
    description: office.tagline ?? `${office.name} — Catholic Eparchy of Segeneyti.`,
    path: `/offices/${slug}`,
    image: office.featuredImage?.url,
  })
}

export default async function OfficePage({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const office = await getOfficeBySlug(slug, locale)
  if (!office) notFound()

  const now = Date.now()
  const upcoming = office.events.filter((e) => new Date(e.endDate ?? e.startDate).getTime() >= now)
  const past = office.events.filter((e) => new Date(e.endDate ?? e.startDate).getTime() < now).reverse()

  return (
    <>
      <PageHeader
        title={office.name}
        subtitle={office.tagline}
        breadcrumbs={[{ label: 'Offices', href: '/offices' }, { label: office.name }]}
      />

      <Section className="bg-white">
        <Container>
          {/* Banner */}
          {office.featuredImage?.url && (
            <div className="mb-8 rounded-2xl overflow-hidden bg-parchment-100">
              <Image
                src={office.featuredImage.url}
                alt={office.featuredImage.alt || office.name}
                width={office.featuredImage.width ?? 1600}
                height={office.featuredImage.height ?? 900}
                className="w-full h-auto max-h-[70vh] object-contain"
                priority
                sizes="(max-width: 1024px) 100vw, 80vw"
              />
            </div>
          )}

          {/* Announcements */}
          {office.announcements.length > 0 && (
            <div className="mb-10 space-y-3">
              {office.announcements.map((a, i) => (
                <div
                  key={i}
                  className="rounded-lg border-l-4 border-gold-500 bg-gold-50 px-4 py-3"
                >
                  <div className="flex items-baseline justify-between gap-3 flex-wrap">
                    <p className="font-semibold text-charcoal-900">{a.title}</p>
                    {a.date && <span className="text-xs text-charcoal-500">{fmtDate(a.date)}</span>}
                  </div>
                  {a.body && <p className="mt-1 text-sm text-charcoal-600 leading-relaxed">{a.body}</p>}
                </div>
              ))}
            </div>
          )}

          <div className="grid gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-12">
              {/* About */}
              {office.about ? (
                <div className="prose prose-eparchy max-w-none">
                  <RichText data={office.about} />
                </div>
              ) : null}

              {/* Updates */}
              {office.updates.length > 0 && (
                <div>
                  <h2 className="font-serif text-2xl font-bold text-maroon-900 mb-5">Updates</h2>
                  <div className="space-y-8">
                    {office.updates.map((u, i) => (
                      <article key={i} className="border-b border-charcoal-100 pb-8 last:border-0">
                        {u.image?.url && (
                          <div className="mb-3 rounded-lg overflow-hidden bg-parchment-100">
                            <Image
                              src={u.image.url}
                              alt={u.image.alt || u.title}
                              width={u.image.width ?? 1200}
                              height={u.image.height ?? 675}
                              className="w-full h-auto max-h-[60vh] object-contain"
                              sizes="(max-width: 1024px) 100vw, 66vw"
                            />
                          </div>
                        )}
                        <div className="flex items-baseline justify-between gap-3 flex-wrap">
                          <h3 className="font-serif text-lg font-semibold text-charcoal-900">{u.title}</h3>
                          {u.date && <span className="text-xs text-charcoal-500">{fmtDate(u.date)}</span>}
                        </div>
                        {u.excerpt && <p className="mt-1 text-charcoal-600">{u.excerpt}</p>}
                        {u.body ? (
                          <div className="prose prose-eparchy max-w-none mt-3">
                            <RichText data={u.body} />
                          </div>
                        ) : null}
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar: events + contact */}
            <aside className="space-y-8">
              {(upcoming.length > 0 || past.length > 0) && (
                <div className="rounded-xl border border-charcoal-100 p-5">
                  <h2 className="font-serif text-lg font-bold text-maroon-900 mb-4">Events</h2>
                  {upcoming.length > 0 && (
                    <ul className="space-y-4">
                      {upcoming.map((e, i) => (
                        <li key={i} className="border-l-2 border-maroon-700 pl-3">
                          <p className="font-semibold text-sm text-charcoal-900">{e.title}</p>
                          <p className="text-xs text-maroon-700 font-medium">{fmtDate(e.startDate)}</p>
                          {e.location && <p className="text-xs text-charcoal-500">{e.location}</p>}
                          {e.description && <p className="text-xs text-charcoal-600 mt-1">{e.description}</p>}
                        </li>
                      ))}
                    </ul>
                  )}
                  {past.length > 0 && (
                    <>
                      <p className="text-xs font-semibold uppercase tracking-wide text-charcoal-400 mt-5 mb-2">
                        Past
                      </p>
                      <ul className="space-y-2">
                        {past.slice(0, 5).map((e, i) => (
                          <li key={i} className="text-xs text-charcoal-500">
                            {e.title} — {fmtDate(e.startDate)}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}

              {office.leader && (office.leader.name || office.leader.email || office.leader.phone) && (
                <div className="rounded-xl bg-parchment-50 border border-parchment-200 p-5">
                  <h2 className="font-serif text-lg font-bold text-maroon-900 mb-3">Contact</h2>
                  {office.leader.name && <p className="text-sm font-semibold text-charcoal-900">{office.leader.name}</p>}
                  {office.leader.role && <p className="text-xs text-charcoal-500 mb-2">{office.leader.role}</p>}
                  {office.leader.email && (
                    <p className="text-sm">
                      <a href={`mailto:${office.leader.email}`} className="text-maroon-700 hover:text-maroon-900 underline underline-offset-2">
                        {office.leader.email}
                      </a>
                    </p>
                  )}
                  {office.leader.phone && <p className="text-sm text-charcoal-600">{office.leader.phone}</p>}
                </div>
              )}
            </aside>
          </div>
        </Container>
      </Section>
    </>
  )
}
