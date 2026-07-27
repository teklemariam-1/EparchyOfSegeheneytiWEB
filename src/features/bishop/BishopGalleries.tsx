'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import type { BishopGallery } from '@/lib/bishops/queries'

/**
 * Grouped photo galleries with a fullscreen lightbox.
 *
 * Bandwidth is a real constraint — a significant share of visitors are on slow
 * or metered Eritrean connections — so the grid never ships originals:
 * `next/image` with an explicit `sizes` serves a thumbnail-sized variant, and
 * everything below the fold is `loading="lazy"`. The full-resolution image is
 * only fetched when someone actually opens the lightbox, and `priority` is
 * never set.
 *
 * Alt text comes from the media record in the active locale. Where a caption
 * exists but alt text does not, the caption is used rather than an empty
 * string, so a screen reader hears something meaningful instead of "image".
 */
export function BishopGalleries({
  galleries,
  labels,
}: {
  galleries: BishopGallery[]
  labels: { close: string; previous: string; next: string; photos: string; untitled: string }
}) {
  // Which gallery is open, and which image within it.
  const [open, setOpen] = useState<{ gallery: number; image: number } | null>(null)
  const touchStartX = useRef<number | null>(null)

  const close = useCallback(() => setOpen(null), [])

  const step = useCallback(
    (delta: number) => {
      setOpen((current) => {
        if (!current) return current
        const images = galleries[current.gallery]?.images ?? []
        if (images.length === 0) return current
        return {
          ...current,
          image: (current.image + delta + images.length) % images.length,
        }
      })
    },
    [galleries],
  )

  // Keyboard controls and scroll lock, matching the media gallery's behaviour.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowLeft') step(-1)
      else if (e.key === 'ArrowRight') step(1)
    }
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [open, close, step])

  if (!galleries.length) return null

  const active = open ? galleries[open.gallery]?.images?.[open.image] : null

  return (
    <div className="space-y-10">
      {galleries.map((gallery, g) => {
        const images = (gallery.images ?? []).filter((entry) => entry?.image?.url)
        if (!images.length) return null

        return (
          <section key={gallery.key ?? g} id={`gallery-${gallery.key ?? g}`} className="scroll-mt-24">
            <h3 className="font-serif text-xl font-bold text-charcoal-900">{gallery.title}</h3>
            {gallery.description ? (
              <p className="bishop-prose mt-1 text-charcoal-600">{gallery.description}</p>
            ) : null}
            <p className="mt-1 text-sm text-charcoal-500">
              {images.length} {labels.photos}
            </p>

            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {images.map((entry, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => setOpen({ gallery: g, image: i })}
                    className="group relative block aspect-[4/3] w-full overflow-hidden rounded-lg focus-visible:ring-2 focus-visible:ring-maroon-700 focus-visible:ring-offset-2"
                  >
                    <Image
                      src={entry.image!.url!}
                      alt={entry.image?.alt || entry.caption || labels.untitled}
                      fill
                      loading="lazy"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                  </button>
                  {entry.caption ? (
                    <p className="mt-1 text-xs text-charcoal-600">{entry.caption}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        )
      })}

      {open && active?.image?.url ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={active.caption ?? labels.untitled}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4"
          onClick={close}
          onTouchStart={(e) => {
            touchStartX.current = e.touches[0]?.clientX ?? null
          }}
          onTouchEnd={(e) => {
            const start = touchStartX.current
            touchStartX.current = null
            if (start === null) return
            const delta = (e.changedTouches[0]?.clientX ?? start) - start
            if (Math.abs(delta) > 50) step(delta > 0 ? -1 : 1)
          }}
        >
          <div
            className="relative h-[75vh] w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={active.image.url}
              alt={active.image.alt || active.caption || labels.untitled}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>

          {active.caption || active.credit ? (
            <p className="mt-3 max-w-2xl text-center text-sm text-white/80">
              {active.caption}
              {active.credit ? <span className="text-white/50"> — {active.credit}</span> : null}
            </p>
          ) : null}

          <button
            type="button"
            onClick={close}
            aria-label={labels.close}
            className="absolute end-4 top-4 rounded-full bg-white/10 px-3 py-1 text-2xl leading-none text-white hover:bg-white/20"
          >
            ×
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              step(-1)
            }}
            aria-label={labels.previous}
            className="absolute start-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 px-3 py-2 text-white hover:bg-white/20"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              step(1)
            }}
            aria-label={labels.next}
            className="absolute end-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 px-3 py-2 text-white hover:bg-white/20"
          >
            ›
          </button>
        </div>
      ) : null}
    </div>
  )
}
