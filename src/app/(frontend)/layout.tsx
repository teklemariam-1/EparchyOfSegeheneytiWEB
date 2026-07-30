import type { Metadata } from 'next'
import React from 'react'
import { Inter, Noto_Serif_Ethiopic } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getLocale } from 'next-intl/server'
import { cookies } from 'next/headers'
import { TEXT_SCALE_COOKIE, parseTextScale } from '@/lib/textScale'
import { SiteHeader } from '@/components/navigation/SiteHeader'
import { SiteFooter } from '@/components/navigation/SiteFooter'
import { SkipNav } from '@/components/shared/SkipNav'
import { CookieConsent } from '@/components/shared/CookieConsent'
import { VisitorTracker } from '@/components/shared/VisitorTracker'
import { getSiteSettings, getBannerSettings } from '@/lib/payload/queries'
import { resolveBannerTheme } from '@/lib/banner-themes'
import '../globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const notoSerifEthiopic = Noto_Serif_Ethiopic({
  subsets: ['ethiopic'],
  variable: '--font-noto-ethiopic',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  metadataBase: new URL((process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').trim()),
  title: {
    template: '%s | Eparchy of Segheneyti',
    default: 'Catholic Eparchy of Segheneyti',
  },
  description:
    "The official website of the Catholic Eparchy of Segheneyti in Eritrea — serving God's people through faith, community, and mission.",
  keywords: ['Eparchy', 'Segheneyti', 'Catholic', 'Eritrea', 'Church', 'ካቶሊካዊ', 'ሠገነይቲ'],
  authors: [{ name: 'Eparchy of Segheneyti' }],
  creator: 'Eparchy of Segheneyti',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Catholic Eparchy of Segheneyti',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
    },
  },
}

export default async function FrontendLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [locale, settings, messages, bannerSettings, cookieStore] = await Promise.all([
    getLocale(),
    getSiteSettings(),
    getMessages(),
    getBannerSettings(),
    cookies(),
  ])
  const ga4Id = settings.analytics?.ga4Id
  const gtmId = settings.analytics?.gtmId

  // Seasonal banner theme (admin-configurable) — exposed as CSS variables so
  // PageHeader on every page picks it up without per-page changes.
  const banner = resolveBannerTheme(bannerSettings)
  const bannerVars = {
    '--banner-bg': banner.background,
    '--banner-subtitle': banner.subtitle,
    '--banner-accent': banner.accent,
    '--banner-pattern-opacity': String(banner.patternOpacity),
    ...(banner.imageUrl
      ? {
          '--banner-image': `url("${banner.imageUrl.replace(/"/g, '%22')}")`,
          '--banner-image-opacity': String(banner.imageOpacity),
          '--banner-overlay-opacity': String(banner.imageOverlayOpacity),
        }
      : {}),
  } as React.CSSProperties

  // Reader text-size preference. Server-read so the chosen size is in the
  // first byte of HTML — no flash, no hydration shift. parseTextScale is an
  // allow-list; a crafted cookie value cannot reach this style attribute.
  const contentScale = parseTextScale(cookieStore.get(TEXT_SCALE_COOKIE)?.value)
  const rootVars = { ...bannerVars, '--content-scale': contentScale } as React.CSSProperties

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${notoSerifEthiopic.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-parchment text-charcoal-800 antialiased" style={rootVars}>
        <NextIntlClientProvider messages={messages}>
          {/* Cookie consent — also owns the analytics scripts, so GTM/GA4 are
              only ever injected after the visitor explicitly accepts. */}
          <CookieConsent ga4Id={ga4Id} gtmId={gtmId} />
          {/* Anonymous, aggregate visit counting (country + day only). */}
          <VisitorTracker />

          <SkipNav />
          <SiteHeader />
          <main id="main-content" className="min-h-screen">
            {children}
          </main>
          <SiteFooter />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
