import type { Field } from 'payload'
import {
  APPOINTING_AUTHORITY_OPTIONS,
  INITIATIVE_STATUS_OPTIONS,
  TERM_END_REASON_OPTIONS,
} from '../terminology'

/**
 * Tab 5 — Ministry & tenure.
 *
 * Two things worth explaining:
 *
 * 1. Appointment. Eritrea's is a Metropolitan Church sui iuris (metropolitan
 *    see: Asmara; Segeneyti is one of its four eparchies), so its eparchs are
 *    appointed by the Roman Pontiff with the Council of Hierarchs proposing
 *    candidates. There is no patriarchal election to model.
 *
 * 2. Apostolic succession. Recorded here as a named principal consecrator, not
 *    as a traversable graph. A full lineage would have to walk consecrators who
 *    are not and never will be in our database, so it would be a chain of free
 *    text pretending to be a relationship. The consecration milestone already
 *    carries the same fact with its `people` entries.
 */
export const ministryTab: Field[] = [
  {
    type: 'collapsible',
    label: 'Term of office',
    admin: { initCollapsed: false },
    fields: [
      {
        type: 'row',
        fields: [
          {
            name: 'termStart',
            type: 'date',
            label: 'Term began',
            admin: { width: '33%', description: 'Usually the date of enthronement.' },
          },
          {
            name: 'termEnd',
            type: 'date',
            label: 'Term ended',
            admin: { width: '33%', description: 'Leave blank while he is serving.' },
          },
          {
            name: 'termEndReason',
            type: 'select',
            options: TERM_END_REASON_OPTIONS,
            admin: {
              width: '34%',
              condition: (_, sibling) => Boolean(sibling?.termEnd),
            },
          },
        ],
      },
    ],
  },
  {
    type: 'collapsible',
    label: 'Appointment',
    admin: { initCollapsed: false },
    fields: [
      {
        type: 'row',
        fields: [
          {
            name: 'appointingAuthority',
            type: 'select',
            options: APPOINTING_AUTHORITY_OPTIONS,
            defaultValue: 'roman-pontiff',
            admin: {
              width: '50%',
              description:
                'Eparchs of a Metropolitan Church sui iuris are appointed by the Roman Pontiff; the Council of Hierarchs proposes candidates.',
            },
          },
          {
            name: 'appointingAuthorityName',
            type: 'text',
            localized: true,
            admin: { width: '50%', description: 'The person by name, e.g. "Pope Francis".' },
          },
        ],
      },
      { name: 'appointmentDate', type: 'date', label: 'Date of appointment' },
    ],
  },
  {
    name: 'previousAppointments',
    type: 'array',
    label: 'Previous appointments',
    admin: {
      initCollapsed: true,
      description: 'Offices held before Segeneyti — including another see, if he was transferred here.',
    },
    fields: [
      { name: 'title', type: 'text', required: true, localized: true },
      {
        type: 'row',
        fields: [
          { name: 'place', type: 'text', localized: true, admin: { width: '50%' } },
          { name: 'startYear', type: 'number', admin: { width: '25%', step: 1 } },
          { name: 'endYear', type: 'number', admin: { width: '25%', step: 1 } },
        ],
      },
      { name: 'notes', type: 'textarea', localized: true },
    ],
  },
  {
    type: 'collapsible',
    label: 'Succession',
    admin: { initCollapsed: true },
    fields: [
      {
        type: 'row',
        fields: [
          {
            name: 'predecessor',
            type: 'relationship',
            relationTo: 'bishops',
            admin: { width: '50%', description: 'The Eparch before him, once that record exists.' },
          },
          {
            name: 'successor',
            type: 'relationship',
            relationTo: 'bishops',
            admin: { width: '50%' },
          },
        ],
      },
      {
        type: 'row',
        fields: [
          {
            name: 'principalConsecrator',
            type: 'relationship',
            relationTo: 'priests',
            admin: { width: '50%', description: 'If he is in our clergy records.' },
          },
          {
            name: 'principalConsecratorName',
            type: 'text',
            localized: true,
            admin: { width: '50%', description: 'Otherwise his name as written.' },
          },
        ],
      },
    ],
  },
  {
    name: 'pastoralPriorities',
    type: 'array',
    label: 'Pastoral priorities & initiatives',
    admin: {
      initCollapsed: true,
      description: 'What his ministry is focused on — catechesis, seminary formation, diaspora care, and so on.',
    },
    fields: [
      { name: 'title', type: 'text', required: true, localized: true },
      { name: 'description', type: 'textarea', localized: true },
      {
        type: 'row',
        fields: [
          {
            name: 'status',
            type: 'select',
            options: INITIATIVE_STATUS_OPTIONS,
            defaultValue: 'ongoing',
            admin: { width: '34%' },
          },
          { name: 'startDate', type: 'date', admin: { width: '33%' } },
          { name: 'endDate', type: 'date', admin: { width: '33%' } },
        ],
      },
      {
        name: 'isPublic',
        type: 'checkbox',
        label: 'Show on the public website',
        defaultValue: true,
      },
    ],
  },
  {
    type: 'collapsible',
    label: 'Related content',
    admin: {
      initCollapsed: true,
      description:
        'Anything linked here appears automatically on his public page — no need to re-enter letters or coverage that already exist elsewhere in the site.',
    },
    fields: [
      {
        name: 'relatedMessages',
        type: 'relationship',
        relationTo: 'bishop-messages',
        hasMany: true,
        admin: { description: 'His pastoral letters and homilies.' },
      },
      { name: 'relatedPublications', type: 'relationship', relationTo: 'publications', hasMany: true },
      { name: 'relatedNews', type: 'relationship', relationTo: 'news', hasMany: true },
      { name: 'relatedEvents', type: 'relationship', relationTo: 'events', hasMany: true },
    ],
  },
]
