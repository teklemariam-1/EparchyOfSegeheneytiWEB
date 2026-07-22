import type { CollectionConfig } from 'payload'
import { safeRevalidatePath, safeRevalidateTag } from '../../lib/payload/revalidate'
import { isChanceryOrAbove } from '../../lib/permissions/collectionAccess'
import { taxonomyValueField } from '../shared/taxonomyValueField'

export const NewsCategories: CollectionConfig = {
  slug: 'news-categories',
  labels: { singular: 'News Category', plural: 'News Categories' },
  admin: {
    group: 'Content',
    useAsTitle: 'label',
    defaultColumns: ['label', 'value'],
    description:
      'Categories available for news articles. They appear in the Category dropdown when editing news and as the filter buttons on the public News page.',
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
        safeRevalidatePath('/news')
      },
    ],
    afterDelete: [
      () => {
        safeRevalidateTag('taxonomies')
        safeRevalidatePath('/news')
      },
    ],
  },
  fields: [
    {
      name: 'label',
      type: 'text',
      required: true,
      admin: { description: 'Shown on the News page filter buttons and in the admin dropdown.' },
    },
    taxonomyValueField(
      "URL-friendly identifier stored on articles and used in filter links (e.g. 'youth'). Lowercase letters, numbers and hyphens only. Avoid changing it once articles use it.",
    ),
  ],
}
