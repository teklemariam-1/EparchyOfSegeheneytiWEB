import { withPayload } from '@payloadcms/next/withPayload'
import createNextIntlPlugin from 'next-intl/plugin'
import { withSentryConfig } from '@sentry/nextjs'
import withBundleAnalyzer from '@next/bundle-analyzer'
import type { NextConfig } from 'next'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

// ─── Content Security Policy ──────────────────────────────────────────────────
// Strict CSP; adjust `img-src` and `connect-src` when adding third-party services.
const CSP = [
  "default-src 'self'",
  // Scripts: Next.js inline runtime + Google Analytics (if used)
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google.com https://maps.googleapis.com",
  // Styles: Next.js inlines critical CSS
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // Fonts
  "font-src 'self' https://fonts.gstatic.com",
  // Images: self + S3/R2 CDN + Google (maps tiles, GA pixel)
  `img-src 'self' data: blob: https://${process.env.S3_HOSTNAME ?? '*'} https://www.google.com https://maps.gstatic.com https://maps.googleapis.com`,
  // Frames: Google Maps embed only
  "frame-src https://www.google.com https://maps.google.com",
  // XHR/fetch: self + Payload API + Sentry
  "connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://o0.ingest.sentry.io https://*.ingest.sentry.io",
  // Media from S3/R2
  `media-src 'self' https://${process.env.S3_HOSTNAME ?? '*'}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join('; ')

const securityHeaders = [
  // Prevent MIME sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Block clickjacking — also covered by frame-ancestors in CSP
  { key: 'X-Frame-Options', value: 'DENY' },
  // Stop leaking referrer to third parties
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Permissions policy: disable unused browser features
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  // HSTS: 1 year, include subdomains, preload-ready
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
  // CSP
  { key: 'Content-Security-Policy', value: CSP },
]

const nextConfig: NextConfig = {
  experimental: {
    reactCompiler: false,
  },

  // ── Compression ─────────────────────────────────────────────────────────────
  compress: true,

  // ── Power-on headers ────────────────────────────────────────────────────────
  async headers() {
    return [
      {
        // Apply security headers to every route
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        // Long-lived cache for immutable Next.js static chunks
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // Cache public assets for 7 days
        source: '/(.*)\\.(ico|png|jpg|jpeg|webp|svg|woff2|woff|ttf)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' },
        ],
      },
    ]
  },

  images: {
    // Allow images from S3/R2 bucket + CMS-hosted media
    remotePatterns: [
      {
        protocol: 'https',
        hostname: process.env.S3_HOSTNAME ?? 'localhost',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        pathname: '/media/**',
      },
    ],
    // Serve modern formats automatically
    formats: ['image/avif', 'image/webp'],
  },

  async redirects() {
    return []
  },
}

const sentryOptions = {
  // Upload source maps only when SENTRY_AUTH_TOKEN is set (CI/CD)
  silent: !process.env.SENTRY_AUTH_TOKEN,
  org: process.env.SENTRY_ORG ?? 'eparchy-segeneyti',
  project: process.env.SENTRY_PROJECT ?? 'segeneyti-web',
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Automatically tree-shake Sentry logger in production
  disableLogger: true,
  // Tunnel Sentry requests through /api/monitoring to bypass ad-blockers
  tunnelRoute: '/api/monitoring',
  // Hides source maps from the browser bundle
  hideSourceMaps: true,
  // Auto-instrument Next.js data fetching
  automaticVercelMonitors: false,
}

const withAnalyzer = withBundleAnalyzer({ enabled: process.env.ANALYZE === 'true' })

export default withSentryConfig(
  withNextIntl(withPayload(withAnalyzer(nextConfig))),
  sentryOptions,
)
