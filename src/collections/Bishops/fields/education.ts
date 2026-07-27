import type { Field } from 'payload'

/**
 * Tab 4 — Education.
 *
 * Separate from both milestones and honours: a degree is neither an event in a
 * life story nor a distinction conferred, and staff filling in a CV think in
 * institutions and years rather than dates.
 *
 * Years are plain numbers, not dates — nobody records the day a licentiate
 * began, and a `date` column would invite the same invented 1 January that the
 * milestone precision control exists to prevent.
 */
export const educationTab: Field[] = [
  {
    name: 'education',
    type: 'array',
    label: 'Education',
    labels: { singular: 'Qualification', plural: 'Qualifications' },
    admin: {
      initCollapsed: true,
      description: 'Seminaries, universities, and academic qualifications, earliest first.',
      components: {
        RowLabel: '@/components/admin/bishops/RowLabels#EducationRowLabel',
      },
    },
    fields: [
      { name: 'institution', type: 'text', required: true, localized: true },
      {
        type: 'row',
        fields: [
          { name: 'location', type: 'text', localized: true, admin: { width: '50%' } },
          {
            name: 'fieldOfStudy',
            type: 'text',
            localized: true,
            admin: { width: '50%', description: 'e.g. Sacred Theology, Canon Law.' },
          },
        ],
      },
      {
        type: 'row',
        fields: [
          {
            name: 'degree',
            type: 'text',
            localized: true,
            admin: { width: '50%', description: 'Degree or qualification awarded, e.g. Licentiate in Sacred Theology.' },
          },
          {
            name: 'startYear',
            type: 'number',
            admin: { width: '25%', step: 1, placeholder: '1998' },
          },
          {
            name: 'endYear',
            type: 'number',
            admin: { width: '25%', step: 1, placeholder: '2002' },
          },
        ],
      },
      { name: 'thesisTitle', type: 'text', localized: true },
      { name: 'notes', type: 'textarea', localized: true },
      {
        name: 'isPublic',
        type: 'checkbox',
        label: 'Show on the public website',
        defaultValue: true,
      },
    ],
  },
]
