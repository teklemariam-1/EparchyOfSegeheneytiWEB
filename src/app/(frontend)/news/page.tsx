import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { buildMetadata } from '@/lib/seo/buildMetadata'

export const metadata: Metadata = buildMetadata({
  title: 'News',
  description: 'Latest news and announcements from the Catholic Eparchy of Segeneyti.',
  path: '/news',
})

export default function NewsPage() {
  return (
    <>
      <PageHeader
        title="News"
        subtitle="Announcements and updates from the Eparchy."
        breadcrumbs={[{ label: 'News' }]}
      />
      <Section>
        <Container>
          <p className="text-charcoal-500 text-center py-12">
            News articles will appear here. This section is connected to the CMS in Stage 5.
          </p>
        </Container>
      </Section>
    </>
  )
}
