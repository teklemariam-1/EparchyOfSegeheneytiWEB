import { RootLayout, handleServerFunctions } from '@payloadcms/next/layouts'
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
  const serverFunction: Parameters<typeof RootLayout>[0]['serverFunction'] =
    async function (args) {
      'use server'
      return handleServerFunctions({
        ...args,
        config,
        importMap,
      })
    }

  return (
    <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
      {children}
    </RootLayout>
  )
}
