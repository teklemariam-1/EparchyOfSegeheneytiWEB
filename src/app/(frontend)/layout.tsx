import React from 'react'
import { SiteHeader } from '@/components/navigation/SiteHeader'
import { SiteFooter } from '@/components/navigation/SiteFooter'

/**
 * Public-facing layout shell.
 * All routes inside (frontend)/ share this layout.
 * SiteHeader and SiteFooter are server components that fetch their own data.
 */
export default function FrontendLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="min-h-screen">
        {children}
      </main>
      <SiteFooter />
    </>
  )
}
