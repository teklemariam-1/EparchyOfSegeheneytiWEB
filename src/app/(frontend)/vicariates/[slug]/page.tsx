import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { RichText } from '@/components/shared/RichText'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { EmptyState } from '@/components/shared/EmptyState'
import { ParishCard, type ParishCardData } from '@/features/parishes/ParishCard'
import { getLocale, getTranslations } from 'next-intl/server'
import { getVicariateBySlug, getParishesList } from '@/lib/payload/queries'

// Locale comes from the NEXT_LOCALE cookie — cannot be statically generated.
export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const v = await getVicariateBySlug(slug)
  if (!v) return {}
  return buildMetadata({
    title: v.name,
    description: v.description,
    path: `/vicariates/${v.slug}`,
    image: v.featuredImage?.url,
  })
}

export default async function VicariateDetailPage({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const t = await getTranslations('vicariates')

  const vicariate = await getVicariateBySlug(slug, locale)
  if (!vicariate) notFound()

  const parishes = await getParishesList(100, slug, locale)

  const cards: ParishCardData[] = parishes.map((p) => ({
    slug: p.slug,
    name: p.title,
    vicariate: p.vicariate?.slug ?? slug,
    vicariateName: p.vicariate?.name,
    patronSaint: p.patronSaint,
    city: p.city,
    imageUrl: p.image?.url,
    priestName: p.pastor ?? undefined,
  }))

  return (
    <>
      <PageHeader
        title={vicariate.name}
        subtitle={vicariate.seat ? `${t('seat')}: ${vicariate.seat}` : undefined}
        breadcrumbs={[
          { label: t('title'), href: '/vicariates' },
          { label: vicariate.name },
        ]}
      />

      <Section className="bg-white">
        <Container>
          {vicariate.featuredImage?.url && (
            <div className="mb-8 w-full overflow-hidden rounded-2xl bg-parchment-100">
              <Image
                src={vicariate.featuredImage.url}
                alt={vicariate.featuredImage.alt || vicariate.name}
                width={vicariate.featuredImage.width ?? 1600}
                height={vicariate.featuredImage.height ?? 900}
                className="w-full h-auto max-h-[75vh] object-contain"
                priority
                sizes="(max-width: 1024px) 100vw, 1024px"
              />
            </div>
          )}

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              {vicariate.description && (
                <p className="text-lg leading-relaxed text-charcoal-600">{vicariate.description}</p>
              )}
              {vicariate.about ? (
                <div className="mt-6">
                  <RichText data={vicariate.about} />
                </div>
              ) : null}
            </div>

            {/* Vicar & contact */}
            {(vicariate.vicar || vicariate.contact?.phone || vicariate.contact?.email || vicariate.contact?.address) && (
              <aside className="card h-fit p-5">
                <h2 className="font-serif text-base font-semibold text-charcoal-900">
                  {t('contactHeading')}
                </h2>
                <dl className="mt-3 space-y-2 text-sm">
                  {vicariate.vicar && (
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-charcoal-400">{t('vicar')}</dt>
                      <dd className="text-charcoal-700">{vicariate.vicar}</dd>
                    </div>
                  )}
                  {vicariate.contact?.address && (
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-charcoal-400">{t('address')}</dt>
                      <dd className="text-charcoal-700">{vicariate.contact.address}</dd>
                    </div>
                  )}
                  {vicariate.contact?.phone && (
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-charcoal-400">{t('phone')}</dt>
                      <dd>
                        <a href={`tel:${vicariate.contact.phone}`} className="text-maroon-700 hover:underline">
                          {vicariate.contact.phone}
                        </a>
                      </dd>
                    </div>
                  )}
                  {vicariate.contact?.email && (
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-charcoal-400">{t('email')}</dt>
                      <dd className="break-all">
                        <a href={`mailto:${vicariate.contact.email}`} className="text-maroon-700 hover:underline">
                          {vicariate.contact.email}
                        </a>
                      </dd>
                    </div>
                  )}
                </dl>
              </aside>
            )}
          </div>
        </Container>
      </Section>

      {/* Parishes in this vicariate */}
      <Section className="bg-parchment-50">
        <Container>
          <h2 className="mb-2 font-serif text-2xl font-bold text-charcoal-900">
            {t('parishesIn', { name: vicariate.name })}
          </h2>
          <div className="mb-8 mt-2 h-1 w-14 rounded-full bg-gold-400" />

          {cards.length === 0 ? (
            <EmptyState title={t('noParishes')} description={t('noParishesDescription')} />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {cards.map((p) => (
                <ParishCard key={p.slug} parish={p} />
              ))}
            </div>
          )}

          <div className="mt-10 border-t border-charcoal-200 pt-6">
            <Link
              href="/vicariates"
              className="text-sm font-medium text-maroon-700 transition-colors hover:text-maroon-900"
            >
              ← {t('allVicariates')}
            </Link>
          </div>
        </Container>
      </Section>
    </>
  )
}
