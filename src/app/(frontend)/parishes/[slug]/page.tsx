import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { Badge } from '@/components/ui/Badge'
import { RichText } from '@/components/shared/RichText'
import { getLocale } from 'next-intl/server'
import { getParishBySlug, getAllParishSlugs } from '@/lib/payload/queries'

export const revalidate = 600

interface Props {
  params: Promise<{ slug: string }>
}

const VICARIATE_LABELS: Record<string, string> = {
  segeneyti: 'Segeneyti',
  'adi-keyih': 'Adi Keyih',
  dekemhare: 'Dekemhare',
  mendefera: 'Mendefera',
  diaspora: 'Diaspora',
}

export async function generateStaticParams() {
  const slugs = await getAllParishSlugs()
  return slugs
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const parish = await getParishBySlug(slug)
  return buildMetadata({
    title: parish?.seo?.title ?? parish?.title ?? `Parish — ${slug}`,
    description: parish?.seo?.description ?? (parish ? `${parish.title} — ${parish.city ?? ''}` : undefined),
    path: `/parishes/${slug}`,
  })
}

export default async function ParishDetailPage({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const parish = await getParishBySlug(slug, locale)
  if (!parish) notFound()

  const vicariateLabel = VICARIATE_LABELS[parish.vicariate ?? ''] ?? parish.vicariate ?? ''

  return (
    <>
      <PageHeader
        title={parish.title}
        subtitle={[vicariateLabel, parish.city].filter(Boolean).join(' · ')}
        breadcrumbs={[{ label: 'Parishes', href: '/parishes' }, { label: parish.title }]}
      />

      <Section className="bg-white">
        <Container>
          <div className="grid lg:grid-cols-3 gap-10">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-10">
              {/* Patron saint */}
              {parish.patronSaint && (
                <div>
                  <h2 className="font-serif text-xl font-semibold text-charcoal-900 mb-4">Patron Saint</h2>
                  <div className="flex items-start gap-4 rounded-xl bg-parchment-50 border border-parchment-200 p-5">
                    <span className="text-3xl" aria-hidden="true">✝</span>
                    <div>
                      <p className="font-semibold text-charcoal-900">{parish.patronSaint}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Featured image */}
              {(() => {
                if (!parish.image) return null
                return (
                  <div className="relative aspect-video rounded-xl overflow-hidden">
                    <Image
                      src={parish.image.url}
                      alt={parish.image.alt ?? parish.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 66vw"
                    />
                  </div>
                )
              })()}

              {/* Mass times */}
              {parish.massTimes && parish.massTimes.length > 0 && (
                <div>
                  <h2 className="font-serif text-xl font-semibold text-charcoal-900 mb-4">Mass Schedule</h2>
                  <div className="overflow-hidden rounded-xl border border-charcoal-100">
                    <table className="w-full text-sm">
                      <thead className="bg-maroon-800 text-white">
                        <tr>
                          <th className="text-left px-4 py-3 font-medium">Day</th>
                          <th className="text-left px-4 py-3 font-medium">Time</th>
                          <th className="text-left px-4 py-3 font-medium">Language</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-charcoal-100">
                        {parish.massTimes.map((mt, i) => (
                          <tr key={i} className="hover:bg-parchment-50 transition-colors">
                            <td className="px-4 py-3 font-medium text-charcoal-800">{mt.day}</td>
                            <td className="px-4 py-3 text-charcoal-700">{mt.time}</td>
                            <td className="px-4 py-3">
                              {mt.language && <Badge variant="neutral" size="sm">{mt.language}</Badge>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* History */}
              {parish.history != null ? (
                <div>
                  <h2 className="font-serif text-xl font-semibold text-charcoal-900 mb-4">History</h2>
                  <RichText data={parish.history} />
                </div>
              ) : null}

              {/* Photo gallery */}
              {parish.gallery && parish.gallery.length > 0 && (
                <div>
                  <h2 className="font-serif text-xl font-semibold text-charcoal-900 mb-4">Photo Gallery</h2>
                  <div className="grid grid-cols-3 gap-2">
                    {parish.gallery.map((g, i) => (
                      <div key={i} className="relative aspect-square rounded-lg overflow-hidden">
                        <Image
                          src={g.url!}
                          alt={g.alt ?? parish.title}
                          fill
                          className="object-cover"
                          sizes="33vw"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
              {/* Contact */}
              <div className="card p-5 space-y-3">
                <h3 className="font-serif text-base font-semibold text-charcoal-900">Contact</h3>
                {parish.address && (
                  <p className="text-sm text-charcoal-600 flex items-start gap-2">
                    <svg className="h-4 w-4 mt-0.5 shrink-0 text-maroon-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {parish.address}
                  </p>
                )}
                {parish.phone && (
                  <a href={`tel:${parish.phone}`} className="text-sm text-maroon-700 hover:underline flex items-center gap-2">
                    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {parish.phone}
                  </a>
                )}
                {parish.email && (
                  <a href={`mailto:${parish.email}`} className="text-sm text-maroon-700 hover:underline flex items-center gap-2 break-all">
                    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {parish.email}
                  </a>
                )}
                {!parish.address && !parish.phone && !parish.email && (
                  <p className="text-sm text-charcoal-400 italic">Contact details not yet available.</p>
                )}
              </div>

              {/* Pastor */}
              {parish.pastor && (
                <div className="card p-5">
                  <h3 className="font-serif text-base font-semibold text-charcoal-900 mb-3">Pastor</h3>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-maroon-100 flex items-center justify-center shrink-0">
                      <svg className="h-5 w-5 text-maroon-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-charcoal-800">Fr. {parish.pastor}</p>
                  </div>
                </div>
              )}

              <Link href="/parishes" className="block text-center text-sm font-medium text-maroon-700 hover:text-maroon-900 transition-colors">
                ← All Parishes
              </Link>
            </aside>
          </div>
        </Container>
      </Section>
    </>
  )
}
