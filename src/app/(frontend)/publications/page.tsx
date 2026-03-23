import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { buildMetadata } from '@/lib/seo/buildMetadata'

export const metadata: Metadata = buildMetadata({
  title: 'Publications',
  description: 'Magazines, publications, and archives from the Catholic Eparchy of Segeneyti.',
  path: '/publications',
})

export default function PublicationsPage() {
  return (
    <>
      <PageHeader
        title="Publications"
        subtitle="Magazines, documents, and archives from the Eparchy."
        breadcrumbs={[{ label: 'Publications' }]}
      />
      <Section>
        <Container>
          <p className="text-charcoal-500 text-center py-12">
            Publications will appear here. This section is connected to the CMS in Stage 5.
          </p>
        </Container>
      </Section>
    </>
  )
}
