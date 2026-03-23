import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { buildMetadata } from '@/lib/seo/buildMetadata'

export const metadata: Metadata = buildMetadata({
  title: 'Parishes',
  description: 'Explore parishes of the Catholic Eparchy of Segeneyti across Eritrea.',
  path: '/parishes',
})

export default function ParishesPage() {
  return (
    <>
      <PageHeader
        title="Parishes"
        subtitle="Find a parish community near you."
        breadcrumbs={[{ label: 'Parishes' }]}
      />
      <Section>
        <Container>
          <p className="text-charcoal-500 text-center py-12">
            Parish profiles will appear here. This section is connected to the CMS in Stage 5.
          </p>
        </Container>
      </Section>
    </>
  )
}
