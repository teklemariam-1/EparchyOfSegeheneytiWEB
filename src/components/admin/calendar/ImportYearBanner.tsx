'use client'

import React from 'react'
import Link from 'next/link'

/**
 * Banner above the Ge'ez Calendar Days list: entry point to the New-Year
 * import wizard, right where admins manage the calendar data.
 */
export function ImportYearBanner() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap',
        border: '1px solid var(--theme-elevation-150)',
        borderRadius: 8,
        padding: '12px 16px',
        margin: '16px 0 8px',
        background: 'var(--theme-elevation-50)',
      }}
    >
      <div>
        <strong>ዓውደ-ኣዋርሕ ሓድሽ ዓመት · New Ge&apos;ez year</strong>
        <div style={{ fontSize: 13, color: 'var(--theme-elevation-600)', marginTop: 2 }}>
          Import the next E.C. year (2019, 2020, …) from the liturgical-book JSON — with a
          dry-run validation report before anything is written.
        </div>
      </div>
      <Link
        href="/admin/calendar-import"
        style={{
          flexShrink: 0,
          padding: '8px 14px',
          borderRadius: 6,
          fontSize: 13,
          fontWeight: 600,
          textDecoration: 'none',
          color: 'var(--theme-base-0, #fff)',
          background: 'var(--theme-elevation-800)',
        }}
      >
        📅 Import New Year
      </Link>
    </div>
  )
}

export default ImportYearBanner
