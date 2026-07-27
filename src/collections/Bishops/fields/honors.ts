import type { Field } from 'payload'
import { HONOR_CATEGORY_OPTIONS } from '../terminology'
import { datePrecisionFields, validateHttpUrl } from './shared'

/**
 * Tab 3 — Honours, awards & achievements.
 *
 * Kept apart from milestones on purpose. An honorary doctorate is not a step in
 * a life story; conflating the two produces a timeline where a medal sits
 * between an ordination and a pastoral assignment as though it were the same
 * kind of thing.
 */
export const honorsTab: Field[] = [
  {
    name: 'honors',
    type: 'array',
    label: 'Honours, awards & achievements',
    labels: { singular: 'Honour', plural: 'Honours' },
    admin: {
      initCollapsed: true,
      description: 'Ecclesiastical honours, academic degrees, civil awards, and formal recognitions.',
      components: {
        RowLabel: '@/components/admin/bishops/RowLabels#HonorRowLabel',
      },
    },
    fields: [
      {
        name: 'name',
        type: 'text',
        required: true,
        localized: true,
        label: 'Name of the honour or award',
      },
      {
        type: 'row',
        fields: [
          {
            name: 'category',
            type: 'select',
            options: HONOR_CATEGORY_OPTIONS,
            defaultValue: 'ecclesiastical',
            admin: { width: '50%' },
          },
          {
            name: 'awardingBody',
            type: 'text',
            localized: true,
            admin: { width: '50%', description: 'Who conferred it.' },
          },
        ],
      },
      datePrecisionFields({ name: 'date', label: 'Date conferred' }),
      { name: 'place', type: 'text', localized: true },
      { name: 'description', type: 'textarea', localized: true },
      {
        type: 'row',
        fields: [
          {
            name: 'certificate',
            type: 'upload',
            relationTo: 'media',
            admin: { width: '50%', description: 'Photograph or scan of the certificate, if we have one.' },
          },
          {
            name: 'publication',
            type: 'relationship',
            relationTo: 'publications',
            admin: { width: '50%', description: 'Or a catalogued document recording it.' },
          },
        ],
      },
      {
        type: 'row',
        fields: [
          {
            name: 'url',
            type: 'text',
            label: 'Link',
            validate: validateHttpUrl,
            admin: { width: '70%', description: 'Full web address, including https://' },
          },
          {
            name: 'isPublic',
            type: 'checkbox',
            label: 'Show publicly',
            defaultValue: true,
            admin: { width: '30%' },
          },
        ],
      },
    ],
  },
]
