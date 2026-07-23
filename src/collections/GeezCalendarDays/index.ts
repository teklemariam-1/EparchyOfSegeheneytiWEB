import type { CollectionConfig, PayloadRequest } from 'payload'
import { sql } from '@payloadcms/db-postgres'
import { safeRevalidatePath, safeRevalidateTag } from '../../lib/payload/revalidate'
import { isChanceryOrAbove } from '../../lib/permissions/collectionAccess'
import { GEEZ_MONTHS, GEEZ_MONTH_LABELS } from '../../lib/constants/geezMonths'
import {
  validateYearRows,
  checkExistingDays,
  type ImportRow,
} from '../../lib/calendar-sync/import-validation'
import { convertGxawieBook } from '../../lib/calendar-sync/convert-gxawie'

const canManageCalendar = (req: PayloadRequest): boolean => {
  const role = (req.user as { role?: string } | null)?.role
  return role === 'super-admin' || role === 'chancery-editor'
}

async function fetchExistingDays(req: PayloadRequest) {
  const result = await req.payload.find({
    collection: 'geez-calendar-days',
    sort: 'gregorianDate',
    limit: 10_000,
    depth: 0,
  })
  return (result.docs as unknown as Array<Record<string, unknown>>).map((d) => ({
    month: String(d.month),
    day: Number(d.day),
    geezYear: Number(d.geezYear),
    gregorianDate: String(d.gregorianDate).slice(0, 10),
  }))
}

/**
 * One document per day of the Ge'ez liturgical year: readings, antiphon,
 * deceased-clergy commemorations and feasts, each tied to its Gregorian date.
 * Structure mirrors the eparchy's liturgical calendar book (imported from the
 * gxawie calendar JSON; see scripts/convert-geez-calendar.mjs).
 */
