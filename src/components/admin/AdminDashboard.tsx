import React from 'react'
import { Gutter } from '@payloadcms/ui'
import DashboardStats from './DashboardStats'
import AnalyticsDashboard from './analytics/AnalyticsDashboard'
import { hasPermission, type AuthUser } from '@/lib/permissions/resolve'

/**
 * Custom admin dashboard view.
 *
 * Server-side permission gate (not UI-only): users who hold `visitor-stats.view`
 * get the full analytics dashboard; everyone else gets the lightweight stats
 * overview. The sensitive "Users & security" section within analytics is further
 * gated on `users.manage`. This is a real boundary — the analytics data route
 * (/api/admin/aggregate) enforces the same permission independently.
 */
export default async function AdminDashboard(props: {
  initPageResult?: { req?: { user?: AuthUser | null } }
  searchParams?: Record<string, string | string[] | undefined>
}) {
  const user = props?.initPageResult?.req?.user ?? null
  const canViewAnalytics = hasPermission(user, 'visitor-stats.view')
  const canViewSecurity = hasPermission(user, 'users.manage')

  return (
    <Gutter>
      <div style={{ paddingTop: 28, paddingBottom: 44 }}>
        {canViewAnalytics ? (
          <AnalyticsDashboard searchParams={props?.searchParams} canViewSecurity={canViewSecurity} />
        ) : (
          <DashboardStats />
        )}
      </div>
    </Gutter>
  )
}
