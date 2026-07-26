/**
 * The news listing's view preference.
 *
 * Shared between the Server Component that reads the cookie and the client
 * toggle that writes it, so the name and the accepted values cannot drift.
 */

export const NEWS_VIEW_COOKIE = 'news-view'

export type NewsView = 'grid' | 'magazine'

/** The layout used when nobody has chosen one. */
export const DEFAULT_NEWS_VIEW: NewsView = 'magazine'

/**
 * Narrow an untrusted cookie value to a known view.
 *
 * Anything unrecognised falls back to the default rather than throwing — a
 * stale or hand-edited cookie must never break the news page.
 */
export function parseNewsView(value: string | undefined): NewsView {
  return value === 'grid' || value === 'magazine' ? value : DEFAULT_NEWS_VIEW
}
