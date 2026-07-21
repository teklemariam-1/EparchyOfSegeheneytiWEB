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

/**
 * The uploaded Eparchy logo, for the branded auth screens.
 *
 * Read directly (not via the cached query helper) so the login screen never
 * depends on the data cache, and swallow any error — a missing logo must never
 * stop someone logging in; the views fall back to the crest mark.
 */
async function getBrandLogoUrl(resolvedConfig: Awaited<typeof config>): Promise<string | null> {
  try {
    const { getPayload } = await import('payload')
    const payload = await getPayload({ config: resolvedConfig })
    const settings = (await payload.findGlobal({ slug: 'site-settings', depth: 1 } as any)) as any
    return settings?.logo?.url ?? settings?.logoDark?.url ?? null
  } catch {
    return null
  }
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

  const isAuthScreen =
    firstSegment === loginSegment || firstSegment === forgotSegment || firstSegment === resetSegment
  const logoUrl = isAuthScreen ? await getBrandLogoUrl(resolvedConfig) : null

  if (firstSegment === loginSegment) {
    return <AdminLoginView logoUrl={logoUrl} redirectTo={Array.isArray(resolvedSearchParams.redirect) ? resolvedSearchParams.redirect[0] : resolvedSearchParams.redirect} />
  }

  if (firstSegment === forgotSegment) {
    return <AdminForgotPasswordView logoUrl={logoUrl} />
  }

  if (firstSegment === resetSegment) {
    return <AdminResetPasswordView logoUrl={logoUrl} token={resolvedParams.segments?.[1]} />
  }

  return RootPage({
    config: Promise.resolve(resolvedConfig),
    importMap,
    params: Promise.resolve(resolvedParams),
    searchParams: Promise.resolve(resolvedSearchParams),
  })
}

