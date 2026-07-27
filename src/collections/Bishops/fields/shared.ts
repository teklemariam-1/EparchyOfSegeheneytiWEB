import type { Field } from 'payload'
import {
  DATE_PRECISION_OPTIONS,
  DOCUMENT_TYPE_OPTIONS,
  LINK_TYPE_OPTIONS,
} from '../terminology'

/**
 * Field factories shared between the bishop record and its milestones.
 *
 * Reference links and documents attach at both levels (Part C), and a date is
 * never stored without its precision — defining each once keeps the two levels
 * from drifting apart as the schema grows.
 */

/**
 * Accepts only absolute http(s) URLs.
 *
 * Stored exactly as entered (never normalised) so a staff member can see what
 * they typed; the renderer is what adds rel="noopener noreferrer". A bare
 * "vatican.va" is rejected rather than silently prefixed, because guessing the
 * scheme is how a link ends up pointing at the wrong host.
 */
export function validateHttpUrl(value: unknown): true | string {
  if (value === null || value === undefined || value === '') return true
  if (typeof value !== 'string') return 'Enter a web address.'
  let parsed: URL
  try {
    parsed = new URL(value.trim())
  } catch {
    return 'Enter a full web address including https:// — for example https://www.vatican.va/…'
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return 'Only http:// and https:// addresses are allowed.'
  }
  return true
}

/**
 * A date plus how precisely it is known.
 *
 * `date` always holds a real timestamp because Postgres has nowhere to put "no
 * day"; `precision` records how much of it staff actually vouched for, and the
 * formatter (src/lib/bishops/timeline.ts) renders only that much. So an entry
 * captured as "circa 1998" displays as "circa 1998" and never as 1 Jan 1998.
 */
export function datePrecisionFields(opts: {
  name?: string
  label: string
  description?: string
  required?: boolean
  includeOngoing?: boolean
}): Field {
  const name = opts.name ?? 'date'
  return {
    type: 'row',
    fields: [
      {
        name,
        type: 'date',
        label: opts.label,
        required: opts.required ?? false,
        admin: {
          width: '60%',
          description: opts.description,
          date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMM yyyy' },
        },
      },
      {
        name: `${name}Precision`,
        type: 'select',
        label: 'How exact is this date?',
        defaultValue: 'exact',
        options: opts.includeOngoing
          ? DATE_PRECISION_OPTIONS
          : DATE_PRECISION_OPTIONS.filter((o) => o.value !== 'ongoing'),
        admin: {
          width: '40%',
          description:
            'Choose "Year only" or "Approximate" rather than inventing a day you are not sure of.',
        },
      },
    ],
  }
}

/**
 * Repeatable external reference links (Part C). Used on the bishop record and
 * on each milestone.
 *
 * `lastCheckedAt` is recorded by staff, not by a crawler — it exists so a dead
 * link can be spotted during a review pass. An automated link-health check is a
 * reasonable follow-up but is deliberately not built here.
 */
export function referenceLinksField(description: string): Field {
  return {
    name: 'links',
    type: 'array',
    label: 'Reference links',
    admin: { description, initCollapsed: true },
    fields: [
      {
        name: 'url',
        type: 'text',
        required: true,
        validate: validateHttpUrl,
        admin: { description: 'Full web address, including https://' },
      },
      { name: 'label', type: 'text', required: true, localized: true },
      {
        type: 'row',
        fields: [
          {
            name: 'linkType',
            type: 'select',
            options: LINK_TYPE_OPTIONS,
            defaultValue: 'other',
            admin: { width: '50%' },
          },
          {
            name: 'sourceName',
            type: 'text',
            admin: { width: '50%', description: 'Publication or site name, e.g. "Vatican News".' },
          },
        ],
      },
      {
        type: 'row',
        fields: [
          { name: 'date', type: 'date', label: 'Date of the source', admin: { width: '50%' } },
          {
            name: 'lastCheckedAt',
            type: 'date',
            label: 'Link last checked',
            admin: { width: '50%', description: 'Set when you last confirmed this link still works.' },
          },
        ],
      },
      {
        name: 'isPublic',
        type: 'checkbox',
        label: 'Show on the public website',
        defaultValue: true,
      },
    ],
  }
}

/**
 * Repeatable document attachments. Documents live in `publications` when they
 * are catalogued works and in `media` when they are a plain file, so both are
 * offered rather than forcing staff to pick the wrong home for a scan.
 */
export function documentsField(description: string): Field {
  return {
    name: 'documents',
    type: 'array',
    label: 'Documents',
    admin: { description, initCollapsed: true },
    fields: [
      { name: 'title', type: 'text', required: true, localized: true },
      {
        type: 'row',
        fields: [
          {
            name: 'documentType',
            type: 'select',
            options: DOCUMENT_TYPE_OPTIONS,
            defaultValue: 'other',
            admin: { width: '50%' },
          },
          { name: 'date', type: 'date', admin: { width: '50%' } },
        ],
      },
      {
        name: 'publication',
        type: 'relationship',
        relationTo: 'publications',
        admin: { description: 'Link to a catalogued publication, if this document is one.' },
      },
      {
        name: 'file',
        type: 'upload',
        relationTo: 'media',
        admin: { description: 'Or attach the file directly (PDF, scan).' },
      },
      {
        name: 'isPublic',
        type: 'checkbox',
        label: 'Show on the public website',
        defaultValue: true,
      },
    ],
  }
}
