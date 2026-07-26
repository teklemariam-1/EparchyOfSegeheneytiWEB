import { getLocale, getTranslations } from 'next-intl/server'
import { MagazineHero, MagazineSecondary } from './MagazineCards'
import { FEATURED_COUNT, shouldSpanFirstCard } from './layout'
import type { ShareTarget } from './share'
import type { NewsCardData } from './NewsCard'

/**
 * Magazine listing: a featured block of five, then the rest of the page.
 *
 * ── Why the lower grid has a double-width card ───────────────────────────────
 * The page size (12) is shared with the card-grid view so both views paginate
 * identically — same articles on the same page, same total. The featured block
 * takes 5, leaving 7 for a 4-column grid, and 7 does not divide by 4. That is
 * precisely the gap the earlier magazine attempt left on every page.
 *
 * Rather than change the page size (which would desynchronise the two views) or
 * accept a hole, the first card below the featured block spans two columns.
 * Seven cards then occupy eight slots: two complete rows, a clean rectangle on
 * every full page, and a section-lead card that reads as deliberate.
 *
 * If the page size or the featured count ever changes, revisit SPAN_FIRST — the
 * arithmetic below is what keeps the page full.
 */

interface MagazineViewProps {
  items: NewsCardData[]
}

export async function MagazineView({ items }: MagazineViewProps) {
  const locale = await getLocale()
  const t = await getTranslations('news')

  const shareLabels: Record<ShareTarget, string> = {
    facebook: t('shareOnFacebook'),
    x: t('shareOnX'),
    whatsapp: t('shareOnWhatsApp'),
  }

  const hero = items[0]
  const secondaries = items.slice(1, FEATURED_COUNT)
  const rest = items.slice(FEATURED_COUNT)

  // Only worth spanning when the remainder would otherwise leave a hole in the
  // 4-column grid. On the last page `rest` is whatever is left, so this check
  // keeps that page tidy too instead of forcing an odd-looking wide card.
  const spanFirst = shouldSpanFirstCard(rest.length)

  if (!hero) return null

  return (
    <div className="space-y-5">
      {/* ── Featured block ────────────────────────────────────────────────────
          Desktop: hero 55% / 2×2 45%. Tablet: hero full width, secondaries
          2-across. Mobile: single column, hero first.
          `items-stretch` + `h-full` make the two columns end flush, so the
          block reads as one rectangle even when the hero headline is long. */}
      <div className="grid items-stretch gap-5 lg:grid-cols-[55fr_45fr]">
        <MagazineHero news={hero} locale={locale} shareLabels={shareLabels} className="h-full" />

        {secondaries.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:auto-rows-fr">
            {secondaries.map((item) => (
              <MagazineSecondary
                key={item.slug}
                news={item}
                locale={locale}
                shareLabels={shareLabels}
                className="h-full"
              />
            ))}
          </div>
        )}
      </div>

      {/* ── The rest of the page, 4-up ─────────────────────────────────────── */}
      {rest.length > 0 && (
        <div className="grid auto-rows-fr gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {rest.map((item, index) => (
            <MagazineSecondary
              key={item.slug}
              news={item}
              locale={locale}
              shareLabels={shareLabels}
              className={index === 0 && spanFirst ? 'h-full sm:col-span-2' : 'h-full'}
            />
          ))}
        </div>
      )}
    </div>
  )
}
