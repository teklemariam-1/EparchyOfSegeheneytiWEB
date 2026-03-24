import type { Metadata } from 'next'
import { Suspense } from 'react'
import Image from 'next/image'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/shared/EmptyState'
import { FilterBar } from '@/components/shared/FilterBar'
import { getMediaGallery } from '@/lib/payload/queries'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = buildMetadata({
  title: 'Media',
  description: 'Photo gallery and media resources from the Catholic Eparchy of Segeneyti.',
  path: '/media',
})

const CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'liturgy', label: 'Liturgy' },
  { value: 'youth', label: 'Youth' },
  { value: 'community', label: 'Community' },
  { value: 'pastoral-visit', label: 'Pastoral Visits' },
  { value: 'ordination', label: 'Ordinations' },
]

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>
}) {
  const { category, page: pageParam } = await searchParams
  const currentPage = Number(pageParam) || 1
  const { docs: mediaItems, meta } = await getMediaGallery({ limit: 24, category, page: currentPage })

  return (
    <>
      <PageHeader
        title="Media"
        subtitle="Photos and media from liturgical life, pastoral visits, and community events across the Eparchy."
        breadcrumbs={[{ label: 'Media' }]}
      />

      <Section className="bg-white">
        <Container>
          <Suspense fallback={<div className="h-12 mb-8" />}>
            <FilterBar options={CATEGORIES} paramName="category" />
          </Suspense>

          {/* Gallery grid */}
          {mediaItems.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {mediaItems.map((item) => (
                <div
                  key={item.id}
                  className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer bg-parchment-100"
                >
                  <Image
                    src={item.sizes?.card?.url ?? item.sizes?.thumbnail?.url ?? item.url}
                    alt={item.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-charcoal-900/0 group-hover:bg-charcoal-900/60 transition-colors flex items-end p-3">
                    <p className="text-white text-xs font-medium leading-tight opacity-0 group-hover:opacity-100 transition-opacity line-clamp-2">
                      {item.alt}
                    </p>
                  </div>

                  {/* Category badge */}
                  {item.category && (
                    <div className="absolute top-2 left-2">
                      <Badge variant="maroon" size="sm" className="shadow-sm">
                        {CATEGORIES.find((c) => c.value === item.category)?.label ?? item.category}
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
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
