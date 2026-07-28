import type { Metadata } from 'next'
import { getLocale } from 'next-intl/server'
import { HeroSection } from '@/features/home/HeroSection'
import { LatestNewsSection } from '@/features/home/LatestNewsSection'
import { UpcomingEventsSection } from '@/features/home/UpcomingEventsSection'
import { BishopMessageSection } from '@/features/home/BishopMessageSection'
import { QuickLinksSection } from '@/features/home/QuickLinksSection'
import { TodaysFeast } from '@/features/calendar-sync/widgets/TodaysFeast'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { JsonLd } from '@/components/seo/JsonLd'
import { websiteSchema, organizationSchema } from '@/lib/seo/structuredData'
import {
  getHomepageGlobal,
  getNewsList,
  getUpcomingEvents,
  getLatestBishopMessage,
  getSiteSettings,
} from '@/lib/payload/queries'
import { getActiveBishop } from '@/lib/bishops/queries'

export const metadata: Metadata = buildMetadata({
  title: 'Catholic Eparchy of Segheneyti',
  description:
    "The official website of the Catholic Eparchy of Segheneyti in Eritrea — serving God's people through faith, community, and mission.",
  isHome: true,
})

export const revalidate = 300

export default async function HomePage() {
  const locale = await getLocale()

  let homepage: Awaited<ReturnType<typeof getHomepageGlobal>> = {}
  let news: Awaited<ReturnType<typeof getNewsList>>['docs'] = []
  let events: Awaited<ReturnType<typeof getUpcomingEvents>> = []
  let bishopMessage: Awaited<ReturnType<typeof getLatestBishopMessage>> = null
  let settings: Awaited<ReturnType<typeof getSiteSettings>> = {}
  let bishop: Awaited<ReturnType<typeof getActiveBishop>> = null

  try {
    homepage = await getHomepageGlobal(locale)
    const newsLimit = homepage.latestNews?.limit ?? 3
    const eventsLimit = homepage.upcomingEvents?.limit ?? 5
    const results = await Promise.all([
      getNewsList({ limit: newsLimit, locale }),
      getUpcomingEvents(eventsLimit, locale),
      getLatestBishopMessage(locale),
      getSiteSettings(locale),
      // Name, title and portrait of the sitting Eparch — no longer read from
      // the homepage global, so a change of Eparch updates this section too.
      getActiveBishop(locale),
    ])
    news = results[0].docs
    events = results[1]
    bishopMessage = results[2]
    settings = results[3]
    bishop = results[4]
  } catch {
    // DB unavailable — render full page structure with empty data
  }

  // Hero emblem: shown unless explicitly disabled in Site Settings.
  const heroLogo = settings.showHeroLogo !== false ? (settings.logo ?? settings.logoDark) : null

  return (
    <>
      <JsonLd data={[websiteSchema(), organizationSchema()]} />
      <HeroSection hero={homepage.hero} logo={heroLogo} />
      <TodaysFeast />
      <BishopMessageSection
        config={homepage.bishopMessage}
        message={bishopMessage}
        bishop={bishop}
      />
      <LatestNewsSection config={homepage.latestNews} news={news} />
      <UpcomingEventsSection config={homepage.upcomingEvents} events={events} />
      <QuickLinksSection config={homepage.quickLinks} />
    </>
  )
}
