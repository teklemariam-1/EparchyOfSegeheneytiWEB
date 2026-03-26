/* @payloadcms/next v3 — Root layout for the embedded admin panel.
 *
 * Payload's compiled RootLayout (index.js) does NOT import the global SCSS that
 * defines :root CSS custom-properties (--base, --theme-bg, --color-base-*, etc.).
 * The import declaration only exists in the .d.ts file, which is never executed.
 * We import it here so Next.js / webpack compiles the SCSS and includes the
 * resulting CSS in the admin route's stylesheet bundle.
 */
import '@payloadcms/ui/scss/app.scss'
import './custom.css'

import type React from 'react'
import { RootLayout, handleServerFunctions } from '@payloadcms/next/layouts'
import config from '@payload-config'
import { importMap } from './importMap.js'

export { metadata } from '@payloadcms/next/layouts'

export default async function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RootLayout
      config={config}
      importMap={importMap}
      serverFunction={async function serverFunction(args) {
        'use server'
        return handleServerFunctions({ ...args, config, importMap })
      }}
    >
      {children}
    </RootLayout>
  )
}
