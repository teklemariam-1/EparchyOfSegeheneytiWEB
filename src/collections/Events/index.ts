import type { CollectionConfig } from 'payload'
import { safeRevalidatePath, safeRevalidateTag } from '../../lib/payload/revalidate'
import { isPublishedOrAuthenticated } from '../../lib/permissions/readAccess'
import { can, canManageOwnParish, requirePublishPermission, hideUnless } from '../../lib/permissions/access'
import { slugFieldHook } from '../../lib/payload/slugField'
import { isEmbeddableVideoUrl } from '../../lib/video/embed'

export const Events: CollectionConfig = {
  slug: 'events',
  admin: {
    hidden: hideUnless('events.create', 'events.update', 'events.delete', 'events.manage-own', 'events.publish'),
    useAsTitle: 'title',
    group: 'Content',
    defaultColumns: ['_status', 'title', 'startDate', 'endDate', 'parish'],
    description: 'Eparchy-wide and parish-level events.',
    preview: (doc) => `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/events/${(doc as any).slug}`,
  },
  access: {
    read: isPublishedOrAuthenticated,
    create: canManageOwnParish('events.create', 'events.manage-own'),
    update: canManageOwnParish('events.update', 'events.manage-own'),
    delete: can('events.delete'),
  },
  versions: { drafts: true },
  hooks: {
    beforeChange: [requirePublishPermission('events.publish')],
    afterChange: [
      ({ doc }) => {
        safeRevalidateTag('events')
        safeRevalidatePath(`/events/${doc.slug}`)
        safeRevalidatePath('/events')
        safeRevalidatePath('/')
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
      // Publish state lives in Payload's own `_status` (drafts are enabled).
      // Cancellation is a separate idea — a cancelled event is still published,
      // it just isn't happening — so it gets its own flag rather than being a
      // third option on a select that also meant draft/published.
      name: 'isCancelled',
      type: 'checkbox',
      defaultValue: false,
      label: 'Cancelled',
      admin: { position: 'sidebar', description: 'Mark this event as cancelled.' },
    },
    {
      // Options are managed in the Event Types collection (admin-editable),
      // so this is a text field rendered as a dynamic dropdown.
      name: 'eventType',
      type: 'text',
      defaultValue: 'liturgical',
      admin: {
        position: 'sidebar',
        components: {
          Field: {
            path: '@/components/admin/TaxonomySelect#TaxonomySelect',
            clientProps: { collectionSlug: 'event-types', labelText: 'Event Type' },
          },
        },
      },
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
      admin: { position: 'sidebar' },
    },
    {
      name: 'excerpt',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'description',
      type: 'richText',
      localized: true,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'startDate',
          type: 'date',
          required: true,
          // Primary sort/filter key for every event listing and the calendar
          // range query — indexed so those don't seq-scan.
          index: true,
          admin: { date: { pickerAppearance: 'dayAndTime' } },
        },
        {
          name: 'endDate',
          type: 'date',
          admin: { date: { pickerAppearance: 'dayAndTime' } },
        },
      ],
    },
    {
      name: 'isAllDay',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'videoUrl',
      type: 'text',
      admin: {
        description:
          'Paste the link to the stream or recording — YouTube or Facebook. Both the address-bar link and the Share button link work. Leave empty if there is no video.',
      },
      // Validated at paste time rather than discovered by a visitor staring at a
      // dead frame. The same parser that renders the embed decides this, so the
      // admin cannot accept a URL the page will then refuse to play.
      validate: (value: unknown) => {
        if (value === null || value === undefined || value === '') return true
        if (isEmbeddableVideoUrl(String(value))) return true
        return 'That link cannot be embedded. Paste a YouTube or Facebook video link — for a shortened fb.watch link, open it first and copy the full address.'
      },
    },
    {
      name: 'location',
      type: 'group',
      fields: [
        { name: 'name', type: 'text', localized: true },
        { name: 'address', type: 'text' },
        { name: 'googleMapsUrl', type: 'text' },
      ],
    },
    {
      name: 'parish',
      type: 'relationship',
      relationTo: 'parishes',
      admin: { position: 'sidebar' },
    },
    {
      name: 'organizer',
      type: 'relationship',
      relationTo: 'users',
      admin: { position: 'sidebar' },
    },
    {
      name: 'isRecurring',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'geezCalendarRef',
      type: 'relationship',
      relationTo: 'geez-calendar-entries',
      label: "Ge'ez Calendar Entry",
      admin: {
        position: 'sidebar',
        description: "Link to the corresponding Ge'ez liturgical calendar entry.",
      },
    },
    {
      name: 'seo',
      type: 'group',
      label: 'SEO',
      admin: { position: 'sidebar' },
      fields: [
        { name: 'metaTitle', type: 'text', localized: true },
        { name: 'metaDescription', type: 'textarea', localized: true },
      ],
    },
  ],
  timestamps: true,
}
