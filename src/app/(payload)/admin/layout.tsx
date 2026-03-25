import { RootLayout } from '@payloadcms/next/layouts'
import { importMap } from './importMap.js'
import config from '@payload-config'
import React from 'react'
import './custom.css'

export { metadata } from '@payloadcms/next/layouts'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RootLayout config={config} importMap={importMap}>
      {children}
    </RootLayout>
  )
}
