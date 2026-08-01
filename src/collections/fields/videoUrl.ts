import type { Field } from 'payload'
import { isEmbeddableVideoUrl } from '../../lib/video/embed'

/**
 * The "paste a video link" field, defined once.
 *
 * Events had this first, with a validator that rejects an unembeddable link at
 * paste time rather than letting a visitor discover it as a dead frame. News
 * and office updates now want the same thing, and the one property that must
 * hold is that the admin never accepts a URL the page will refuse to play —
 * which is only guaranteed while the SAME parser decides both.
 *
 * Copying the field would have let the two drift the first time the parser
 * learned a new provider.
 */
export const videoUrlField = (overrides: Partial<Field> = {}): Field =>
  ({
    name: 'videoUrl',
    type: 'text',
    admin: {
      description:
        'Paste the link to the stream or recording — YouTube or Facebook. Both the address-bar link and the Share button link work. Leave empty if there is no video.',
      ...(overrides.admin as Record<string, unknown>),
    },
    validate: (value: unknown) => {
      if (value === null || value === undefined || value === '') return true
      if (isEmbeddableVideoUrl(String(value))) return true
      return 'That link cannot be embedded. Paste a YouTube or Facebook video link — for a shortened fb.watch link, open it first and copy the full address.'
    },
    ...overrides,
  }) as Field
