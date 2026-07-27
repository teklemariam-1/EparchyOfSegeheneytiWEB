import type { Field } from 'payload'

/**
 * Tab 6 — Biography.
 *
 * The summary is not a nicety: it is what cards, previews, the meta
 * description, and the Open Graph description all read from. Without it those
 * surfaces fall back to truncating rich text, which cuts Ge'ez mid-syllable.
 */
export const biographyTab: Field[] = [
  {
    name: 'biographySummary',
    type: 'textarea',
    localized: true,
    label: 'Short summary',
    maxLength: 400,
    admin: {
      description:
        'Two or three sentences. Used on cards, link previews, and in search results — write it as a standalone paragraph, not as an opening clause.',
    },
  },
  {
    name: 'biography',
    type: 'richText',
    localized: true,
    label: 'Full biography',
    admin: {
      description:
        'The full account. Tigrinya is rendered with extra line spacing on the public page, so long passages stay readable.',
    },
  },
]
