/**
 * SEO-related types used by buildMetadata and page components.
 */

export interface PageSEO {
  title?: string
  description?: string
  image?: {
    url: string
    alt?: string
    width?: number
    height?: number
  }
  noIndex?: boolean
}
