import type { CollectionAfterReadHook } from 'payload'

/**
 * Remove entries marked `isPublic: false` from responses to anonymous callers.
 *
 * Field-level access already hides the Internal tab, but it cannot help here:
 * `isPublic` is a per-row flag inside an array, and Payload evaluates access per
 * FIELD, not per array element. Without this hook a milestone that staff
 * deliberately withheld would still be sitting in `GET /api/bishops` for anyone
 * who looked, even though no page renders it.
 *
 * Filtering in the page component would not fix that — the leak is in the API
 * response, not in the HTML. This runs on the way out, so REST, GraphQL and the
 * Local API are all covered by the one check.
 *
 * Authenticated staff keep everything: they need to see what is withheld in
 * order to manage it.
 */

/** Entries default to public — a row saved before the flag existed stays visible. */
function isWithheld(entry: unknown): boolean {
  return (entry as { isPublic?: unknown } | null)?.isPublic === false
}

function keepPublic<T>(entries: T[] | null | undefined): T[] | null | undefined {
  if (!Array.isArray(entries)) return entries
  return entries.filter((entry) => !isWithheld(entry))
}

export const stripNonPublicEntries: CollectionAfterReadHook = ({ doc, req }) => {
  if (req.user) return doc

  const record = doc as Record<string, unknown>

  record.milestones = keepPublic(record.milestones as unknown[])?.map((milestone) => {
    const entry = milestone as Record<string, unknown>
    return {
      ...entry,
      links: keepPublic(entry.links as unknown[]),
      documents: keepPublic(entry.documents as unknown[]),
    }
  })

  record.honors = keepPublic(record.honors as unknown[])
  record.education = keepPublic(record.education as unknown[])
  record.pastoralPriorities = keepPublic(record.pastoralPriorities as unknown[])
  record.links = keepPublic(record.links as unknown[])
  record.documents = keepPublic(record.documents as unknown[])

  record.galleries = keepPublic(record.galleries as unknown[])?.map((gallery) => {
    const entry = gallery as Record<string, unknown>
    return { ...entry, images: keepPublic(entry.images as unknown[]) }
  })

  return record
}
