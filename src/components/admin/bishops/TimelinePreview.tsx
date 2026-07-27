'use client'

import { useAllFormFields } from '@payloadcms/ui'
import { MILESTONE_TYPE_LABELS } from '@/collections/Bishops/terminology'
import { buildTimeline, formatMilestoneRange, type DatedMilestone } from '@/lib/bishops/timeline'

/**
 * The chronology as visitors will see it, inside the edit form.
 *
 * Milestones are stored in the order they were typed and sorted by date only at
 * render time, so the array in the form is NOT the timeline. Among forty
 * entries a mistyped year is invisible in the editor and obvious here — which
 * is the whole point of showing it before saving.
 *
 * Reuses the same buildTimeline/formatMilestoneRange the public page uses, so
 * this cannot drift from what actually ships. English labels only: this is an
 * ordering check for staff, not a translation preview.
 */

const PERIOD_LABELS: Record<string, string> = {
  origins: 'Origins',
  formation: 'Formation',
  priesthood: 'Priesthood',
  episcopacy: 'Episcopacy',
}

interface PreviewMilestone extends DatedMilestone {
  title?: unknown
  isPublic?: unknown
}

/**
 * Rebuild the milestone rows from Payload's flat form state.
 *
 * The form stores each row's fields as `milestones.0.title`, not as an array of
 * objects, so the array value itself is only a row count.
 */
function readMilestones(fields: Record<string, { value?: unknown }>): PreviewMilestone[] {
  const raw = fields['milestones']?.value
  const count = typeof raw === 'number' ? raw : Array.isArray(raw) ? raw.length : 0
  if (!count) return []

  const rows: PreviewMilestone[] = []
  for (let i = 0; i < count; i++) {
    rows.push({
      title: fields[`milestones.${i}.title`]?.value,
      milestoneType: fields[`milestones.${i}.milestoneType`]?.value as string | undefined,
      date: fields[`milestones.${i}.date`]?.value as string | undefined,
      datePrecision: fields[`milestones.${i}.datePrecision`]?.value as string | undefined,
      endDate: fields[`milestones.${i}.endDate`]?.value as string | undefined,
      endDatePrecision: fields[`milestones.${i}.endDatePrecision`]?.value as string | undefined,
      order: fields[`milestones.${i}.order`]?.value as number | undefined,
      isPublic: fields[`milestones.${i}.isPublic`]?.value,
    })
  }
  return rows
}

export function TimelinePreview() {
  const [fields] = useAllFormFields()
  const milestones = readMilestones(fields as unknown as Record<string, { value?: unknown }>)

  if (milestones.length === 0) return null

  const groups = buildTimeline(milestones)

  return (
    <div
      style={{
        border: '1px solid var(--theme-elevation-150)',
        borderRadius: '4px',
        padding: '1rem 1.25rem',
        marginTop: '1.5rem',
        background: 'var(--theme-elevation-50)',
      }}
    >
      <strong style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
        Timeline preview
      </strong>
      <p style={{ margin: '0 0 1rem', fontSize: '0.75rem', opacity: 0.7 }}>
        In date order, grouped as visitors will see it. Entries with no date sort to the end;
        entries marked not public are shown here in grey and will not appear on the website.
      </p>

      {groups.map((group) => (
        <div key={group.period} style={{ marginBottom: '1rem' }}>
          <div
            style={{
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              opacity: 0.65,
              marginBottom: '0.35rem',
            }}
          >
            {PERIOD_LABELS[group.period] ?? group.period}
          </div>
          <ol style={{ margin: 0, paddingInlineStart: '1.1rem', fontSize: '0.82rem' }}>
            {group.milestones.map((milestone, i) => {
              const withheld = milestone.isPublic === false
              const range = formatMilestoneRange(milestone, 'en')
              const type = milestone.milestoneType as keyof typeof MILESTONE_TYPE_LABELS | undefined
              const title =
                (typeof milestone.title === 'string' && milestone.title.trim()) ||
                (type && MILESTONE_TYPE_LABELS[type]) ||
                'Untitled milestone'

              return (
                <li
                  key={`${group.period}-${i}`}
                  style={{ marginBottom: '0.25rem', opacity: withheld ? 0.45 : 1 }}
                >
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>{range ?? 'no date'}</span>
                  {' — '}
                  {title}
                  {withheld ? ' (not public)' : ''}
                </li>
              )
            })}
          </ol>
        </div>
      ))}
    </div>
  )
}
