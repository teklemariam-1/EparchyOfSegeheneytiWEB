import type { Field } from 'payload'
import { ASSOCIATED_ROLE_OPTIONS, MILESTONE_TYPE_OPTIONS } from '../terminology'
import { datePrecisionFields, documentsField, referenceLinksField } from './shared'

/**
 * Tab 2 — Life & ministry milestones. The core of the system.
 *
 * A repeatable array rather than fixed columns, because no fixed set of columns
 * covers a whole life: a man who spent four years teaching in Rome, was made
 * Protosyncellus, then led a synod delegation, needs three unlike rows. Adding
 * an unusual event must never require a schema change.
 *
 * Chronological ordering is computed at render time from `date` + precision (see
 * src/lib/bishops/timeline.ts) rather than stored, so a corrected date reorders
 * the timeline without staff having to renumber anything. `order` only breaks
 * ties between entries that share a date.
 */
export const milestonesTab: Field[] = [
  {
    name: 'milestones',
    type: 'array',
    label: 'Life & ministry milestones',
    labels: { singular: 'Milestone', plural: 'Milestones' },
    admin: {
      initCollapsed: true,
      description:
        'Everything from birth to the present, added as it happens. Order does not matter — the public timeline sorts by date. Only a type and a title are needed to save one.',
      components: {
        // Collapsed rows read "Milestone 01" by default, which is useless in a
        // list of forty. Show the entry's own title instead.
        RowLabel: '@/components/admin/bishops/RowLabels#MilestoneRowLabel',
      },
    },
    fields: [
      {
        type: 'row',
        fields: [
          {
            name: 'milestoneType',
            type: 'select',
            required: true,
            options: MILESTONE_TYPE_OPTIONS,
            defaultValue: 'pastoral-assignment',
            label: 'What kind of event is this?',
            admin: { width: '50%' },
          },
          {
            name: 'isPublic',
            type: 'checkbox',
            label: 'Show on the public website',
            defaultValue: true,
            admin: { width: '25%' },
          },
          {
            name: 'order',
            type: 'number',
            label: 'Manual order',
            admin: {
              width: '25%',
              description: 'Only used to order entries that share the same date. Leave blank otherwise.',
            },
          },
        ],
      },
      {
        name: 'title',
        type: 'text',
        required: true,
        localized: true,
        admin: { description: 'Short heading for the timeline, e.g. "Ordained to the priesthood".' },
      },
      datePrecisionFields({
        name: 'date',
        label: 'Date',
        description: 'When it happened, as precisely as it is actually known.',
      }),
      datePrecisionFields({
        name: 'endDate',
        label: 'End date',
        description: 'Only for something that spanned a period — an assignment, a course of study.',
        includeOngoing: true,
      }),
      {
        name: 'location',
        type: 'text',
        localized: true,
        admin: { description: 'Where it happened, in words. Add the parish or vicariate below if it is one of ours.' },
      },
      {
        type: 'row',
        fields: [
          { name: 'parish', type: 'relationship', relationTo: 'parishes', admin: { width: '50%' } },
          { name: 'vicariate', type: 'relationship', relationTo: 'vicariates', admin: { width: '50%' } },
        ],
      },
      {
        name: 'description',
        type: 'richText',
        localized: true,
        admin: { description: 'Optional fuller account. Ge\'ez script is given extra line spacing on the public page.' },
      },
      {
        name: 'people',
        type: 'array',
        label: 'People involved',
        admin: {
          initCollapsed: true,
          description:
            'Principal consecrator, co-consecrators, the ordaining bishop, the Pontiff who appointed him. Pick from our clergy list where the person is in it, otherwise just type the name.',
        },
        fields: [
          {
            type: 'row',
            fields: [
              {
                name: 'role',
                type: 'select',
                options: ASSOCIATED_ROLE_OPTIONS,
                defaultValue: 'other',
                admin: { width: '50%' },
              },
              {
                name: 'priest',
                type: 'relationship',
                relationTo: 'priests',
                admin: { width: '50%', description: 'If he is in our clergy records.' },
              },
            ],
          },
          {
            name: 'name',
            type: 'text',
            localized: true,
            admin: {
              description: 'Name as written — use this for anyone not in our clergy records, such as a Roman Pontiff.',
            },
          },
        ],
      },
      {
        name: 'photos',
        type: 'upload',
        relationTo: 'media',
        hasMany: true,
        admin: { description: 'A few photos shown inline with this milestone.' },
      },
      {
        name: 'galleryKey',
        type: 'text',
        label: 'Linked gallery',
        admin: {
          description:
            'To link this milestone to a full gallery, type that gallery\'s Key exactly as it appears on the Galleries tab (e.g. "episcopal-consecration-2024"). Saving fails with a clear message if it does not match one.',
        },
      },
      documentsField('Decrees, letters, or programmes connected to this event.'),
      referenceLinksField('Announcements, news coverage, or video of this event.'),
    ],
  },
]
