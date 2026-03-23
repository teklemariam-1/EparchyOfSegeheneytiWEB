import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { buildMetadata } from '@/lib/seo/buildMetadata'

export const metadata: Metadata = buildMetadata({
  title: 'Events',
  description: 'Upcoming events and celebrations in the Catholic Eparchy of Segeneyti.',
  path: '/events',
})

export default function EventsPage() {
  return (
    <>
      <PageHeader
        title="Events"
        subtitle="Liturgical celebrations, community gatherings, and special occasions."
        breadcrumbs={[{ label: 'Events' }]}
      />
      <Section>
        <Container>
          <p className="text-charcoal-500 text-center py-12">
            Events will appear here. This section is connected to the CMS in Stage 5.
          </p>
        </Container>
      </Section>
    </>
  )
}
