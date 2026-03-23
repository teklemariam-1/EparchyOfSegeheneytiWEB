import type { Metadata } from 'next'
import Image from 'next/image'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/shared/EmptyState'
import { getPublicationsList, getMagazinesList, getArchivesList } from '@/lib/payload/queries'

export const revalidate = 600

export const metadata: Metadata = buildMetadata({
  title: 'Publications',
  description: 'Magazines, pastoral documents, and archives from the Catholic Eparchy of Segeneyti.',
  path: '/publications',
})

const TYPE_LABELS: Record<string, string> = {
  'pastoral-letter': 'Pastoral Letter',
  'synod-document': 'Synod Document',
  catechism: 'Catechism',
  directory: 'Directory',
}

export default async function PublicationsPage() {
  const [publications, magazines, archives] = await Promise.all([
    getPublicationsList(),
    getMagazinesList(),
    getArchivesList(),
  ])

  const featured = magazines.find((m) => m.isFeatured) ?? magazines[0] ?? null

  return (
    <>
      <PageHeader
        title="Publications"
        subtitle="Magazines, pastoral documents, and historical archives from the Eparchy."
        breadcrumbs={[{ label: 'Publications' }]}
      />

      {/* Featured magazine */}
      {featured && (
        <Section className="bg-maroon-800 text-white">
          <Container>
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Cover */}
              <div className="shrink-0 w-40 h-56 rounded-xl overflow-hidden shadow-xl bg-maroon-700 flex flex-col items-center justify-end p-4 text-center">
                {featured.coverImage?.url ? (
                  <Image
                    src={featured.coverImage.url}
                    alt={featured.coverImage.alt ?? featured.title}
                    fill
                    className="object-cover"
                    sizes="160px"
                  />
                ) : (
                  <>
                    {featured.volume != null && featured.issue != null && (
                      <p className="text-xs text-maroon-200 font-medium uppercase tracking-wider">
                        Vol. {featured.volume} No. {featured.issue}
                      </p>
                    )}
                    <p className="text-sm font-bold text-white mt-1">{featured.title}</p>
                    {featured.year && <p className="text-xs text-maroon-300">{featured.year}</p>}
                  </>
                )}
              </div>
              {/* Info */}
              <div className="flex-1 text-center md:text-left">
                <Badge variant="gold" size="sm">Latest Issue</Badge>
                <h2 className="mt-2 text-2xl font-serif font-bold text-white">
                  {featured.title}{featured.volume != null && featured.issue != null && ` — Vol. ${featured.volume}, No. ${featured.issue}`}
                </h2>
                {featured.summary && (
                  <p className="mt-2 text-maroon-200 leading-relaxed">{featured.summary}</p>
                )}
                <div className="mt-5 flex flex-wrap gap-3 justify-center md:justify-start">
                  <button className="rounded-md bg-gold-500 px-5 py-2 text-sm font-semibold text-charcoal-900 hover:bg-gold-400 transition-colors">
                    Read Online
                  </button>
                </div>
              </div>
            </div>
          </Container>
        </Section>
      )}

      {/* Magazine archive */}
      <Section className="bg-white">
        <Container>
          <h2 className="text-xl font-serif font-bold text-charcoal-900 mb-6">Magazine Archive</h2>
          {magazines.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {magazines.map((mag) => (
                <div key={mag.id} className="card flex flex-col overflow-hidden">
                  <div className="relative h-32 bg-maroon-800 flex flex-col items-center justify-end p-3 text-center">
                    {mag.coverImage?.url ? (
                      <Image
                        src={mag.coverImage.url}
                        alt={mag.coverImage.alt ?? mag.title}
                        fill
                        className="object-cover"
                        sizes="300px"
                      />
                    ) : (
                      <>
                        {mag.volume != null && mag.issue != null && (
                          <p className="text-xs text-white/70 font-medium uppercase tracking-wider">
                            Vol. {mag.volume} / {mag.issue}
                          </p>
                        )}
                        <p className="text-sm font-bold text-white">{mag.title}</p>
                      </>
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-2">
                      {mag.year && <Badge variant="maroon" size="sm">{mag.year}</Badge>}
                      {mag.isFeatured && <Badge variant="gold" size="sm">Latest</Badge>}
                    </div>
                    {mag.summary && (
                      <p className="text-xs text-charcoal-500 line-clamp-3 flex-1">{mag.summary}</p>
                    )}
                    <div className="mt-3">
                      <button className="w-full rounded border border-maroon-300 py-1.5 text-xs font-medium text-maroon-700 hover:bg-maroon-50 transition-colors">
                        Read
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No magazines yet" description="Magazine issues will appear here once added to the CMS." />
          )}
        </Container>
      </Section>

      {/* Documents & Pastoral Letters */}
      <Section className="bg-parchment-50">
        <Container>
          <h2 className="text-xl font-serif font-bold text-charcoal-900 mb-6">Documents &amp; Pastoral Letters</h2>
          {publications.length > 0 ? (
            <div className="space-y-3">
              {publications.map((pub) => (
                <div key={pub.id} className="card flex flex-col sm:flex-row sm:items-center gap-4 p-5">
                  <div className="shrink-0 h-12 w-12 rounded-lg bg-maroon-100 flex items-center justify-center">
                    <svg className="h-6 w-6 text-maroon-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm text-charcoal-900">{pub.title}</h3>
                      {pub.documentType && (
                        <Badge variant="neutral" size="sm">{TYPE_LABELS[pub.documentType] ?? pub.documentType}</Badge>
                      )}
                      {pub.publishedYear && <Badge variant="maroon" size="sm">{pub.publishedYear}</Badge>}
                    </div>
                    {pub.description && <p className="text-xs text-charcoal-500 mb-1">{pub.description}</p>}
                    {pub.language && <p className="text-xs text-charcoal-400">🌐 {pub.language}</p>}
                  </div>
                  {pub.fileUrl && (
                    <a
                      href={pub.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 rounded border border-maroon-300 px-4 py-1.5 text-xs font-medium text-maroon-700 hover:bg-maroon-50 transition-colors whitespace-nowrap"
                    >
                      Download
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No documents yet" description="Pastoral documents will appear here once added to the CMS." />
          )}
        </Container>
      </Section>

      {/* Archives */}
      <Section className="bg-white">
        <Container>
          <h2 className="text-xl font-serif font-bold text-charcoal-900 mb-2">Archives</h2>
          <p className="text-sm text-charcoal-500 mb-6">
            Historical documents of the Eparchy. Restricted items require authorised access.
          </p>
          {archives.length > 0 ? (
            <div className="space-y-3">
              {archives.map((arch) => (
                <div key={arch.id} className="card flex flex-col sm:flex-row sm:items-center gap-4 p-5">
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
                      <Badge variant={arch.accessTier === 'restricted' ? 'red' : 'green'} size="sm">
                        {arch.accessTier === 'restricted' ? 'Restricted' : 'Public'}
                      </Badge>
                      {arch.year && <Badge variant="neutral" size="sm">{arch.year}</Badge>}
                    </div>
                    {arch.description && <p className="text-xs text-charcoal-500">{arch.description}</p>}
                  </div>
                  {arch.accessTier !== 'restricted' ? (
                    <button className="shrink-0 rounded border border-maroon-300 px-4 py-1.5 text-xs font-medium text-maroon-700 hover:bg-maroon-50 transition-colors whitespace-nowrap">
                      Download
                    </button>
                  ) : (
                    <span className="shrink-0 rounded border border-charcoal-200 px-4 py-1.5 text-xs text-charcoal-400 whitespace-nowrap cursor-not-allowed">
                      Restricted
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No archives yet" description="Historical archives will appear here once added to the CMS." />
          )}
        </Container>
      </Section>
    </>
  )
}
