import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { getBishopSuccession } from '@/lib/bishops/queries'
import { formatPreciseDate } from '@/lib/bishops/timeline'
import { buildMetadata } from '@/lib/seo/buildMetadata'

export const dynamic = 'force-dynamic'

/**
 * A succession list needs a succession. With one record it would read as a
 * page-length way of saying what /bishop already says, and "Eparchs of
 * Segheneyti" over a single card invites the reader to wonder who is missing.
 *
 * So the list 404s until there are two records, while the individual profiles
 * stay live at /eparchs/[slug] the whole time — nothing is hidden, and the page
 * appears by itself the day a second Eparch is added. Navigation links to it
 * only when it exists, so there is never a link into a 404.
 */
const MINIMUM_FOR_LIST = 2

export async function generateMetadata(): Promise<Metadata> {
  const bishops = await getBishopSuccession()
  if (bishops.length < MINIMUM_FOR_LIST) return { robots: { index: false, follow: false } }

  return buildMetadata({
    title: 'Eparchs of Segheneyti',
    description:
      'The Eparchs who have led the Catholic Eparchy of Segheneyti, one of the four eparchies of the Eritrean Catholic Church.',
    path: '/eparchs',
  })
}

export default async function EparchsPage() {
  const locale = await getLocale()
  const [bishops, t, tn] = await Promise.all([
    getBishopSuccession(locale),
    getTranslations('bishop'),
    getTranslations('nav'),
  ])

  if (bishops.length < MINIMUM_FOR_LIST) notFound()

  return (
    <>
      <PageHeader
        title={t('successionTitle')}
        subtitle={t('successionSubtitle')}
        breadcrumbs={[{ label: tn('home'), href: '/' }, { label: t('successionTitle') }]}
      />

      <Section className="bg-parchment-50">
        <Container size="narrow">
          <ol className="space-y-6">
            {bishops.map((bishop) => {
              const start = formatPreciseDate(bishop.termStart, 'year', locale)
              const end = bishop.termEnd ? formatPreciseDate(bishop.termEnd, 'year', locale) : null

              return (
                <li key={bishop.slug}>
                  <Link
                    href={`/eparchs/${bishop.slug}`}
                    className="card flex items-start gap-5 p-5 transition-shadow"
                  >
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full ring-2 ring-gold-300">
                      {bishop.portrait?.url ? (
                        <Image
                          src={bishop.portrait.url}
                          alt={bishop.portrait.alt || bishop.fullName || ''}
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
                        {bishop.fullName}
                        {bishop.isActive ? (
                          <span className="ms-2 rounded-full bg-maroon-50 px-2 py-0.5 align-middle text-xs font-semibold uppercase tracking-wide text-maroon-800">
                            {t('sittingEparch')}
                          </span>
                        ) : null}
                      </h2>
                      {bishop.formalTitle ? (
                        <p className="text-sm text-maroon-700">{bishop.formalTitle}</p>
                      ) : null}
                      {start ? (
                        <p className="mt-1 text-sm text-charcoal-600">
                          {start} – {end ?? t('present')}
                        </p>
                      ) : null}
                      {bishop.biographySummary ? (
                        <p className="bishop-prose mt-2 text-charcoal-700">
                          {bishop.biographySummary}
                        </p>
                      ) : null}
                    </div>
                  </Link>
                </li>
              )
            })}
          </ol>
        </Container>
      </Section>
    </>
  )
}
