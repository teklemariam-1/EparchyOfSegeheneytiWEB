import React from 'react'
import { Gutter } from '@payloadcms/ui'
import { CalendarImportWizard } from './CalendarImportWizard'
import { hasPermission, type AuthUser } from '@/lib/permissions/resolve'

/**
 * Custom admin view at /admin/calendar-import: the Ge'ez New-Year import
 * wizard. Upload the eparchy's liturgical-book JSON for the next E.C. year
 * (e.g. 2019, 2020…), review the dry-run validation report, then import.
 */
export default async function CalendarImportView(props: {
  initPageResult?: { req?: { user?: AuthUser | null } }
}) {
  const allowed = hasPermission(props?.initPageResult?.req?.user ?? null, 'geez-calendar.import')

  return (
    <Gutter>
      <div style={{ paddingTop: 28, paddingBottom: 44, maxWidth: 860 }}>
        <h1 style={{ marginBottom: 4 }}>Ge&apos;ez Calendar — New Year Import</h1>
        {allowed ? (
          <CalendarImportWizard />
        ) : (
          <p>You need chancery or super-admin access to import calendar years.</p>
        )}
      </div>
    </Gutter>
  )
}
