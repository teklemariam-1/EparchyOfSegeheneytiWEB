import Image from 'next/image'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Container } from '@/components/layout/Container'
import { Section } from '@/components/layout/Section'
import { RichText } from '@/components/shared/RichText'
import { formatPreciseDate } from '@/lib/bishops/timeline'
import type { BishopRecord } from '@/lib/bishops/queries'
import { BishopTimeline } from './BishopTimeline'
import { BishopGalleries } from './BishopGalleries'
import { PrintButton } from './PrintButton'

/**
 * The public profile of an Eparch, shared by /bishop (the sitting one) and
 * /eparchs/[slug] (any of them).
 *
 * Everything rendered here has already been filtered server-side: the query
 * layer runs with `overrideAccess: false`, and the collection's afterRead hook
 * removes every `isPublic: false` entry before the data reaches this file. No
 * section below decides what a visitor may see — by the time it gets here, the
 * withheld entries are simply absent.
 */
export async function BishopProfile({
  bishop,
  locale,
}: {
  bishop: BishopRecord
  locale: string
}) {
  const t = await getTranslations('bishop')
  const dateLabels = { circa: t('circa'), ongoing: t('ongoing') }

  const born = formatPreciseDate(bishop.dateOfBirth, bishop.dateOfBirthPrecision, locale, dateLabels)
  const died = formatPreciseDate(bishop.dateOfDeath, bishop.dateOfDeathPrecision, locale, dateLabels)
  const termStart = formatPreciseDate(bishop.termStart, 'exact', locale, dateLabels)
  const termEnd = formatPreciseDate(bishop.termEnd, 'exact', locale, dateLabels)

  const milestones = bishop.milestones ?? []
  const honors = bishop.honors ?? []
  const galleries = (bishop.galleries ?? []).filter((g) => g.images?.length)
  const links = (bishop.links ?? []).filter((l) => l.url)
  const documents = (bishop.documents ?? []).filter((d) => d.file?.url || d.publication)
  const messages = bishop.relatedMessages ?? []
  const publications = bishop.relatedPublications ?? []

  return (
    <>
      {/* ── Header: portrait, name, title, motto, coat of arms ─────────────── */}
      <Section className="bg-white">
        <Container>
          <div className="flex flex-col gap-10 md:flex-row md:items-start">
            <div className="mx-auto shrink-0 md:mx-0">
              {bishop.portrait?.url ? (
                <div className="relative h-60 w-60 overflow-hidden rounded-full ring-4 ring-gold-300">
                  <Image
                    src={bishop.portrait.url}
                    // Alt text is authored on the media record per locale. Falling
                    // back to his name is better than an empty alt on a portrait
                    // that is the subject of the page.
                    alt={bishop.portrait.alt || bishop.fullName || ''}
                    fill
                    sizes="240px"
                    className="object-cover"
                    priority
                  />
                </div>
              ) : null}
            </div>

            <div className="flex-1">
              {bishop.isActive ? (
                <p className="mb-2 inline-block rounded-full bg-maroon-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-maroon-800">
                  {t('sittingEparch')}
                </p>
              ) : null}

              <h1 className="font-serif text-3xl font-bold text-charcoal-900 md:text-4xl">
                {bishop.fullName}
              </h1>
              {bishop.formalTitle ? (
                <p className="mt-1 font-medium text-maroon-700">{bishop.formalTitle}</p>
              ) : null}

              <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-1 text-sm text-charcoal-700 sm:grid-cols-2">
                {born ? (
                  <div>
                    <dt className="inline font-semibold">{t('born')}: </dt>
                    <dd className="inline">
                      {born}
                      {bishop.placeOfBirth ? `, ${bishop.placeOfBirth}` : ''}
                    </dd>
                  </div>
                ) : null}
                {died ? (
                  <div>
                    <dt className="inline font-semibold">{t('died')}: </dt>
                    <dd className="inline">
                      {died}
                      {bishop.placeOfDeath ? `, ${bishop.placeOfDeath}` : ''}
                    </dd>
                  </div>
                ) : null}
                {termStart ? (
                  <div>
                    <dt className="inline font-semibold">{t('term')}: </dt>
                    <dd className="inline">
                      {termStart} – {termEnd ?? t('present')}
                    </dd>
                  </div>
                ) : null}
                {bishop.appointingAuthorityName ? (
                  <div>
                    <dt className="inline font-semibold">{t('appointedBy')}: </dt>
                    <dd className="inline">{bishop.appointingAuthorityName}</dd>
                  </div>
                ) : null}
              </dl>

              {bishop.motto ? (
                <figure className="mt-6 border-s-4 border-gold-400 ps-4">
                  <blockquote className="bishop-prose font-serif italic text-charcoal-800">
                    “{bishop.motto}”
                  </blockquote>
                  {bishop.mottoOriginal || bishop.mottoNote ? (
                    <figcaption className="mt-1 text-sm text-charcoal-500">
                      {bishop.mottoOriginal}
                      {bishop.mottoOriginal && bishop.mottoNote ? ' — ' : ''}
                      {bishop.mottoNote}
                    </figcaption>
                  ) : null}
                </figure>
              ) : null}

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <PrintButton label={t('print')} />
              </div>
            </div>

            {bishop.coatOfArms?.url ? (
              <div className="mx-auto shrink-0 md:mx-0">
                <Image
                  src={bishop.coatOfArms.url}
                  alt={bishop.coatOfArms.alt || t('coatOfArms')}
                  width={140}
                  height={170}
                  className="h-auto w-32 object-contain"
                />
              </div>
            ) : null}
          </div>
        </Container>
      </Section>

      {/* ── Biography ──────────────────────────────────────────────────────── */}
      {bishop.biography || bishop.biographySummary ? (
        <Section id="biography" className="bg-parchment-50">
          <Container size="narrow">
            <h2 className="mb-6 font-serif text-2xl font-bold text-charcoal-900">
              {t('biography')}
            </h2>
            {bishop.biographySummary ? (
              <p className="bishop-prose mb-6 font-medium text-charcoal-800">
                {bishop.biographySummary}
              </p>
            ) : null}
            {bishop.biography ? (
              <div className="bishop-prose prose prose-eparchy max-w-none">
                <RichText data={bishop.biography as never} />
              </div>
            ) : null}
          </Container>
        </Section>
      ) : null}

      {/* ── Timeline ───────────────────────────────────────────────────────── */}
      {milestones.length ? (
        <Section id="timeline" className="bg-white">
          <Container size="narrow">
            <h2 className="mb-8 font-serif text-2xl font-bold text-charcoal-900">
              {t('timeline')}
            </h2>
            <BishopTimeline milestones={milestones} locale={locale} />
          </Container>
        </Section>
      ) : null}

      {/* ── Honours ────────────────────────────────────────────────────────── */}
      {honors.length ? (
        <Section id="honours" className="bg-parchment-50">
          <Container size="narrow">
            <h2 className="mb-6 font-serif text-2xl font-bold text-charcoal-900">{t('honours')}</h2>
            <ul className="space-y-4">
              {honors.map((honor, i) => {
                const when = formatPreciseDate(honor.date, honor.datePrecision, locale, dateLabels)
                return (
                  <li key={i} className="rounded-lg border border-charcoal-100 bg-white p-4">
                    <p className="bishop-prose font-semibold text-charcoal-900">{honor.name}</p>
                    <p className="mt-0.5 text-sm text-charcoal-600">
                      {[honor.awardingBody, honor.place, when].filter(Boolean).join(' · ')}
                    </p>
                    {honor.description ? (
                      <p className="bishop-prose mt-2 text-charcoal-700">{honor.description}</p>
                    ) : null}
                    {honor.url ? (
                      <a
                        href={honor.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-block text-sm text-maroon-700 underline underline-offset-2"
                      >
                        {t('moreInformation')}
                        <span aria-hidden="true"> ↗</span>
                      </a>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          </Container>
        </Section>
      ) : null}

      {/* ── Galleries ──────────────────────────────────────────────────────── */}
      {galleries.length ? (
        <Section id="galleries" className="bg-white print:hidden">
          <Container>
            <h2 className="mb-6 font-serif text-2xl font-bold text-charcoal-900">
              {t('galleries')}
            </h2>
            <BishopGalleries
              galleries={galleries}
              labels={{
                close: t('gallery.close'),
                previous: t('gallery.previous'),
                next: t('gallery.next'),
                photos: t('gallery.photos'),
                untitled: t('gallery.untitled'),
              }}
            />
          </Container>
        </Section>
      ) : null}

      {/* ── Related content ────────────────────────────────────────────────── */}
      {messages.length || publications.length ? (
        <Section id="writings" className="bg-parchment-50 print:hidden">
          <Container size="narrow">
            <h2 className="mb-6 font-serif text-2xl font-bold text-charcoal-900">
              {t('writings')}
            </h2>
            <ul className="space-y-2">
              {messages.map((message, i) => (
                <li key={`m-${i}`}>
                  <Link
                    href={`/bishop-messages/${message.slug}`}
                    className="text-maroon-700 hover:text-maroon-900"
                  >
                    {message.title}
                  </Link>
                </li>
              ))}
              {publications.map((publication, i) => (
                <li key={`p-${i}`}>
                  <Link
                    href={`/publications#${publication.slug}`}
                    className="text-maroon-700 hover:text-maroon-900"
                  >
                    {publication.title}
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}

      {/* ── Sources ────────────────────────────────────────────────────────── */}
      {links.length || documents.length ? (
        <Section id="sources" className="bg-white">
          <Container size="narrow">
            <h2 className="mb-6 font-serif text-2xl font-bold text-charcoal-900">{t('sources')}</h2>

            {links.length ? (
              <ul className="space-y-2">
                {links.map((link, i) => (
                  <li key={i}>
                    <a
                      href={link.url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-maroon-700 underline underline-offset-2 hover:text-maroon-900"
                    >
                      {link.label ?? link.url}
                      <span aria-hidden="true"> ↗</span>
                    </a>
                    {link.sourceName ? (
                      <span className="text-sm text-charcoal-500"> — {link.sourceName}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}

            {documents.length ? (
              <ul className="mt-4 space-y-2">
                {documents.map((document, i) => (
                  <li key={i}>
                    {document.file?.url ? (
                      <a
                        href={document.file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-maroon-700 underline underline-offset-2 hover:text-maroon-900"
                      >
                        {document.title}
                        <span aria-hidden="true"> ↗</span>
                      </a>
                    ) : (
                      <span className="text-charcoal-800">{document.title}</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : null}
          </Container>
        </Section>
      ) : null}
    </>
  )
}
