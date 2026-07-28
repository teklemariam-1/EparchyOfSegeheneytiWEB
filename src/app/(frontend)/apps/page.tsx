import type { Metadata } from 'next'
import Image from 'next/image'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { EmptyState } from '@/components/shared/EmptyState'
import { getLocale, getTranslations } from 'next-intl/server'
import { getAppsList, type AppItem } from '@/lib/payload/queries'

// Resolves locale from the NEXT_LOCALE cookie — cannot be statically generated.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = buildMetadata({
  title: 'Apps & Downloads',
  description:
    'Mobile applications and downloadable resources from the Catholic Eparchy of Segheneyti.',
  path: '/apps',
})

export default async function AppsPage() {
  const locale = await getLocale()
  const [apps, t] = await Promise.all([getAppsList(50, locale), getTranslations('apps')])

  return (
    <>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        breadcrumbs={[{ label: t('title') }]}
      />

      <Section className="bg-white">
        <Container>
          {apps.length === 0 ? (
            <EmptyState title={t('empty')} description={t('emptyDescription')} />
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {apps.map((app) => (
                <AppCard key={app.id} app={app} t={t} />
              ))}
            </div>
          )}

          {apps.some((a) => a.fileUrl && a.resourceType === 'android-app') && (
            <p className="mt-8 rounded-xl border border-gold-200 bg-gold-50 px-5 py-4 text-xs leading-relaxed text-charcoal-600">
              {t('apkNotice')}
            </p>
          )}
        </Container>
      </Section>
    </>
  )
}

function AppCard({
  app,
  t,
}: {
  app: AppItem
  t: Awaited<ReturnType<typeof getTranslations<'apps'>>>
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-charcoal-100 bg-white shadow-sm transition hover:shadow-md">
      {app.bannerImage?.url && (
        <div className="relative aspect-[1200/630] w-full bg-parchment-100">
          <Image
            src={app.bannerImage.url}
            alt={app.bannerImage.alt || app.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      )}

      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start gap-4">
          {app.icon?.url && (
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-charcoal-100">
              <Image src={app.icon.url} alt={app.icon.alt || app.title} fill className="object-cover" sizes="56px" />
            </div>
          )}
          <div className="min-w-0">
            <h2 className="font-serif text-lg font-semibold text-charcoal-900">{app.title}</h2>
            {app.version && (
              <p className="mt-0.5 text-xs text-charcoal-400">
                {t('version')} {app.version}
              </p>
            )}
          </div>
        </div>

        {app.description && (
          <p className="mt-3 text-sm leading-relaxed text-charcoal-600">{app.description}</p>
        )}

        {/* Actions */}
        <div className="mt-auto flex flex-wrap gap-3 pt-5">
          {app.playStoreUrl && (
            <a
              href={app.playStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-charcoal-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-charcoal-800"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M3.6 1.8a1 1 0 0 0-.6.9v18.6a1 1 0 0 0 .6.9l10.1-10.2L3.6 1.8Zm11.5 8.6 2.9-2.9-9.6-5.4 6.7 8.3Zm0 3.2-6.7 8.3 9.6-5.4-2.9-2.9Zm5.3-2.5-2.4-1.3-3 3 3 3 2.4-1.3a1.6 1.6 0 0 0 0-2.8Z" />
              </svg>
              {t('googlePlay')}
            </a>
          )}

          {app.appStoreUrl && (
            <a
              href={app.appStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-charcoal-200 px-4 py-2.5 text-sm font-semibold text-charcoal-800 transition-colors hover:border-charcoal-300 hover:bg-charcoal-50"
            >
              {t('appStore')}
            </a>
          )}

          {app.fileUrl && (
            <a
              href={app.fileUrl}
              download={app.fileName ?? undefined}
              className="inline-flex items-center gap-2 rounded-lg bg-maroon-800 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-maroon-700"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {app.resourceType === 'android-app' ? t('downloadApk') : t('download')}
              {app.fileSizeLabel && (
                <span className="font-normal opacity-80">({app.fileSizeLabel})</span>
              )}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
