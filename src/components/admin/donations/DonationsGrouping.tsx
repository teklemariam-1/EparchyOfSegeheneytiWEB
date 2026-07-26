'use client'

import { useState } from 'react'
import { GroupedTable } from '../shared/GroupedTable'

/**
 * Collapsible "Group & total" panel above the Donations list.
 *
 * Same server-side aggregation and reusable GroupedTable as Visitor Stats and
 * News. Group by month, method, currency or status with a count and a summed
 * amount per group. Defaults to currency × month because a total that mixes ERN
 * and USD is meaningless, so currency has to be the outer dimension.
 *
 * Collapsed by default so it never gets in the way of the normal list, search
 * and pagination.
 */
export function DonationsGrouping() {
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
        {open ? '▾ Hide grouping' : '▸ Group & total donations'}
      </button>

      {open && (
        <div style={{ marginTop: '1rem' }}>
          <GroupedTable collection="donations" initialGroupBy={['currency', 'createdAt']} initialBucket="month" />
        </div>
      )}
    </div>
  )
}

export default DonationsGrouping
