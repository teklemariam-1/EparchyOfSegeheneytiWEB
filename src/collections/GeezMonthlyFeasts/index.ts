import type { CollectionConfig } from 'payload'
import { safeRevalidatePath, safeRevalidateTag } from '../../lib/payload/revalidate'
import { isChanceryOrAbove } from '../../lib/permissions/collectionAccess'

/**
 * Monthly recurring commemorations of the Ge'ez calendar — feasts observed on
 * the same day of every month (e.g. ሚካኤል on the 12th, በዓለማርያም on the 21st).
 * Shown on their day in every month of the public calendar.
 */
export const GeezMonthlyFeasts: CollectionConfig = {
  slug: 'geez-monthly-feasts',
  labels: { singular: "Ge'ez Monthly Feast", plural: "Ge'ez Monthly Feasts" },
  admin: {
    group: 'Calendar',
    useAsTitle: 'name',
    defaultColumns: ['day', 'name', 'icon'],
    description:
      'Recurring monthly commemorations: each appears on its day in every Ge\'ez month of the public calendar.',
  },
  access: {
    read: () => true,
    create: isChanceryOrAbove,
    update: isChanceryOrAbove,
    delete: isChanceryOrAbove,
  },
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
      name: 'day',
      type: 'number',
      required: true,
      unique: true,
      index: true,
      min: 1,
      max: 30,
      admin: { description: "Ge'ez day of the month (1–30) this commemoration recurs on." },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: { description: 'Commemoration name(s), e.g. ሚካኤል. Separate multiple with ፣' },
    },
    {
      name: 'icon',
      type: 'text',
      admin: { description: 'Optional small icon (emoji) shown on the calendar, e.g. ✝' },
    },
  ],
  timestamps: true,
}
