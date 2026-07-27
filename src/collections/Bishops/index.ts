import type { CollectionConfig } from 'payload'
import { safeRevalidatePath, safeRevalidateTag } from '../../lib/payload/revalidate'
import { isPublishedOrAuthenticated } from '../../lib/permissions/readAccess'
import { can, canField, hideUnless, requirePublishPermission } from '../../lib/permissions/access'
import { identityTab } from './fields/identity'
import { milestonesTab } from './fields/milestones'
import { honorsTab } from './fields/honors'
import { educationTab } from './fields/education'
import { ministryTab } from './fields/ministry'
import { biographyTab } from './fields/biography'
import { galleriesTab } from './fields/galleries'
import { sourcesTab } from './fields/sources'
import { internalTab } from './fields/internal'
import {
  auditAndRevalidateActivation,
  deactivateIncumbent,
  requireSetActivePermission,
  revalidateBishopSurfaces,
} from './hooks/activation'
import { validateGalleryKeys } from './hooks/validateGalleryKeys'
import { stripNonPublicEntries } from './hooks/stripNonPublic'

/**
 * The Eparchs of Segeneyti — a living biographical record, not a one-time
 * biography. While an Eparch is serving, staff keep adding milestones, photos
 * and achievements as they happen.
 *
 * Built so that a future Eparch, or a predecessor added later for the
 * historical record, needs no code change: every ecclesiastical term is a
 * stable slug translated at render time (see ./terminology), and every section
 * that could grow is an array rather than a fixed column.
 *
 * Ge'ez-Rite terminology throughout — eparchy not diocese, eparch not bishop,
 * enthronement not installation. Segeneyti is one of the four eparchies of the
 * Eritrean Catholic Church, whose metropolitan see is Asmara.
 *
 * The admin form is tabbed because a single flat form of this size is unusable
 * for the chancery staff who maintain it. Only Identity has required fields, so
 * a record can be opened the day an appointment is announced and completed over
 * the years that follow.
 */
export const Bishops: CollectionConfig = {
  slug: 'bishops',
  admin: {
    hidden: hideUnless('bishops.view', 'bishops.create', 'bishops.edit', 'bishops.delete'),
    useAsTitle: 'fullName',
    group: 'Magisterium',
    defaultColumns: ['_status', 'fullName', 'isActive', 'termStart', 'termEnd'],
    description:
      'Biographical records of the Eparchs of Segeneyti — life, ministry, honours, galleries and sources.',
    preview: (doc) =>
      `${(process.env.NEXT_PUBLIC_SITE_URL ?? '').trim()}/eparchs/${(doc as { slug?: string }).slug ?? ''}`,
  },
  // Drafts so a record can be prepared privately before an appointment is
  // announced. Anonymous reads are constrained to published documents by
  // isPublishedOrAuthenticated, so ?draft=true cannot expose one.
  versions: { drafts: true },
  access: {
    read: isPublishedOrAuthenticated,
    create: can('bishops.create'),
    update: can('bishops.edit'),
    delete: can('bishops.delete'),
  },
  hooks: {
    beforeValidate: [validateGalleryKeys],
    // Strips isPublic:false array entries for anonymous callers, so a withheld
    // milestone is absent from the API response and not merely unrendered.
    afterRead: [stripNonPublicEntries],
    beforeChange: [
      requirePublishPermission('bishops.publish'),
      requireSetActivePermission,
      deactivateIncumbent,
    ],
    afterChange: [
      auditAndRevalidateActivation,
      ({ doc }) => {
        // Ordinary edits: the profile and any surface that quotes him.
        safeRevalidateTag('bishops')
        safeRevalidatePath(`/eparchs/${(doc as { slug?: string }).slug ?? ''}`)
        safeRevalidatePath('/bishop')
        safeRevalidatePath('/eparchs')
        return doc
      },
    ],
    afterDelete: [
      ({ doc }) => {
        revalidateBishopSurfaces((doc as { slug?: string }).slug)
        return doc
      },
    ],
  },
  fields: [
    /**
     * Sidebar — the two flags that decide what the rest of the site shows.
     *
     * `isActive` is additionally backed by a partial unique index in Postgres
     * and by the `bishops.set_active` permission; see hooks/activation.ts.
     */
    {
      name: 'isActive',
      type: 'checkbox',
      label: 'Sitting Eparch',
      defaultValue: false,
      index: true,
      access: {
        // Reading the flag is public — the website needs it. Setting it is
        // gated in the hook, which can distinguish activation from an ordinary
        // save; field access cannot see the transition.
        update: canField('bishops.set_active'),
        create: canField('bishops.set_active'),
      },
      admin: {
        position: 'sidebar',
        description:
          'Ticking this makes him the Eparch shown across the whole website and automatically stands the previous one down. Only a super-admin can change it.',
      },
    },
    {
      /**
       * A `ui` field rather than an edit-view slot: it renders inside the form,
       * where it can read live form state, so the picture updates as staff type
       * instead of only after a save.
       */
      name: 'completeness',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/admin/bishops/CompletenessIndicator#CompletenessIndicator',
        },
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Identity',
          description: 'Who he is. The only tab that must be filled in to save.',
          fields: identityTab,
        },
        {
          label: 'Life & ministry',
          description: 'His life from birth onward, added to as things happen.',
          fields: [
            ...milestonesTab,
            {
              // Chronology as visitors will see it, without leaving the editor —
              // the only practical way to catch a mistyped year among forty
              // entries that are stored in entry order, not date order.
              name: 'timelinePreview',
              type: 'ui',
              admin: {
                components: {
                  Field: '@/components/admin/bishops/TimelinePreview#TimelinePreview',
                },
              },
            },
          ],
        },
        {
          label: 'Honours',
          description: 'Awards, degrees and recognitions — kept apart from the life story.',
          fields: honorsTab,
        },
        {
          label: 'Education',
          description: 'Seminaries, universities and qualifications.',
          fields: educationTab,
        },
        {
          label: 'Ministry & tenure',
          description: 'Term of office, appointment, succession, and related content.',
          fields: ministryTab,
        },
        {
          label: 'Biography',
          description: 'The written account, in both languages.',
          fields: biographyTab,
        },
        {
          label: 'Galleries',
          description: 'Photographs, grouped by occasion.',
          fields: galleriesTab,
        },
        {
          label: 'Sources',
          description: 'Reference links and documents for the record as a whole.',
          fields: sourcesTab,
        },
        {
          label: 'Internal',
          description: 'Staff-only. Never published, never sent to the website.',
          fields: internalTab,
        },
      ],
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
