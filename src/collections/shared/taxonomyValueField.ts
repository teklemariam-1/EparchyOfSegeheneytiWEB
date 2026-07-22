import type { Field } from 'payload'

const VALUE_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** The machine-readable `value` field shared by taxonomy collections
 *  (news categories, event types). */
export function taxonomyValueField(description: string): Field {
  return {
    name: 'value',
    type: 'text',
    required: true,
    unique: true,
    index: true,
    validate: (val: unknown) =>
      (typeof val === 'string' && VALUE_RE.test(val)) ||
      "Use lowercase letters, numbers and hyphens only (e.g. 'social-ministry').",
    admin: { description },
  }
}
