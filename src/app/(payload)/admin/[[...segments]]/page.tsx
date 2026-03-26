/* @payloadcms/next v3 — Catch-all page for every admin route.
 *
 * RootPage and generatePageMetadata accept Promise-wrapped params/searchParams
 * (Next.js 15 convention). Pass the promises through directly — do NOT unwrap
 * and re-wrap them, as that creates unnecessary microtask overhead.
 */
import type { Metadata } from 'next'
import { RootPage, generatePageMetadata } from '@payloadcms/next/views'
import config from '@payload-config'
import { importMap } from '../importMap.js'

type Args = {
  params: Promise<{ segments: string[] }>
  searchParams: Promise<{ [key: string]: string | string[] }>
}

export const maxDuration = 60

export function generateMetadata({ params, searchParams }: Args): Promise<Metadata> {
  return generatePageMetadata({ config, params, searchParams })
}

export default function Page({ params, searchParams }: Args) {
  return RootPage({ config, importMap, params, searchParams })
}

