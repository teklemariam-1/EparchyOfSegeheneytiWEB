import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { EmptyState } from '@/components/shared/EmptyState'
import { getLocale, getTranslations } from 'next-intl/server'
import { getVicariatesList } from '@/lib/payload/queries'

// Locale comes from the NEXT_LOCALE cookie — cannot be statically generated.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = buildMetadata({
  title: 'Vicariates',
  description:
    'The vicariates of the Catholic Eparchy of Segheneyti and the parishes that belong to each.',
  path: '/vicariates',
})

export default async function VicariatesPage() {
  const locale = await getLocale()
  const [vicariates, t] = await Promise.all([
    getVicariatesList(locale),
    getTranslations('vicariates'),
  ])

  return (
    <>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        breadcrumbs={[{ label: t('title') }]}
      />

      <Section className="bg-white">
        <Container>
          {/* Hierarchy explainer: Eparchy → Vicariate → Parish */}
          <p className="mb-8 rounded-xl border border-parchment-200 bg-parchment-50 px-5 py-4 text-sm leading-relaxed text-charcoal-600">
            {t('structureNote')}
          </p>

          {vicariates.length === 0 ? (
            <EmptyState title={t('empty')} description={t('emptyDescription')} />
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {vicariates.map((v) => (
                <Link
                  key={v.id}
                  href={`/vicariates/${v.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-charcoal-100 bg-white shadow-sm transition hover:border-maroon-200 hover:shadow-md"
                >
                  {v.featuredImage?.url && (
                    <div className="relative aspect-[16/7] w-full bg-parchment-100">
                      <Image
                        src={v.featuredImage.url}
                        alt={v.featuredImage.alt || v.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </div>
                  )}

                  <div className="flex flex-1 flex-col p-6">
                    <h2 className="font-serif text-lg font-semibold text-charcoal-900 transition-colors group-hover:text-maroon-800">
                      {v.name}
                    </h2>
                    {v.seat && (
                      <p className="mt-0.5 text-xs text-charcoal-400">
                        {t('seat')}: {v.seat}
                      </p>
                    )}
                    {v.description && (
                      <p className="mt-3 text-sm leading-relaxed text-charcoal-600 line-clamp-3">
                        {v.description}
                      </p>
                    )}

                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-charcoal-100">
                      <span className="text-xs font-medium text-maroon-700">
                        {v.parishCount ?? 0} {v.parishCount === 1 ? t('parish') : t('parishes')}
                      </span>
                      <span className="text-xs text-charcoal-400 group-hover:text-maroon-700 transition-colors">
                        {t('viewParishes')} →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Container>
      </Section>
    </>
  )
}
