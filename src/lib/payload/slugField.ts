import type { FieldHook } from 'payload'
import { slugify } from '../formatters/slug'

/**
 * Reusable `beforeValidate` hook for a `slug` text field.
 *
 * - If an editor typed a slug, it is normalized (lowercased, hyphenated).
 * - If the slug is left empty, it is auto-generated from the first non-empty
 *   source field (default: `title`, then `name`).
 *
 * Note: `slugify` handles Latin text; a Tigrinya/Ge'ez-only title yields an
 * empty slug, in which case the editor must supply one manually (the field
 * stays `required`). This matches the transliteration caveat in slug.ts.
 */
export const slugFieldHook =
  (sourceFields: string[] = ['title', 'name']): FieldHook =>
  ({ value, data }) => {
    if (typeof value === 'string' && value.trim().length > 0) {
      return slugify(value)
    }
    for (const field of sourceFields) {
      const source = data?.[field]
      if (typeof source === 'string' && source.trim().length > 0) {
        return slugify(source)
      }
    }
    return value
  }
