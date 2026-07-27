import type { Field, FieldHook } from 'payload'
import { canField } from '../../../lib/permissions/access'
import { decrypt, encrypt, isEncrypted } from '../../../lib/crypto/fieldEncryption'

/**
 * Tab 7 — Internal. Never public.
 *
 * Protection is field-level `access`, not template omission. Payload evaluates
 * field read access before serialising, so a caller without `bishops.edit` gets
 * a response in which these keys are simply absent — REST, GraphQL and the
 * Local API alike. Leaving them out of the JSX instead would have left them
 * sitting in /api/bishops for anyone who looked.
 *
 * Private contact details are additionally encrypted at rest, so they are not
 * legible in a database dump or a backup. Unlike the donation account number
 * they are DECRYPTED on read rather than masked: a phone number nobody can read
 * is a phone number nobody can ring, and the field access check above has
 * already established that this caller is entitled to it.
 */

const internalAccess = {
  read: canField('bishops.edit'),
  create: canField('bishops.edit'),
  update: canField('bishops.edit'),
}

/** Encrypt on write, decrypt on read. Tolerates values stored before this existed. */
const encryptOnWrite: FieldHook = ({ value }) => {
  if (value == null || value === '') return value
  if (isEncrypted(value)) return value
  return encrypt(String(value))
}

const decryptOnRead: FieldHook = ({ value }) =>
  typeof value === 'string' && value ? decrypt(value) : value

const encryptedTextHooks = {
  beforeChange: [encryptOnWrite],
  afterRead: [decryptOnRead],
}

export const internalTab: Field[] = [
  {
    name: 'internalNotes',
    type: 'textarea',
    label: 'Internal notes',
    access: internalAccess,
    admin: {
      description:
        'Working notes for chancery staff — sources still to verify, dates awaiting confirmation. Never shown publicly and never sent to the website.',
    },
  },
  {
    name: 'privateContact',
    type: 'group',
    label: 'Private contact details',
    access: internalAccess,
    admin: { description: 'Encrypted at rest. Visible only to staff who can edit bishop records.' },
    fields: [
      {
        type: 'row',
        fields: [
          {
            name: 'phone',
            type: 'text',
            admin: { width: '50%' },
            hooks: encryptedTextHooks,
          },
          {
            name: 'email',
            type: 'text',
            admin: { width: '50%' },
            hooks: encryptedTextHooks,
          },
        ],
      },
      {
        name: 'assistant',
        type: 'text',
        admin: { description: 'Secretary or assistant to contact first.' },
      },
    ],
  },
  {
    name: 'internalAttachments',
    type: 'array',
    label: 'Internal attachments',
    access: internalAccess,
    admin: {
      initCollapsed: true,
      description:
        'Documents that must not be published. Upload them to Media with access level "Restricted" so the file itself is also protected — attaching a public file here still leaves it fetchable by its direct URL.',
    },
    fields: [
      { name: 'title', type: 'text', required: true },
      { name: 'file', type: 'upload', relationTo: 'media' },
      { name: 'note', type: 'textarea' },
    ],
  },
]
