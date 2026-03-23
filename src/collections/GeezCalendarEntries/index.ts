import type { CollectionConfig } from 'payload'
import { isPublicRead, isChanceryOrAbove } from '@/lib/permissions/collectionAccess'

export const GeezCalendarEntries: CollectionConfig = {
  slug: 'geez-calendar-entries',
  admin: { useAsTitle: 'title', group: 'Calendar' },
  access: { read: isPublicRead, create: isChanceryOrAbove, update: isChanceryOrAbove, delete: isChanceryOrAbove },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'geezMonth', type: 'select', required: true, options: ['meskerem','tikmt','hidar','tahsas','tir','yekatit','megabit','miyazya','ginbot','sene','hamle','nehase','pagume'] },
    { name: 'geezDay', type: 'number', required: true, min: 1, max: 30 },
    { name: 'gregorianMonth', type: 'number', min: 1, max: 12 },
    { name: 'gregorianDay', type: 'number', min: 1, max: 31 },
    { name: 'feastRank', type: 'select', options: ['major', 'minor', 'memorial', 'optional-memorial', 'fasting', 'ordinary'] },
    { name: 'liturgicalColor', type: 'select', options: ['white', 'red', 'purple', 'green', 'black', 'gold'] },
    { name: 'description', type: 'richText', localized: true },
    { name: 'saint', type: 'text', localized: true },
    { name: 'isFasting', type: 'checkbox', defaultValue: false },
  ],
}
