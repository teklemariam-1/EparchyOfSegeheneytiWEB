import { parseVideoUrl } from '@/lib/video/embed'
import { cn } from '@/lib/utils'

/**
 * The player for a liturgy that was streamed.
 *
 * A Server Component: the embed URL is derived from a stored value with no
 * browser API involved, so there is nothing to hydrate. The iframe itself is
 * inert markup.
 *
 * An unrecognised URL renders NOTHING rather than an empty frame. That is the
 * deliberate choice: a visitor who came to watch Fasika is better served by an
 * event page with no player than by a black rectangle that never loads, and the
 * admin refuses the bad URL at paste time anyway (see the field validation on
 * the Events collection).
 */

interface LiturgyVideoProps {
  /** The URL as an editor pasted it. */
  url: string | null | undefined
  /** Accessible title — the event's own name, already translated by the caller. */
  title: string
  /** Translated "Watch on YouTube"-style fallback label. */
  fallbackLabel: string
  className?: string
}

export function LiturgyVideo({ url, title, fallbackLabel, className }: LiturgyVideoProps) {
  const video = parseVideoUrl(url)
  if (!video) return null

  return (
    <figure className={cn('not-prose', className)}>
      {/* 16:9 without a plugin. `aspect-video` keeps the frame from collapsing
          before the provider's script sizes it, which otherwise shows as a jump
          on slower connections. */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-charcoal-900">
        <iframe
          src={video.embedUrl}
          title={title}
          loading="lazy"
          // `allow` is the provider's minimum for playback and full-screen.
          // Deliberately no camera/microphone/geolocation.
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          // The embed is third-party: keep it from reaching back into this page.
          sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>

      {/* A player can still fail — a deleted video, a private stream, a blocked
          embed. The direct link is the way out, and costs one line. */}
      <figcaption className="mt-2 text-right">
        <a
          href={video.watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-maroon-700 hover:text-maroon-900 transition-colors"
        >
          {fallbackLabel} ↗
        </a>
      </figcaption>
    </figure>
  )
}
