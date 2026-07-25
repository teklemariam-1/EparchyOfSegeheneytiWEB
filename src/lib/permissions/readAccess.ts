import type { Access, AccessArgs } from 'payload'

/**
 * Read access for public-facing content.
 *
 * Writes are never expressed here — every create/update/delete decision goes
 * through the permission catalog in ./access. Reads are different: most content
 * is public by design, so these two helpers cover it, and the collections that
 * restrict reads use `can('…')` directly.
 */

/** Allows read access to everyone (public content). */
export const isPublicRead: Access = () => true

/**
 * Public read for draft-enabled collections.
 *
 * Authenticated users (editors) may read everything, including drafts.
 * Anonymous visitors are constrained to published documents via a where-clause,
 * so appending `?draft=true` to the REST/GraphQL API cannot expose unpublished
 * content. Use this instead of `isPublicRead` on any collection with
 * `versions: { drafts: true }`.
 */
export const isPublishedOrAuthenticated: Access = ({ req }: AccessArgs) => {
  if (req.user) return true
  return { _status: { equals: 'published' } }
}
