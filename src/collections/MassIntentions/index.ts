import type { CollectionConfig } from 'payload'
import { can, canField, hideUnless } from '../../lib/permissions/access'
import { notifyRequesterOnStatusChange } from './hooks/notify'

/**
 * Mass intention requests — "please offer a Mass for …".
 *
 * The classic diaspora act: someone in Frankfurt or Toronto cannot be at the
 * graveside for a parent's anniversary, so they ask that a Mass be offered at
 * home. Until now that arrived, if at all, as contact-form free text with no
 * way to answer the only question the requester has: WHEN will it be offered?
 *
 * The workflow exists to answer that question. Staff move a request to
 * `scheduled` and set the date; the requester is emailed the date; after the
 * celebration it is marked `celebrated`. The record is the parish's Mass-book
 * entry and the family's answer, in one place.
 *
 * ── Offerings ────────────────────────────────────────────────────────────────
 * A stipend customarily accompanies an intention, but this collection stays
 * deliberately uncoupled from Donations: the success screen points to /donate
 * with the request reference, and reconciliation stays human. Wiring payment
 * INTO the request would make "we could not offer it" into a refund workflow —
 * complexity the chancery does not need.
 *
 * ── Privacy ──────────────────────────────────────────────────────────────────
 * Rows name the dead and the sick. No public read exists; the form writes
 * through a trusted server action, same as sacramental requests.
 */
export const MassIntentions: CollectionConfig = {
  slug: 'mass-intentions',
  admin: {
    useAsTitle: 'forWhom',
    group: 'Administration',
    // The question staff open this list for: what is not yet scheduled?
    defaultColumns: ['status', 'intentionType', 'forWhom', 'scheduledFor', 'createdAt'],
    description:
      'Requests for Masses to be offered. "New" means not yet scheduled. Contains personal data — never published.',
    listSearchableFields: ['forWhom', 'requesterName', 'requesterEmail', 'parish'],
    hidden: hideUnless('mass-intentions.view'),
  },
  access: {
    read: can('mass-intentions.view'),
    // No anonymous REST create — the public form goes through a server action.
    create: can('mass-intentions.manage'),
    update: can('mass-intentions.manage'),
    delete: can('mass-intentions.delete'),
  },
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        if (operation === 'create') {
          // Server-controlled: a submission cannot arrive pre-scheduled.
          data.submittedAt = new Date().toISOString()
          data.status = 'new'
        }
        return data
      },
    ],
    afterChange: [notifyRequesterOnStatusChange],
  },
  fields: [
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'new',
      access: {
        create: canField('mass-intentions.manage'),
        update: canField('mass-intentions.manage'),
      },
      options: [
        { label: 'New', value: 'new' },
        { label: 'Scheduled', value: 'scheduled' },
        { label: 'Celebrated', value: 'celebrated' },
        { label: 'Unable to offer', value: 'declined' },
      ],
      admin: {
        position: 'sidebar',
        description:
          'Moving to "Scheduled" emails the requester the date below — set the date FIRST, then the status.',
      },
    },
    {
      name: 'scheduledFor',
      type: 'date',
      access: {
        create: canField('mass-intentions.manage'),
        update: canField('mass-intentions.manage'),
      },
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayOnly' },
        description: 'The date the Mass will be (or was) offered. Included in the email to the requester.',
      },
    },
    {
      name: 'intentionType',
      type: 'select',
      required: true,
      options: [
        { label: 'Repose of the soul (deceased)', value: 'repose' },
        { label: 'Anniversary of death', value: 'anniversary' },
        { label: 'Healing / the sick', value: 'healing' },
        { label: 'Thanksgiving', value: 'thanksgiving' },
        { label: 'Special intention', value: 'special' },
      ],
      admin: { position: 'sidebar' },
    },

    // ── The intention ────────────────────────────────────────────────────────
    {
      name: 'forWhom',
      type: 'text',
      required: true,
      admin: { description: 'Who the Mass is for — a name, or "the souls of the faithful departed".' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'parish',
          type: 'text',
          admin: {
            width: '50%',
            description: 'Where they would like it offered, if they have a preference. Free text — coordination happens by email.',
          },
        },
        {
          name: 'preferredDate',
          type: 'text',
          admin: {
            width: '50%',
            description: 'Free text on purpose: "the Sunday nearest 12 March" and "40th day" are real answers a date picker cannot hold.',
          },
        },
      ],
    },
    {
      name: 'details',
      type: 'textarea',
      admin: { description: 'Anything else the requester said about the intention.' },
    },

    // ── Who is asking ────────────────────────────────────────────────────────
    {
      type: 'row',
      fields: [
        { name: 'requesterName', type: 'text', required: true, admin: { width: '50%' } },
        { name: 'requesterEmail', type: 'email', required: true, admin: { width: '50%' } },
      ],
    },
    { name: 'requesterPhone', type: 'text', admin: { width: '50%' } },

    // ── Staff-only ───────────────────────────────────────────────────────────
    {
      name: 'staffNotes',
      type: 'textarea',
      access: {
        read: canField('mass-intentions.view'),
        create: canField('mass-intentions.manage'),
        update: canField('mass-intentions.manage'),
      },
      admin: { description: 'Internal. Never sent to the requester.' },
    },
    {
      name: 'submittedAt',
      type: 'date',
      access: {
        create: canField('mass-intentions.manage'),
        update: canField('mass-intentions.manage'),
      },
      admin: { position: 'sidebar', readOnly: true },
    },
  ],
  timestamps: true,
}
