import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { getLocale, getTranslations } from 'next-intl/server'
import { getParishesList } from '@/lib/payload/queries'
import { FEEDS } from '@/lib/calendar-sync/feeds'
import { feedUrl } from '@/lib/calendar-sync/config'
import { FeedCard } from '@/features/calendar-sync/FeedCard'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = buildMetadata({
  title: 'Calendar Subscriptions',
  description:
    "Subscribe to the Ge'ez liturgical calendar, feast days, fasting seasons and eparchy events in Google Calendar, Apple Calendar or Outlook.",
  path: '/calendar-subscriptions',
})

export default async function CalendarSubscriptionsPage() {
  const locale = (await getLocale()) === 'ti' ? 'ti' : 'en'
  const t = await getTranslations('calendar')
  const parishes = await getParishesList(200)

  const labels = {
    copyUrl: t('copyUrl'),
    copied: t('copied'),
    google: t('providerGoogle'),
    apple: t('providerApple'),
    outlook: t('providerOutlook'),
    download: t('downloadFeed'),
    allParishes: t('allParishes'),
  }

  return (
    <>
      <PageHeader
        title={t('subscribeTitle')}
        subtitle={t('subscribeSubtitle')}
        breadcrumbs={[{ label: t('title'), href: '/geez-calendar' }, { label: t('subscribeTitle') }]}
      />

      <Section className="bg-parchment-50 dark:bg-charcoal-950">
        <Container>
          <div className="grid gap-5 sm:grid-cols-2">
            {FEEDS.map((feed) => (
              <FeedCard
                key={feed.id}
                title={feed.title[locale]}
                description={feed.description[locale]}
                baseUrl={feedUrl(feed.id)}
                parishes={
                  feed.supportsParish
                    ? parishes.map((p) => ({ slug: p.slug, title: p.title }))
                    : undefined
                }
                labels={labels}
              />
            ))}
          </div>

          <div className="mt-8 max-w-2xl space-y-3 text-sm text-charcoal-500 leading-relaxed dark:text-charcoal-300">
            <p>{t('subscribeHint')}</p>
            <p>
              <strong className="text-charcoal-700 dark:text-charcoal-100">Samsung / Android · </strong>
              {t('samsungHint')}
            </p>
          </div>
        </Container>
      </Section>
    </>
  )
}
