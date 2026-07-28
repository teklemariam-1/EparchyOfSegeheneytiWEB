import type { Metadata } from 'next'
import { Suspense } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { EmptyState } from '@/components/shared/EmptyState'
import { FilterBar } from '@/components/shared/FilterBar'
import { getTranslations } from 'next-intl/server'
import { getMediaGallery } from '@/lib/payload/queries'
import { MediaLightboxGrid } from '@/features/media/MediaLightboxGrid'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = buildMetadata({
  title: 'Media',
  description: 'Photo gallery and media resources from the Catholic Eparchy of Segheneyti.',
  path: '/media',
})

const CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'general', label: 'General' },
  { value: 'event', label: 'Events' },
  { value: 'parish', label: 'Parishes' },
  { value: 'clergy', label: 'Bishop & Clergy' },
  { value: 'document', label: 'Documents' },
]

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>
}) {
  const { category, page: pageParam } = await searchParams
  const currentPage = Number(pageParam) || 1
  const { docs: mediaItems, meta } = await getMediaGallery({ limit: 24, category, page: currentPage })
  const t = await getTranslations('media')

  return (
    <>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        breadcrumbs={[{ label: t('title') }]}
      />

      <Section className="bg-white">
        <Container>
          <Suspense fallback={<div className="h-12 mb-8" />}>
            <FilterBar options={CATEGORIES} paramName="category" />
          </Suspense>

          {/* Gallery grid with fullscreen lightbox */}
          {mediaItems.length > 0 ? (
            <MediaLightboxGrid items={mediaItems} />
          ) : (
            <EmptyState
              title="No photos yet"
              description="Photos will appear here once uploaded to the media library in the CMS."
            />
          )}

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="mt-10 flex justify-center gap-2">
              {meta.hasPrevPage && (
                <a
                  href={`/media?${category && category !== 'all' ? `category=${category}&` : ''}page=${meta.page - 1}`}
                  className="rounded border border-charcoal-200 px-4 py-2 text-sm text-charcoal-500 hover:border-maroon-300 hover:text-maroon-700 transition-colors"
                >
                  ← Previous
                </a>
              )}
              <span className="rounded border border-maroon-700 bg-maroon-800 px-4 py-2 text-sm text-white">
                {meta.page} / {meta.totalPages}
              </span>
              {meta.hasNextPage && (
                <a
                  href={`/media?${category && category !== 'all' ? `category=${category}&` : ''}page=${meta.page + 1}`}
                  className="rounded border border-charcoal-200 px-4 py-2 text-sm text-charcoal-500 hover:border-maroon-300 hover:text-maroon-700 transition-colors"
                >
                  Next →
                </a>
              )}
            </div>
          )}
        </Container>
      </Section>
    </>
  )
}
