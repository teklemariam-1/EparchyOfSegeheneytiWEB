import type { Metadata } from 'next'
import Link from 'next/link'
import { getLocale } from 'next-intl/server'
import { Container } from '@/components/layout/Container'
import { PageHeader } from '@/components/layout/PageHeader'
import { LanguageSwitcher } from '@/components/navigation/LanguageSwitcher'
import { buildMetadata } from '@/lib/seo/buildMetadata'

export const metadata: Metadata = buildMetadata({
  title: 'Settings',
  description: 'Manage your language and display preferences for the Eparchy of Segeneyti website.',
})

export default async function SettingsPage() {
  const locale = await getLocale()

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Manage your preferences"
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Settings' }]}
      />

      <section className="py-12 bg-parchment min-h-[60vh]">
        <Container>
          <div className="max-w-2xl mx-auto space-y-6">

            {/* Language */}
            <div className="bg-white rounded-2xl shadow-card border border-charcoal-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-charcoal-100 bg-maroon-50">
                <h2 className="text-base font-semibold text-maroon-900 font-serif">Language</h2>
                <p className="text-sm text-charcoal-500 mt-0.5">
                  Choose the language used for navigation and interface labels.
                </p>
              </div>
              <div className="px-6 py-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-charcoal-700">Display language</p>
                  <p className="text-xs text-charcoal-400 mt-0.5">
                    Content language is set per article by our editors.
                  </p>
                </div>
                <LanguageSwitcher currentLocale={locale} />
              </div>
            </div>

            {/* Quick links */}
            <div className="bg-white rounded-2xl shadow-card border border-charcoal-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-charcoal-100 bg-maroon-50">
                <h2 className="text-base font-semibold text-maroon-900 font-serif">Quick Links</h2>
              </div>
              <ul className="divide-y divide-charcoal-100">
                {[
                  { label: 'Contact Us', href: '/contact', desc: 'Send a message to the Eparchy' },
                  { label: 'About the Eparchy', href: '/about', desc: 'Learn about our diocese' },
                  { label: "Ge'ez Calendar", href: '/geez-calendar', desc: 'Liturgical calendar' },
                  { label: 'Find a Parish', href: '/parishes', desc: 'Locate your nearest parish' },
                ].map(({ label, href, desc }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="flex items-center justify-between px-6 py-4 hover:bg-parchment/50 transition-colors group"
                    >
                      <div>
                        <p className="text-sm font-medium text-charcoal-800 group-hover:text-maroon-800 transition-colors">
                          {label}
                        </p>
                        <p className="text-xs text-charcoal-400 mt-0.5">{desc}</p>
                      </div>
                      <svg
                        className="h-4 w-4 text-charcoal-300 group-hover:text-maroon-600 transition-colors shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                      </svg>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Admin */}
            <div className="bg-white rounded-2xl shadow-card border border-charcoal-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-charcoal-100 bg-maroon-50">
                <h2 className="text-base font-semibold text-maroon-900 font-serif">Administration</h2>
              </div>
              <div className="px-6 py-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-charcoal-700">CMS Admin Panel</p>
                  <p className="text-xs text-charcoal-400 mt-0.5">
                    Manage content, users, and site settings (editors only).
                  </p>
                </div>
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-2 rounded-lg border border-maroon-200 bg-maroon-50 px-4 py-2 text-sm font-medium text-maroon-800 hover:bg-maroon-100 transition-colors"
                >
                  Go to Admin →
                </Link>
              </div>
            </div>

          </div>
        </Container>
      </section>
    </>
  )
}
