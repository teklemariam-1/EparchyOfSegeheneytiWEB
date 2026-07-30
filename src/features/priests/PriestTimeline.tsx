import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { formatPreciseDate, sortMilestones } from '@/lib/bishops/timeline'
import type { PriestMilestone } from '@/lib/payload/queries'

/**
 * A priest's ministry history, in one chronological column.
 *
 * Deliberately NOT the Bishops timeline. That component groups entries into the
 * four arcs of a life, which earns its complexity at forty entries but produces
 * three headings over five lines for a parish priest — and its period mapping
 * only knows episcopal milestone types, so a priest's entries would all fall
 * into "Episcopacy". The date formatting is genuinely shared, because the
 * problem it solves — records that only vouch for a year — is the same one.
 *
 * A missing date is not a defect here. Rural and older records often give a
 * year and nothing more, so an entry with no date at all still renders its
 * title; it simply sorts last.
 */
export async function PriestTimeline({
  milestones,
  locale,
}: {
  milestones: PriestMilestone[]
  locale: string
}) {
  const t = await getTranslations('clergy')
  const entries = sortMilestones(milestones.filter((m) => m?.title))
  if (!entries.length) return null

  return (
    <ol className="relative ms-3 space-y-8 border-s-2 border-gold-200">
      {entries.map((milestone, i) => {
        const date = formatPreciseDate(milestone.date, milestone.datePrecision, locale, {
          circa: t('circa'),
        })

        return (
          <li key={i} className="ms-6">
            <span
              aria-hidden="true"
              className="absolute -start-[7px] mt-1.5 h-3 w-3 rounded-full bg-gold-500 ring-4 ring-white"
            />

            {date ? (
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-maroon-700">
                {date}
              </p>
            ) : null}

            <h3 className="font-serif font-bold leading-snug text-charcoal-900">
              {milestone.title}
            </h3>

            {milestone.parish?.slug ? (
              <Link
                href={`/parishes/${milestone.parish.slug}`}
                className="mt-0.5 inline-block text-sm text-maroon-700 hover:text-maroon-900"
              >
                {milestone.parish.name}
              </Link>
            ) : milestone.parish?.name ? (
              <p className="mt-0.5 text-sm text-charcoal-600">{milestone.parish.name}</p>
            ) : null}

            {milestone.description ? (
              <p className="mt-2 text-sm leading-relaxed text-charcoal-600">
                {milestone.description}
              </p>
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}
