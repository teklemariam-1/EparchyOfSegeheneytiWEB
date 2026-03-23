import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return buildMetadata({ title: `Event — ${slug}`, path: `/events/${slug}` })
}

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params
  if (!slug) notFound()

  return (
    <>
      <PageHeader
        title="Event"
        breadcrumbs={[{ label: 'Events', href: '/events' }, { label: slug }]}
      />
      <Section>
        <Container size="narrow">
          <p className="text-charcoal-500 text-center py-12">
            Event detail for &ldquo;{slug}&rdquo; will appear here in Stage 5.
          </p>
        </Container>
      </Section>
    </>
  )
}
