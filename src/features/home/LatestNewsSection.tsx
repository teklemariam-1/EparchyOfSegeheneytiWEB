import Link from 'next/link'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { formatDate } from '@/lib/formatters/date'
import { Badge } from '@/components/ui/Badge'

// Static mock news — replaced with CMS data in Stage 5
const MOCK_NEWS = [
  {
    id: '1',
    title: 'Eparchy Celebrates Annual Pastoral Assembly',
    excerpt:
      'Priests, religious, and lay leaders gathered for three days of prayer, reflection, and pastoral planning for the coming year.',
    slug: 'eparchy-pastoral-assembly',
    publishedAt: '2026-03-18T08:00:00Z',
    category: 'Eparchy News',
  },
  {
    id: '2',
    title: 'New Youth Council Leadership Elected',
    excerpt:
      'The Eparchy Youth Council has elected new officers to lead the youth ministry for the next two years.',
    slug: 'youth-council-new-leadership',
    publishedAt: '2026-03-12T10:00:00Z',
    category: 'Youth',
  },
  {
    id: '3',
    title: 'Holy Week Schedule Announced for All Parishes',
    excerpt:
      'All parishes in the Eparchy have been asked to submit their Holy Week liturgical schedules by March 25th.',
    slug: 'holy-week-schedule-2026',
    publishedAt: '2026-03-05T09:00:00Z',
    category: 'Liturgy',
  },
]

export function LatestNewsSection() {
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
              Latest News
            </h2>
            <div className="divider-gold mt-3" />
          </div>
          <Link href="/news" className="btn-ghost hidden sm:inline-flex">
            All News →
          </Link>
        </div>

        {/* News grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_NEWS.map((item) => (
            <article key={item.id} className="card flex flex-col">
              {/* Image placeholder */}
              <div className="h-44 bg-gradient-to-br from-maroon-100 to-maroon-200 flex items-center justify-center">
                <span className="text-maroon-400 text-3xl">✝</span>
              </div>

              <div className="flex flex-col flex-1 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="maroon">{item.category}</Badge>
                  <span className="text-xs text-charcoal-400">
                    {formatDate(item.publishedAt, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                <h3 className="text-base font-semibold text-charcoal-900 leading-snug mb-2 font-serif">
                  <Link
                    href={`/news/${item.slug}`}
                    className="hover:text-maroon-800 transition-colors"
                  >
                    {item.title}
                  </Link>
                </h3>

                <p className="text-sm text-charcoal-600 leading-relaxed flex-1">
                  {item.excerpt}
                </p>

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
      </Container>
    </Section>
  )
}
