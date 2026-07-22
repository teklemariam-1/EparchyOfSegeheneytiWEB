import type { CollectionConfig } from 'payload'
import { safeRevalidatePath, safeRevalidateTag } from '../../lib/payload/revalidate'
import { isChanceryOrAbove } from '../../lib/permissions/collectionAccess'
import { taxonomyValueField } from '../shared/taxonomyValueField'

export const EventTypes: CollectionConfig = {
  slug: 'event-types',
  labels: { singular: 'Event Type', plural: 'Event Types' },
  admin: {
    group: 'Content',
    useAsTitle: 'label',
    defaultColumns: ['label', 'value'],
    description:
      'Types available for events. They appear in the Event Type dropdown when editing events and as the filter buttons on the public Events page.',
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
        safeRevalidateTag('taxonomies')
        safeRevalidatePath('/events')
      },
    ],
    afterDelete: [
      () => {
        safeRevalidateTag('taxonomies')
        safeRevalidatePath('/events')
      },
    ],
  },
  fields: [
    {
      name: 'label',
      type: 'text',
      required: true,
      admin: { description: 'Shown on the Events page filter buttons and in the admin dropdown.' },
    },
    taxonomyValueField(
      "URL-friendly identifier stored on events and used in filter links (e.g. 'pilgrimage'). Lowercase letters, numbers and hyphens only. Avoid changing it once events use it.",
    ),
  ],
}
