import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/formatters/date'
import { RichText } from '@/components/shared/RichText'
import { getLocale } from 'next-intl/server'
import { getNewsBySlug, getNewsList, getAllNewsSlugs } from '@/lib/payload/queries'

export const revalidate = 300

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return getAllNewsSlugs()
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const article = await getNewsBySlug(slug)
  return buildMetadata({
    title: article?.seo?.title ?? article?.title ?? `News — ${slug}`,
    description: article?.seo?.description ?? article?.excerpt,
    path: `/news/${slug}`,
  })
}

export default async function NewsDetailPage({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const [article, { docs: related }] = await Promise.all([
    getNewsBySlug(slug, locale),
    getNewsList({ limit: 4, locale }),
  ])

  if (!article) notFound()

  const relatedArticles = related.filter((r) => r.slug !== slug).slice(0, 3)
  const categoryLabel = article.category
    ? article.category.charAt(0).toUpperCase() + article.category.slice(1)
    : 'News'

  return (
    <>
      <PageHeader
        title={article.title}
        breadcrumbs={[{ label: 'News', href: '/news' }, { label: article.title }]}
      />

      <Section className="bg-white">
        <Container>
          <div className="grid lg:grid-cols-3 gap-10">
            {/* Main article */}
            <article className="lg:col-span-2">
              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <Badge variant="maroon">{categoryLabel}</Badge>
                {article.publishedAt && (
                  <time className="text-sm text-charcoal-400" dateTime={article.publishedAt}>
                    {formatDate(article.publishedAt)}
                  </time>
                )}
                {article.author && (
                  <>
                    <span className="text-sm text-charcoal-400">·</span>
                    <span className="text-sm text-charcoal-500">By {article.author}</span>
                  </>
                )}
              </div>

              {/* Featured image */}
              {article.featuredImage?.url ? (
                <div className="mb-8 relative h-64 md:h-80 rounded-xl overflow-hidden">
                  <Image
                    src={article.featuredImage.url}
                    alt={article.featuredImage.alt}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 1024px) 100vw, 66vw"
                  />
                </div>
              ) : (
                <div className="mb-8 h-64 md:h-80 rounded-xl bg-parchment-100 flex items-center justify-center">
                  <svg className="h-16 w-16 text-maroon-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}

              {/* Rich text content */}
              {article.content ? (
                <RichText data={article.content} />
              ) : article.excerpt ? (
                <div className="prose prose-eparchy max-w-none">
                  <p className="lead">{article.excerpt}</p>
                </div>
              ) : null}

              {/* Tags */}
              {article.tags && article.tags.length > 0 && (
                <div className="mt-8 flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <Badge key={tag} variant="neutral">{tag}</Badge>
                  ))}
                </div>
              )}

              {/* Back link */}
              <div className="mt-10 flex items-center justify-between border-t border-charcoal-100 pt-6">
                <Link
                  href="/news"
                  className="text-sm font-medium text-maroon-700 hover:text-maroon-900 transition-colors"
                >
                  ← Back to News
                </Link>
              </div>
            </article>

            {/* Sidebar */}
            <aside className="space-y-8">
              {/* Related articles */}
              {relatedArticles.length > 0 && (
                <div className="card p-5">
                  <h3 className="font-serif text-base font-semibold text-charcoal-900 mb-4">
                    Related Articles
                  </h3>
                  <ul className="divide-y divide-charcoal-100">
                    {relatedArticles.map((r) => (
                      <li key={r.slug} className="py-3">
                        <Link
                          href={`/news/${r.slug}`}
                          className="text-sm font-medium text-charcoal-700 hover:text-maroon-700 transition-colors line-clamp-2"
                        >
                          {r.title}
                        </Link>
                        {r.publishedAt && (
                          <p className="text-xs text-charcoal-400 mt-1">
                            {formatDate(r.publishedAt, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Subscribe CTA */}
              <div className="rounded-xl bg-parchment-50 border border-parchment-200 p-5">
                <h3 className="font-serif text-base font-semibold text-charcoal-900 mb-2">
                  Stay Informed
                </h3>
                <p className="text-xs text-charcoal-600 mb-4 leading-relaxed">
                  Subscribe to the Eparchy newsletter to receive news and pastoral letters directly in your inbox.
                </p>
                <Link href="/contact" className="btn-primary w-full text-center block text-sm">
                  Subscribe
                </Link>
              </div>
            </aside>
          </div>
        </Container>
      </Section>
    </>
  )
}
