import type { CollectionConfig } from 'payload'
import { safeRevalidatePath, safeRevalidateTag } from '../../lib/payload/revalidate'
import { isPublicRead, isChanceryOrAbove } from '../../lib/permissions/collectionAccess'
import { slugFieldHook } from '../../lib/payload/slugField'

/**
 * Vicariates — the middle tier of the Eparchy's structure:
 *   Eparchy → Vicariate → Parish
 *
 * Previously this was a hard-coded select on Parishes, so staff could not add or
 * rename one without a code change. It is now a first-class collection.
 */
export const Vicariates: CollectionConfig = {
  slug: 'vicariates',
  admin: {
    useAsTitle: 'name',
    group: 'Church',
    defaultColumns: ['name', 'seat', 'order'],
    description: 'Vicariates of the Eparchy. Each parish belongs to one vicariate.',
    preview: (doc) => `${(process.env.NEXT_PUBLIC_SITE_URL ?? '').trim()}/vicariates/${(doc as any).slug}`,
  },
  access: {
    read: isPublicRead,
    create: isChanceryOrAbove,
    update: isChanceryOrAbove,
    delete: isChanceryOrAbove,
  },
  hooks: {
    afterChange: [
      ({ doc }) => {
        safeRevalidateTag('vicariates')
        safeRevalidatePath(`/vicariates/${doc.slug}`)
        safeRevalidatePath('/vicariates')
        safeRevalidatePath('/parishes')
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      localized: true,
      admin: { description: 'e.g. "Segeneyti Vicariate"' },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      hooks: { beforeValidate: [slugFieldHook(['name', 'title'])] },
      admin: { position: 'sidebar' },
    },
    {
      name: 'seat',
      type: 'text',
      localized: true,
      admin: { position: 'sidebar', description: 'Principal town or seat of the vicariate.' },
    },
    {
      name: 'order',
      type: 'number',
      admin: { position: 'sidebar', description: 'Controls listing order (lowest first).' },
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Banner image shown on the vicariate card and page.' },
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
      admin: { description: 'Short summary shown on the vicariate listing.' },
    },
    {
      name: 'about',
      type: 'richText',
      localized: true,
      admin: { description: 'Longer description shown on the vicariate page.' },
    },
    {
      name: 'vicar',
      type: 'relationship',
      relationTo: 'priests',
      admin: { position: 'sidebar', description: 'Priest serving as vicar for this vicariate.' },
    },
    {
      name: 'contact',
      type: 'group',
      fields: [
        { name: 'phone', type: 'text' },
        { name: 'email', type: 'email' },
        { name: 'address', type: 'text', localized: true },
      ],
    },
  ],
  timestamps: true,
}
