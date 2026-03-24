import { getTranslations } from 'next-intl/server'

/**
 * Visually hidden skip link — becomes visible on keyboard focus.
 * Allows screen-reader and keyboard users to bypass the navigation.
 */
export async function SkipNav() {
  const t = await getTranslations('a11y')

  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[200] focus:px-4 focus:py-2 focus:rounded-md focus:bg-maroon-800 focus:text-white focus:font-medium focus:shadow-lg focus:outline-none"
    >
      {t('skipToMain')}
    </a>
  )
}
