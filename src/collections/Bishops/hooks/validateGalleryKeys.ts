import type { CollectionBeforeValidateHook } from 'payload'
import { APIError } from 'payload'

/**
 * A milestone may point at a gallery by key. Payload cannot offer a select of
 * sibling-array values, so the field is free text — which means a typo would
 * otherwise save happily and render a timeline link to nothing.
 *
 * Validated collection-wide rather than per-field because the check needs both
 * arrays at once, and a field-level `validate` only ever sees its own value.
 */
export const validateGalleryKeys: CollectionBeforeValidateHook = ({ data }) => {
  const doc = data as
    | {
        milestones?: Array<{ galleryKey?: unknown; title?: unknown }> | null
        galleries?: Array<{ key?: unknown }> | null
      }
    | undefined
  if (!doc?.milestones?.length) return data

  const known = new Set(
    (doc.galleries ?? [])
      .map((g) => (typeof g?.key === 'string' ? g.key.trim() : ''))
      .filter(Boolean),
  )

  for (const milestone of doc.milestones) {
    const key = typeof milestone?.galleryKey === 'string' ? milestone.galleryKey.trim() : ''
    if (!key || known.has(key)) continue

    const knownList = known.size ? [...known].join(', ') : 'none defined yet'
    throw new APIError(
      `A milestone points at the gallery "${key}", but no gallery on the Galleries tab has that Key. Available keys: ${knownList}.`,
      400,
    )
  }

  return data
}
