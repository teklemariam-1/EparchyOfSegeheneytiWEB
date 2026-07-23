import Link from 'next/link'
import Image from 'next/image'
import { formatDate } from '@/lib/formatters/date'
import type { EventListItem, MediaItem, TaxonomyOption } from '@/lib/payload/queries'

export interface SidebarArticle {
  href: string
  title: string
  date?: string
  imageUrl?: string | null
  views?: number
}

export interface SidebarSection {
  title: string
  items: SidebarArticle[]
}

function SectionShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-charcoal-100 bg-white p-5">
      <h2 className="font-serif text-base font-semibold text-charcoal-900">{title}</h2>
      <div className="mt-1 mb-4 h-1 w-10 rounded-full bg-gold-400" />
      {children}
    </div>
  )
}

function ArticleRow({ item }: { item: SidebarArticle }) {
  return (
    <li>
      <Link href={item.href} className="group flex gap-3">
        {item.imageUrl ? (
          <span className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-charcoal-100">
            <Image src={item.imageUrl} alt="" fill sizes="80px" className="object-cover" />
          </span>
        ) : (
          <span className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg bg-maroon-50 text-maroon-300">
            ✝
          </span>
        )}
        <span className="min-w-0">
          <span className="line-clamp-2 text-sm font-medium leading-snug text-charcoal-800 group-hover:text-maroon-800 transition-colors">
            {item.title}
          </span>
          <span className="mt-0.5 block text-xs text-charcoal-400">
            {item.date ? formatDate(item.date, { month: 'short', day: 'numeric', year: 'numeric' }) : null}
            {item.views !== undefined && (
              <span className="ml-2 inline-flex items-center gap-1">
                👁 {item.views.toLocaleString()}
              </span>
            )}
          </span>
        </span>
      </Link>
    </li>
  )
}

/**
 * Reusable article sidebar: related / most-read / latest article sections,
 * upcoming events, category pills and recent media thumbnails. Sections with
 * no items are simply omitted.
 */
export function ArticleSidebar({
  sections = [],
  events,
  categories,
  recentMedia,
}: {
  sections?: SidebarSection[]
  events?: { title: string; items: EventListItem[] }
  categories?: { title: string; items: TaxonomyOption[]; hrefFor: (value: string) => string }
  recentMedia?: { title: string; items: MediaItem[]; href: string }
}) {
  return (
    <aside className="space-y-6 print:hidden" aria-label="Related content">
      {sections
        .filter((s) => s.items.length > 0)
        .map((s) => (
          <SectionShell key={s.title} title={s.title}>
            <ul className="space-y-4">
              {s.items.map((item) => (
                <ArticleRow key={item.href} item={item} />
              ))}
            </ul>
          </SectionShell>
        ))}

      {events && events.items.length > 0 && (
        <SectionShell title={events.title}>
          <ul className="space-y-3">
            {events.items.map((ev) => (
              <li key={ev.slug}>
                <Link href={`/events/${ev.slug}`} className="group flex gap-3">
                  <span className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-maroon-800 text-white">
                    <span className="text-sm font-bold leading-none">
                      {new Date(ev.startDate).getDate()}
                    </span>
                    <span className="text-[9px] uppercase text-maroon-200">
                      {formatDate(ev.startDate, { month: 'short' })}
                    </span>
                  </span>
                  <span className="min-w-0">
                    <span className="line-clamp-2 text-sm font-medium leading-snug text-charcoal-800 group-hover:text-maroon-800 transition-colors">
                      {ev.title}
                    </span>
                    {ev.location?.venue && (
                      <span className="mt-0.5 block truncate text-xs text-charcoal-400">📍 {ev.location.venue}</span>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </SectionShell>
      )}

      {categories && categories.items.length > 0 && (
        <SectionShell title={categories.title}>
          <div className="flex flex-wrap gap-2">
            {categories.items.map((c) => (
              <Link
                key={c.value}
                href={categories.hrefFor(c.value)}
                className="rounded-full border border-charcoal-200 px-3 py-1 text-xs text-charcoal-600 transition-colors hover:border-maroon-400 hover:bg-maroon-50 hover:text-maroon-800"
              >
                {c.label}
              </Link>
            ))}
          </div>
        </SectionShell>
      )}

      {recentMedia && recentMedia.items.length > 0 && (
        <SectionShell title={recentMedia.title}>
          <div className="grid grid-cols-3 gap-2">
            {recentMedia.items.slice(0, 6).map((m) => (
              <Link key={m.id} href={recentMedia.href} className="relative aspect-square overflow-hidden rounded-lg bg-charcoal-100">
                <Image
                  src={m.sizes?.thumbnail?.url ?? m.sizes?.card?.url ?? m.url}
                  alt={m.alt}
                  fill
                  sizes="90px"
                  className="object-cover transition-transform duration-300 hover:scale-105"
                />
              </Link>
            ))}
          </div>
        </SectionShell>
      )}
    </aside>
  )
}

export default ArticleSidebar
