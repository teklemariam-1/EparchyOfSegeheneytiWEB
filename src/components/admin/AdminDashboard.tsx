import React from 'react'
import { Gutter } from '@payloadcms/ui'
import DashboardStats from './DashboardStats'
import AnalyticsDashboard from './analytics/AnalyticsDashboard'

/**
 * Custom admin dashboard view.
 *
 * Replaces Payload's default dashboard (whose per-collection quick-create
 * cards duplicated the sidebar). Super-admins get the full analytics
 * dashboard with date filtering and PDF export; other editors get the
 * lightweight stats overview.
 */
export default async function AdminDashboard(props: {
  initPageResult?: { req?: { user?: { role?: string } | null } }
  searchParams?: Record<string, string | string[] | undefined>
}) {
  const role = props?.initPageResult?.req?.user?.role
  const isSuperAdmin = role === 'super-admin'

  return (
    <Gutter>
      <div style={{ paddingTop: 28, paddingBottom: 44 }}>
        {isSuperAdmin ? (
          <AnalyticsDashboard searchParams={props?.searchParams} />
        ) : (
          <DashboardStats />
        )}
      </div>
    </Gutter>
  )
}
