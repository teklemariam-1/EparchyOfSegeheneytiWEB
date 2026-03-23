import type { Metadata } from 'next'
import { HeroSection } from '@/features/home/HeroSection'
import { LatestNewsSection } from '@/features/home/LatestNewsSection'
import { UpcomingEventsSection } from '@/features/home/UpcomingEventsSection'
import { BishopMessageSection } from '@/features/home/BishopMessageSection'
import { QuickLinksSection } from '@/features/home/QuickLinksSection'
import { buildMetadata } from '@/lib/seo/buildMetadata'

export const metadata: Metadata = buildMetadata({
  title: 'Catholic Eparchy of Segeneyti',
  description:
    "The official website of the Catholic Eparchy of Segeneyti in Eritrea — serving God's people through faith, community, and mission.",
  isHome: true,
})

// Revalidate home page every 5 minutes; Payload afterChange hooks will
// call revalidateTag('homepage') for immediate cache busting on publish.
export const revalidate = 300

export default async function HomePage() {
  return (
    <>
      <HeroSection />
      <BishopMessageSection />
      <LatestNewsSection />
      <UpcomingEventsSection />
      <QuickLinksSection />
    </>
  )
}
