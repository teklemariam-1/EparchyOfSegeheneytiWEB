import type { Field } from 'payload'

/**
 * Ministry history and photo galleries — the Bishops module's shape, cut down.
 *
 * An Eparch's record justifies eleven milestone types and per-entry source
 * documents; a parish priest's does not, and a form that large would simply go
 * unfilled. This keeps what a priest's page actually shows — what happened,
 * when, roughly where — and drops the apparatus around it.
 *
 * Every entry carries its own `isPublic`, because withholding is usually about
 * one entry rather than a whole section: a pastoral assignment that ended
 * badly, a date the family would rather not see published.
 */

/** Same vocabulary as the Bishops timeline where it overlaps, so the two read alike. */
const MILESTONE_TYPES = [
  { label: 'Birth', value: 'birth' },
  { label: 'Baptism', value: 'baptism' },
  { label: 'Seminary', value: 'seminary' },
  { label: 'Diaconate ordination', value: 'diaconate-ordination' },
  { label: 'Priestly ordination', value: 'priestly-ordination' },
  { label: 'Pastoral assignment', value: 'pastoral-assignment' },
  { label: 'Further studies', value: 'further-studies' },
  { label: 'Curial or teaching role', value: 'curial-role' },
  { label: 'Retirement', value: 'retirement' },
  { label: 'Other', value: 'other' },
]

/**
 * Dates in a priest's history are often approximate — an ordination year
 * remembered without the day, a seminary period known only to the year. The
 * precision flag lets the page say "1994" or "around 1994" honestly rather than
 * inventing a false 1 January.
 */
const DATE_PRECISION = [
  { label: 'Exact date', value: 'exact' },
  { label: 'Month and year', value: 'month' },
  { label: 'Year only', value: 'year' },
  { label: 'Approximate', value: 'approximate' },
]

export const milestonesField: Field = {
  name: 'milestones',
  type: 'array',
  label: 'Ministry history',
  admin: {
    description:
      'What happened, and when. Add entries as they happen — the page orders them by date, so they need not be entered in order.',
    initCollapsed: true,
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'milestoneType',
          type: 'select',
          required: true,
          defaultValue: 'pastoral-assignment',
          options: MILESTONE_TYPES,
          admin: { width: '60%' },
        },
        {
          name: 'isPublic',
          type: 'checkbox',
          defaultValue: true,
          label: 'Show publicly',
          admin: { width: '40%' },
        },
      ],
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      admin: { description: 'e.g. “Appointed Pastor of St Mary, Segheneyti”.' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'date',
          type: 'date',
          admin: { width: '50%', date: { pickerAppearance: 'dayOnly' } },
        },
        {
          name: 'datePrecision',
          type: 'select',
          defaultValue: 'exact',
          options: DATE_PRECISION,
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'parish',
      type: 'relationship',
      relationTo: 'parishes',
      admin: { description: 'If this entry concerns a particular parish.' },
    },
  ],
}

export const galleriesField: Field = {
  name: 'galleries',
  type: 'array',
  label: 'Photo galleries',
  admin: {
    description: 'Photographs grouped by occasion — an ordination, a jubilee, parish life.',
    initCollapsed: true,
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'title', type: 'text', required: true, localized: true, admin: { width: '60%' } },
        {
          name: 'isPublic',
          type: 'checkbox',
          defaultValue: true,
          label: 'Show publicly',
          admin: { width: '40%' },
        },
      ],
    },
    {
      name: 'images',
      type: 'array',
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', required: true },
        { name: 'caption', type: 'text', localized: true },
        {
          // A single photograph can be the withheld one — a face the family
          // would rather not publish — without losing the gallery around it.
          name: 'isPublic',
          type: 'checkbox',
          defaultValue: true,
          label: 'Show publicly',
        },
      ],
    },
  ],
}
