import type { Metadata } from 'next'
import Image from 'next/image'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { getHomepageGlobal } from '@/lib/payload/queries'

export const metadata: Metadata = buildMetadata({
  title: 'About the Eparchy',
  description:
    'Learn about the Catholic Eparchy of Segeneyti — its history, mission, bishop, and pastoral vision for the faithful in Eritrea.',
  path: '/about',
})

const PILLARS = [
  {
    icon: '✝️',
    title: 'Faith',
    body: 'Rooted in the apostolic tradition of the Oriental Catholic Church, we proclaim the Gospel of Jesus Christ in every community we serve.',
  },
  {
    icon: '🕊️',
    title: 'Service',
    body: 'Through schools, clinics, and outreach programs, the Eparchy responds to the material and spiritual needs of the poorest in our society.',
  },
  {
    icon: '🌍',
    title: 'Unity',
    body: 'We are in full communion with the Holy Father and walk together with the universal Catholic Church while celebrating our distinctive Ge\'ez rite.',
  },
  {
    icon: '📖',
    title: 'Formation',
    body: "Catechesis, youth ministry, and adult faith formation build a well-grounded Catholic community prepared for life's challenges.",
  },
]

const TIMELINE = [
  { year: '1995', label: 'Eparchy established', desc: 'The Holy See erected the Eparchy of Segeneyti, separating it from the Eparchy of Asmara.' },
  { year: '2003', label: 'First synod', desc: 'The first diocesan synod was held, setting pastoral priorities for the next decade.' },
  { year: '2010', label: 'New cathedral', desc: 'The Cathedral of Saint Michael in Segeneyti was consecrated, becoming the heart of eparchial life.' },
  { year: '2018', label: 'Education expansion', desc: 'The Eparchy opened three additional parish schools, now educating over 4 000 students.' },
  { year: '2024', label: 'Pastoral plan', desc: 'A renewed five-year pastoral plan was launched, centred on family ministry and vocations promotion.' },
]

