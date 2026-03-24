import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { getLocale } from 'next-intl/server'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    template: '%s | Eparchy of Segeneyti',
    default: 'Catholic Eparchy of Segeneyti',
  },
  description:
    'The official website of the Catholic Eparchy of Segeneyti in Eritrea — serving God\'s people through faith, community, and mission.',
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  return (
    <html lang={locale} className={inter.variable} suppressHydrationWarning>
      <body className="bg-parchment text-charcoal-800 antialiased">
        {children}
      </body>
    </html>
  )
}
