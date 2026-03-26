/* @payloadcms/next v3 — Catch-all page for every admin route.
 *
 * RootPage and generatePageMetadata accept Promise-wrapped params/searchParams
 * (Next.js 15 convention). Pass the promises through directly — do NOT unwrap
 * and re-wrap them, as that creates unnecessary microtask overhead.
 */
import type { Metadata } from 'next'
import { RootPage, generatePageMetadata } from '@payloadcms/next/views'
import config from '@payload-config'
import {
  AdminForgotPasswordView,
  AdminLoginView,
  AdminResetPasswordView,
} from '@/components/admin/auth/AdminAuthViews'
import { importMap } from '../importMap.js'

type Args = {
  params: Promise<{ segments: string[] }>
  searchParams: Promise<{ [key: string]: string | string[] }>
}

export const maxDuration = 60

export function generateMetadata({ params, searchParams }: Args): Promise<Metadata> {
  return generatePageMetadata({ config, params, searchParams })
}

export default async function Page({ params, searchParams }: Args) {
  const [resolvedParams, resolvedSearchParams, resolvedConfig] = await Promise.all([
    params,
    searchParams,
    config,
  ])

  const loginSegment = (resolvedConfig.admin.routes.login ?? '/login').slice(1)
  const forgotSegment = (resolvedConfig.admin.routes.forgot ?? '/forgot').slice(1)
  const resetSegment = (resolvedConfig.admin.routes.reset ?? '/reset').slice(1)
  const firstSegment = resolvedParams.segments?.[0]

  if (firstSegment === loginSegment) {
    return <AdminLoginView redirectTo={Array.isArray(resolvedSearchParams.redirect) ? resolvedSearchParams.redirect[0] : resolvedSearchParams.redirect} />
  }

  if (firstSegment === forgotSegment) {
    return <AdminForgotPasswordView />
  }

  if (firstSegment === resetSegment) {
    return <AdminResetPasswordView token={resolvedParams.segments?.[1]} />
  }

  return RootPage({
    config: Promise.resolve(resolvedConfig),
    importMap,
    params: Promise.resolve(resolvedParams),
    searchParams: Promise.resolve(resolvedSearchParams),
  })
}

