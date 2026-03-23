import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { Badge } from '@/components/ui/Badge'

export const revalidate = 600

export const metadata: Metadata = buildMetadata({
  title: 'Publications',
  description:
    'Magazines, pastoral documents, and archives from the Catholic Eparchy of Segeneyti.',
  path: '/publications',
})

type Magazine = {
  title: string
  volume: number
  issue: number
  year: number
  description: string
  coverColor: string
  isFeatured: boolean
  pdfUrl?: string
  fileSize?: string
}

type Publication = {
  title: string
  type: string
  language: string
  year: number
  description: string
  fileSize?: string
  pdfUrl?: string
}

type Archive = {
  title: string
  year: number
  description: string
  accessTier: 'public' | 'restricted'
  fileSize?: string
}

const MAGAZINES: Magazine[] = [
  {
    title: 'Segeneyti Review',
    volume: 12, issue: 3, year: 2024,
    description: 'The quarterly magazine of the Eparchy featuring pastoral articles, parish news, youth testimonies, and reflections from the Bishop.',
    coverColor: 'from-maroon-700 to-maroon-900',
    isFeatured: true,
    fileSize: '4.2 MB',
  },
  {
    title: 'Segeneyti Review',
    volume: 12, issue: 2, year: 2024,
    description: 'Special issue dedicated to the Year of Prayer, with contributions from all vicariates.',
    coverColor: 'from-maroon-600 to-maroon-800',
    isFeatured: false,
    fileSize: '3.8 MB',
  },
  {
    title: 'Segeneyti Review',
    volume: 12, issue: 1, year: 2024,
    description: 'New Year issue: vision for 2024, catechetical resources, and Fasika reflections.',
    coverColor: 'from-maroon-700 to-maroon-900',
    isFeatured: false,
    fileSize: '3.9 MB',
  },
  {
    title: 'Segeneyti Review',
    volume: 11, issue: 4, year: 2023,
    description: 'Year in review: major events, ordinations, and community achievements across the Eparchy.',
    coverColor: 'from-charcoal-600 to-charcoal-800',
    isFeatured: false,
    fileSize: '4.0 MB',
  },
]

const PUBLICATIONS: Publication[] = [
  {
    title: "Bishop's Pastoral Letter on the Family",
    type: 'pastoral-letter',
    language: 'Tigrinya / English',
    year: 2024,
    description: 'The Bishop\'s annual pastoral letter calling families to renewed commitment to prayer and catechesis.',
    fileSize: '1.2 MB',
  },
  {
    title: 'Eparchial Synod Final Document 2022',
    type: 'synod-document',
    language: 'Tigrinya',
    year: 2022,
    description: 'The conclusions and pastoral directives of the 2022 Eparchial Assembly.',
    fileSize: '3.4 MB',
  },
  {
    title: 'Catechism for Young Catholics — Tigrinya Edition',
    type: 'catechism',
    language: 'Tigrinya',
    year: 2023,
    description: 'An adapted catechism for secondary school students, prepared by the Eparchial Catechetical Commission.',
    fileSize: '8.7 MB',
  },
  {
    title: 'Directory of Parishes and Priests 2024',
    type: 'directory',
    language: 'English / Tigrinya',
    year: 2024,
    description: 'Official directory listing all parishes, mission stations, and assigned clergy.',
    fileSize: '0.9 MB',
  },
]

const ARCHIVES: Archive[] = [
  {
    title: 'Eparchy Establishment Documents (1995)',
    year: 1995,
    description: 'Canonical decree of the Holy See erecting the Eparchy of Segeneyti.',
    accessTier: 'public',
    fileSize: '0.5 MB',
  },
  {
    title: 'First Synod Minutes (2003)',
    year: 2003,
    description: 'Official minutes and pastoral resolutions from the first diocesan synod.',
    accessTier: 'public',
    fileSize: '2.1 MB',
  },
  {
    title: 'Ordination Records 1995–2010',
    year: 2010,
    description: 'Historical ordination records. Access restricted to authorised researchers.',
    accessTier: 'restricted',
  },
  {
    title: 'Property and Real Estate Titles',
    year: 2024,
    description: 'Property deeds and land titles of Eparchial institutions. Restricted access.',
    accessTier: 'restricted',
  },
]

const TABS = [
  { id: 'magazines', label: 'Magazines' },
  { id: 'docs', label: 'Documents & Pastorals' },
  { id: 'archives', label: 'Archives' },
]

const TYPE_LABELS: Record<string, string> = {
  'pastoral-letter': 'Pastoral Letter',
  'synod-document':  'Synod Document',
  catechism:         'Catechism',
  directory:         'Directory',
}

