'use client'

import { useRowLabel } from '@payloadcms/ui'
import { MILESTONE_TYPE_LABELS, HONOR_CATEGORY_LABELS } from '@/collections/Bishops/terminology'

/**
 * Row labels for the repeatable arrays on a bishop record.
 *
 * Payload collapses array rows to "Milestone 01", "Milestone 02" … which is
 * unusable in a list of forty entries spanning a life: staff would have to open
 * each one to find the ordination. These show the entry's own title instead.
 *
 * All of them fall back to the numbered label while a row is still empty, so a
 * freshly added row is not a blank strip.
 */

function rowNumber(index: number | undefined): string {
  return String((index ?? 0) + 1).padStart(2, '0')
}

/** Array row values arrive untyped from the form; read defensively. */
function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

/** "Ordained to the priesthood — 1998" */
export function MilestoneRowLabel() {
  const { data, rowNumber: index } = useRowLabel<{
    title?: unknown
    milestoneType?: unknown
    date?: unknown
    datePrecision?: unknown
  }>()

  const title = text(data?.title)
  const type = typeof data?.milestoneType === 'string' ? data.milestoneType : undefined
  const typeLabel = type ? MILESTONE_TYPE_LABELS[type as keyof typeof MILESTONE_TYPE_LABELS] : undefined

  const year =
    typeof data?.date === 'string' && data.date
      ? new Date(data.date).getUTCFullYear()
      : undefined
  // Only the year is shown: the row label is a scanning aid, and a full date
  // here would contradict a "year only" precision setting inside the row.
  const yearLabel = Number.isFinite(year) ? String(year) : null

  const heading = title ?? typeLabel ?? `Milestone ${rowNumber(index)}`
  return <span>{yearLabel ? `${heading} — ${yearLabel}` : heading}</span>
}

/** "Honorary Doctorate — Academic degree or honorary doctorate" */
export function HonorRowLabel() {
  const { data, rowNumber: index } = useRowLabel<{ name?: unknown; category?: unknown }>()

  const name = text(data?.name)
  const category = typeof data?.category === 'string' ? data.category : undefined
  const categoryLabel = category
    ? HONOR_CATEGORY_LABELS[category as keyof typeof HONOR_CATEGORY_LABELS]
    : undefined

  if (!name) return <span>{`Honour ${rowNumber(index)}`}</span>
  return <span>{categoryLabel ? `${name} — ${categoryLabel}` : name}</span>
}

/** "Pontifical Urban University — 1998–2002" */
export function EducationRowLabel() {
  const { data, rowNumber: index } = useRowLabel<{
    institution?: unknown
    degree?: unknown
    startYear?: unknown
    endYear?: unknown
  }>()

  const institution = text(data?.institution)
  if (!institution) return <span>{`Qualification ${rowNumber(index)}`}</span>

  const start = typeof data?.startYear === 'number' ? data.startYear : null
  const end = typeof data?.endYear === 'number' ? data.endYear : null
  const years = start && end ? `${start}–${end}` : (start ?? end ?? null)
  const degree = text(data?.degree)

  return <span>{[institution, degree, years].filter(Boolean).join(' — ')}</span>
}

/** "Episcopal Consecration 2024 (episcopal-consecration-2024) · 24 photos" */
export function GalleryRowLabel() {
  const { data, rowNumber: index } = useRowLabel<{
    title?: unknown
    key?: unknown
    images?: unknown
  }>()

  const title = text(data?.title)
  if (!title) return <span>{`Gallery ${rowNumber(index)}`}</span>

  const key = text(data?.key)
  const count = Array.isArray(data?.images) ? data.images.length : 0
  // The key is shown because milestones reference a gallery by it — staff need
  // to be able to read it off without opening the row.
  const suffix = [key ? `(${key})` : null, count ? `${count} photo${count === 1 ? '' : 's'}` : null]
    .filter(Boolean)
    .join(' · ')

  return <span>{suffix ? `${title} ${suffix}` : title}</span>
}
