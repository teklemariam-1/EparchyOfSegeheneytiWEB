import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { getObituaries } from '@/lib/obituary/queries'

// Resolves the locale from the NEXT_LOCALE cookie, so it can never be
// statically generated — same as every other listing page.
export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: 'Clergy obituaries — ዜና ዕረፍቲ ካህናት',
    description:
      'The life stories of the priests of the Catholic Eparchy of Segheneyti who have gone to their rest.',
    path: '/obituaries',
  })
}

export default async function ObituariesPage() {
  const locale = await getLocale()
  const [obituaries, t, tn] = await Promise.all([
    getObituaries(locale),
    getTranslations('obituaries'),
    getTranslations('nav'),
  ])

  return (
    <>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        breadcrumbs={[{ label: tn('home'), href: '/' }, { label: t('title') }]}
      />

      <Section className="bg-parchment-50">
        <Container size="narrow">
          {obituaries.length === 0 ? (
            <div className="rounded-lg border border-charcoal-200 bg-white p-10 text-center">
              <h2 className="font-serif text-lg font-bold text-charcoal-900">{t('emptyTitle')}</h2>
              <p className="mt-2 text-charcoal-600">{t('emptyDescription')}</p>
            </div>
          ) : (
            <ol className="space-y-6">
              {obituaries.map((doc) => {
                const photo = typeof doc.photo === 'object' ? doc.photo : null
                const honorific = (doc.honorific === 'other' ? doc.honorificOther : doc.honorific) ?? ''
                const birthYear = doc.birthDate ? new Date(doc.birthDate).getUTCFullYear() : null
                const deathYear = doc.deathDate ? new Date(doc.deathDate).getUTCFullYear() : null

                return (
                  <li key={doc.slug}>
                    <Link
                      href={`/obituaries/${doc.slug}`}
                      className="card flex items-start gap-5 p-5 transition-shadow"
                    >
                      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full ring-2 ring-gold-300">
                        {photo?.url ? (
                          <Image
                            src={photo.url}
                            alt={photo.alt || doc.fullName}
                            fill
                            loading="lazy"
                            sizes="96px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-maroon-100" aria-hidden="true" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <h2 className="font-serif text-lg font-bold text-charcoal-900">
                          {honorific} {doc.fullName}
                        </h2>
                        {birthYear && deathYear ? (
                          <p className="mt-1 text-sm text-maroon-700">
                            ✝ {birthYear}–{deathYear}
                          </p>
                        ) : null}
                        <p className="mt-1 text-sm text-charcoal-600">{doc.burialTown}</p>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ol>
          )}
        </Container>
      </Section>
    </>
  )
}
