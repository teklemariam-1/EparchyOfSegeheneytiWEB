/**
 * Whitelisted group-by configuration for admin grouped tables.
 *
 * This is the security boundary for the server-side aggregation: only the
 * collections, columns and measures listed here can ever be grouped or summed,
 * so column identifiers can be interpolated straight into SQL (they never come
 * from the client). It is deliberately free of server-only imports (no drizzle,
 * no payload) so the client GroupedTable component can import it for labels.
 */

export type ColumnKind = 'text' | 'date' | 'boolean' | 'number'

export interface GroupColumn {
  /** Stable key used in the API request and the URL. */
  key: string
  /** Actual Postgres column name (from the migrations). Never client-supplied. */
  column: string
  label: string
  kind: ColumnKind
  /** Available as a group-by dimension. */
  groupable?: boolean
  /** Available as a filter. */
  filterable?: boolean
}

export interface Measure {
  key: string
  column: string
  label: string
}

export interface AggregatableCollection {
  /** Postgres table name. */
  table: string
  label: string
  columns: GroupColumn[]
  /** Numeric columns summed per group. Empty → groups are COUNT(*) only. */
  measures: Measure[]
  /**
   * Columns counted with COUNT(DISTINCT …) — "how many unique donors", not "how
   * much". Kept separate from `measures` for one reason: distinct counts do not
   * add up. A donor who gave in March and in April is one donor but appears in
   * two groups, so summing the per-group counts would overstate the total.
   * `groupByAggregate` therefore reports a grand-total distinct count only for
   * an ungrouped query, where there is nothing to add.
   *
   * Only the count leaves the database — never the underlying values, which is
   * what makes it safe to count donor emails that the collection's field access
   * otherwise withholds.
   */
  distinctMeasures?: Measure[]
}

export type Bucket = 'day' | 'week' | 'month' | 'year'
export const BUCKETS: Bucket[] = ['day', 'week', 'month', 'year']

export const AGGREGATIONS: Record<string, AggregatableCollection> = {
  'visitor-stats': {
    table: 'visitor_stats',
    label: 'Visitor statistics',
    columns: [
      { key: 'dimension', column: 'dimension', label: 'Dimension', kind: 'text', groupable: true, filterable: true },
      { key: 'key', column: 'key', label: 'Key', kind: 'text', groupable: true, filterable: true },
      { key: 'country', column: 'country', label: 'Country', kind: 'text', groupable: true, filterable: true },
      { key: 'date', column: 'date', label: 'Date', kind: 'date', groupable: true, filterable: true },
    ],
    measures: [{ key: 'count', column: 'count', label: 'Visits / views' }],
  },
  donations: {
    table: 'donations',
    label: 'Donations',
    columns: [
      { key: 'currency', column: 'currency', label: 'Currency', kind: 'text', groupable: true, filterable: true },
      { key: 'status', column: 'status', label: 'Status', kind: 'text', groupable: true, filterable: true },
      { key: 'frequency', column: 'frequency', label: 'Frequency', kind: 'text', groupable: true, filterable: true },
      { key: 'provider', column: 'provider', label: 'Method', kind: 'text', groupable: true, filterable: true },
      { key: 'anonymous', column: 'anonymous', label: 'Anonymous', kind: 'boolean', groupable: true, filterable: true },
      { key: 'createdAt', column: 'created_at', label: 'Date', kind: 'date', groupable: true, filterable: true },
    ],
    measures: [{ key: 'amount', column: 'amount', label: 'Amount raised' }],
    distinctMeasures: [{ key: 'donors', column: 'donor_email', label: 'Unique donors' }],
  },
  news: {
    table: 'news',
    label: 'News',
    columns: [
      { key: 'category', column: 'category', label: 'Category', kind: 'text', groupable: true, filterable: true },
      { key: 'status', column: '_status', label: 'Status', kind: 'text', groupable: true, filterable: true },
      { key: 'reviewStatus', column: 'review_status', label: 'Review status', kind: 'text', groupable: true, filterable: true },
      { key: 'author', column: 'author_id', label: 'Author', kind: 'number', groupable: true },
      { key: 'source', column: 'source_name', label: 'Source', kind: 'text', groupable: true, filterable: true },
      { key: 'imported', column: 'is_imported', label: 'Imported', kind: 'boolean', groupable: true, filterable: true },
      { key: 'publishedAt', column: 'published_at', label: 'Published', kind: 'date', groupable: true, filterable: true },
      { key: 'createdAt', column: 'created_at', label: 'Created', kind: 'date', groupable: true, filterable: true },
    ],
    measures: [],
  },
}

export type FilterOp = 'eq' | 'gte' | 'lte'

export interface GroupFilter {
  key: string
  op: FilterOp
  value: string
}

export interface GroupByRequest {
  collection: string
  groupBy: string[]
  bucket?: Bucket
  filters?: GroupFilter[]
  limit?: number
}

export interface GroupedRow {
  /** Display values keyed by group-column key, in request order. */
  groups: Record<string, string | null>
  rowCount: number
  sums: Record<string, number>
  /** COUNT(DISTINCT …) per group, when the collection declares any. */
  distincts?: Record<string, number>
}

export interface GroupByResult {
  collection: string
  groupBy: string[]
  bucket?: Bucket
  measures: Measure[]
  rows: GroupedRow[]
  distinctMeasures?: Measure[]
  /**
   * `grandTotal.distincts` is present only for an ungrouped query — see the
   * note on `distinctMeasures` for why per-group distinct counts cannot be
   * added up.
   */
  grandTotal: { rowCount: number; sums: Record<string, number>; distincts?: Record<string, number> }
}
