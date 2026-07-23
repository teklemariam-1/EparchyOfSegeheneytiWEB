import React from 'react'
import { Gutter } from '@payloadcms/ui'
import DashboardStats from './DashboardStats'

/**
 * Custom admin dashboard view.
 *
 * Replaces Payload's default dashboard, which rendered a card (with a
 * quick-create "+" button) for every collection group — duplicating the
 * sidebar navigation. The dashboard now focuses on statistics and activity;
 * all management pages remain reachable through the sidebar.
 */
export default async function AdminDashboard() {
  return (
    <Gutter>
      <div style={{ paddingTop: 28, paddingBottom: 44 }}>
        <DashboardStats />
      </div>
    </Gutter>
  )
}
