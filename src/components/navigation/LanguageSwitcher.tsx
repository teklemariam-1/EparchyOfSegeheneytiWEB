'use client'

interface Props {
  /** Current locale resolved server-side ('en' | 'ti'). */
  currentLocale: string
}

/**
 * Two-state language toggle: EN ↔ ትግርኛ.
 * Persists choice in a 1-year cookie (`NEXT_LOCALE`) and reloads the page.
 */
export function LanguageSwitcher({ currentLocale }: Props) {
  const isTigrinya = currentLocale === 'ti'

  const handleSwitch = () => {
    const next = isTigrinya ? 'en' : 'ti'
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; SameSite=Lax`
    window.location.reload()
  }

  return (
    <button
      type="button"
      onClick={handleSwitch}
      className="hidden sm:inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-charcoal-600 hover:bg-charcoal-50 hover:text-maroon-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon-700"
      aria-label={isTigrinya ? 'Switch to English' : 'Switch to ትግርኛ'}
      title={isTigrinya ? 'Switch to English' : 'Switch to ትግርኛ (Tigrinya)'}
    >
      <span aria-hidden="true">🌐</span>
      <span>{isTigrinya ? 'EN' : 'ትግ'}</span>
    </button>
  )
}
