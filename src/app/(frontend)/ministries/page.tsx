import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { buildMetadata } from '@/lib/seo/buildMetadata'

export const metadata: Metadata = buildMetadata({
  title: 'Ministries',
  description: 'The various ministries and apostolates of the Catholic Eparchy of Segeneyti.',
  path: '/ministries',
})

export default function MinistriesPage() {
  return (
    <>
      <PageHeader
        title="Ministries"
        subtitle="Serving together in every area of Church life."
        breadcrumbs={[{ label: 'Ministries' }]}
      />
      <Section>
        <Container>
          <p className="text-charcoal-500 text-center py-12">
            Ministry sections will appear here. This section is connected to the CMS in Stage 5.
          </p>
        </Container>
      </Section>
    </>
  )
}
