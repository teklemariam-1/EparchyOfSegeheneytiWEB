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
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {vicariates.map((v) => (
                <Link
                  key={v.id}
                  href={`/vicariates/${v.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-charcoal-100 bg-white shadow-sm transition hover:border-maroon-200 hover:shadow-md"
                >
                  {/* Every card gets the same image area — a vicariate without a
                      photo shows a quiet branded wash instead of collapsing to a
                      text-only card, so the grid stays even. */}
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-parchment-100">
                    {v.featuredImage?.url ? (
                      <Image
                        src={v.featuredImage.url}
                        alt={v.featuredImage.alt || v.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-maroon-800 via-maroon-700 to-maroon-900">
                        <svg
                          className="absolute right-5 top-1/2 h-24 w-24 -translate-y-1/2 text-white/10"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path d="M10 2h4v8h8v4h-8v8h-4v-8H2v-4h8z" />
                        </svg>
                      </div>
                    )}
                    {/* Parish count badge on the image */}
                    <span className="absolute left-4 top-4 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-maroon-800 shadow-sm backdrop-blur-sm">
                      {v.parishCount ?? 0} {v.parishCount === 1 ? t('parish') : t('parishes')}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <h2 className="font-serif text-lg font-semibold text-charcoal-900 transition-colors group-hover:text-maroon-800">
                      {v.name}
                    </h2>
                    {v.seat && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-charcoal-400">
                        <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {t('seat')}: {v.seat}
                      </p>
                    )}
                    {v.description && (
                      <p className="mt-3 text-sm leading-relaxed text-charcoal-600 line-clamp-3">
                        {v.description}
                      </p>
                    )}

                    <div className="mt-auto flex items-center justify-end pt-4 border-t border-charcoal-100">
                      <span className="text-xs font-medium text-charcoal-400 group-hover:text-maroon-700 transition-colors">
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
