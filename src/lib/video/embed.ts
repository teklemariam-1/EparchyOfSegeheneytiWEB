/**
 * Turns a pasted video link into an embed, or refuses it.
 *
 * The editor-facing promise is "paste the URL" — a chancery secretary should not
 * have to know what an embed URL is, or find a video ID inside a share link. So
 * this accepts the shapes people actually paste, including the ones YouTube's
 * own share button produces (`youtu.be/ID?si=…`), and the `/live/` form that a
 * streamed liturgy has while it is on air.
 *
 * ── Why this is an allow-list ────────────────────────────────────────────────
 * The parsed result goes into an <iframe src>. Passing an arbitrary URL there
 * would let anyone who can edit an event embed anything at all on the site —
 * including a page that mimics the eparchy's own login. So an unrecognised host
 * is REFUSED rather than passed through, and the ID itself is checked against a
 * strict character class before it is interpolated into a URL.
 *
 * Refusal is a real outcome, not an error state: the caller renders the event
 * without a player rather than an empty frame, and the admin shows a validation
 * message so the mistake is caught at paste time.
 */

export type VideoProvider = 'youtube' | 'facebook'

export interface ParsedVideo {
  provider: VideoProvider
  /** Provider-side identifier, already validated as safe to interpolate. */
  id: string
  /** URL suitable for an <iframe src>. */
  embedUrl: string
  /** Canonical watch URL, for a "watch on YouTube" fallback link. */
  watchUrl: string
}

/** YouTube IDs are 11 chars of an unreserved alphabet. Anything else is not an ID. */
const YOUTUBE_ID = /^[\w-]{11}$/

/** Facebook video IDs are digits, sometimes long. */
const FACEBOOK_ID = /^\d{5,}$/

const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
  'youtu.be',
])

const FACEBOOK_HOSTS = new Set(['facebook.com', 'www.facebook.com', 'web.facebook.com', 'fb.watch'])

function youtubeIdFrom(url: URL): string | null {
  // youtu.be/ID — the share-button form.
  if (url.hostname === 'youtu.be') {
    const id = url.pathname.slice(1).split('/')[0] ?? ''
    return YOUTUBE_ID.test(id) ? id : null
  }

  // youtube.com/watch?v=ID — the address-bar form.
  const v = url.searchParams.get('v')
  if (v && YOUTUBE_ID.test(v)) return v

  // /live/ID while a liturgy is streaming, /embed/ID if someone pasted an
  // embed, /shorts/ID for a clip. All carry the id in the second segment.
  const segments = url.pathname.split('/').filter(Boolean)
  if (segments.length >= 2 && ['live', 'embed', 'shorts', 'v'].includes(segments[0]!)) {
    const id = segments[1]!
    return YOUTUBE_ID.test(id) ? id : null
  }

  return null
}

function facebookIdFrom(url: URL): string | null {
  // facebook.com/watch/?v=ID
  const v = url.searchParams.get('v')
  if (v && FACEBOOK_ID.test(v)) return v

  // facebook.com/<page>/videos/ID or /videos/<slug>/ID
  const segments = url.pathname.split('/').filter(Boolean)
  const videosAt = segments.indexOf('videos')
  if (videosAt !== -1) {
    // The id is the last all-digit segment after /videos/.
    for (let i = segments.length - 1; i > videosAt; i--) {
      if (FACEBOOK_ID.test(segments[i]!)) return segments[i]!
    }
  }
  return null
}

/**
 * Parse a pasted URL. Returns `null` for anything not recognised — an unknown
 * host, a malformed link, or a known host with no identifiable video.
 */
export function parseVideoUrl(input: string | null | undefined): ParsedVideo | null {
  if (typeof input !== 'string') return null
  const trimmed = input.trim()
  if (!trimmed) return null

  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    return null
  }

  // http(s) only: a `javascript:` or `data:` URL must never reach an iframe.
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null

  const host = url.hostname.toLowerCase()

  if (YOUTUBE_HOSTS.has(host)) {
    const id = youtubeIdFrom(url)
    if (!id) return null
    return {
      provider: 'youtube',
      id,
      // youtube-nocookie defers YouTube's tracking cookies until playback — the
      // right default for a church site whose visitors did not ask to be
      // tracked for watching a liturgy.
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
      watchUrl: `https://www.youtube.com/watch?v=${id}`,
    }
  }

  if (FACEBOOK_HOSTS.has(host)) {
    // fb.watch links are shortened and carry no id; they cannot be embedded
    // without resolving the redirect server-side, so they are refused with a
    // message telling the editor to paste the full link instead.
    const id = facebookIdFrom(url)
    if (!id) return null
    const href = encodeURIComponent(`https://www.facebook.com/watch/?v=${id}`)
    return {
      provider: 'facebook',
      id,
      embedUrl: `https://www.facebook.com/plugins/video.php?href=${href}&show_text=false`,
      watchUrl: `https://www.facebook.com/watch/?v=${id}`,
    }
  }

  return null
}

/** Whether a pasted value would produce a working player. Used by admin validation. */
export function isEmbeddableVideoUrl(input: string | null | undefined): boolean {
  return parseVideoUrl(input) !== null
}

/**
 * The origins an embed needs in the CSP.
 *
 * Exported so next.config.ts and this parser cannot drift: if a provider is
 * added here without its origin being allowed, the player fails silently with
 * only a console error.
 */
export const VIDEO_FRAME_ORIGINS = [
  'https://www.youtube-nocookie.com',
  'https://www.youtube.com',
  'https://www.facebook.com',
] as const
