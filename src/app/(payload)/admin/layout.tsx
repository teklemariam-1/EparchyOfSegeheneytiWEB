/* @payloadcms/next v3 — Root layout for the embedded admin panel.
 *
 * Payload's compiled RootLayout (index.js) does NOT import its own stylesheet;
 * the canonical layout must import '@payloadcms/next/css' (the full compiled
 * admin CSS). Importing only '@payloadcms/ui/scss/app.scss' is NOT enough — it
 * provides root variables and component base styles, but the layout templates
 * (.template-default grid, nav sidebar, dashboard groups) ship exclusively in
 * @payloadcms/next's stylesheet and the admin renders unstyled without them.
 */
import '@payloadcms/next/css'
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
