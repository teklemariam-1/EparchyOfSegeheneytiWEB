import type { CollectionAfterReadHook } from 'payload'

/**
 * Enforce the visibility switches on the way OUT of the API.
 *
 * Two mechanisms, one hook:
 *
 *  1. SECTION switches (`visibility.show*`) — a section that is off is deleted
 *     from the response entirely.
 *  2. PER-ENTRY `isPublic` — a single withheld milestone, gallery or photograph
 *     is filtered out of its array.
 *
 * Field-level access cannot do either job. It evaluates per FIELD, so it cannot
 * see a per-row flag inside an array; and a section switch is a decision about
 * a sibling field's value, which access control has no vocabulary for.
 *
 * Filtering in the page component would not fix it either — the leak would be
 * in `GET /api/priests`, not in the HTML. This runs on the way out, so REST,
 * GraphQL and the Local API are covered by one check.
 *
 * Authenticated staff keep everything: they must see what is withheld in order
 * to manage it.
 */

/** Entries default to public — a row saved before the flag existed stays visible. */
function isWithheld(entry: unknown): boolean {
  return (entry as { isPublic?: unknown } | null)?.isPublic === false
}

function keepPublic<T>(entries: T[] | null | undefined): T[] | null | undefined {
  if (!Array.isArray(entries)) return entries
  return entries.filter((entry) => !isWithheld(entry))
}

/**
 * A section switch that has never been set reads as its default. Contact is the
 * one that defaults to OFF, so `undefined` must mean hidden for it and shown
 * for the others — otherwise a record created before this feature would publish
 * a phone number the moment the code shipped.
 */
function sectionOn(value: unknown, defaultWhenUnset: boolean): boolean {
  return value === undefined || value === null ? defaultWhenUnset : value !== false
}

export const stripNonPublicPriestData: CollectionAfterReadHook = ({ doc, req }) => {
  if (req.user) return doc

  const record = doc as Record<string, unknown>
  const visibility = (record.visibility ?? {}) as Record<string, unknown>

  if (!sectionOn(visibility.showBio, true)) delete record.bio
  if (!sectionOn(visibility.showEducation, true)) delete record.education

  if (!sectionOn(visibility.showMilestones, true)) {
    delete record.milestones
  } else {
    record.milestones = keepPublic(record.milestones as unknown[])
  }

  if (!sectionOn(visibility.showGalleries, true)) {
    delete record.galleries
  } else {
    record.galleries = keepPublic(record.galleries as unknown[])?.map((gallery) => {
      const entry = gallery as Record<string, unknown>
      return { ...entry, images: keepPublic(entry.images as unknown[]) }
    })
  }

  // Contact defaults to HIDDEN. This is the switch whose default direction
  // protects people rather than data.
  if (!sectionOn(visibility.showContact, false)) delete record.contact

  // Both dates are top-level fields on the collection, not a `dates` group.
  if (!sectionOn(visibility.showDates, true)) delete record.ordinationDate

  // Never published, whatever the switches say: a birth date is identity-theft
  // material and serves no purpose on a clergy page. There is deliberately no
  // switch that turns this one back on.
  delete record.birthDate

  return record
}
