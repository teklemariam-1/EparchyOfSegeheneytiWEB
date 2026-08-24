import * as Sentry from '@sentry/nextjs'
import type { ClergyObituary } from '@/types/payload-types'
import { getPayload } from '../payload/client'
import { cachedQuery } from '../payload/cache'

/**
 * Public read layer for the clergy obituaries. Same contract as
 * lib/bishops/queries: `overrideAccess: false` so drafts never leak past the
 * collection's read access, everything cached against the `clergy-obituaries`
 * tag the collection's afterChange invalidates, and safe empties on error —
 * logged first, so an outage is not mistaken for "no obituaries yet".
 */

/** Depth 1: the photo upload resolves; nothing on the document needs more. */
const DEPTH = 1

function logQueryError(where: string, err: unknown): void {
  console.error(`[query:clergy-obituaries.${where}]`, err)
  Sentry.captureException(err, { tags: { query: `clergy-obituaries.${where}` } })
}

async function _getObituaries(locale?: string): Promise<ClergyObituary[]> {
  try {
    const payload = await getPayload()
    const result = await payload.find({
      collection: 'clergy-obituaries',
      // Most recent death first; publishedAt breaks ties between same-day
      // deaths (both hook-defaulted, so neither is ever null under DESC).
      sort: ['-deathDate', '-publishedAt'],
      limit: 100,
      depth: DEPTH,
      locale: locale as never,
      overrideAccess: false,
    })
    return result.docs as unknown as ClergyObituary[]
  } catch (err) {
    logQueryError('getObituaries', err)
    return []
  }
}
/** Every published obituary, most recent death first. */
export const getObituaries = cachedQuery(_getObituaries, 'getObituaries', ['clergy-obituaries'])

async function _getObituaryBySlug(slug: string, locale?: string): Promise<ClergyObituary | null> {
  try {
    const payload = await getPayload()
    const result = await payload.find({
      collection: 'clergy-obituaries',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: DEPTH,
      locale: locale as never,
      overrideAccess: false,
    })
    return (result.docs[0] as unknown as ClergyObituary) ?? null
  } catch (err) {
    logQueryError('getObituaryBySlug', err)
    return null
  }
}
export const getObituaryBySlug = cachedQuery(_getObituaryBySlug, 'getObituaryBySlug', ['clergy-obituaries'])

async function _getObituarySlugs(): Promise<{ slug: string; updatedAt?: string }[]> {
  try {
    const payload = await getPayload()
    const result = await payload.find({
      collection: 'clergy-obituaries',
      limit: 500,
      depth: 0,
      overrideAccess: false,
    })
    return (result.docs as unknown as { slug: string; updatedAt?: string }[]).map((d) => ({
      slug: d.slug,
      updatedAt: d.updatedAt,
    }))
  } catch (err) {
    logQueryError('getObituarySlugs', err)
    return []
  }
}
/** For the sitemap and generateStaticParams. */
export const getAllObituarySlugs = cachedQuery(_getObituarySlugs, 'getAllObituarySlugs', ['clergy-obituaries'])
