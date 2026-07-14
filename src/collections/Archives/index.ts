import type { CollectionConfig } from 'payload'
import { safeRevalidatePath } from '../../lib/payload/revalidate'
import { isPublicRead, isChanceryOrAbove, isSuperAdmin } from '../../lib/permissions/collectionAccess'
import { slugFieldHook } from '../../lib/payload/slugField'

export const Archives: CollectionConfig = {
  slug: 'archives',
  admin: {
    useAsTitle: 'title',
    group: 'Publications',
    defaultColumns: ['title', 'category', 'year', 'accessLevel'],
    description: 'Historical and official documents for the Eparchy archive.',
  },
  access: {
    read: ({ req }) => {
      // Public archives can be read by everyone; restricted ones need auth
      const user = req.user as { role: string } | null
      if (user && ['super-admin', 'chancery-editor'].includes(user.role)) return true
      return { accessLevel: { equals: 'public' } }
    },
    create: isChanceryOrAbove,
    update: isChanceryOrAbove,
    delete: isSuperAdmin,
  },
  hooks: {
    afterChange: [
      async ({ doc, req }) => {
        // Propagate the archive's access level onto its underlying media files,
        // so a restricted document cannot be fetched via its direct media URL.
        try {
          const level = doc.accessLevel === 'restricted' ? 'restricted' : 'public'
          const fileIds: string[] = (doc.files ?? [])
            .map((f: { file?: unknown }) =>
              f.file && typeof f.file === 'object'
                ? (f.file as { id: string }).id
                : (f.file as string | undefined),
            )
            .filter((id: string | undefined): id is string => Boolean(id))

          for (const id of fileIds) {
            await req.payload.update({
              collection: 'media',
              id,
              data: { accessLevel: level },
              overrideAccess: true,
            })
          }
        } catch (err) {
          req.payload.logger.error(
            `Archives access-level propagation failed for "${doc.slug}": ${String(err)}`,
          )
        }

        safeRevalidatePath(`/archives/${doc.slug}`)
        safeRevalidatePath('/archives')
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
      hooks: { beforeValidate: [slugFieldHook()] },
      admin: { position: 'sidebar' },
    },
    {
      name: 'year',
      type: 'number',
      required: true,
      index: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Official Documents', value: 'official' },
        { label: 'Pastoral Letters', value: 'pastoral' },
        { label: 'Historical Records', value: 'historical' },
        { label: 'Correspondence', value: 'correspondence' },
        { label: 'Council / Synod Minutes', value: 'council' },
        { label: 'Statistics / Reports', value: 'reports' },
        { label: 'Other', value: 'other' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'accessLevel',
      type: 'select',
      required: true,
      defaultValue: 'public',
      options: [
        { label: 'Public', value: 'public' },
        { label: 'Restricted (authenticated only)', value: 'restricted' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'files',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        { name: 'file', type: 'upload', relationTo: 'media', required: true },
        { name: 'label', type: 'text', localized: true, admin: { description: 'Document title or description.' } },
        { name: 'language', type: 'select', options: ['ti', 'en', 'ar', 'it', 'other'], defaultValue: 'ti' },
      ],
    },
    {
      name: 'tags',
      type: 'array',
      fields: [{ name: 'tag', type: 'text' }],
      admin: { position: 'sidebar' },
    },
  ],
  timestamps: true,
}
