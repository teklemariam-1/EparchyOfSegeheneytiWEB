import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/formatters/date'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const revalidate = 300

interface Props {
  params: Promise<{ slug: string }>
}

// Mock data — real fetch via Payload in Stage 5
const MOCK_ARTICLES: Record<
  string,
  {
    title: string
    category: string
    publishedAt: string
    author: string
    excerpt: string
    body: string[]
    relatedSlugs: string[]
  }
> = {
  'bishop-pastoral-letter-2024': {
    title: 'Bishop Issues Pastoral Letter on Family and Faith',
    category: 'eparchy',
    publishedAt: '2024-12-01T08:00:00Z',
    author: 'Chancery Office',
    excerpt:
      'In a heartfelt message to the faithful, the Bishop of Segeneyti reflects on the role of the family as the domestic church.',
    body: [
      'In a wide-ranging pastoral letter addressed to the clergy, religious, and lay faithful of the Eparchy of Segeneyti, the Bishop has called for a renewed commitment to building up the family as the domestic church.',
      'The letter, issued at the beginning of the Ge\'ez liturgical year, draws on the teaching of the Second Vatican Council and recent magisterial documents to emphasise that the home is the primary place of encounter with the living God.',
      '"Every Christian home is a little church," the Bishop writes. "When parents pray with their children, when forgiveness is practised daily, when the table becomes an altar of encounter — there the Kingdom of God takes root."',
      'The pastoral letter also outlined concrete proposals: a monthly Family Rosary initiative to be promoted in every parish, the formation of family leadership teams within each Small Christian Community, and a diocesan Family Day to be celebrated on the feast of the Holy Family.',
    ],
    relatedSlugs: ['advent-preparations-parishes', 'synod-eritrean-bishops'],
  },
}

const RELATED_TITLES: Record<string, string> = {
  'advent-preparations-parishes': 'Parishes Across the Eparchy Prepare for Advent Season',
  'synod-eritrean-bishops': "Eritrean Catholic Bishops' Conference Concludes Autumn Synod",
  'youth-day-segeneyti-2024': 'Diocesan Youth Day 2024 Draws 800 Young Pilgrims',
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const article = MOCK_ARTICLES[slug]
  return buildMetadata({
    title: article?.title ?? `News — ${slug}`,
    description: article?.excerpt,
    path: `/news/${slug}`,
  })
}

export default async function NewsDetailPage({ params }: Props) {
  const { slug } = await params
  const article = MOCK_ARTICLES[slug]

  // Fallback article for unknown slugs during Stage 4 preview
  const display = article ?? {
    title: decodeURIComponent(slug).replace(/-/g, ' '),
    category: 'eparchy',
    publishedAt: new Date().toISOString(),
    author: 'Chancery Office',
    excerpt: '',
    body: [
      'Full article content will be available once this page is connected to the CMS in Stage 5.',
    ],
    relatedSlugs: [],
  }

  return (
    <>
      <PageHeader
        title={display.title}
        breadcrumbs={[{ label: 'News', href: '/news' }, { label: display.title }]}
      />

      <Section className="bg-white">
        <Container>
          <div className="grid lg:grid-cols-3 gap-10">
            {/* Main article */}
            <article className="lg:col-span-2">
              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <Badge variant="maroon">{display.category.charAt(0).toUpperCase() + display.category.slice(1)}</Badge>
                <time className="text-sm text-charcoal-400" dateTime={display.publishedAt}>
                  {formatDate(display.publishedAt)}
                </time>
                <span className="text-sm text-charcoal-400">·</span>
                <span className="text-sm text-charcoal-500">By {display.author}</span>
              </div>

              {/* Image placeholder */}
              <div className="mb-8 h-64 md:h-80 rounded-xl bg-parchment-100 flex items-center justify-center">
                <svg
                  className="h-16 w-16 text-maroon-200"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>

              {/* Body */}
              <div className="prose prose-eparchy max-w-none">
                {display.excerpt && <p className="lead">{display.excerpt}</p>}
                {display.body.map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>

              {/* Share / nav */}
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
              {display.relatedSlugs.length > 0 && (
                <div className="card p-5">
                  <h3 className="font-serif text-base font-semibold text-charcoal-900 mb-4">
                    Related Articles
                  </h3>
                  <ul className="divide-y divide-charcoal-100">
                    {display.relatedSlugs.map((s) => (
                      <li key={s} className="py-3">
                        <Link
                          href={`/news/${s}`}
                          className="text-sm font-medium text-charcoal-700 hover:text-maroon-700 transition-colors line-clamp-2"
                        >
                          {RELATED_TITLES[s] ?? s.replace(/-/g, ' ')}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Latest news CTA */}
              <div className="rounded-xl bg-parchment-50 border border-parchment-200 p-5">
                <h3 className="font-serif text-base font-semibold text-charcoal-900 mb-2">
                  Stay Informed
                </h3>
                <p className="text-xs text-charcoal-600 mb-4 leading-relaxed">
                  Subscribe to the Eparchy newsletter to receive news and pastoral letters
                  directly in your inbox.
                </p>
                <Link
                  href="/contact"
                  className="btn-primary w-full text-center block text-sm"
                >
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
