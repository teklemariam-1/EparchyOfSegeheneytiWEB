import type { CollectionBeforeChangeHook } from 'payload'

/** Full years lived between two ISO dates, respecting month and day. */
export function fullYearsBetween(birthIso: string, deathIso: string): number {
  const birth = new Date(birthIso)
  const death = new Date(deathIso)
  let years = death.getUTCFullYear() - birth.getUTCFullYear()
  const monthDiff = death.getUTCMonth() - birth.getUTCMonth()
  if (monthDiff < 0 || (monthDiff === 0 && death.getUTCDate() < birth.getUTCDate())) {
    years -= 1
  }
  return years
}

/**
 * Auto-fill ageAtDeath from the two dates when the editor left it empty.
 * Editable by design: a typed value is never overwritten, so a chancery
 * correction (a birth year known only approximately) sticks.
 */
export const computeAgeAtDeath: CollectionBeforeChangeHook = ({ data }) => {
  const record = data as { birthDate?: unknown; deathDate?: unknown; ageAtDeath?: unknown }
  const hasAge = record.ageAtDeath !== null && record.ageAtDeath !== undefined && record.ageAtDeath !== ''
  if (
    !hasAge &&
    typeof record.birthDate === 'string' && record.birthDate &&
    typeof record.deathDate === 'string' && record.deathDate
  ) {
    record.ageAtDeath = fullYearsBetween(record.birthDate, record.deathDate)
  }
  return data
}

/**
 * When a priest from the clergy register is linked, fill in what the register
 * already knows — name, photo, birth date, ordination date — but only into
 * fields the editor left empty, and never let a failed lookup block the save:
 * the obituary must remain writable for a priest who was never registered.
 */
export const inheritFromPriest: CollectionBeforeChangeHook = async ({ data, req }) => {
  const record = data as {
    relatedPriest?: unknown
    fullName?: unknown
    photo?: unknown
    birthDate?: unknown
    ordination?: { date?: unknown; bishop?: unknown; place?: unknown; church?: unknown }
  }
  const rel = record.relatedPriest
  if (rel === null || rel === undefined) return data
  const id = typeof rel === 'object' ? (rel as { id?: string | number }).id : (rel as string | number)
  if (id === null || id === undefined) return data

  try {
    const priest = (await req.payload.findByID({
      collection: 'priests',
      id,
      depth: 0,
    })) as { fullName?: string; photo?: unknown; birthDate?: string; ordinationDate?: string }

    if (!record.fullName && priest.fullName) record.fullName = priest.fullName
    if (!record.photo && priest.photo !== null && priest.photo !== undefined) record.photo = priest.photo
    if (!record.birthDate && priest.birthDate) record.birthDate = priest.birthDate
    if (!record.ordination?.date && priest.ordinationDate) {
      record.ordination = { ...record.ordination, date: priest.ordinationDate }
    }
  } catch {
    // The register lookup is a convenience, not a gate.
  }
  return data
}

/**
 * The list sorts on `-deathDate` with `-publishedAt` as tiebreak; same hazard
 * News documents — a null publishedAt sorts ahead of everything under DESC in
 * Postgres — so default it on every write path, not just the admin form.
 */
export const defaultPublishedAt: CollectionBeforeChangeHook = ({ data }) => {
  const record = data as { publishedAt?: unknown }
  if (record.publishedAt === null || record.publishedAt === undefined || record.publishedAt === '') {
    record.publishedAt = new Date().toISOString()
  }
  return data
}
