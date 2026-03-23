import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { buildMetadata } from '@/lib/seo/buildMetadata'

export const metadata: Metadata = buildMetadata({
  title: 'Media',
  description: 'Photo gallery and videos from the Catholic Eparchy of Segeneyti.',
  path: '/media',
})

export default function MediaPage() {
  return (
    <>
      <PageHeader
        title="Media"
        subtitle="Photos and videos from Eparchy life and events."
        breadcrumbs={[{ label: 'Media' }]}
      />
      <Section>
        <Container>
          <p className="text-charcoal-500 text-center py-12">
            Media gallery will appear here. This section is connected to the CMS in Stage 5.
          </p>
        </Container>
      </Section>
    </>
  )
}
