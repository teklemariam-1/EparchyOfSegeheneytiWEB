import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'

export const revalidate = 600

interface Props {
  params: Promise<{ slug: string }>
}

type MassTime = { day: string; time: string; language: string }

type ParishDetail = {
  name: string
  vicariate: string
  patronSaint: string
  feastDate?: string
  city: string
  address?: string
  phone?: string
  email?: string
  priestName?: string
  priestTitle?: string
  founded?: number
  history: string[]
  massTimes: MassTime[]
  ministries: string[]
}

const MOCK_PARISHES: Record<string, ParishDetail> = {
  'st-michael-segeneyti': {
    name: 'Cathedral of Saint Michael',
    vicariate: 'segeneyti',
    patronSaint: 'Saint Michael the Archangel',
    feastDate: 'January 12',
    city: 'Segeneyti',
    address: 'Segeneyti, Southern Zoba, Eritrea',
    phone: '+291-1-000000',
    email: 'segeneyti.cathedral@eparchy.er',
    priestName: 'Tesfay Haile',
    priestTitle: 'Archpriest',
    founded: 1962,
    history: [
      'The Cathedral of Saint Michael is the mother church of the Eparchy of Segeneyti. It was first built in 1962 by Comboni missionaries alongside the local faithful, who quarried the stone by hand from the surrounding hills.',
      'After the establishment of the Eparchy in 1995, it was elevated to cathedral status and underwent a major restoration programme completed in 2010, including the installation of its distinctive twin bell towers.',
    ],
    massTimes: [
      { day: 'Sunday', time: '7:00 AM', language: 'Ge\'ez' },
      { day: 'Sunday', time: '9:30 AM', language: 'Tigrinya' },
      { day: 'Weekdays', time: '6:30 AM', language: 'Tigrinya' },
      { day: 'Saturday Vigil', time: '5:00 PM', language: 'Tigrinya' },
    ],
    ministries: ['Youth Group', 'Catechists', 'Catholic Women', 'Small Christian Communities', 'Liturgical Choir'],
  },
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const parish = MOCK_PARISHES[slug]
  return buildMetadata({
    title: parish?.name ?? `Parish — ${slug}`,
    description: parish ? `${parish.name} — ${parish.city}` : undefined,
    path: `/parishes/${slug}`,
  })
}

const VICARIATE_LABELS: Record<string, string> = {
  segeneyti: 'Segeneyti',
  'adi-keyih': 'Adi Keyih',
  dekemhare: 'Dekemhare',
  mendefera: 'Mendefera',
  diaspora: 'Diaspora',
}

export default async function ParishDetailPage({ params }: Props) {
  const { slug } = await params
  const parish: ParishDetail = MOCK_PARISHES[slug] ?? {
    name: decodeURIComponent(slug).replace(/-/g, ' '),
    vicariate: 'segeneyti',
    patronSaint: 'Unknown',
    city: 'Eritrea',
    history: ['Full parish information will be available once this page is connected to the CMS in Stage 5.'],
    massTimes: [],
    ministries: [],
  }

  return (
    <>
      <PageHeader
        title={parish.name}
        subtitle={`${VICARIATE_LABELS[parish.vicariate] ?? parish.vicariate} Vicariate · ${parish.city}`}
        breadcrumbs={[{ label: 'Parishes', href: '/parishes' }, { label: parish.name }]}
      />

      <Section className="bg-white">
        <Container>
          <div className="grid lg:grid-cols-3 gap-10">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-10">
              {/* Patron */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="font-serif text-xl font-semibold text-charcoal-900">
                    Patron Saint
                  </h2>
                </div>
                <div className="flex items-start gap-4 rounded-xl bg-parchment-50 border border-parchment-200 p-5">
                  <span className="text-3xl" aria-hidden="true">✝</span>
                  <div>
                    <p className="font-semibold text-charcoal-900">{parish.patronSaint}</p>
                    {parish.feastDate && (
                      <p className="text-sm text-charcoal-500 mt-0.5">Feast: {parish.feastDate}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Mass times */}
              {parish.massTimes.length > 0 && (
                <div>
                  <h2 className="font-serif text-xl font-semibold text-charcoal-900 mb-4">
                    Mass Schedule
                  </h2>
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
                              <Badge variant="neutral" size="sm">{mt.language}</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* History */}
              {parish.history.length > 0 && (
                <div>
                  <h2 className="font-serif text-xl font-semibold text-charcoal-900 mb-4">
                    History
                  </h2>
                  <div className="prose prose-eparchy max-w-none">
                    {parish.history.map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Gallery placeholder */}
              <div>
                <h2 className="font-serif text-xl font-semibold text-charcoal-900 mb-4">
                  Photo Gallery
                </h2>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div key={n} className="aspect-square rounded-lg bg-parchment-100 flex items-center justify-center">
                      <svg className="h-8 w-8 text-charcoal-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-charcoal-400 mt-2">Photos will be managed through the CMS in Stage 5.</p>
              </div>
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
              {/* Contact card */}
              <div className="card p-5 space-y-3">
                <h3 className="font-serif text-base font-semibold text-charcoal-900">Contact</h3>
                {parish.address && (
                  <p className="text-sm text-charcoal-600 flex items-start gap-2">
                    <svg className="h-4 w-4 mt-0.5 shrink-0 text-maroon-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {parish.address}
                  </p>
                )}
                {parish.phone && (
                  <a href={`tel:${parish.phone}`} className="text-sm text-maroon-700 hover:underline flex items-center gap-2">
                    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    {parish.phone}
                  </a>
                )}
                {parish.email && (
                  <a href={`mailto:${parish.email}`} className="text-sm text-maroon-700 hover:underline flex items-center gap-2 break-all">
                    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    {parish.email}
                  </a>
                )}
              </div>

              {/* Pastor */}
              {parish.priestName && (
                <div className="card p-5">
                  <h3 className="font-serif text-base font-semibold text-charcoal-900 mb-3">Pastor</h3>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-maroon-100 flex items-center justify-center shrink-0">
                      <svg className="h-5 w-5 text-maroon-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-charcoal-800">Fr. {parish.priestName}</p>
                      {parish.priestTitle && (
                        <p className="text-xs text-charcoal-500">{parish.priestTitle}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Ministries */}
              {parish.ministries.length > 0 && (
                <div className="card p-5">
                  <h3 className="font-serif text-base font-semibold text-charcoal-900 mb-3">
                    Parish Ministries
                  </h3>
                  <ul className="space-y-1.5">
                    {parish.ministries.map((m) => (
                      <li key={m} className="flex items-center gap-2 text-sm text-charcoal-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-gold-500 shrink-0" />
                        {m}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Founded */}
              {parish.founded && (
                <div className="rounded-lg bg-maroon-50 border border-maroon-100 p-4 text-center">
                  <p className="text-xs text-maroon-600 uppercase tracking-wider font-medium mb-1">Founded</p>
                  <p className="text-2xl font-bold font-serif text-maroon-800">{parish.founded}</p>
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