export default function PublicationsPage() {
  const featured = MAGAZINES.find((m) => m.isFeatured)

  return (
    <>
      <PageHeader
        title="Publications"
        subtitle="Magazines, pastoral documents, and historical archives from the Eparchy."
        breadcrumbs={[{ label: 'Publications' }]}
      />

      {/* ── Featured magazine ───────────────────────────────────────── */}
      {featured && (
        <Section className="bg-maroon-800 text-white">
          <Container>
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Cover */}
              <div className={`shrink-0 w-40 h-56 rounded-xl bg-gradient-to-b ${featured.coverColor} shadow-xl flex flex-col items-center justify-end p-4 text-center`}>
                <p className="text-xs text-maroon-200 font-medium uppercase tracking-wider">
                  Vol. {featured.volume} No. {featured.issue}
                </p>
                <p className="text-sm font-bold text-white mt-1">{featured.title}</p>
                <p className="text-xs text-maroon-300">{featured.year}</p>
              </div>
              {/* Info */}
              <div className="flex-1 text-center md:text-left">
                <Badge variant="gold" size="sm">Latest Issue</Badge>
                <h2 className="mt-2 text-2xl font-serif font-bold text-white">
                  {featured.title} — Vol. {featured.volume}, No. {featured.issue}
                </h2>
                <p className="mt-2 text-maroon-200 leading-relaxed">{featured.description}</p>
                <div className="mt-5 flex flex-wrap gap-3 justify-center md:justify-start">
                  <button className="rounded-md bg-gold-500 px-5 py-2 text-sm font-semibold text-charcoal-900 hover:bg-gold-400 transition-colors">
                    Read Online
                  </button>
                  <button className="rounded-md border border-maroon-400 px-5 py-2 text-sm font-medium text-white hover:bg-maroon-700 transition-colors">
                    Download PDF {featured.fileSize && `(${featured.fileSize})`}
                  </button>
                </div>
              </div>
            </div>
          </Container>
        </Section>
      )}

      {/* ─── Tab sections ────────────────────────────────────────────── */}
      {/* Magazines archive */}
      <Section className="bg-white">
        <Container>
          <h2 className="text-xl font-serif font-bold text-charcoal-900 mb-6">
            Magazine Archive
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {MAGAZINES.map((mag) => (
              <div key={`${mag.volume}-${mag.issue}`} className="card flex flex-col overflow-hidden">
                {/* Mini cover */}
                <div className={`h-32 bg-gradient-to-b ${mag.coverColor} flex flex-col items-center justify-end p-3 text-center`}>
                  <p className="text-xs text-white/70 font-medium uppercase tracking-wider">
                    Vol. {mag.volume} / {mag.issue}
                  </p>
                  <p className="text-sm font-bold text-white">{mag.title}</p>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="maroon" size="sm">{mag.year}</Badge>
                    {mag.isFeatured && <Badge variant="gold" size="sm">Latest</Badge>}
                  </div>
                  <p className="text-xs text-charcoal-500 line-clamp-3 flex-1">{mag.description}</p>
                  <div className="mt-3 flex gap-2">
                    <button className="flex-1 rounded border border-maroon-300 py-1.5 text-xs font-medium text-maroon-700 hover:bg-maroon-50 transition-colors">
                      Read
                    </button>
                    {mag.fileSize && (
                      <button className="flex-1 rounded border border-charcoal-200 py-1.5 text-xs font-medium text-charcoal-600 hover:bg-charcoal-50 transition-colors">
                        PDF ({mag.fileSize})
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Documents */}
      <Section className="bg-parchment-50">
        <Container>
          <h2 className="text-xl font-serif font-bold text-charcoal-900 mb-6">
            Documents & Pastoral Letters
          </h2>
          <div className="space-y-3">
            {PUBLICATIONS.map((pub) => (
              <div
                key={pub.title}
                className="card flex flex-col sm:flex-row sm:items-center gap-4 p-5"
              >
                {/* Icon */}
                <div className="shrink-0 h-12 w-12 rounded-lg bg-maroon-100 flex items-center justify-center">
                  <svg className="h-6 w-6 text-maroon-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm text-charcoal-900">{pub.title}</h3>
                    <Badge variant="neutral" size="sm">{TYPE_LABELS[pub.type] ?? pub.type}</Badge>
                    <Badge variant="maroon" size="sm">{pub.year}</Badge>
                  </div>
                  <p className="text-xs text-charcoal-500 mb-1">{pub.description}</p>
                  <p className="text-xs text-charcoal-400">🌐 {pub.language}</p>
                </div>
                {/* Download */}
                <button className="shrink-0 rounded border border-maroon-300 px-4 py-1.5 text-xs font-medium text-maroon-700 hover:bg-maroon-50 transition-colors whitespace-nowrap">
                  Download{pub.fileSize ? ` (${pub.fileSize})` : ''}
                </button>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Archives */}
      <Section className="bg-white">
        <Container>
          <h2 className="text-xl font-serif font-bold text-charcoal-900 mb-2">Archives</h2>
          <p className="text-sm text-charcoal-500 mb-6">
            Historical documents of the Eparchy. Restricted items require authorised access.
          </p>
          <div className="space-y-3">
            {ARCHIVES.map((arch) => (
              <div
                key={arch.title}
                className="card flex flex-col sm:flex-row sm:items-center gap-4 p-5"
              >
                <div className="shrink-0 h-12 w-12 rounded-lg bg-parchment-100 flex items-center justify-center">
                  {arch.accessTier === 'restricted' ? (
                    <svg className="h-6 w-6 text-charcoal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  ) : (
                    <svg className="h-6 w-6 text-maroon-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm text-charcoal-900">{arch.title}</h3>
                    <Badge
                      variant={arch.accessTier === 'restricted' ? 'red' : 'green'}
                      size="sm"
                    >
                      {arch.accessTier === 'restricted' ? 'Restricted' : 'Public'}
                    </Badge>
                    <Badge variant="neutral" size="sm">{arch.year}</Badge>
                  </div>
                  <p className="text-xs text-charcoal-500">{arch.description}</p>
                </div>
                {arch.accessTier === 'public' ? (
                  <button className="shrink-0 rounded border border-maroon-300 px-4 py-1.5 text-xs font-medium text-maroon-700 hover:bg-maroon-50 transition-colors whitespace-nowrap">
                    Download{arch.fileSize ? ` (${arch.fileSize})` : ''}
                  </button>
                ) : (
                  <span className="shrink-0 rounded border border-charcoal-200 px-4 py-1.5 text-xs text-charcoal-400 whitespace-nowrap cursor-not-allowed">
                    Restricted
                  </span>
                )}
              </div>
            ))}
          </div>
        </Container>
      </Section>
    </>
  )
}
