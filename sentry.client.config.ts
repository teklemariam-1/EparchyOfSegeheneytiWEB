import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Capture 10% of transactions in production; 100% in dev/staging
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Only capture replays on errors in production to respect user privacy
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0,

  debug: false,

  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  beforeSend(event) {
    // Strip PII from error messages before sending
    if (event.request?.cookies) {
      delete event.request.cookies
    }
    return event
  },
})
