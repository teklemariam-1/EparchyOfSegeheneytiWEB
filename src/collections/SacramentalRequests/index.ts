import type { CollectionConfig } from 'payload'
import { can, canField, hideUnless } from '../../lib/permissions/access'
import { notifyRequesterOnStatusChange } from './hooks/notify'

/**
 * Requests for a sacramental record — a baptism certificate, a confirmation
 * record, a certificate of freedom to marry.
 *
 * These used to arrive as free text on the contact form, under a "Sacramental
 * Request" subject line. That meant no required fields (so half of them had to
 * be chased for the parish or the parents' names), no status (so nothing showed
 * what was outstanding), and no record of what had been sent. This exists to
 * fix all three.
 *
 * ── Who asks, and why the fields look like this ──────────────────────────────
 * Typically a diaspora Eritrean marrying abroad, whose new diocese wants proof
 * of baptism from the home parish. They may not know the exact date, so
 * `approximateDate` is free text rather than a date picker — "around Easter
 * 1994" is a usable answer and a date field would force them to invent
 * precision. The parents' names are what actually lets a parish find the entry
 * in a handwritten register.
 *
 * ── Privacy ──────────────────────────────────────────────────────────────────
 * Every row is personal data about a named individual, often including their
 * parents. There is NO public read: unlike contact submissions, nothing here is
 * ever published. `read` requires a permission, and the public form writes
 * through a trusted server action rather than an anonymous REST create.
 */
export const SacramentalRequests: CollectionConfig = {
  slug: 'sacramental-requests',
  admin: {
    useAsTitle: 'subjectName',
    group: 'Administration',
    // Status first: the question staff open this list to answer is "what is
    // still outstanding", not "who wrote last".
    defaultColumns: ['status', 'sacrament', 'subjectName', 'parish', 'createdAt'],
    description:
      'Requests for baptism, confirmation and marriage records. "New" means nobody has picked it up yet. Contains personal data — never published.',
    listSearchableFields: ['subjectName', 'requesterName', 'requesterEmail', 'parish'],
    hidden: hideUnless('sacramental-requests.view'),
  },
  access: {
    read: can('sacramental-requests.view'),
    // No anonymous REST create: the public form goes through a server action
    // with overrideAccess, which closes the spam/DB-flood vector that an open
    // POST /api/sacramental-requests would leave.
    create: can('sacramental-requests.manage'),
    update: can('sacramental-requests.manage'),
    delete: can('sacramental-requests.delete'),
  },
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        if (operation === 'create') {
          // Server-controlled: a submitted form must not be able to arrive
          // pre-marked as "completed", nor backdate itself.
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
      // Staff-only. A public submission cannot set or move its own status.
      access: {
        create: canField('sacramental-requests.manage'),
        update: canField('sacramental-requests.manage'),
      },
      options: [
        { label: 'New', value: 'new' },
        { label: 'In progress', value: 'in-progress' },
        { label: 'Waiting on requester', value: 'waiting' },
        { label: 'Completed', value: 'completed' },
        { label: 'Unable to fulfil', value: 'declined' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Moving this to a new state emails the requester, except for internal states.',
      },
    },
    {
      name: 'sacrament',
      type: 'select',
      required: true,
      options: [
        { label: 'Baptism certificate', value: 'baptism' },
        { label: 'Confirmation (Chrismation) record', value: 'confirmation' },
        { label: 'First Communion record', value: 'first-communion' },
        { label: 'Marriage certificate', value: 'marriage' },
        { label: 'Certificate of freedom to marry', value: 'freedom-to-marry' },
        { label: 'Other', value: 'other' },
      ],
      admin: { position: 'sidebar' },
    },

    // ── Who the record is about ──────────────────────────────────────────────
    {
      name: 'subjectName',
      type: 'text',
      required: true,
      admin: { description: 'Full name of the person the record is about, as it would appear in the register.' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'parish',
          type: 'text',
          admin: {
            width: '50%',
            description: 'Parish where it took place, if known. A text field, not a picker — the parish may no longer exist under that name.',
          },
        },
        {
          name: 'approximateDate',
          type: 'text',
          admin: {
            width: '50%',
            description: 'Free text on purpose: "around Easter 1994" is a usable answer, and a date picker would force invented precision.',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'fatherName', type: 'text', admin: { width: '50%' } },
        { name: 'motherName', type: 'text', admin: { width: '50%' } },
      ],
    },

    // ── Who is asking ────────────────────────────────────────────────────────
    {
      type: 'row',
      fields: [
        { name: 'requesterName', type: 'text', required: true, admin: { width: '50%' } },
        { name: 'requesterEmail', type: 'email', required: true, admin: { width: '50%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'requesterPhone', type: 'text', admin: { width: '50%' } },
        {
          name: 'relationship',
          type: 'text',
          admin: { width: '50%', description: 'e.g. "myself", "my mother", "the parish of ..."' },
        },
      ],
    },
    {
      name: 'purpose',
      type: 'textarea',
      admin: { description: 'Why the record is needed — usually a marriage abroad. Helps the parish judge urgency.' },
    },

    // ── Staff-only ───────────────────────────────────────────────────────────
    {
      name: 'staffNotes',
      type: 'textarea',
      access: {
        read: canField('sacramental-requests.view'),
        create: canField('sacramental-requests.manage'),
        update: canField('sacramental-requests.manage'),
      },
      admin: { description: 'Internal. Never sent to the requester.' },
    },
    {
      name: 'submittedAt',
      type: 'date',
      access: {
        create: canField('sacramental-requests.manage'),
        update: canField('sacramental-requests.manage'),
      },
      admin: { position: 'sidebar', readOnly: true },
    },
  ],
  timestamps: true,
}
