import type { Metadata } from 'next'
import React from 'react'
import { Inter, Noto_Serif_Ethiopic } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getLocale } from 'next-intl/server'
import { SiteHeader } from '@/components/navigation/SiteHeader'
import { SiteFooter } from '@/components/navigation/SiteFooter'
import { SkipNav } from '@/components/shared/SkipNav'
import { CookieConsent } from '@/components/shared/CookieConsent'
import { VisitorTracker } from '@/components/shared/VisitorTracker'
import { getSiteSettings } from '@/lib/payload/queries'
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
    template: '%s | Eparchy of Segeneyti',
    default: 'Catholic Eparchy of Segeneyti',
  },
  description:
    "The official website of the Catholic Eparchy of Segeneyti in Eritrea — serving God's people through faith, community, and mission.",
  keywords: ['Eparchy', 'Segeneyti', 'Catholic', 'Eritrea', 'Church', 'ካቶሊካዊ', 'ሰገነይቲ'],
  authors: [{ name: 'Eparchy of Segeneyti' }],
  creator: 'Eparchy of Segeneyti',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Catholic Eparchy of Segeneyti',
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
  const [locale, settings, messages] = await Promise.all([
    getLocale(),
    getSiteSettings(),
    getMessages(),
  ])
  const ga4Id = settings.analytics?.ga4Id
  const gtmId = settings.analytics?.gtmId

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${notoSerifEthiopic.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-parchment text-charcoal-800 antialiased">
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
