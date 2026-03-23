import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/shared/EmptyState'
import { getMinistriesList } from '@/lib/payload/queries'

export const revalidate = 600

export const metadata: Metadata = buildMetadata({
  title: 'Ministries',
  description:
    'The various ministries and apostolates of the Catholic Eparchy of Segeneyti — serving together in every area of Church life.',
  path: '/ministries',
})

const TYPE_META: Record<string, { icon: string; label: string; badge: 'maroon' | 'gold' | 'neutral' | 'green' }> = {
  youth:         { icon: '🌟', label: 'Youth Ministry',           badge: 'maroon' },
  catechists:    { icon: '📖', label: 'Catechists',               badge: 'gold' },
  women:         { icon: '🌺', label: "Catholic Women's League",  badge: 'neutral' },
  scc:           { icon: '🏘️', label: 'Small Christian Communities', badge: 'green' },
  liturgy:       { icon: '🎵', label: 'Liturgical Ministry',      badge: 'maroon' },
  'justice-peace': { icon: '⚖️', label: 'Justice & Peace',        badge: 'neutral' },
}
const DEFAULT_META = { icon: '✝', label: 'Other Ministries', badge: 'neutral' as const }

export default async function MinistriesPage() {
  const ministries = await getMinistriesList()

  // Group by ministryType
  const groups = new Map<string, typeof ministries>()
  for (const m of ministries) {
    const key = m.ministryType ?? 'other'
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(m)
  }

  const groupEntries = Array.from(groups.entries())

  return (
    <>
      <PageHeader
        title="Ministries"
        subtitle="Serving together in every area of Church life — youth, catechesis, liturgy, women, and more."
        breadcrumbs={[{ label: 'Ministries' }]}
      />

      {/* Intro */}
      <Section className="bg-white">
        <Container size="narrow">
          <div className="prose prose-eparchy text-center max-w-none">
            <p className="lead">
              The Eparchy of Segeneyti is animated by the gifts of its lay faithful. Across all vicariates,
              hundreds of dedicated men and women serve in parish ministries, diocesan commissions, and outreach
              programmes. Each ministry is a participation in the threefold mission of Christ — priest, prophet, and king.
            </p>
          </div>
        </Container>
      </Section>

      {groupEntries.length > 0 ? (
        groupEntries.map(([type, items], gi) => {
          const meta = TYPE_META[type] ?? DEFAULT_META
          return (
            <Section key={type} className={gi % 2 === 0 ? 'bg-parchment-50' : 'bg-white'}>
              <Container>
                <div className="flex items-start gap-4 mb-8">
                  <span className="text-4xl" aria-hidden="true">{meta.icon}</span>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="font-serif text-2xl font-bold text-charcoal-900">{meta.label}</h2>
                      <Badge variant={meta.badge}>{items.length} active</Badge>
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((min) => (
                    <div key={min.id} className="card p-5 flex flex-col gap-2">
                      <h3 className="font-serif text-base font-semibold text-charcoal-900">{min.title}</h3>

                      {/* Parish */}
                      {min.parish?.title && (
                        <p className="text-xs text-charcoal-500 flex items-center gap-1">
                          <svg className="h-3 w-3 text-maroon-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          {min.parish.title}
                        </p>
                      )}

                      {/* Leader */}
                      {min.leader && (
                        <p className="text-xs text-charcoal-500 flex items-center gap-1">
                          <svg className="h-3 w-3 text-maroon-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {min.leader}
                        </p>
                      )}

                      {/* Meeting info */}
                      {min.meetingInfo && (
                        <p className="text-xs text-charcoal-500 flex items-center gap-1">
                          <svg className="h-3 w-3 text-maroon-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {min.meetingInfo}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </Container>
            </Section>
          )
        })
      ) : (
        <Section className="bg-white">
          <Container>
            <EmptyState title="No ministries yet" description="Ministry listings will appear here once added to the CMS." />
          </Container>
        </Section>
      )}

      {/* CTA */}
      <Section className="bg-maroon-800 text-white">
        <Container size="narrow" className="text-center">
          <h2 className="text-2xl font-serif font-bold text-white mb-3">Get Involved</h2>
          <p className="text-maroon-200 mb-6">
            Interested in joining a ministry or starting one in your parish? Contact the Eparchy office.
          </p>
          <a
            href="/contact"
            className="inline-block rounded-md bg-gold-500 px-6 py-2.5 text-sm font-semibold text-charcoal-900 hover:bg-gold-400 transition-colors"
          >
            Contact Us →
          </a>
        </Container>
      </Section>
    </>
  )
}
