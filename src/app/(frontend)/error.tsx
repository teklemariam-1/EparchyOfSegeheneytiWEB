'use client'

import { useEffect } from 'react'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: Props) {
  useEffect(() => {
    // Log to an error reporting service in production
    console.error('[frontend-error]', error)
  }, [error])

  return (
    <div className="min-h-screen bg-parchment-50 flex flex-col items-center justify-center px-4 text-center">
      {/* Icon */}
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gold-50 border-2 border-gold-200">
        <svg
          className="h-10 w-10 text-gold-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
      </div>

      <div className="mb-6 h-px w-16 bg-gold-400" aria-hidden="true" />

      <h1 className="font-serif text-3xl sm:text-4xl font-bold text-charcoal-900 mb-3">
        Something went wrong
      </h1>

      <p className="text-charcoal-500 text-base max-w-sm mb-8 leading-relaxed">
        An unexpected error occurred. You can try reloading the page or return to
        the home page.
      </p>

      <div className="flex flex-wrap justify-center gap-3">
        <button
          onClick={reset}
          className="rounded-lg bg-maroon-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-maroon-700 transition-colors"
        >
          Try again
        </button>
        <a
          href="/"
          className="rounded-lg border border-charcoal-200 px-5 py-2.5 text-sm font-medium text-charcoal-700 hover:border-maroon-300 hover:text-maroon-800 transition-colors"
        >
          Return Home
        </a>
      </div>

      {process.env.NODE_ENV === 'development' && error.message && (
        <details className="mt-8 max-w-lg text-left">
          <summary className="cursor-pointer text-xs text-charcoal-400 hover:text-charcoal-600">
            Error details (development only)
          </summary>
          <pre className="mt-2 overflow-auto rounded-lg bg-charcoal-100 p-4 text-xs text-charcoal-700 whitespace-pre-wrap">
            {error.message}
            {error.digest && `\n\nDigest: ${error.digest}`}
          </pre>
        </details>
      )}
    </div>
  )
}
