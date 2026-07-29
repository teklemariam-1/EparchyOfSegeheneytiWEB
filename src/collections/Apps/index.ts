import type { CollectionConfig } from 'payload'
import { safeRevalidatePath, safeRevalidateTag } from '../../lib/payload/revalidate'
import { isPublishedOrAuthenticated } from '../../lib/permissions/readAccess'
import { crud, requirePublishPermission, hideUnless } from '../../lib/permissions/access'
import { slugFieldHook } from '../../lib/payload/slugField'
import { publishAtField } from '../../lib/payload/scheduledPublish'

/** Optional URL field validator — empty is allowed, otherwise must be http(s). */
const optionalUrl = (value: unknown) => {
  if (!value) return true
  return typeof value === 'string' && /^https?:\/\/.+/i.test(value)
    ? true
    : 'Enter a full URL starting with http:// or https://'
}

export const Apps: CollectionConfig = {
  slug: 'apps',
  admin: {
    hidden: hideUnless('apps.create', 'apps.update', 'apps.delete', 'apps.publish'),
    useAsTitle: 'title',
    group: 'Publications',
    defaultColumns: ['title', 'resourceType', 'version', 'publishedAt'],
    description:
      'Mobile apps and downloadable resources (Android APK, archives, documents) with banner images and store links.',
    preview: (doc) => `${(process.env.NEXT_PUBLIC_SITE_URL ?? '').trim()}/apps`,
  },
  access: {
    ...crud(isPublishedOrAuthenticated, 'apps.create', 'apps.update', 'apps.delete'),
  },
  versions: { drafts: true },
  hooks: {
    beforeChange: [requirePublishPermission('apps.publish')],
    afterChange: [
      () => {
        safeRevalidateTag('apps')
        safeRevalidatePath('/apps')
      },
    ],
  },
  fields: [
    publishAtField('apps.publish'),
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
      name: 'resourceType',
      type: 'select',
      required: true,
      defaultValue: 'android-app',
      options: [
        { label: 'Android App', value: 'android-app' },
        { label: 'iOS App', value: 'ios-app' },
        { label: 'Document / Other Download', value: 'download' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'publishedAt',
      type: 'date',
      index: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'version',
      type: 'text',
      admin: { position: 'sidebar', description: 'e.g. "1.2.0" (optional).' },
    },
    {
      name: 'bannerImage',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Wide banner image shown on the card (recommended 1200×630).' },
    },
    {
      name: 'icon',
      type: 'upload',
      relationTo: 'media',
      admin: { position: 'sidebar', description: 'Optional square app icon.' },
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
      admin: { description: 'Short description shown under the title.' },
    },
    {
      name: 'file',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description:
          'Optional direct download (Android .apk, .zip, or a document). Large files upload straight to storage from your browser.',
      },
    },
    {
      name: 'fileSizeLabel',
      type: 'text',
      admin: {
        position: 'sidebar',
        description: 'Optional human-readable size, e.g. "24 MB".',
        condition: (data) => Boolean(data?.file),
      },
    },
    {
      name: 'playStoreUrl',
      type: 'text',
      validate: optionalUrl,
      admin: {
        description: 'Optional Google Play listing URL.',
      },
    },
    {
      name: 'appStoreUrl',
      type: 'text',
      validate: optionalUrl,
      admin: {
        description: 'Optional Apple App Store listing URL.',
      },
    },
  ],
  timestamps: true,
}
