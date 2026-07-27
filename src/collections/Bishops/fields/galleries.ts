import type { Field } from 'payload'
import { slugify } from '../../../lib/formatters/slug'

/**
 * Galleries (Part B).
 *
 * Modelled as grouped galleries only — "Episcopal Consecration 2024",
 * "Pastoral Visits" — because an ungrouped pile of photos is just a group with
 * one heading, whereas a flat array can never become grouped without a data
 * migration. Each group carries its own ordered set of images.
 *
 * Images relate to `media`, so they go through the existing upload path and the
 * configured storage adapter (Vercel Blob / S3) and inherit the `thumbnail`,
 * `card`, `hero` and `og` sizes already defined there. There is deliberately no
 * second upload route.
 *
 * `key` is what a milestone points at (`milestone.galleryKey`), so a timeline
 * entry can link straight to its photos. It is validated collection-wide in
 * hooks/validateGalleryKeys.ts — a typo fails the save with a readable message
 * instead of silently rendering a dead link.
 */
export const galleriesTab: Field[] = [
  {
    name: 'galleries',
    type: 'array',
    label: 'Photo galleries',
    labels: { singular: 'Gallery', plural: 'Galleries' },
    admin: {
      initCollapsed: true,
      description:
        'Group photos by occasion. Milestones on the Life & ministry tab can point at a gallery using its Key.',
      components: {
        RowLabel: '@/components/admin/bishops/RowLabels#GalleryRowLabel',
      },
    },
    fields: [
      { name: 'title', type: 'text', required: true, localized: true },
      {
        name: 'key',
        type: 'text',
        required: true,
        admin: {
          description:
            'Short identifier used to link a milestone to this gallery, e.g. "episcopal-consecration-2024". Generated from the English title if left blank.',
        },
        hooks: {
          beforeValidate: [
            ({ value, siblingData }) => {
              if (typeof value === 'string' && value.trim()) return slugify(value)
              const title = (siblingData as { title?: unknown } | undefined)?.title
              return typeof title === 'string' ? slugify(title) : value
            },
          ],
        },
      },
      { name: 'description', type: 'textarea', localized: true },
      {
        type: 'row',
        fields: [
          {
            name: 'coverImage',
            type: 'upload',
            relationTo: 'media',
            admin: { width: '50%', description: 'Shown as the gallery tile. Defaults to the first image.' },
          },
          { name: 'date', type: 'date', admin: { width: '25%' } },
          {
            name: 'isPublic',
            type: 'checkbox',
            label: 'Show publicly',
            defaultValue: true,
            admin: { width: '25%' },
          },
        ],
      },
      {
        name: 'images',
        type: 'array',
        label: 'Images',
        admin: { initCollapsed: true },
        fields: [
          { name: 'image', type: 'upload', relationTo: 'media', required: true },
          {
            name: 'caption',
            type: 'text',
            localized: true,
            admin: { description: 'Shown under the photo in the lightbox.' },
          },
          {
            type: 'row',
            fields: [
              { name: 'date', type: 'date', admin: { width: '34%' } },
              {
                name: 'credit',
                type: 'text',
                admin: { width: '33%', description: 'Photographer or source.' },
              },
              {
                name: 'isPublic',
                type: 'checkbox',
                label: 'Show publicly',
                defaultValue: true,
                admin: { width: '33%' },
              },
            ],
          },
        ],
      },
    ],
  },
]
