import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { EmptyState } from '@/components/shared/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { getLocale, getTranslations } from 'next-intl/server'
import { getPriestsList } from '@/lib/payload/queries'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = buildMetadata({
  title: 'Clergy',
  description: 'The priests and deacons serving the Catholic Eparchy of Segheneyti.',
  path: '/priests',
})

/**
 * The clergy directory — who serves the eparchy, and where.
 *
 * For a diaspora visitor this answers "who is the priest at my home parish
 * now?", which the parish pages answer one at a time but nothing answered in
 * one place.
 *
 * The cards carry no contact details and the list query does not fetch them.
 * Whether a given priest publishes an email or phone is decided per record by
 * the visibility switches and shown on his own profile — a directory that put
 * every number on one page would be a scraping target regardless of what each
 * priest agreed to individually.
 */
export default async function PriestsPage() {
  const locale = await getLocale()
  const [t, tn, priests] = await Promise.all([
    getTranslations('clergy'),
    getTranslations('nav'),
    getPriestsList(locale),
  ])

  const active = priests.filter((p) => p.status === 'active')
  const other = priests.filter((p) => p.status !== 'active')

  const card = (priest: (typeof priests)[number]) => (
    <article
      key={priest.id}
      className="card group relative flex flex-col items-center p-6 text-center"
    >
      <div className="relative mb-4 h-28 w-28 overflow-hidden rounded-full bg-parchment-200">
        {priest.photo?.url ? (
          <Image
            src={priest.photo.url}
            alt={priest.photo.alt ?? priest.fullName}
            fill
            className="object-cover"
            sizes="112px"
          />
        ) : (
          // A neutral vestment silhouette, not a broken-image glyph.
          <svg viewBox="0 0 24 24" fill="currentColor" className="absolute inset-0 m-auto h-14 w-14 text-maroon-200" aria-hidden="true">
            <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-5 0-8 2.5-8 5.5V22h16v-2.5c0-3-3-5.5-8-5.5Z" />
          </svg>
        )}
      </div>
      <h2 className="font-serif text-base font-semibold text-charcoal-900">
        {priest.slug ? (
          // Stretched link: the whole card is the target, but only the name is
          // the accessible label — so a screen reader announces one link per
          // priest rather than "link, link, link".
          <Link
            href={`/priests/${priest.slug}`}
            className="after:absolute after:inset-0 after:rounded-[inherit] group-hover:text-maroon-800"
          >
            {priest.title ? `${priest.title} ` : ''}
            {priest.fullName}
          </Link>
        ) : (
          <>
            {priest.title ? `${priest.title} ` : ''}
            {priest.fullName}
          </>
        )}
      </h2>
      {priest.assignment && (
        <p className="mt-1 text-sm leading-snug text-charcoal-600">{priest.assignment}</p>
      )}
      {priest.parish?.slug && (
        <Link
          href={`/parishes/${priest.parish.slug}`}
          // Above the stretched link, so the parish stays separately clickable.
          className="relative z-10 mt-2 text-xs font-semibold text-maroon-700 transition-colors hover:text-maroon-900"
        >
          {priest.parish.name ?? t('viewParish')} →
        </Link>
      )}
      {priest.status && priest.status !== 'active' && (
        <span className="mt-2">
          <Badge variant="neutral" size="sm">
            {t(`status.${priest.status}`)}
          </Badge>
        </span>
      )}
    </article>
  )

  return (
    <>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        breadcrumbs={[{ label: tn('home'), href: '/' }, { label: t('title') }]}
      />

      <Section className="bg-white">
        <Container>
          {priests.length === 0 ? (
            <EmptyState title={t('emptyTitle')} description={t('emptyDescription')} />
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {active.map(card)}
              </div>

              {other.length > 0 && (
                <>
                  <h2 className="mb-5 mt-12 font-serif text-xl font-semibold text-charcoal-900">
                    {t('formerHeading')}
                  </h2>
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {other.map(card)}
                  </div>
                </>
              )}

              <p className="mt-10 text-sm text-charcoal-500">
                {t('contactNote')}{' '}
                <Link href="/contact" className="font-semibold text-maroon-700 hover:text-maroon-900">
                  {t('contactLink')}
                </Link>
              </p>
            </>
          )}
        </Container>
      </Section>
    </>
  )
}
