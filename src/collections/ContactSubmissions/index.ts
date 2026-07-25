import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'
import { can, canField, hideUnless } from '../../lib/permissions/access'
import { hasPermission, type AuthUser } from '../../lib/permissions/resolve'
import { safeRevalidatePath, safeRevalidateTag } from '../../lib/payload/revalidate'

/**
 * Lexical stores an empty editor as a root with a single empty paragraph, so a
 * plain truthiness check would treat "untouched" as "answered".
 */
function isEmptyRichText(value: unknown): boolean {
  if (!value || typeof value !== 'object') return true
  const children = (value as any)?.root?.children
  if (!Array.isArray(children) || children.length === 0) return true
  return !children.some((node: any) => {
    if (typeof node?.text === 'string' && node.text.trim()) return true
    return Array.isArray(node?.children) && node.children.some((c: any) => String(c?.text ?? '').trim())
  })
}

export const ContactSubmissions: CollectionConfig = {
  slug: 'contact-submissions',
  admin: {
    useAsTitle: 'subject',
    group: 'Administration',
    // status first so unread ("New") messages are the first thing scanned.
    defaultColumns: ['status', 'subject', 'name', 'email', 'createdAt'],
    description:
      'Messages submitted via the public contact form. "New" means nobody has opened it yet. A message can optionally be answered and published anonymously as a public Q&A.',
    listSearchableFields: ['name', 'email', 'subject', 'message'],
    hidden: hideUnless('contact-submissions.view'),
  },
  access: {
    read: can('contact-submissions.view'),
    // No public REST create — the website form submits through a trusted server
    // action (overrideAccess), so the anonymous /api/contact-submissions POST
    // vector (spam/DB-flood) is closed entirely. Staff can still create in-admin.
    create: can('contact-submissions.manage'),
    update: can('contact-submissions.manage'),
    delete: can('contact-submissions.delete'),
  },
  hooks: {
    beforeChange: [
      ({ data, operation, req }) => {
        if (operation === 'create') {
          // Server-controlled fields — never trust client input for these.
          data.submittedAt = new Date().toISOString()
          data.status = 'new'
        }

        // Publishing gate. Ticking "Publish publicly" without a rewritten
        // question would fall back to nothing to display; without an answer it
        // would put someone's question on the site with no reply. Both would be
        // a privacy failure rather than a cosmetic one, so refuse the write.
        if (data?.publicQA?.isPublic) {
          if (!hasPermission(req.user as AuthUser | null, 'contact-submissions.publish-qa')) {
            throw new APIError('You do not have permission to publish a public Q&A.', 403)
          }
          const q = String(data.publicQA.publicQuestion ?? '').trim()
          if (!q) {
            throw new APIError(
              'To publish publicly you must first write the public version of the question, with identifying details removed.',
              400,
            )
          }
          if (isEmptyRichText(data.publicQA.answer)) {
            throw new APIError(
              'To publish publicly you must first write the official answer.',
              400,
            )
          }
          if (!data.publicQA.publishedAt) {
            data.publicQA.publishedAt = new Date().toISOString()
          }
        }

        return data
      },
    ],
    // The contact page is cached; without this a newly published Q&A would not
    // appear until the next deploy or cache expiry.
    afterChange: [
      () => {
        safeRevalidateTag('contact-qa')
        safeRevalidatePath('/contact')
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      type: 'row',
      fields: [
        { name: 'email', type: 'email', required: true },
        { name: 'phone', type: 'text' },
      ],
    },
    {
      name: 'subject',
      type: 'text',
      required: true,
    },
    {
      name: 'message',
      type: 'textarea',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'new',
      // Only staff may set/change status — a public form submission cannot.
      access: { create: canField('contact-submissions.manage'), update: canField('contact-submissions.manage') },
      options: [
        { label: 'New', value: 'new' },
        { label: 'Read', value: 'read' },
        { label: 'Replied', value: 'replied' },
        { label: 'Archived', value: 'archived' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'submittedAt',
      type: 'date',
      // Server-stamped in beforeChange; never writable via the public API.
      access: { create: canField('contact-submissions.manage'), update: canField('contact-submissions.manage') },
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Timestamp when this message was submitted.',
      },
    },
    {
      /**
       * Public Q&A.
       *
       * A submission is private until a member of staff deliberately opts it in
       * here. Two rules are load-bearing:
       *
       *  - The public page renders `publicQuestion`, never the raw `message`.
       *    People write to a diocese about annulments, money and family crises;
       *    staff must be able to strip identifying detail before anything is
       *    published, and republishing the original verbatim would defeat that.
       *  - The sender's name, email and phone are never exposed. Questions
       *    appear anonymously.
       */
      name: 'publicQA',
      type: 'group',
      label: 'Public Q&A',
      access: { create: canField('contact-submissions.manage'), update: canField('contact-submissions.manage') },
      admin: {
        description:
          'Optionally publish this question and its answer anonymously on the public contact page. Nothing is published unless "Publish publicly" is ticked.',
      },
      fields: [
        {
          name: 'isPublic',
          type: 'checkbox',
          defaultValue: false,
          label: 'Publish publicly',
          admin: {
            description:
              'Requires a public question and an answer. The sender is never named.',
          },
        },
        {
          name: 'publicQuestion',
          type: 'textarea',
          localized: true,
          label: 'Public version of the question',
          admin: {
            description:
              'Rewrite the question with any identifying details removed. This is what visitors see — the original message is never shown.',
          },
        },
        {
          name: 'answer',
          type: 'richText',
          localized: true,
          label: 'Official answer',
          admin: { description: 'Only staff can answer; visitors cannot reply.' },
        },
        {
          name: 'publishedAt',
          type: 'date',
          admin: {
            readOnly: true,
            description: 'Stamped automatically when first published.',
          },
        },
      ],
    },
    {
      name: 'adminNotes',
      type: 'textarea',
      // Internal-only — must not be settable by the public submitter.
      access: { create: canField('contact-submissions.manage'), update: canField('contact-submissions.manage'), read: canField('contact-submissions.manage') },
      admin: {
        description: 'Internal notes (not visible to submitter).',
      },
    },
  ],
  timestamps: true,
}
