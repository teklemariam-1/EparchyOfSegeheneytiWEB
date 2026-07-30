import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { Badge } from '@/components/ui/Badge'
import { RichText } from '@/components/shared/RichText'
import { ShareButtons } from '@/components/shared/ShareButtons'
import { BishopGalleries } from '@/features/bishop/BishopGalleries'
import { PriestTimeline } from '@/features/priests/PriestTimeline'
import { getPriestBySlug } from '@/lib/payload/queries'
import { formatPreciseDate } from '@/lib/bishops/timeline'
import { buildMetadata } from '@/lib/seo/buildMetadata'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const priest = await getPriestBySlug(slug)
  if (!priest) return {}

  return buildMetadata({
    title: [priest.title, priest.fullName].filter(Boolean).join(' '),
    description: priest.assignment ?? undefined,
    path: `/priests/${priest.slug}`,
    image: priest.photo?.url,
    type: 'article',
  })
}

/**
 * One priest's public profile.
 *
 * The hard requirement here is that a record holding NOTHING but a name still
 * looks deliberate. Most parish clergy will never have a biography written, and
 * a page that renders empty headings, a bare timeline rail or a "0 photos"
 * gallery for them would make the sparse record look like a broken page rather
 * than a short one. So every block below is conditional, and the portrait card
 * carries the page on its own when it has to.
 *
 * Nothing on this page decides what is public. The visibility switches are
 * enforced in the collection's afterRead hook, which deletes withheld sections
 * before the query returns — so an absent field here means "not published",
 * and the page's only job is to not render a heading for it.
 */
