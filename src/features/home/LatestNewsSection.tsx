import Link from 'next/link'
import Image from 'next/image'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { formatDate } from '@/lib/formatters/date'
import { Badge } from '@/components/ui/Badge'
import type { NewsListItem, HomepageGlobal } from '@/lib/payload/queries'

interface Props {
  config?: HomepageGlobal['latestNews']
  news: NewsListItem[]
}

function EmptyNewsState() {
  return (
    <div className="py-16 flex flex-col items-center justify-center text-center">
      <div className="h-16 w-16 rounded-full bg-maroon-50 flex items-center justify-center mb-4">
        <span className="text-maroon-300 text-2xl">✝</span>
      </div>
      <p className="text-charcoal-400 text-base">No news available at the moment.</p>
      <p className="text-charcoal-300 text-sm mt-1">Check back soon for updates from the Eparchy.</p>
    </div>
  )
}

export function LatestNewsSection({ config, news }: Props) {
  if (config?.enabled === false) return null

  const heading = config?.heading ?? 'Latest News'

  return (
    <Section className="bg-white" aria-labelledby="news-section-title">
      <Container>
        {/* Section header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-sm font-semibold text-gold-600 uppercase tracking-widest mb-1">
              From the Eparchy
            </p>
            <h2
              id="news-section-title"
              className="text-3xl md:text-4xl font-serif font-bold text-maroon-900"
            >
              {heading}
            </h2>
            <div className="divider-gold mt-3" />
          </div>
          <Link href="/news" className="btn-ghost hidden sm:inline-flex">
            All News →
          </Link>
        </div>

        {/* News grid */}
        {!news.length ? (
          <EmptyNewsState />
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map((item) => (
            <article key={item.id} className="card flex flex-col">
              {/* Featured image or placeholder */}
              {item.featuredImage?.url ? (
                <div className="relative h-44 overflow-hidden">
                  <Image
                    src={item.featuredImage.url}
                    alt={item.featuredImage.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
              ) : (
                <div className="h-44 bg-gradient-to-br from-maroon-100 to-maroon-200 flex items-center justify-center">
                  <span className="text-maroon-400 text-3xl">✝</span>
                </div>
              )}

              <div className="flex flex-col flex-1 p-5">
                <div className="flex items-center gap-2 mb-3">
                  {item.category && <Badge variant="maroon">{item.category}</Badge>}
                  {item.publishedAt && (
                    <span className="text-xs text-charcoal-400">
                      {formatDate(item.publishedAt, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-semibold text-charcoal-900 leading-snug mb-2 font-serif">
                  <Link
                    href={`/news/${item.slug}`}
                    className="hover:text-maroon-800 transition-colors"
                  >
                    {item.title}
                  </Link>
                </h3>

                {item.excerpt && (
                  <p className="text-sm text-charcoal-600 leading-relaxed flex-1">
                    {item.excerpt}
                  </p>
                )}

                <Link
                  href={`/news/${item.slug}`}
                  className="mt-4 text-sm font-medium text-maroon-700 hover:text-maroon-900 transition-colors inline-flex items-center gap-1"
                >
                  Read more
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link href="/news" className="btn-secondary">
            All News
          </Link>
        </div>
        </div>
        )}
      </Container>
    </Section>
  )
}
