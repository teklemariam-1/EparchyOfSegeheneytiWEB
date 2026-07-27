import type { Metadata } from 'next'
import Image from 'next/image'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import Link from 'next/link'
import { getHomepageGlobal, getAboutPageGlobal } from '@/lib/payload/queries'
import { getActiveBishop } from '@/lib/bishops/queries'
import { getLocale, getTranslations } from 'next-intl/server'

export const metadata: Metadata = buildMetadata({
  title: 'About the Eparchy',
  description:
    'Learn about the Catholic Eparchy of Segeneyti — its history, mission, Eparch, and pastoral vision for the faithful in Eritrea.',
  path: '/about',
})

// ── Fallback content (used when the About Page global has no data) ──────────────
const DEFAULT_MISSION = {
  heading: 'Our Mission',
  // "eparchy", not "diocese": this is a Ge'ez-Rite eparchy of the Eritrean
  // Catholic Church, one of its four, under the metropolitan see of Asmara.
  intro:
    "The Catholic Eparchy of Segeneyti is an Eastern Catholic eparchy of the Ge'ez rite, in full communion with the Bishop of Rome and one of the four eparchies of the Eritrean Catholic Church, whose metropolitan see is Asmara. Established in 1995, the Eparchy encompasses the southern and central regions of Eritrea, including the vicariates of Segeneyti, Adi Keyih, Dekemhare, and Mendefera, as well as a diaspora pastoral presence across Europe, North America, and the Gulf states.",
  body:
    'Our mission is to proclaim the Good News of Jesus Christ, celebrate the sacraments, and build up the Body of Christ through integral human development — caring for the spiritual, educational, and physical well-being of everyone entrusted to our care.',
}

const DEFAULT_PILLARS = {
  heading: 'Four Pillars of Eparchial Life',
  items: [
    { icon: '✝️', title: 'Faith', body: 'Rooted in the apostolic tradition of the Oriental Catholic Church, we proclaim the Gospel of Jesus Christ in every community we serve.' },
    { icon: '🕊️', title: 'Service', body: 'Through schools, clinics, and outreach programs, the Eparchy responds to the material and spiritual needs of the poorest in our society.' },
    { icon: '🌍', title: 'Unity', body: "We are in full communion with the Holy Father and walk together with the universal Catholic Church while celebrating our distinctive Ge'ez rite." },
    { icon: '📖', title: 'Formation', body: "Catechesis, youth ministry, and adult faith formation build a well-grounded Catholic community prepared for life's challenges." },
  ],
}

const DEFAULT_TIMELINE = {
  heading: 'Key Milestones',
  items: [
    { year: '1995', label: 'Eparchy established', description: 'The Holy See erected the Eparchy of Segeneyti, separating it from the Eparchy of Asmara.' },
    { year: '2003', label: 'First synod', description: 'The first diocesan synod was held, setting pastoral priorities for the next decade.' },
    { year: '2010', label: 'New cathedral', description: 'The Cathedral of Saint Michael in Segeneyti was consecrated, becoming the heart of eparchial life.' },
    { year: '2018', label: 'Education expansion', description: 'The Eparchy opened three additional parish schools, now educating over 4 000 students.' },
    { year: '2024', label: 'Pastoral plan', description: 'A renewed five-year pastoral plan was launched, centred on family ministry and vocations promotion.' },
  ],
}

const DEFAULT_GEEZ = {
  heading: 'The Ge\'ez Liturgical Tradition',
  body:
    "As an Oriental Catholic Church of the Ge'ez rite, the Eparchy of Segeneyti celebrates the ancient Alexandrian liturgy passed down through the centuries in both Ge'ez and Tigrinya. The Ge'ez calendar, with its 13 months, rich cycle of feasts and fasts, and distinctive liturgical colours, shapes the rhythm of prayer and community life throughout the year.",
  ctaLabel: 'Explore the Ge\'ez Calendar →',
}

