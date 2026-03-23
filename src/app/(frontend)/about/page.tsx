import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { buildMetadata } from '@/lib/seo/buildMetadata'

export const metadata: Metadata = buildMetadata({
  title: 'About the Eparchy',
  description: 'Learn about the Catholic Eparchy of Segeneyti, its history, mission, and leadership.',
  path: '/about',
})

export default function AboutPage() {
  return (
    <>
      <PageHeader
        title="About the Eparchy"
        subtitle="Rooted in faith, united in mission."
        breadcrumbs={[{ label: 'About' }]}
      />
      <Section>
        <Container size="narrow">
          <div className="prose prose-eparchy max-w-none">
            <p className="lead text-xl text-charcoal-600 leading-relaxed">
              The Catholic Eparchy of Segeneyti is a diocese of the Catholic Church in Eritrea,
              serving the faithful across its parishes, schools, and ministries.
            </p>
            <p>
              Content about the Eparchy will be managed through the CMS and displayed here.
              This page will be connected to the Pages collection in Stage 5.
            </p>
          </div>
        </Container>
      </Section>
    </>
  )
}
