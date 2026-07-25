import type { CollectionConfig } from 'payload'
import { safeRevalidatePath, safeRevalidateTag } from '../../lib/payload/revalidate'
import { isPublicRead } from '../../lib/permissions/readAccess'
import { crud, hideUnless } from '../../lib/permissions/access'
import { GEEZ_MONTHS, GEEZ_MONTH_LABELS } from '../../lib/constants/geezMonths'

export const GeezCalendarEntries: CollectionConfig = {
  slug: 'geez-calendar-entries',
  admin: {
    hidden: hideUnless('geez-calendar.manage'),
    useAsTitle: 'title',
    group: 'Calendar',
    defaultColumns: ['title', 'geezDate.month', 'geezDate.day', 'feastRank', 'isFasting'],
    description: "Ge'ez liturgical calendar entries — feasts, fasts, and saints' days.",
    preview: (doc) => `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/geez-calendar/${(doc as any).slug}`,
  },
  access: {
    ...crud(isPublicRead, 'geez-calendar.manage', 'geez-calendar.manage', 'geez-calendar.manage'),
  },
  hooks: {
    afterChange: [
      ({ doc }) => {
        safeRevalidateTag('geez')
        safeRevalidatePath(`/geez-calendar/${doc.slug}`)
        safeRevalidatePath('/geez-calendar')
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'isFasting',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'feastRank',
      type: 'select',
      options: [
        { label: 'Major Feast (Buhe)', value: 'major' },
        { label: 'Minor Feast', value: 'minor' },
        { label: 'Memorial', value: 'memorial' },
        { label: 'Optional Memorial', value: 'optional-memorial' },
        { label: 'Fasting Season', value: 'fasting' },
        { label: 'Ordinary', value: 'ordinary' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'liturgicalColor',
      type: 'select',
      options: [
        { label: 'White (Feasts of Christ & Mary)', value: 'white' },
        { label: 'Red (Martyrs, Holy Spirit)', value: 'red' },
        { label: 'Purple (Fasting / Penitential)', value: 'purple' },
        { label: 'Green (Ordinary Time)', value: 'green' },
        { label: 'Black (Holy Friday)', value: 'black' },
        { label: 'Gold (Highest Feasts)', value: 'gold' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'geezDate',
      type: 'group',
      label: "Ge'ez Date",
      fields: [
        {
          // Canonical month slugs shared with geez-calendar-days (see
          // src/lib/constants/geezMonths.ts) so the two collections can be
          // joined and rendered with the same labels.
          name: 'month',
          type: 'select',
          required: true,
          options: GEEZ_MONTHS.map((m) => ({
            label: `${GEEZ_MONTH_LABELS[m].en} (${GEEZ_MONTH_LABELS[m].ti})`,
            value: m,
          })),
        },
        {
          name: 'day',
          type: 'number',
          required: true,
          min: 1,
          max: 30,
        },
      ],
    },
    {
      name: 'gregorianEquivalent',
      type: 'group',
      label: 'Gregorian Equivalent (approximate)',
      fields: [
        { name: 'month', type: 'number', min: 1, max: 12 },
        { name: 'day', type: 'number', min: 1, max: 31 },
      ],
    },
    {
      name: 'saint',
      type: 'text',
      localized: true,
      admin: { description: "Name of the saint or mystery commemorated on this day." },
    },
    {
      name: 'description',
      type: 'richText',
      localized: true,
    },
    {
      name: 'readings',
      type: 'group',
      label: 'Liturgical Readings',
      fields: [
        { name: 'firstReading', type: 'text', localized: true },
        { name: 'psalm', type: 'text', localized: true },
        { name: 'gospel', type: 'text', localized: true },
      ],
    },
    {
      name: 'fastingNotes',
      type: 'textarea',
      localized: true,
      admin: {
        condition: (data) => data?.isFasting === true,
        description: 'Specific fasting rules for this day.',
      },
    },
    {
      name: 'relatedEvents',
      type: 'relationship',
      relationTo: 'events',
      hasMany: true,
      admin: { position: 'sidebar' },
    },
  ],
  timestamps: true,
}