export const GeezCalendarDays: CollectionConfig = {
  slug: 'geez-calendar-days',
  labels: { singular: "Ge'ez Calendar Day", plural: "Ge'ez Calendar Days" },
  admin: {
    group: 'Calendar',
    useAsTitle: 'geezLabel',
    defaultColumns: ['geezLabel', 'month', 'day', 'gregorianDate', 'events'],
    listSearchableFields: ['geezLabel', 'events', 'deceasedClergy', 'readings'],
    description:
      "Daily liturgical calendar: one entry per Ge'ez day with readings, antiphon, commemorations and feasts, plus the corresponding Gregorian date.",
  },
  access: {
    read: () => true,
    create: isChanceryOrAbove,
    update: isChanceryOrAbove,
    delete: isChanceryOrAbove,
  },
  // Each Ge'ez date exists exactly once; a second year's import cannot
  // silently duplicate or overlap days. (A unique index on the Gregorian
  // calendar day lives in SQL — see the calendar_integrity migration.)
  indexes: [{ unique: true, fields: ['geezYear', 'month', 'day'] }],
  endpoints: [
    {
      // GET /api/geez-calendar-days/integrity — health report over the live
      // data: per-year completeness, duplicates, Gregorian continuity.
      path: '/integrity',
      method: 'get',
      handler: async (req) => {
        if (!canManageCalendar(req)) {
          return Response.json({ error: 'Forbidden' }, { status: 403 })
        }
        const report = checkExistingDays(await fetchExistingDays(req))
        return Response.json(report)
      },
    },
    {
      // POST /api/geez-calendar-days/import — import one E.C. year.
      // Body: { raw: <book JSON>, dryRun?: boolean } for the eparchy's raw
      // liturgical-book file (converted server-side), or
      // { rows: ImportRow[], dryRun?: boolean } for pre-converted data.
      // Validation failures return 422 with the issue list; dryRun always
      // stops after validation and echoes a preview.
      path: '/import',
      method: 'post',
      handler: async (req) => {
        if (!canManageCalendar(req)) {
          return Response.json({ error: 'Forbidden' }, { status: 403 })
        }
        let body: { raw?: unknown; rows?: ImportRow[]; dryRun?: boolean }
        try {
          body = (await req.json?.()) ?? {}
        } catch {
          return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
        }

        const conversionWarnings: string[] = []
        let rows = body.rows
        if (!rows && body.raw !== undefined) {
          const converted = convertGxawieBook(body.raw)
          if (converted.errors.length > 0) {
            return Response.json(
              { ok: false, stage: 'conversion', errors: converted.errors, warnings: converted.warnings },
              { status: 422 },
            )
          }
          rows = converted.rows
          conversionWarnings.push(...converted.warnings)
        }
        if (!Array.isArray(rows) || rows.length === 0) {
          return Response.json(
            { error: 'Body must be { raw: <book JSON> } or { rows: ImportRow[] }' },
            { status: 400 },
          )
        }

        const issues = validateYearRows(rows)
        for (const w of conversionWarnings) {
          issues.push({ level: 'warning', code: 'conversion', message: w })
        }
        const year = rows[0]?.geezYear
        const existing = await fetchExistingDays(req)
        if (existing.some((d) => d.geezYear === year)) {
          issues.push({
            level: 'error',
            code: 'year-exists',
            message: `${year} E.C. is already imported. Delete that year first to re-import it.`,
          })
        }
        const existingGreg = new Set(existing.map((d) => d.gregorianDate))
        const overlap = rows.filter((r) => existingGreg.has(r.gregorianDate))
        if (overlap.length > 0) {
          issues.push({
            level: 'error',
            code: 'greg-overlap',
            message: `${overlap.length} Gregorian date(s) already exist (first: ${overlap[0]!.gregorianDate}).`,
          })
        }

        const errors = issues.filter((i) => i.level === 'error')
        if (body.dryRun || errors.length > 0) {
          const sorted = [...rows].sort((a, b) => (a.gregorianDate < b.gregorianDate ? -1 : 1))
          return Response.json(
            {
              ok: errors.length === 0,
              dryRun: Boolean(body.dryRun),
              year,
              rows: rows.length,
              issues,
              preview: { first: sorted[0], last: sorted[sorted.length - 1] },
            },
            { status: errors.length > 0 ? 422 : 200 },
          )
        }

        // Chunked raw inserts — same shape as the seed migration; a per-row
        // Local API loop would mean ~365 network round-trips.
        const drizzle = (req.payload.db as unknown as { drizzle: { execute: (q: unknown) => Promise<unknown> } }).drizzle
        const CHUNK = 60
        for (let i = 0; i < rows.length; i += CHUNK) {
          const chunk = rows.slice(i, i + CHUNK)
          const values = sql.join(
            chunk.map(
              (r) =>
                sql`(${r.geezLabel}, ${r.month}, ${r.day}, ${r.geezYear}, ${r.gregorianDate}, ${r.readings || null}, ${r.antiphon || null}, ${r.deceasedClergy || null}, ${r.events || null})`,
            ),
            sql`, `,
          )
          await drizzle.execute(
            sql`INSERT INTO "geez_calendar_days" ("geez_label", "month", "day", "geez_year", "gregorian_date", "readings", "antiphon", "deceased_clergy", "events") VALUES ${values}`,
          )
        }
        safeRevalidateTag('geez')
        safeRevalidatePath('/geez-calendar')
        req.payload.logger.info(`Imported ${rows.length} geez calendar days for ${year} E.C.`)
        return Response.json({ ok: true, imported: rows.length, year, issues })
      },
    },
  ],
  hooks: {
    afterChange: [
      () => {
        safeRevalidateTag('geez')
        safeRevalidatePath('/geez-calendar')
      },
    ],
    afterDelete: [
      () => {
        safeRevalidateTag('geez')
        safeRevalidatePath('/geez-calendar')
      },
    ],
  },
  fields: [
    {
      name: 'geezLabel',
      type: 'text',
      required: true,
      admin: { description: "Ge'ez date as shown to visitors, e.g. ፩ መስከረም 2018" },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'month',
          type: 'select',
          required: true,
          index: true,
          options: GEEZ_MONTHS.map((m) => ({
            label: `${GEEZ_MONTH_LABELS[m].en} (${GEEZ_MONTH_LABELS[m].ti})`,
            value: m,
          })),
        },
        { name: 'day', type: 'number', required: true, min: 1, max: 30 },
        { name: 'geezYear', type: 'number', required: true, admin: { description: 'E.C. year, e.g. 2018' } },
      ],
    },
    {
      name: 'gregorianDate',
      type: 'date',
      required: true,
      index: true,
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayOnly' },
        description: 'Corresponding Gregorian (ፈረንጂ) date.',
      },
    },
    {
      name: 'readings',
      type: 'textarea',
      admin: { description: 'Scripture readings for the day (ንባባት).' },
    },
    {
      name: 'antiphon',
      type: 'textarea',
      admin: { description: 'Antiphon / መዝሙር of the day.' },
    },
    {
      name: 'deceasedClergy',
      type: 'textarea',
      label: 'Deceased Clergy Commemoration',
      admin: { description: 'Clergy commemorated on this day (ዝኽሪ ዝዓረፉ ካህናት).' },
    },
    {
      name: 'events',
      type: 'textarea',
      label: 'Feasts / Events',
      admin: { description: 'Feast days and celebrations on this day (በዓላት).' },
    },
  ],
  timestamps: true,
}
