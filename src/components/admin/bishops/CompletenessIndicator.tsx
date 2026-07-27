'use client'

import { useAllFormFields } from '@payloadcms/ui'

/**
 * Shows which sections of a bishop record are filled in and which are still
 * empty.
 *
 * A record here grows over years — opened the day an appointment is announced,
 * still gaining milestones a decade later. Without this, finding what is
 * missing means opening nine tabs and reading them. It reads live form state,
 * so ticks appear as staff type rather than only after a save.
 *
 * Deliberately not a progress bar with a percentage: there is no "complete"
 * bishop, and a number implies staff are failing at something when a young
 * Eparch simply has no honours yet.
 */

interface SectionState {
  label: string
  filled: boolean
  detail?: string
}

/** Form state is a flat map of paths; array lengths appear as the array's own value. */
function arrayLength(fields: Record<string, { value?: unknown }>, name: string): number {
  const value = fields[name]?.value
  return typeof value === 'number' ? value : Array.isArray(value) ? value.length : 0
}

function hasValue(fields: Record<string, { value?: unknown }>, name: string): boolean {
  const value = fields[name]?.value
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  return true
}

export function CompletenessIndicator() {
  const [fields] = useAllFormFields()
  const map = fields as unknown as Record<string, { value?: unknown }>

  const milestones = arrayLength(map, 'milestones')
  const honors = arrayLength(map, 'honors')
  const education = arrayLength(map, 'education')
  const galleries = arrayLength(map, 'galleries')
  const links = arrayLength(map, 'links')

  const sections: SectionState[] = [
    {
      label: 'Identity',
      filled: hasValue(map, 'fullName'),
      detail: hasValue(map, 'portrait') ? 'with portrait' : 'no portrait yet',
    },
    {
      label: 'Life & ministry',
      filled: milestones > 0,
      detail: milestones ? `${milestones} milestone${milestones === 1 ? '' : 's'}` : undefined,
    },
    { label: 'Honours', filled: honors > 0, detail: honors ? `${honors} recorded` : undefined },
    { label: 'Education', filled: education > 0, detail: education ? `${education} recorded` : undefined },
    { label: 'Ministry & tenure', filled: hasValue(map, 'termStart') },
    {
      label: 'Biography',
      filled: hasValue(map, 'biographySummary') || hasValue(map, 'biography'),
      detail: hasValue(map, 'biographySummary') ? undefined : 'summary missing — used for previews',
    },
    { label: 'Galleries', filled: galleries > 0, detail: galleries ? `${galleries} gallery group(s)` : undefined },
    { label: 'Sources', filled: links > 0, detail: links ? `${links} link(s)` : undefined },
  ]

  const done = sections.filter((s) => s.filled).length

  return (
    <div
      style={{
        border: '1px solid var(--theme-elevation-150)',
        borderRadius: '4px',
        padding: '0.75rem 1rem',
        marginBottom: '1.5rem',
        background: 'var(--theme-elevation-50)',
      }}
    >
      <strong style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
        Record completeness — {done} of {sections.length} sections started
      </strong>
      <ul
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.4rem 1.25rem',
          listStyle: 'none',
          margin: 0,
          padding: 0,
          fontSize: '0.8rem',
        }}
      >
        {sections.map((section) => (
          <li key={section.label} style={{ opacity: section.filled ? 1 : 0.6 }}>
            <span aria-hidden="true" style={{ marginInlineEnd: '0.35rem' }}>
              {section.filled ? '✓' : '○'}
            </span>
            {section.label}
            {section.detail ? (
              <span style={{ opacity: 0.7 }}> ({section.detail})</span>
            ) : null}
          </li>
        ))}
      </ul>
      <p style={{ margin: '0.6rem 0 0', fontSize: '0.75rem', opacity: 0.7 }}>
        Nothing here is required. A record can be saved with only a name and filled in over the
        years that follow.
      </p>
    </div>
  )
}
