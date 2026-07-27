import Link from 'next/link'
import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { RichText } from '@/components/shared/RichText'
import { buildTimeline, formatMilestoneRange } from '@/lib/bishops/timeline'
import type { BishopMilestone } from '@/lib/bishops/queries'

/**
 * Vertical timeline of a bishop's public milestones.
 *
 * Grouped into the four arcs of a life rather than rendered flat: forty entries
 * in a single column is a wall of text a reader gives up on, whereas
 * "Formation", "Priesthood", "Episcopacy" lets them find the part they came
 * for.
 *
 * Dates render only to the precision they were recorded at — "1998", "circa
 * 1998", "March 2004" — because publishing 1 January for a man whose birth year
 * is all anyone knows would be an invention presented as a fact.
 */
export async function BishopTimeline({
  milestones,
  locale,
}: {
  milestones: BishopMilestone[]
  locale: string
}) {
  const t = await getTranslations('bishop')
  if (!milestones.length) return null

  const groups = buildTimeline(milestones)
  const dateLabels = { circa: t('circa'), ongoing: t('ongoing'), dash: '–' }

  return (
    <div className="space-y-12">
      {groups.map((group) => (
        <section key={group.period} aria-labelledby={`period-${group.period}`}>
          <h3
            id={`period-${group.period}`}
            className="text-xs font-semibold uppercase tracking-widest text-maroon-700 mb-6"
          >
            {t(`period.${group.period}`)}
          </h3>

          {/* The rail is decorative; the semantic structure is the list itself. */}
          <ol className="relative border-s-2 border-gold-200 ms-3 space-y-8">
            {group.milestones.map((milestone, i) => {
              const range = formatMilestoneRange(milestone, locale, dateLabels)
              const people = (milestone.people ?? []).filter((p) => p?.name || p?.priest?.fullName)

              return (
                <li key={`${group.period}-${i}`} className="ms-6">
                  <span
                    aria-hidden="true"
                    className="absolute -start-[7px] mt-1.5 h-3 w-3 rounded-full bg-gold-500 ring-4 ring-parchment-50"
                  />

                  {range ? (
                    <p className="text-xs font-semibold uppercase tracking-wide text-maroon-700 mb-1">
                      {range}
                    </p>
                  ) : null}

                  {/* Content text scales with the reader's font-size preference;
                      Ge'ez gets looser leading via :lang(ti) in globals.css. */}
                  <h4 className="bishop-milestone-title font-serif font-bold text-charcoal-900">
                    {milestone.title}
                  </h4>

                  {milestone.location || milestone.parish || milestone.vicariate ? (
                    <p className="text-sm text-charcoal-600 mt-0.5">
                      {[
                        milestone.location,
                        milestone.parish?.name,
                        milestone.vicariate?.name,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  ) : null}

                  {milestone.description ? (
                    <div className="bishop-prose prose prose-eparchy max-w-none mt-2">
                      <RichText data={milestone.description as never} />
                    </div>
                  ) : null}

                  {people.length ? (
                    <p className="text-sm text-charcoal-600 mt-2">
                      {people
                        .map((p) => {
                          const name = p.priest?.fullName ?? p.name
                          return p.role ? `${t(`role.${p.role}`)}: ${name}` : name
                        })
                        .join(' · ')}
                    </p>
                  ) : null}

                  {milestone.photos?.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {milestone.photos.slice(0, 4).map((photo, p) =>
                        photo?.url ? (
                          <div key={p} className="relative h-20 w-28 overflow-hidden rounded-md">
                            <Image
                              src={photo.url}
                              alt={photo.alt ?? milestone.title ?? ''}
                              fill
                              loading="lazy"
                              sizes="112px"
                              className="object-cover"
                            />
                          </div>
                        ) : null,
                      )}
                    </div>
                  ) : null}

                  {milestone.galleryKey ? (
                    <Link
                      href={`#gallery-${milestone.galleryKey}`}
                      className="mt-2 inline-block text-sm font-medium text-maroon-700 hover:text-maroon-900"
                    >
                      {t('seeGallery')} →
                    </Link>
                  ) : null}

                  {milestone.links?.length ? (
                    <ul className="mt-2 space-y-1">
                      {milestone.links.map((link, l) =>
                        link?.url ? (
                          <li key={l}>
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-maroon-700 underline underline-offset-2 hover:text-maroon-900"
                            >
                              {link.label ?? link.url}
                              <span aria-hidden="true"> ↗</span>
                            </a>
                          </li>
                        ) : null,
                      )}
                    </ul>
                  ) : null}
                </li>
              )
            })}
          </ol>
        </section>
      ))}
    </div>
  )
}
