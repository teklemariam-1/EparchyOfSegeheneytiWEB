'use client'

import { useState } from 'react'
import { GroupedTable } from '../shared/GroupedTable'

/**
 * Collapsible "Group & count" panel shown above the News list.
 *
 * Uses the same server-side aggregation + reusable GroupedTable as the Visitor
 * Stats page. Group by category, status, review status, author, source, or
 * date (day/week/month/year) with a count per group. Hidden by default so it
 * never gets in the way of the normal list, search and pagination.
 */
export function NewsGrouping() {
  const [open, setOpen] = useState(false)

  return (
    <div
      style={{
        border: '1px solid var(--theme-elevation-150)',
        borderRadius: 4,
        padding: open ? '1rem' : '0.5rem 1rem',
        marginBottom: '1rem',
        background: 'var(--theme-elevation-50)',
      }}
    >
      <button
        type="button"
        className="btn btn--size-small btn--style-secondary"
        style={{ margin: 0 }}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {open ? '▾ Hide grouping' : '▸ Group & count articles'}
      </button>

      {open && (
        <div style={{ marginTop: '1rem' }}>
          <GroupedTable collection="news" initialGroupBy={['category']} initialBucket="month" />
        </div>
      )}
    </div>
  )
}

export default NewsGrouping