export default async function AboutPage() {
  const locale = await getLocale()
  const [homepage, about, bishop, tb] = await Promise.all([
    getHomepageGlobal(locale),
    getAboutPageGlobal(locale),
    // Identity comes from the bishops collection, not the homepage global — so
    // it changes everywhere the moment a new Eparch is set as sitting.
    getActiveBishop(locale),
    getTranslations('bishop'),
  ])
  const t = await getTranslations('about')

  // CMS-or-fallback for each section.
  const mission = {
    heading: about.mission?.heading || DEFAULT_MISSION.heading,
    intro: about.mission?.intro || DEFAULT_MISSION.intro,
    body: about.mission?.body || DEFAULT_MISSION.body,
  }
  const stats = about.stats ?? [] // no hardcoded fallback — only render real figures
  const pillarsHeading = about.pillars?.heading || DEFAULT_PILLARS.heading
  const pillars = about.pillars?.items?.length ? about.pillars.items : DEFAULT_PILLARS.items
  const timelineHeading = about.timeline?.heading || DEFAULT_TIMELINE.heading
  const timeline = about.timeline?.items?.length ? about.timeline.items : DEFAULT_TIMELINE.items
  const geez = {
    heading: about.geez?.heading || DEFAULT_GEEZ.heading,
    body: about.geez?.body || DEFAULT_GEEZ.body,
    ctaLabel: about.geez?.ctaLabel || DEFAULT_GEEZ.ctaLabel,
  }

  return (
    <>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        breadcrumbs={[{ label: t('title') }]}
      />

      {/* ── Mission & Overview ─────────────────────────────────────────── */}
      <Section className="bg-white">
        <Container size="narrow">
          <div className="prose prose-eparchy max-w-none">
            <h2>{mission.heading}</h2>
            <p className="lead">{mission.intro}</p>
            <p>{mission.body}</p>
          </div>

          {/* Key statistics (only shown when configured in the CMS) */}
          {stats.length > 0 && (
            <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {stats.map((s, i) => (
                <div key={`${s.label}-${i}`} className="card p-5 text-center">
                  <p className="font-serif text-3xl font-bold text-maroon-800">{s.value}</p>
                  <p className="text-sm text-charcoal-600 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </Container>
      </Section>

      {/* ── Four Pillars ─────────────────────────────────────────────────── */}
      <Section className="bg-parchment-50">
        <Container>
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-charcoal-900">
              {pillarsHeading}
            </h2>
            <div className="mt-3 mx-auto h-1 w-14 rounded-full bg-gold-400" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {pillars.map((p, i) => (
              <div
                key={`${p.title}-${i}`}
                className="card p-6 text-center flex flex-col items-center gap-3"
              >
                {p.icon && <span className="text-4xl" aria-hidden="true">{p.icon}</span>}
                <h3 className="font-serif text-lg font-semibold text-charcoal-900">{p.title}</h3>
                {p.body && <p className="text-sm text-charcoal-600 leading-relaxed">{p.body}</p>}
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* ── The Eparch ──────────────────────────────────────────────────────
          Everything here resolves from the sitting bishop record. Rendered only
          when one exists: an office with a single real occupant is better left
          unmentioned than filled with an invented name. */}
      {bishop ? (
      <Section id="bishop" className="bg-white">
        <Container>
          <div className="flex flex-col md:flex-row gap-10 items-start">
            {/* Photo */}
            <div className="shrink-0 mx-auto md:mx-0">
              {bishop.portrait?.url ? (
                <div className="relative h-56 w-56 rounded-full overflow-hidden ring-4 ring-gold-300">
                  <Image
                    src={bishop.portrait.url}
                    alt={bishop.portrait.alt || bishop.fullName || ''}
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
                {bishop.fullName}
              </h2>
              {bishop.formalTitle ? (
                <p className="text-sm text-maroon-700 font-medium mb-4">{bishop.formalTitle}</p>
              ) : null}
              {/* The summary is written by staff in both languages. Two
                  paragraphs of untranslatable English prose used to live here. */}
              {bishop.biographySummary ? (
                <p className="bishop-prose text-charcoal-700">{bishop.biographySummary}</p>
              ) : null}
              <p className="mt-4">
                <Link href="/bishop" className="btn-secondary">
                  {tb('biography')}
                </Link>
              </p>
            </div>
          </div>
        </Container>
      </Section>
      ) : null}

      {/* ── Historical timeline ─────────────────────────────────────────── */}
      <Section id="history" className="bg-parchment-50">
        <Container size="narrow">
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-charcoal-900 mb-2">
            {timelineHeading}
          </h2>
          <div className="mt-3 h-1 w-14 rounded-full bg-gold-400 mb-10" />

          <ol className="relative border-l-2 border-maroon-200 space-y-8 pl-6">
            {timeline.map((item, i) => (
              <li key={`${item.year}-${i}`} className="relative">
                {/* Dot */}
                <span className="absolute -left-[1.35rem] top-1 h-4 w-4 rounded-full bg-maroon-700 border-2 border-white" />
                <time className="text-xs font-bold uppercase tracking-widest text-maroon-600">
                  {item.year}
                </time>
                <p className="font-serif text-base font-semibold text-charcoal-900 mt-0.5">
                  {item.label}
                </p>
                {item.description && <p className="text-sm text-charcoal-600 mt-1">{item.description}</p>}
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      {/* ── Ge'ez Rite note ─────────────────────────────────────────────── */}
      <Section className="bg-maroon-800 text-white">
        <Container size="narrow" className="text-center">
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-white mb-4">
            {geez.heading}
          </h2>
          <p className="text-maroon-200 leading-relaxed max-w-2xl mx-auto">
            {geez.body}
          </p>
          <a
            href="/geez-calendar"
            className="mt-6 inline-block rounded-md bg-gold-500 px-6 py-2.5 text-sm font-semibold text-charcoal-900 hover:bg-gold-400 transition-colors"
          >
            {geez.ctaLabel}
          </a>
        </Container>
      </Section>
    </>
  )
}
