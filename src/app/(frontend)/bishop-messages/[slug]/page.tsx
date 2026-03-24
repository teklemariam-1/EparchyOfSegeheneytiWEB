import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { RichText } from '@/components/shared/RichText'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { getLocale } from 'next-intl/server'
import {
  getBishopMessageBySlug,
  getAllBishopMessageSlugs,
} from '@/lib/payload/queries'

export const revalidate = 600

export async function generateStaticParams() {
  const slugs = await getAllBishopMessageSlugs()
  return slugs.map((s) => ({ slug: s.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const msg = await getBishopMessageBySlug(slug)
  if (!msg) return {}
  return buildMetadata({
    title: msg.seo?.title ?? msg.title,
    description: msg.seo?.description ?? msg.excerpt,
    path: `/bishop-messages/${msg.slug}`,
    image: msg.featuredImage?.url,
  })
}

const MESSAGE_TYPE_LABELS: Record<string, string> = {
  'pastoral-letter': 'Pastoral Letter',
  homily: 'Homily',
  'encyclical-response': 'Encyclical Response',
  christmas: 'Christmas Message',
  easter: 'Easter Message',
  extraordinary: 'Extraordinary Announcement',
  general: 'Message',
}

function formatDate(iso?: string) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default async function BishopMessageDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const locale = await getLocale()
  const msg = await getBishopMessageBySlug(slug, locale)
  if (!msg) notFound()

  const typeLabel = msg.messageType
    ? (MESSAGE_TYPE_LABELS[msg.messageType] ?? msg.messageType)
    : 'Message'

  return (
    <>
      <PageHeader
        title={typeLabel}
        breadcrumbs={[
          { label: "Bishop's Messages", href: '/bishop-messages' },
          { label: typeLabel },
        ]}
      />

      <Section className="bg-white">
        <Container size="narrow">
          {/* Featured image */}
          {msg.featuredImage && (
            <div className="relative mb-8 aspect-[21/9] w-full overflow-hidden rounded-2xl">
              <Image
                src={msg.featuredImage.url}
                alt={msg.featuredImage.alt}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 800px"
              />
            </div>
          )}

          {/* Header */}
          <header className="mb-8">
            <span className="inline-block rounded-full bg-maroon-50 border border-maroon-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-maroon-700 mb-4">
              {typeLabel}
            </span>
            <h1 className="font-serif text-3xl font-bold text-charcoal-900 leading-tight mb-3">
              {msg.title}
            </h1>
            {msg.excerpt && (
              <p className="text-lg text-charcoal-600 leading-relaxed mb-4">{msg.excerpt}</p>
            )}
            {msg.publishedAt && (
              <time
                dateTime={msg.publishedAt}
                className="text-sm text-charcoal-400"
              >
                {formatDate(msg.publishedAt)}
              </time>
            )}
          </header>

          <hr className="divider-gold mb-8" />

          {/* Body */}
          <article className="mb-10">
            <RichText data={msg.content} />
          </article>

          {/* PDF download */}
          {msg.pdfUrl && (
            <div className="mt-8 rounded-xl border border-gold-200 bg-gold-50 px-6 py-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-charcoal-900">Download PDF</p>
                <p className="text-xs text-charcoal-500">Full text of this message as a PDF document.</p>
              </div>
              <a
                href={msg.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-lg bg-maroon-800 px-4 py-2 text-sm font-medium text-white hover:bg-maroon-700 transition-colors flex items-center gap-2"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download
              </a>
            </div>
          )}

          {/* Back link */}
          <div className="mt-10 pt-6 border-t border-charcoal-100">
            <Link
              href="/bishop-messages"
              className="inline-flex items-center gap-2 text-sm font-medium text-maroon-700 hover:text-maroon-900 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              All Bishop's Messages
            </Link>
          </div>
        </Container>
      </Section>
    </>
  )
}
