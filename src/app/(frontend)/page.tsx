import type { Metadata } from 'next'
import { getLocale } from 'next-intl/server'
import { HeroSection } from '@/features/home/HeroSection'
import { LatestNewsSection } from '@/features/home/LatestNewsSection'
import { UpcomingEventsSection } from '@/features/home/UpcomingEventsSection'
import { BishopMessageSection } from '@/features/home/BishopMessageSection'
import { QuickLinksSection } from '@/features/home/QuickLinksSection'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import {
  getHomepageGlobal,
  getNewsList,
  getUpcomingEvents,
  getLatestBishopMessage,
} from '@/lib/payload/queries'

export const metadata: Metadata = buildMetadata({
  title: 'Catholic Eparchy of Segeneyti',
  description:
    "The official website of the Catholic Eparchy of Segeneyti in Eritrea — serving God's people through faith, community, and mission.",
  isHome: true,
})

export const revalidate = 300

export default async function HomePage() {
  const locale = await getLocale()

  let homepage: Awaited<ReturnType<typeof getHomepageGlobal>> = {}
  let news: Awaited<ReturnType<typeof getNewsList>>['docs'] = []
  let events: Awaited<ReturnType<typeof getUpcomingEvents>> = []
  let bishopMessage: Awaited<ReturnType<typeof getLatestBishopMessage>> = null

  try {
    homepage = await getHomepageGlobal(locale)
    const newsLimit = homepage.latestNews?.limit ?? 3
    const eventsLimit = homepage.upcomingEvents?.limit ?? 5
    const results = await Promise.all([
      getNewsList({ limit: newsLimit, locale }),
      getUpcomingEvents(eventsLimit, locale),
      getLatestBishopMessage(locale),
    ])
    news = results[0].docs
    events = results[1]
    bishopMessage = results[2]
  } catch {
    // DB unavailable — render full page structure with empty data
  }

  return (
    <>
      <HeroSection hero={homepage.hero} />
      <BishopMessageSection config={homepage.bishopMessage} message={bishopMessage} />
      <LatestNewsSection config={homepage.latestNews} news={news} />
      <UpcomingEventsSection config={homepage.upcomingEvents} events={events} />
      <QuickLinksSection />
    </>
  )
}
