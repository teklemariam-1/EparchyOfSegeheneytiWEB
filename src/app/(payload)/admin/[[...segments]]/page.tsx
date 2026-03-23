import { RootPage, generatePageMetadata } from '@payloadcms/next/views'
import { importMap } from '../importMap.js'
import config from '@payload-config'
import type { Metadata } from 'next'

type Args = {
  params: Promise<{
    segments: string[]
  }>
  searchParams: Promise<{
    [key: string]: string | string[]
  }>
}

export async function generateMetadata({ params, searchParams }: Args): Promise<Metadata> {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  return generatePageMetadata({
    config,
    params: Promise.resolve(resolvedParams),
    searchParams: Promise.resolve(resolvedSearchParams),
  })
}

export default async function AdminPage({ params, searchParams }: Args) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  return RootPage({
    config,
    params: Promise.resolve(resolvedParams),
    searchParams: Promise.resolve(resolvedSearchParams),
    importMap,
  })
}
