import type { CollectionConfig } from 'payload'
import { safeRevalidatePath, safeRevalidateTag } from '../../lib/payload/revalidate'
import { isChanceryOrAbove } from '../../lib/permissions/collectionAccess'
import { GEEZ_MONTHS, GEEZ_MONTH_LABELS } from '../../lib/constants/geezMonths'

/**
 * One document per day of the Ge'ez liturgical year: readings, antiphon,
 * deceased-clergy commemorations and feasts, each tied to its Gregorian date.
 * Structure mirrors the eparchy's liturgical calendar book (imported from the
 * gxawie calendar JSON; see scripts/convert-geez-calendar.mjs).
 */
export const GeezCalendarDays: CollectionConfig = {
  slug: 'geez-calendar-days',
  labels: { singular: "Ge'ez Calendar Day", plural: "Ge'ez Calendar Days" },
  admin: {
    group: 'Calendar',
    useAsTitle: 'geezLabel',
    defaultColumns: ['geezLabel', 'month', 'day', 'gregorianDate', 'events'],
    listSearchableFields: ['geezLabel', 'events', 'deceasedClergy', 'readings'],
    description:
      "Daily liturgical calendar: one entry per Ge'ez day with readings, antiphon, commemorations and feasts, plus the corresponding Gregorian date.",
  },
  access: {
    read: () => true,
    create: isChanceryOrAbove,
    update: isChanceryOrAbove,
    delete: isChanceryOrAbove,
  },
  // Each Ge'ez date exists exactly once; a second year's import cannot
  // silently duplicate or overlap days. (A unique index on the Gregorian
  // calendar day lives in SQL — see the calendar_integrity migration.)
  indexes: [{ unique: true, fields: ['geezYear', 'month', 'day'] }],
  hooks: {
    afterChange: [
      () => {
        safeRevalidateTag('geez')
        safeRevalidatePath('/geez-calendar')
      },
    ],
    afterDelete: [
      () => {
        safeRevalidateTag('geez')
        safeRevalidatePath('/geez-calendar')
      },
    ],
  },
  fields: [
    {
      name: 'geezLabel',
      type: 'text',
      required: true,
      admin: { description: "Ge'ez date as shown to visitors, e.g. ፩ መስከረም 2018" },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'month',
          type: 'select',
          required: true,
          index: true,
          options: GEEZ_MONTHS.map((m) => ({
            label: `${GEEZ_MONTH_LABELS[m].en} (${GEEZ_MONTH_LABELS[m].ti})`,
            value: m,
          })),
        },
        { name: 'day', type: 'number', required: true, min: 1, max: 30 },
        { name: 'geezYear', type: 'number', required: true, admin: { description: 'E.C. year, e.g. 2018' } },
      ],
    },
    {
      name: 'gregorianDate',
      type: 'date',
      required: true,
      index: true,
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayOnly' },
        description: 'Corresponding Gregorian (ፈረንጂ) date.',
      },
    },
    {
      name: 'readings',
      type: 'textarea',
      admin: { description: 'Scripture readings for the day (ንባባት).' },
    },
    {
      name: 'antiphon',
      type: 'textarea',
      admin: { description: 'Antiphon / መዝሙር of the day.' },
    },
    {
      name: 'deceasedClergy',
      type: 'textarea',
      label: 'Deceased Clergy Commemoration',
      admin: { description: 'Clergy commemorated on this day (ዝኽሪ ዝዓረፉ ካህናት).' },
    },
    {
      name: 'events',
      type: 'textarea',
      label: 'Feasts / Events',
      admin: { description: 'Feast days and celebrations on this day (በዓላት).' },
    },
  ],
  timestamps: true,
}
