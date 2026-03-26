/* @payloadcms/next v3 — Admin 404 handler.
 *
 * Without this file, admin 404s may fall through to the frontend not-found page
 * which uses Tailwind classes that aren't loaded on admin routes.
 */
import { NotFoundPage } from '@payloadcms/next/views'
import config from '@payload-config'
import { importMap } from '../importMap.js'

type Args = {
  params: Promise<{ segments: string[] }>
  searchParams: Promise<{ [key: string]: string | string[] }>
}

export default function NotFound({ params, searchParams }: Args) {
  return NotFoundPage({ config, importMap, params, searchParams })
}
