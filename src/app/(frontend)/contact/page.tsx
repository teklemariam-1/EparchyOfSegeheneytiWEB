import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { buildMetadata } from '@/lib/seo/buildMetadata'

export const metadata: Metadata = buildMetadata({
  title: 'Contact',
  description: 'Contact the Catholic Eparchy of Segeneyti Chancery office.',
  path: '/contact',
})

export default function ContactPage() {
  return (
    <>
      <PageHeader
        title="Contact Us"
        subtitle="Reach the Chancery and Eparchy offices."
        breadcrumbs={[{ label: 'Contact' }]}
      />
      <Section>
        <Container size="narrow">
          <p className="text-charcoal-500 text-center py-12">
            Contact form and office information will appear here. This will be implemented fully in Stage 6.
          </p>
        </Container>
      </Section>
    </>
  )
}
