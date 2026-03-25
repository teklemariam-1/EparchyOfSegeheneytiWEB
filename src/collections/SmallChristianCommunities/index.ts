import type { CollectionConfig } from 'payload'
import { revalidatePath } from 'next/cache'
import { isPublicRead, isChanceryOrAbove, isOwnParishOrAbove } from '../../lib/permissions/collectionAccess'

export const SmallChristianCommunities: CollectionConfig = {
  slug: 'small-christian-communities',
  admin: {
    useAsTitle: 'name',
    group: 'Ministries',
    defaultColumns: ['name', 'parish', 'meetingDay', 'status'],
    description: 'Small Christian Communities (SCCs) within each parish.',
  },
  access: {
    read: isPublicRead,
    create: isOwnParishOrAbove(),
    update: isOwnParishOrAbove(),
    delete: isChanceryOrAbove,
  },
  hooks: {
    afterChange: [
      ({ doc }) => {
        revalidatePath('/ministries/scc')
      },
    ],
  },
  fields: [
    {
      name: 'name',
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
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'parish',
      type: 'relationship',
      relationTo: 'parishes',
      required: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'description',
      type: 'richText',
      localized: true,
    },
    {
      name: 'neighborhoodArea',
      type: 'text',
      localized: true,
      admin: { description: 'Geographic area or neighborhood this SCC covers.' },
    },
    {
      name: 'coordinator',
      type: 'group',
      fields: [
        { name: 'name', type: 'text' },
        { name: 'phone', type: 'text' },
      ],
    },
    {
      name: 'meetingDay',
      type: 'select',
      options: [
        { label: 'Sunday', value: 'sunday' },
        { label: 'Monday', value: 'monday' },
        { label: 'Tuesday', value: 'tuesday' },
        { label: 'Wednesday', value: 'wednesday' },
        { label: 'Thursday', value: 'thursday' },
        { label: 'Friday', value: 'friday' },
        { label: 'Saturday', value: 'saturday' },
      ],
    },
    {
      name: 'meetingSchedule',
      type: 'text',
      localized: true,
      admin: { description: 'Full schedule description (e.g. "Every second Friday at 6pm").' },
    },
    {
      name: 'memberCount',
      type: 'number',
      admin: { description: 'Approximate number of member households.' },
    },
  ],
  timestamps: true,
}
