'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'
import { useTranslations } from 'next-intl'

const CONSENT_COOKIE = 'cookie-consent'
const ONE_YEAR = 60 * 60 * 24 * 365

type Consent = 'accepted' | 'declined'

function readConsent(): Consent | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|;\s*)cookie-consent=(accepted|declined)/)
  return (match?.[1] as Consent) ?? null
}

/**
 * Cookie consent banner.
 *
 * Analytics scripts are rendered by this component rather than the layout, so
 * they physically cannot load until the visitor has accepted — declining means
 * no tracking script is ever injected. The language cookie (NEXT_LOCALE) and the
 * admin session cookie are strictly necessary and therefore out of scope.
 */
export function CookieConsent({ ga4Id, gtmId }: { ga4Id?: string; gtmId?: string }) {
  const t = useTranslations('cookies')
  // `undefined` = not yet read on the client. Keeps SSR output and the first
  // client paint identical, so the banner never flashes for people who already chose.
  const [consent, setConsent] = useState<Consent | null | undefined>(undefined)

  useEffect(() => {
    setConsent(readConsent())
  }, [])

  const choose = (value: Consent) => {
    document.cookie = `${CONSENT_COOKIE}=${value}; path=/; max-age=${ONE_YEAR}; SameSite=Lax`
    setConsent(value)
  }

  const analyticsAllowed = consent === 'accepted'
  const showBanner = consent === null
  const hasAnalytics = Boolean(ga4Id || gtmId)

  return (
    <>
      {/* Tracking loads only after explicit consent */}
      {analyticsAllowed && gtmId && (
        <Script id="gtm-init" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`}
        </Script>
      )}
      {analyticsAllowed && ga4Id && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga4Id}');`}
          </Script>
        </>
      )}

      {showBanner && (
        <div
          role="dialog"
          aria-modal="false"
          aria-labelledby="cookie-consent-title"
          className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4"
        >
          <div className="mx-auto max-w-4xl rounded-2xl border border-charcoal-200 bg-white p-5 shadow-lg sm:p-6">
            <h2
              id="cookie-consent-title"
              className="font-serif text-base font-semibold text-charcoal-900"
            >
              {t('title')}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-charcoal-600">
              {hasAnalytics ? t('message') : t('messageNecessaryOnly')}{' '}
              <a
                href="/privacy"
                className="font-medium text-maroon-700 underline underline-offset-2 hover:text-maroon-900"
              >
                {t('learnMore')}
              </a>
            </p>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={() => choose('declined')}
                className="rounded-lg border border-charcoal-200 px-5 py-2.5 text-sm font-medium text-charcoal-700 transition-colors hover:border-charcoal-300 hover:bg-charcoal-50"
              >
                {t('decline')}
              </button>
              <button
                type="button"
                onClick={() => choose('accepted')}
                className="rounded-lg bg-maroon-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-maroon-700"
              >
                {t('accept')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
