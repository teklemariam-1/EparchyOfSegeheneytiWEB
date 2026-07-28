import type { Field } from 'payload'
import { slugFieldHook } from '../../../lib/payload/slugField'
import { HONORIFIC_OPTIONS } from '../terminology'
import { datePrecisionFields } from './shared'

/**
 * Tab 1 — Identity.
 *
 * The only tab with required fields: a record must be nameable to be saved.
 * Everything else across the other tabs is optional so a draft can be opened
 * the day an appointment is announced and filled in over the following years.
 */
export const identityTab: Field[] = [
  {
    name: 'fullName',
    type: 'text',
    required: true,
    localized: true,
    label: 'Full name',
    admin: {
      description:
        'The name as it should appear publicly, including the honorific — e.g. "Abune …". Enter the Tigrinya form on the ትግርኛ tab.',
    },
  },
  {
    name: 'slug',
    type: 'text',
    required: true,
    unique: true,
    index: true,
    hooks: { beforeValidate: [slugFieldHook(['fullName', 'episcopalName'])] },
    admin: {
      position: 'sidebar',
      description:
        'Web address for this profile. Generated from the English name; a Tigrinya-only name produces nothing, so type one in Latin letters.',
    },
  },
  {
    type: 'row',
    fields: [
      {
        name: 'honorific',
        type: 'select',
        options: HONORIFIC_OPTIONS,
        defaultValue: 'abune',
        admin: {
          width: '50%',
          description: 'How he is formally addressed. "Abune" is the Ge\'ez-rite form.',
        },
      },
      {
        name: 'episcopalName',
        type: 'text',
        localized: true,
        admin: {
          width: '50%',
          description: 'The name taken at episcopal consecration, if different from his birth name.',
        },
      },
    ],
  },
  {
    name: 'formalTitle',
    type: 'text',
    localized: true,
    admin: {
      description:
        'Full formal title, e.g. "Eparch of the Catholic Eparchy of Segheneyti". Shown under his name on every public page.',
    },
  },
  {
    type: 'collapsible',
    label: 'Other names',
    admin: { initCollapsed: true, description: 'Optional — useful for archival and genealogical records.' },
    fields: [
      {
        type: 'row',
        fields: [
          { name: 'baptismalName', type: 'text', localized: true, admin: { width: '33%' } },
          { name: 'familyName', type: 'text', localized: true, admin: { width: '33%' } },
          {
            name: 'nameInReligion',
            type: 'text',
            localized: true,
            admin: {
              width: '34%',
              description: 'The name taken on religious profession, for members of an order.',
            },
          },
        ],
      },
    ],
  },
  {
    type: 'row',
    fields: [
      {
        name: 'portrait',
        type: 'upload',
        relationTo: 'media',
        admin: {
          width: '50%',
          description: 'Official portrait. Add alt text on the media record — it is read aloud by screen readers.',
        },
      },
      {
        name: 'coatOfArms',
        type: 'upload',
        relationTo: 'media',
        label: 'Coat of arms',
        admin: { width: '50%', description: 'His episcopal coat of arms, if one has been granted.' },
      },
    ],
  },
  {
    type: 'collapsible',
    label: 'Episcopal motto',
    admin: { initCollapsed: true },
    fields: [
      {
        name: 'motto',
        type: 'text',
        localized: true,
        admin: { description: 'The motto as it should read to visitors, in each language.' },
      },
      {
        name: 'mottoOriginal',
        type: 'text',
        admin: {
          description:
            'The motto in its original language (Latin or Ge\'ez), if it was chosen in one. Not translated — shown as written.',
        },
      },
      {
        name: 'mottoNote',
        type: 'textarea',
        localized: true,
        admin: { description: 'Optional note on the translation or the scriptural source.' },
      },
    ],
  },
  {
    type: 'collapsible',
    label: 'Birth',
    admin: { initCollapsed: false },
    fields: [
      datePrecisionFields({
        name: 'dateOfBirth',
        label: 'Date of birth',
        description: 'Leave blank if unknown.',
      }),
      { name: 'placeOfBirth', type: 'text', localized: true },
    ],
  },
  {
    type: 'collapsible',
    label: 'Death',
    admin: {
      initCollapsed: true,
      description: 'Complete only for a deceased Eparch.',
    },
    fields: [
      datePrecisionFields({ name: 'dateOfDeath', label: 'Date of death' }),
      { name: 'placeOfDeath', type: 'text', localized: true },
    ],
  },
  {
    type: 'row',
    fields: [
      {
        name: 'nationality',
        type: 'text',
        localized: true,
        defaultValue: 'Eritrean',
        admin: { width: '34%' },
      },
      {
        name: 'homeParish',
        type: 'relationship',
        relationTo: 'parishes',
        admin: {
          width: '33%',
          description: 'The parish he comes from. Pick from the list rather than typing it.',
        },
      },
      {
        name: 'homeVicariate',
        type: 'relationship',
        relationTo: 'vicariates',
        admin: { width: '33%' },
      },
    ],
  },
]
