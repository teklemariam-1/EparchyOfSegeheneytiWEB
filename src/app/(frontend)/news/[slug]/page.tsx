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
  return buildMetadata({
    title: `News — ${slug}`,
    path: `/news/${slug}`,
  })
}

export default async function NewsDetailPage({ params }: Props) {
  const { slug } = await params

  // In Stage 5, this will fetch from Payload by slug and call notFound() if missing
  if (!slug) notFound()

  return (
    <>
      <PageHeader
        title="News Article"
        breadcrumbs={[{ label: 'News', href: '/news' }, { label: slug }]}
      />
      <Section>
        <Container size="narrow">
          <p className="text-charcoal-500 text-center py-12">
            Article content for &ldquo;{slug}&rdquo; will appear here once connected to the CMS in Stage 5.
          </p>
        </Container>
      </Section>
    </>
  )
}
