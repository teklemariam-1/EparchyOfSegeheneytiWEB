/**
 * Share-intent URLs for article cards.
 *
 * WhatsApp is first on purpose: it is the dominant channel for Eritrean
 * diaspora communication, so it is the share that actually gets used here.
 *
 * `wa.me` (not `api.whatsapp.com`) is the documented universal link — it opens
 * the native app on mobile and WhatsApp Web on desktop, rather than bouncing
 * mobile users through a web page that then tries to hand off to the app.
 */

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.segeneyti.org').replace(/\/$/, '')

export type ShareTarget = 'whatsapp' | 'facebook' | 'x'

/** Absolute, canonical URL for an article — share targets reject relative links. */
export function articleUrl(slug: string): string {
  return `${SITE_URL}/news/${slug}`
}

/**
 * Build the share URL for one target.
 *
 * Every interpolated value is percent-encoded: article titles routinely contain
 * `&`, `?`, `#`, and Ge'ez punctuation, any of which would truncate the shared
 * link or corrupt the message if passed raw.
 */
export function shareUrl(target: ShareTarget, title: string, slug: string): string {
  const url = articleUrl(slug)
  const encodedUrl = encodeURIComponent(url)

  switch (target) {
    case 'whatsapp':
      // WhatsApp takes a single free-text message, so the title and link are
      // combined; the newline renders as a line break in the chat draft.
      return `https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`
    case 'facebook':
      // Facebook ignores any caption parameter and reads the page's Open Graph
      // tags instead, so only the URL is sent.
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
    case 'x':
      return `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodedUrl}`
  }
}