export default async function PriestPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const locale = await getLocale()
  const [priest, t, tn, tc] = await Promise.all([
    getPriestBySlug(slug, locale),
    getTranslations('clergy'),
    getTranslations('nav'),
    getTranslations('common'),
  ])
  if (!priest) notFound()

  const displayName = [priest.title, priest.fullName].filter(Boolean).join(' ')
  const ordination = formatPreciseDate(priest.ordinationDate, 'exact', locale)
  const education = (priest.education ?? []).filter((entry) => entry?.institution)
  const galleries = priest.galleries ?? []
  const milestones = priest.milestones ?? []

  // Mapped rather than re-implemented: the Bishops gallery already solves lazy
  // loading, the lightbox and keyboard navigation, and a priest's galleries are
  // the same thing with fewer fields.
  const galleryProps = galleries.map((gallery, index) => ({
    key: `priest-gallery-${index}`,
    title: gallery.title ?? null,
    images: (gallery.images ?? []).map((entry) => ({
      image: entry.image,
      caption: entry.caption ?? null,
    })),
  }))

  return (
    <>
      <PageHeader
        title={displayName}
        subtitle={priest.assignment ?? undefined}
        breadcrumbs={[
          { label: tn('home'), href: '/' },
          { label: t('title'), href: '/priests' },
          { label: priest.fullName },
        ]}
      />

      <Section className="bg-white">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
            {/* ── Identity card ── */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="overflow-hidden rounded-xl border border-charcoal-100 bg-parchment-50">
                <div className="relative aspect-[3/4] w-full bg-parchment-200">
                  {priest.photo?.url ? (
                    <Image
                      src={priest.photo.url}
                      alt={priest.photo.alt || displayName}
                      fill
                      priority
                      sizes="(max-width: 1024px) 100vw, 288px"
                      className="object-cover"
                    />
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                      className="absolute inset-0 m-auto h-24 w-24 text-maroon-200"
                    >
                      <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-5 0-8 2.5-8 5.5V22h16v-2.5c0-3-3-5.5-8-5.5Z" />
                    </svg>
                  )}
                </div>

                <dl className="space-y-3 p-5 text-sm">
                  {priest.status && priest.status !== 'active' ? (
                    <div>
                      <Badge variant="neutral" size="sm">
                        {t(`status.${priest.status}`)}
                      </Badge>
                    </div>
                  ) : null}

                  {ordination ? (
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                        {t('ordained')}
                      </dt>
                      <dd className="text-charcoal-800">{ordination}</dd>
                    </div>
                  ) : null}

                  {priest.parishes?.length ? (
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                        {t('serves')}
                      </dt>
                      <dd className="space-y-1">
                        {priest.parishes.map((parish, i) =>
                          parish.slug ? (
                            <Link
                              key={i}
                              href={`/parishes/${parish.slug}`}
                              className="block font-semibold text-maroon-700 hover:text-maroon-900"
                            >
                              {parish.name}
                            </Link>
                          ) : (
                            <span key={i} className="block text-charcoal-800">
                              {parish.name}
                            </span>
                          ),
                        )}
                      </dd>
                    </div>
                  ) : null}

                  {/* Present only when this priest's record publishes contact —
                      the hook removes it otherwise, so there is nothing to check. */}
                  {priest.contact?.email || priest.contact?.phone ? (
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-charcoal-500">
                        {t('contactHeading')}
                      </dt>
                      <dd className="space-y-1">
                        {priest.contact.email ? (
                          <a
                            href={`mailto:${priest.contact.email}`}
                            className="block break-all text-maroon-700 hover:text-maroon-900"
                          >
                            {priest.contact.email}
                          </a>
                        ) : null}
                        {priest.contact.phone ? (
                          <a
                            href={`tel:${priest.contact.phone.replace(/\s+/g, '')}`}
                            className="block text-maroon-700 hover:text-maroon-900"
                          >
                            {priest.contact.phone}
                          </a>
                        ) : null}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </div>

              <div className="mt-5">
                <ShareButtons title={displayName} />
              </div>
            </aside>

            {/* ── Profile body ── */}
            <div className="min-w-0 space-y-12">
              {priest.bio ? (
                <section>
                  <h2 className="mb-4 font-serif text-2xl font-bold text-charcoal-900">
                    {t('biography')}
                  </h2>
                  <div className="bishop-prose prose prose-eparchy max-w-none">
                    <RichText data={priest.bio as never} />
                  </div>
                </section>
              ) : null}

              {milestones.length ? (
                <section>
                  <h2 className="mb-6 font-serif text-2xl font-bold text-charcoal-900">
                    {t('ministryHistory')}
                  </h2>
                  <PriestTimeline milestones={milestones} locale={locale} />
                </section>
              ) : null}

              {education.length ? (
                <section>
                  <h2 className="mb-4 font-serif text-2xl font-bold text-charcoal-900">
                    {t('education')}
                  </h2>
                  <ul className="space-y-2">
                    {education.map((entry, i) => (
                      <li key={i} className="text-charcoal-700">
                        <span className="font-semibold text-charcoal-900">{entry.institution}</span>
                        {entry.degree ? <span> — {entry.degree}</span> : null}
                        {entry.year ? (
                          <span className="text-charcoal-500"> ({entry.year})</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {galleryProps.length ? (
                <section>
                  <h2 className="mb-6 font-serif text-2xl font-bold text-charcoal-900">
                    {t('galleries')}
                  </h2>
                  <BishopGalleries
                    galleries={galleryProps as never}
                    labels={{
                      close: tc('close'),
                      previous: tc('previous'),
                      next: tc('next'),
                      photos: t('photos'),
                      untitled: t('untitledPhoto'),
                    }}
                  />
                </section>
              ) : null}

              {/* The whole right column can legitimately be empty — a name and a
                  photograph is a complete record for most parish clergy. Say so
                  rather than leaving a blank half-page. */}
              {!priest.bio && !milestones.length && !education.length && !galleryProps.length ? (
                <p className="rounded-lg border border-dashed border-charcoal-200 p-6 text-sm text-charcoal-500">
                  {t('sparseProfile')}
                </p>
              ) : null}

              <p className="text-sm text-charcoal-500">
                {t('contactNote')}{' '}
                <Link
                  href="/contact"
                  className="font-semibold text-maroon-700 hover:text-maroon-900"
                >
                  {t('contactLink')}
                </Link>
              </p>
            </div>
          </div>
        </Container>
      </Section>
    </>
  )
}
