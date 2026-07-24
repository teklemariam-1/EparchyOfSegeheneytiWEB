import type { Metadata } from 'next'
import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'
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
  const [t, tn] = await Promise.all([getTranslations('settings'), getTranslations('nav')])

  const quickLinks = [
    { key: 'contact', href: '/contact' },
    { key: 'about', href: '/about' },
    { key: 'calendar', href: '/geez-calendar' },
    { key: 'parish', href: '/parishes' },
  ] as const

  return (
    <>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        breadcrumbs={[{ label: tn('home'), href: '/' }, { label: t('title') }]}
      />

      <section className="py-12 bg-parchment min-h-[60vh]">
        <Container>
          <div className="max-w-2xl mx-auto space-y-6">

            {/* Language */}
            <div className="bg-white rounded-2xl shadow-card border border-charcoal-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-charcoal-100 bg-maroon-50">
                <h2 className="text-base font-semibold text-maroon-900 font-serif">{t('language')}</h2>
                <p className="text-sm text-charcoal-500 mt-0.5">
                  {t('languageHelp')}
                </p>
              </div>
              <div className="px-6 py-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-charcoal-700">{t('displayLanguage')}</p>
                  <p className="text-xs text-charcoal-400 mt-0.5">
                    {t('contentLanguageNote')}
                  </p>
                </div>
                <LanguageSwitcher currentLocale={locale} />
              </div>
            </div>

            {/* Quick links */}
            <div className="bg-white rounded-2xl shadow-card border border-charcoal-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-charcoal-100 bg-maroon-50">
                <h2 className="text-base font-semibold text-maroon-900 font-serif">{t('quickLinks')}</h2>
              </div>
              <ul className="divide-y divide-charcoal-100">
                {quickLinks.map(({ key, href }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="flex items-center justify-between px-6 py-4 hover:bg-parchment/50 transition-colors group"
                    >
                      <div>
                        <p className="text-sm font-medium text-charcoal-800 group-hover:text-maroon-800 transition-colors">
                          {t(`links.${key}.label`)}
                        </p>
                        <p className="text-xs text-charcoal-400 mt-0.5">{t(`links.${key}.desc`)}</p>
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
                <h2 className="text-base font-semibold text-maroon-900 font-serif">{t('administration')}</h2>
              </div>
              <div className="px-6 py-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-charcoal-700">{t('cmsAdminPanel')}</p>
                  <p className="text-xs text-charcoal-400 mt-0.5">
                    {t('adminHelp')}
                  </p>
                </div>
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-2 rounded-lg border border-maroon-200 bg-maroon-50 px-4 py-2 text-sm font-medium text-maroon-800 hover:bg-maroon-100 transition-colors"
                >
                  {t('goToAdmin')} →
                </Link>
              </div>
            </div>

          </div>
        </Container>
      </section>
    </>
  )
}
