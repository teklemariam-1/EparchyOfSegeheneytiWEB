import { withPayload } from '@payloadcms/next/withPayload'
import createNextIntlPlugin from 'next-intl/plugin'
import { withSentryConfig } from '@sentry/nextjs'
import withBundleAnalyzer from '@next/bundle-analyzer'
import type { NextConfig } from 'next'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

// ─── Content Security Policy ──────────────────────────────────────────────────
// Strict CSP for public frontend routes.
// `unsafe-eval` is only needed by the Next.js dev runtime; the production client
// bundle does not eval, so we drop it in production to harden against XSS.
const isProd = process.env.NODE_ENV === 'production'

// ── Third-party origins, grouped by the feature that needs them ───────────────
//
// STRIPE — card donations. We use **hosted Checkout**: the donor is redirected
// to checkout.stripe.com, enters their card on Stripe's own origin, and comes
// back. That is what keeps card data off this site entirely (PCI SAQ-A), and it
// also means the CSP below is doing less work than it looks — no Stripe script
// runs on our pages today.
//
// The origins are listed anyway because they are needed the moment anything
// embeds Stripe: Stripe.js, the Payment Element, or a 3-D Secure challenge
// iframe. Every one is required for that — a missing frame-src silently breaks
// the payment modal with nothing but a console error, which is a miserable thing
// to debug from a donor's bug report. `form-action` matters right now: the
// server action redirects the browser to Stripe, and a `form-action 'self'`
// blocks that navigation.
const STRIPE_SCRIPT = 'https://js.stripe.com'
const STRIPE_FRAME = 'https://js.stripe.com https://hooks.stripe.com'
const STRIPE_CONNECT = 'https://api.stripe.com'
const STRIPE_FORM = 'https://checkout.stripe.com'
//
// Turnstile (bot challenge on public forms) is already wired below, since it is
// toggleable at runtime from site-settings and must work the moment it is
// switched on.
const TURNSTILE_ORIGIN = 'https://challenges.cloudflare.com'

const frontendScriptSrc = [
  "script-src 'self' 'unsafe-inline'",
  isProd ? '' : "'unsafe-eval'",
  'https://www.googletagmanager.com https://www.google.com https://maps.googleapis.com',
  TURNSTILE_ORIGIN,
  STRIPE_SCRIPT,
]
  .filter(Boolean)
  .join(' ')

const CSP = [
  "default-src 'self'",
  // Scripts: Next.js inline runtime + Google Analytics (if used)
  frontendScriptSrc,
  // Styles: Next.js inlines critical CSS
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // Fonts
  "font-src 'self' https://fonts.gstatic.com",
  // Images: self + S3/R2 CDN + Google (maps tiles, GA pixel)
  `img-src 'self' data: blob: https://${process.env.S3_HOSTNAME ?? '*'} https://*.public.blob.vercel-storage.com https://www.google.com https://maps.gstatic.com https://maps.googleapis.com`,
  // Frames: Google Maps embed + Turnstile widget + Stripe's 3-D Secure iframe
  `frame-src https://www.google.com https://maps.google.com ${TURNSTILE_ORIGIN} ${STRIPE_FRAME}`,
  // XHR/fetch: self + Payload API + Sentry + Stripe
  `connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://o0.ingest.sentry.io https://*.ingest.sentry.io ${TURNSTILE_ORIGIN} ${STRIPE_CONNECT}`,
  // Media from S3/R2 + Vercel Blob
  `media-src 'self' https://${process.env.S3_HOSTNAME ?? '*'} https://*.public.blob.vercel-storage.com`,
  "object-src 'none'",
  "base-uri 'self'",
  // The donate server action redirects to Stripe's hosted Checkout; with
  // `'self'` alone the browser blocks that navigation and the donor is stranded
  // on a blank form with no error.
  `form-action 'self' ${STRIPE_FORM}`,
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join('; ')

// Relaxed CSP for the Payload admin panel.
// Payload's admin UI uses blob: URLs for webpack code-splitting and web workers;
// Vercel injects vercel.live feedback scripts on preview/production deployments.
const ADMIN_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://vercel.live https://vercel.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://vercel.live",
  "font-src 'self' data: https://fonts.gstatic.com https://vercel.live",
  // Media thumbnails/previews come from Vercel Blob (or the S3/R2 host). The
  // generic `https://*` here did not reliably match those hosts, so the admin
  // Media list rendered every image as a black box (the frontend CSP already
  // lists the Blob host explicitly, which is why the public site worked). List
  // the same hosts here.
  `img-src 'self' data: blob: https://*.public.blob.vercel-storage.com https://${process.env.S3_HOSTNAME ?? '*'} http://localhost:*`,
  "frame-src 'self' https://vercel.live",
  // Vercel live feedback uses Pusher websockets.
  // Vercel Blob is configured with clientUploads, so the browser PUTs the file
  // straight to blob.vercel-storage.com rather than proxying it through our
  // server (that is what keeps uploads under Vercel's ~4.5MB function body
  // limit). Without these hosts every admin upload dies on a CSP violation.
  "connect-src 'self' blob: https://blob.vercel-storage.com https://*.blob.vercel-storage.com https://*.public.blob.vercel-storage.com wss://ws-us3.pusher.com https://vercel.live https://*.vercel.live https://www.google-analytics.com https://region1.google-analytics.com https://o0.ingest.sentry.io https://*.ingest.sentry.io",
  "worker-src blob: 'self'",
  // Blob host is listed explicitly: without it this narrows to just the S3 host
  // the moment S3_HOSTNAME is set, silently breaking audio/video previews for
  // media stored on Vercel Blob.
  `media-src 'self' blob: https://${process.env.S3_HOSTNAME ?? '*'} https://*.public.blob.vercel-storage.com`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ')

const adminSecurityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Content-Security-Policy', value: ADMIN_CSP },
  // robots.txt asks crawlers not to fetch /admin; this instructs them not to
  // index it even if they arrive by a link or an already-known URL. Belt and
  // braces, because a login page in search results invites credential stuffing.
  { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
  // The admin must never be embedded, and it is exempt from the frontend
  // header block above, so it needs its own clickjacking guard.
  { key: 'X-Frame-Options', value: 'DENY' },
]

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
        // Apply security headers to every route EXCEPT /admin — admin has its
        // own CSP below. Sending two CSP headers causes browsers to AND-merge
        // them, which blocks the blob: scripts/workers Payload admin requires.
        source: '/((?!admin(?:/|$)).*)',
        headers: securityHeaders,
      },
      {
        // Relaxed CSP for Payload admin — needs blob: scripts, workers, and
        // vercel.live feedback scripts on Vercel deployments.
        source: '/admin(.*)',
        headers: adminSecurityHeaders,
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
    // Allow images from S3/R2 bucket, Vercel Blob, and CMS-hosted media
    remotePatterns: [
      {
        protocol: 'https',
        hostname: process.env.S3_HOSTNAME ?? 'localhost',
        pathname: '/**',
      },
      {
        // Vercel Blob public URLs: <storeId>.public.blob.vercel-storage.com
        protocol: 'https',
        hostname: '**.public.blob.vercel-storage.com',
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
