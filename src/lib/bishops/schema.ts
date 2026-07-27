import { personSchema } from '../seo/structuredData'
import type { BishopRecord } from './queries'

/**
 * Person JSON-LD for an Eparch.
 *
 * Shared by /bishop and /eparchs/[slug] so the two cannot describe the same man
 * differently — they render the same record and must emit the same entity.
 *
 * `url` always points at the permanent /eparchs/[slug] address, never at
 * /bishop: /bishop is the office and will one day describe someone else, so
 * using it as the canonical identifier would silently reassign this Person's
 * identity to his successor.
 *
 * `sameAs` carries the public reference links — the Holy See announcement, a
 * reference database entry — which is what lets a search engine reconcile this
 * page with the same man recorded elsewhere.
 */
export function bishopPersonSchema(bishop: BishopRecord) {
  return personSchema({
    name: bishop.fullName ?? '',
    // "other" is a placeholder meaning "written into the formal title instead",
    // so emitting it as an honorific would publish the literal word "other".
    honorificPrefix: bishop.honorific && bishop.honorific !== 'other' ? bishop.honorific : undefined,
    jobTitle: bishop.formalTitle ?? undefined,
    description: bishop.biographySummary ?? undefined,
    birthDate: bishop.dateOfBirth ?? undefined,
    deathDate: bishop.dateOfDeath ?? undefined,
    imageUrl: bishop.portrait?.url,
    slug: bishop.slug,
    url: `/eparchs/${bishop.slug}`,
    sameAs: (bishop.links ?? [])
      .map((link) => link.url)
      .filter((url): url is string => Boolean(url)),
  })
}
