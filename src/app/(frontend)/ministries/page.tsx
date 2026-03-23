import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { Badge } from '@/components/ui/Badge'

export const revalidate = 600

export const metadata: Metadata = buildMetadata({
  title: 'Ministries',
  description: 'The various ministries and apostolates of the Catholic Eparchy of Segeneyti — serving together in every area of Church life.',
  path: '/ministries',
})

type Ministry = {
  name: string
  description?: string
  leader?: string
  meetingDay?: string
  parish?: string
  contactEmail?: string
}

type MinistryGroup = {
  type: string
  icon: string
  label: string
  description: string
  badge: 'maroon' | 'gold' | 'neutral' | 'green'
  items: Ministry[]
}

const MINISTRY_GROUPS: MinistryGroup[] = [
  {
    type: 'youth',
    icon: '🌟',
    label: 'Youth Ministry',
    description: 'Empowering young Catholics to grow in faith, leadership, and service.',
    badge: 'maroon',
    items: [
      { name: 'Diocesan Youth Group', leader: 'Mebrat Tesfay', meetingDay: 'Every Saturday', parish: 'Segeneyti Cathedral', contactEmail: 'youth@eparchy.er' },
      { name: 'Adi Keyih Youth Fellowship', leader: 'Hana Gebrehiwet', meetingDay: 'Every Friday', parish: 'St Mary, Adi Keyih' },
      { name: 'Diaspora Youth Network', description: 'Connecting young Eritrean Catholics abroad through online formation and annual gatherings.' },
    ],
  },
  {
    type: 'catechists',
    icon: '📖',
    label: 'Catechists',
    description: 'Trained lay ministers dedicated to handing on the faith to children and adults.',
    badge: 'gold',
    items: [
      { name: 'Children\'s Catechesis Programme', leader: 'Sr. Almaz Haile', meetingDay: 'Sundays after Mass', parish: 'All parishes' },
      { name: 'Adult RCIA Programme', leader: 'Fr. Dawit Abraha', meetingDay: 'Wednesday evenings', parish: 'Cathedral' },
    ],
  },
  {
    type: 'women',
    icon: '🌺',
    label: 'Catholic Women\'s League',
    description: 'Building communities of faith, solidarity, and charitable service among women.',
    badge: 'neutral',
    items: [
      { name: 'Cathedral Women\'s Group', leader: 'Firehiwet Berhane', meetingDay: 'Every Tuesday', parish: 'Segeneyti Cathedral' },
      { name: 'Mendefera Women\'s Apostolate', meetingDay: 'Every Thursday', parish: 'St George, Mendefera' },
    ],
  },
  {
    type: 'scc',
    icon: '🏘️',
    label: 'Small Christian Communities',
    description: 'Neighbourhood faith communities that gather for prayer, Bible sharing, and mutual support.',
    badge: 'green',
    items: [
      { name: 'Segeneyti Town Centre SCC', leader: 'Petros Kidane', meetingDay: 'Every Sunday evening' },
      { name: 'Adi Keyih SCCs (12 groups)', description: 'Twelve active SCCs covering every neighbourhood in the Adi Keyih town area.' },
      { name: 'Diaspora Online SCCs', description: 'Virtual SCCs connecting diaspora families across time zones for weekly prayer and faith sharing.' },
    ],
  },
  {
    type: 'liturgy',
    icon: '🎵',
    label: 'Liturgical Ministry',
    description: 'Serving the sacred liturgy through music, ceremonial, and lay ministries.',
    badge: 'maroon',
    items: [
      { name: 'Cathedral Choir', leader: 'Kidane Haile', meetingDay: 'Thursdays & Sunday before Mass', parish: 'Segeneyti Cathedral' },
      { name: 'Lectors & Acolytes', meetingDay: 'Monthly formation', parish: 'All parishes' },
    ],
  },
  {
    type: 'justice-peace',
    icon: '⚖️',
    label: 'Justice & Peace',
    description: 'Advocating for human dignity, peacebuilding, and integral human development.',
    badge: 'neutral',
    items: [
      { name: 'Eparchial Caritas Office', leader: 'Selam Tewolde', contactEmail: 'caritas@eparchy.er' },
      { name: 'Justice & Peace Commission', leader: 'Deacon Yohannes Kibrom', meetingDay: 'Monthly' },
    ],
  },
]

export default function MinistriesPage() {
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
              The Eparchy of Segeneyti is animated by the gifts of its lay faithful. Across all
              vicariates, hundreds of dedicated men and women serve in parish ministries, diocesan
              commissions, and outreach programmes. Each ministry is a participation in the threefold
              mission of Christ — priest, prophet, and king.
            </p>
          </div>
        </Container>
      </Section>

      {/* Ministry groups */}
      {MINISTRY_GROUPS.map((group, gi) => (
        <Section
          key={group.type}
          className={gi % 2 === 0 ? 'bg-parchment-50' : 'bg-white'}
        >
          <Container>
            {/* Group header */}
            <div className="flex items-start gap-4 mb-8">
              <span className="text-4xl" aria-hidden="true">{group.icon}</span>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="font-serif text-2xl font-bold text-charcoal-900">{group.label}</h2>
                  <Badge variant={group.badge}>{group.items.length} active</Badge>
                </div>
                <p className="text-charcoal-600">{group.description}</p>
              </div>
            </div>

            {/* Ministry cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.items.map((min) => (
                <div key={min.name} className="card p-5 flex flex-col gap-2">
                  <h3 className="font-serif text-base font-semibold text-charcoal-900">
                    {min.name}
                  </h3>

                  {min.description && (
                    <p className="text-xs text-charcoal-500 leading-relaxed">{min.description}</p>
                  )}

                  <div className="mt-auto space-y-1.5 pt-2">
                    {min.parish && (
                      <p className="text-xs text-charcoal-500 flex items-center gap-1">
                        <svg className="h-3 w-3 text-maroon-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        {min.parish}
                      </p>
                    )}
                    {min.leader && (
                      <p className="text-xs text-charcoal-500 flex items-center gap-1">
                        <svg className="h-3 w-3 text-maroon-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {min.leader}
                      </p>
                    )}
                    {min.meetingDay && (
                      <p className="text-xs text-charcoal-500 flex items-center gap-1">
                        <svg className="h-3 w-3 text-maroon-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {min.meetingDay}
                      </p>
                    )}
                    {min.contactEmail && (
                      <a href={`mailto:${min.contactEmail}`} className="text-xs text-maroon-600 hover:underline flex items-center gap-1 break-all">
                        <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {min.contactEmail}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </Section>
      ))}

      {/* CTA */}
      <Section className="bg-maroon-800 text-white">
        <Container size="narrow" className="text-center">
          <h2 className="text-2xl font-serif font-bold text-white mb-3">
            Get Involved
          </h2>
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