export default async function AboutPage() {
  const homepage = await getHomepageGlobal()
  const bishop = homepage.bishopMessage

  return (
    <>
      <PageHeader
        title="About the Eparchy"
        subtitle="Rooted in faith, united in mission — serving the faithful of Eritrea since 1995."
        breadcrumbs={[{ label: 'About' }]}
      />

      {/* ── Mission & Overview ─────────────────────────────────────────── */}
      <Section className="bg-white">
        <Container size="narrow">
          <div className="prose prose-eparchy max-w-none">
            <h2>Our Mission</h2>
            <p className="lead">
              The Catholic Eparchy of Segeneyti is an Oriental Catholic diocese of the Ge'ez rite,
              in full communion with the Bishop of Rome. Established in 1995, the Eparchy encompasses
              the southern and central regions of Eritrea, including the vicariates of Segeneyti,
              Adi Keyih, Dekemhare, and Mendefera, as well as a diaspora pastoral presence across
              Europe, North America, and the Gulf states.
            </p>
            <p>
              Our mission is to proclaim the Good News of Jesus Christ, celebrate the sacraments,
              and build up the Body of Christ through integral human development — caring for the
              spiritual, educational, and physical well-being of everyone entrusted to our care.
            </p>
            <p>
              The Eparchy ministers through{' '}
              <strong>47 parishes</strong>,{' '}
              <strong>12 schools</strong>,{' '}
              <strong>6 health clinics</strong>, and numerous youth, catechetical, and community
              development programmes.
            </p>
          </div>
        </Container>
      </Section>

      {/* ── Four Pillars ─────────────────────────────────────────────────── */}
      <Section className="bg-parchment-50">
        <Container>
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-charcoal-900">
              Four Pillars of Eparchial Life
            </h2>
            <div className="mt-3 mx-auto h-1 w-14 rounded-full bg-gold-400" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PILLARS.map((p) => (
              <div
                key={p.title}
                className="card p-6 text-center flex flex-col items-center gap-3"
              >
                <span className="text-4xl" aria-hidden="true">{p.icon}</span>
                <h3 className="font-serif text-lg font-semibold text-charcoal-900">{p.title}</h3>
                <p className="text-sm text-charcoal-600 leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* ── Bishop's Profile ────────────────────────────────────────────── */}
      <Section className="bg-white">
        <Container>
          <div className="flex flex-col md:flex-row gap-10 items-start">
            {/* Photo */}
            <div className="shrink-0 mx-auto md:mx-0">
              {bishop?.photo?.url ? (
                <div className="relative h-56 w-56 rounded-full overflow-hidden ring-4 ring-gold-300">
                  <Image
                    src={bishop.photo.url}
                    alt={bishop.photo.alt || bishop?.bishopName || 'Bishop'}
                    fill
                    className="object-cover"
                    sizes="224px"
                  />
                </div>
              ) : (
                <div className="h-56 w-56 rounded-full bg-maroon-100 flex items-center justify-center ring-4 ring-gold-300">
                  <svg className="h-24 w-24 text-maroon-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Bio */}
            <div className="flex-1">
              <div className="divider-gold mb-6" />
              <h2 className="text-2xl font-serif font-bold text-charcoal-900 mb-1">
                {bishop?.bishopName ?? 'Most Rev. Bishop of Segeneyti'}
              </h2>
              <p className="text-sm text-maroon-700 font-medium mb-4">
                {bishop?.bishopTitle ?? 'Bishop of the Catholic Eparchy of Segeneyti'}
              </p>
              <div className="prose prose-eparchy">
                <p>
                  The Bishop leads the faithful of the Eparchy in their spiritual journey, presiding
                  over the sacramental life of the Church, guiding its pastoral programmes, and
                  representing the diocese in its relations with the Holy See and ecumenical partners.
                </p>
                <p>
                  The full biography and latest messages from the Bishop are available in the
                  <a href="/bishop-messages"> Bishop's Messages</a> section of this website.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* ── Historical timeline ─────────────────────────────────────────── */}
      <Section className="bg-parchment-50">
        <Container size="narrow">
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-charcoal-900 mb-2">
            Key Milestones
          </h2>
          <div className="mt-3 h-1 w-14 rounded-full bg-gold-400 mb-10" />

          <ol className="relative border-l-2 border-maroon-200 space-y-8 pl-6">
            {TIMELINE.map((item) => (
              <li key={item.year} className="relative">
                {/* Dot */}
                <span className="absolute -left-[1.35rem] top-1 h-4 w-4 rounded-full bg-maroon-700 border-2 border-white" />
                <time className="text-xs font-bold uppercase tracking-widest text-maroon-600">
                  {item.year}
                </time>
                <p className="font-serif text-base font-semibold text-charcoal-900 mt-0.5">
                  {item.label}
                </p>
                <p className="text-sm text-charcoal-600 mt-1">{item.desc}</p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      {/* ── Ge'ez Rite note ─────────────────────────────────────────────── */}
      <Section className="bg-maroon-800 text-white">
        <Container size="narrow" className="text-center">
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-white mb-4">
            The Ge'ez Liturgical Tradition
          </h2>
          <p className="text-maroon-200 leading-relaxed max-w-2xl mx-auto">
            As an Oriental Catholic Church of the Ge'ez rite, the Eparchy of Segeneyti celebrates
            the ancient Alexandrian liturgy passed down through the centuries in both Ge'ez and
            Tigrinya. The Ge'ez calendar, with its 13 months, rich cycle of feasts and fasts, and
            distinctive liturgical colours, shapes the rhythm of prayer and community life
            throughout the year.
          </p>
          <a
            href="/geez-calendar"
            className="mt-6 inline-block rounded-md bg-gold-500 px-6 py-2.5 text-sm font-semibold text-charcoal-900 hover:bg-gold-400 transition-colors"
          >
            Explore the Ge'ez Calendar →
          </a>
        </Container>
      </Section>
    </>
  )
}
