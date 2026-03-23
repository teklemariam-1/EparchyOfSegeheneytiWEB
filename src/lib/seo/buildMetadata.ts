import type { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
const SITE_NAME = 'Catholic Eparchy of Segeneyti'
const DEFAULT_OG_IMAGE = `${SITE_URL}/images/og-default.jpg`

interface BuildMetadataOptions {
  title: string
  description?: string
  image?: string
  path?: string
  isHome?: boolean
  noIndex?: boolean
  type?: 'website' | 'article'
}

/**
 * Factory for consistent Next.js Metadata objects.
 * Use in each page's generateMetadata() or as a static export.
 */
export function buildMetadata({
  title,
  description,
  image,
  path = '',
  isHome = false,
  noIndex = false,
  type = 'website',
}: BuildMetadataOptions): Metadata {
  const url = `${SITE_URL}${path}`
  const ogImage = image ?? DEFAULT_OG_IMAGE

  return {
    title: isHome ? title : { absolute: `${title} | ${SITE_NAME}` },
    description,
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: isHome ? title : `${title} | ${SITE_NAME}`,
      description,
      url,
      siteName: SITE_NAME,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type,
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: isHome ? title : `${title} | ${SITE_NAME}`,
      description,
      images: [ogImage],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  }
}
