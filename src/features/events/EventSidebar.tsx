import Link from 'next/link'
import Image from 'next/image'
import { formatShortDate } from '@/lib/formatters/date'

/**
 * The rail beside an event.
 *
 * Modelled on the news article sidebar, which readers already know, but built
 * separately rather than reused: that component's sections take news rows with
 * a publication date, whereas an event's defining fact is WHEN IT HAPPENS —
 * which is a different date, pointing the other way in time, and the one thing
 * a reader is scanning this list for. Forcing events through the article shape
 * would have meant a date column that means something different per row.
 *
 * Sections with nothing in them are dropped entirely; a young site should not
 * show three empty boxes.
 */

export interface EventRow {
  slug: string
  title: string
  /** Optional: the most-read list is ranked by views and may predate a date. */
  startDate?: string
  featuredImage?: { url: string; alt?: string } | null
  views?: number
}

export interface EventSidebarSection {
  title: string
  items: EventRow[]
  /** Shown after the title, e.g. a view count for the most-read list. */
  showViews?: boolean
}

function DateChip({ iso, locale }: { iso?: string; locale: string }) {
  const date = new Date(iso ?? '')
  const valid = Boolean(iso) && !Number.isNaN(date.getTime())
  return (
    <span
      className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-maroon-800 text-white"
      aria-hidden="true"
    >
      {valid ? (
        <>
          <span className="text-sm font-bold leading-none">{date.getUTCDate()}</span>
          <span className="text-[9px] uppercase leading-none text-maroon-200">
            {new Intl.DateTimeFormat(locale === 'ti' ? 'ti-ER' : 'en-GB', {
              month: 'short',
              timeZone: 'UTC',
            }).format(date)}
          </span>
        </>
      ) : (
        <span className="text-xs">—</span>
      )}
    </span>
  )
}

export function EventSidebar({
  sections,
  locale,
  geezCalendar,
}: {
  sections: EventSidebarSection[]
  locale: string
  geezCalendar?: { title: string; body: string; link: string }
}) {
  const populated = sections.filter((s) => s.items.length > 0)

  return (
    <aside className="space-y-6 print:hidden">
      {populated.map((section) => (
        <section key={section.title} className="card p-5">
          <h2 className="mb-3 font-serif text-sm font-semibold uppercase tracking-wide text-charcoal-900">
            {section.title}
          </h2>
          <ul className="divide-y divide-charcoal-100">
            {section.items.map((item) => (
              <li key={item.slug} className="py-3 first:pt-0 last:pb-0">
                <Link href={`/events/${item.slug}`} className="group flex gap-3">
                  {item.featuredImage?.url ? (
                    <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-parchment-100">
                      <Image
                        src={item.featuredImage.url}
                        alt=""
                        fill
                        loading="lazy"
                        sizes="44px"
                        className="object-cover"
                      />
                    </span>
                  ) : (
                    <DateChip iso={item.startDate} locale={locale} />
                  )}

                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 text-sm font-medium leading-snug text-charcoal-800 transition-colors group-hover:text-maroon-800">
                      {item.title}
                    </span>
                    <span className="mt-0.5 block text-xs text-charcoal-400">
                      {item.startDate ? formatShortDate(item.startDate, locale) : null}
                      {section.showViews && typeof item.views === 'number' && item.views > 0 && (
                        <span className="ms-2">· {item.views.toLocaleString()}</span>
                      )}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {geezCalendar && (
        <div className="rounded-xl border border-maroon-100 bg-maroon-50 p-5">
          <h2 className="mb-2 font-serif text-sm font-semibold text-charcoal-900">
            {geezCalendar.title}
          </h2>
          <p className="mb-3 text-xs leading-relaxed text-charcoal-600">{geezCalendar.body}</p>
          <Link
            href="/geez-calendar"
            className="text-xs font-semibold text-maroon-700 transition-colors hover:text-maroon-900"
          >
            {geezCalendar.link} →
          </Link>
        </div>
      )}
    </aside>
  )
}
