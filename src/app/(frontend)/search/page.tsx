import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { buildMetadata } from '@/lib/seo/buildMetadata'

export const metadata: Metadata = buildMetadata({
  title: 'Search',
  description: 'Search across all content on the Catholic Eparchy of Segeneyti website.',
  path: '/search',
})

export default function SearchPage() {
  return (
    <>
      <PageHeader
        title="Search"
        subtitle="Find news, events, parishes, and more."
        breadcrumbs={[{ label: 'Search' }]}
      />
      <Section>
        <Container size="narrow">
          <p className="text-charcoal-500 text-center py-12">
            Search functionality will be implemented in Stage 6.
          </p>
        </Container>
      </Section>
    </>
  )
}
