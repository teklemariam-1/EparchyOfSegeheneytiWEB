import type { Metadata } from 'next'
import React from 'react'
import '@payloadcms/next/css'
import './custom.css'

export const metadata: Metadata = {
  title: 'Admin Panel | Eparchy of Segeneyti',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html>
      <body>{children}</body>
    </html>
  )
}
