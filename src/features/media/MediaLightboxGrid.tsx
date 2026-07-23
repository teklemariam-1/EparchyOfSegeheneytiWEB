'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Badge } from '@/components/ui/Badge'
import type { MediaItem } from '@/lib/payload/queries'

const CATEGORY_LABELS: Record<string, string> = {
  general: 'General',
  event: 'Event',
  parish: 'Parish',
  clergy: 'Clergy',
  document: 'Document',
}

/**
 * Media gallery grid with a fullscreen lightbox.
 *
 * Click an image to view it full-size on a darkened backdrop; close with ×,
 * Esc or a click outside; navigate with arrows, arrow keys or swipe; zoom
 * with the mouse wheel, double-click/tap, or the zoom buttons.
 */
export function MediaLightboxGrid({ items }: { items: MediaItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [zoom, setZoom] = useState(1)
  const touchStartX = useRef<number | null>(null)

  const close = useCallback(() => {
    setOpenIndex(null)
    setZoom(1)
  }, [])

  const step = useCallback(
    (delta: number) => {
      setOpenIndex((cur) => {
        if (cur === null || items.length === 0) return cur
        setZoom(1)
        return (cur + delta + items.length) % items.length
      })
    },
    [items.length],
  )

  // Keyboard controls + scroll lock while open.
  useEffect(() => {
    if (openIndex === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowLeft') step(-1)
      else if (e.key === 'ArrowRight') step(1)
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [openIndex, close, step])

  const current = openIndex !== null ? items[openIndex] : null

  const navBtn: React.CSSProperties = {}

  return (
    <>
      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map((item, i) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setOpenIndex(i)}
            aria-label={`View ${item.alt || 'image'} full size`}
            className="group relative aspect-square overflow-hidden rounded-xl bg-charcoal-100 focus-visible:ring-2 focus-visible:ring-maroon-600 focus-visible:outline-none"
          >
            <Image
              src={item.sizes?.card?.url ?? item.sizes?.thumbnail?.url ?? item.url}
              alt={item.alt}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {item.alt && (
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 pt-6 text-left text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                {item.alt}
              </span>
            )}
            {item.category && (
              <span className="absolute left-2 top-2">
                <Badge variant="maroon" size="sm">
                  {CATEGORY_LABELS[item.category] ?? item.category}
                </Badge>
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {current && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={current.alt || 'Image viewer'}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in"
          onClick={close}
          onTouchStart={(e) => {
            touchStartX.current = e.touches[0]?.clientX ?? null
          }}
          onTouchEnd={(e) => {
            const start = touchStartX.current
            touchStartX.current = null
            const end = e.changedTouches[0]?.clientX
            if (start !== null && end !== undefined && Math.abs(end - start) > 60) {
              step(end < start ? 1 : -1)
            }
          }}
          onWheel={(e) => {
            setZoom((z) => Math.min(4, Math.max(1, z + (e.deltaY < 0 ? 0.25 : -0.25))))
          }}
        >
          {/* Close */}
          <button
            type="button"
            onClick={close}
            aria-label="Close image viewer"
            className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition-colors hover:bg-white/25 focus-visible:ring-2 focus-visible:ring-white"
          >
            ×
          </button>

          {/* Zoom controls */}
          <div className="absolute left-4 top-4 z-10 flex gap-2">
            {[
              { label: 'Zoom out', sym: '−', d: -0.5 },
              { label: 'Zoom in', sym: '+', d: 0.5 },
            ].map((b) => (
              <button
                key={b.label}
                type="button"
                aria-label={b.label}
                onClick={(e) => {
                  e.stopPropagation()
                  setZoom((z) => Math.min(4, Math.max(1, z + b.d)))
                }}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-xl text-white transition-colors hover:bg-white/25"
              >
                {b.sym}
              </button>
            ))}
            {zoom > 1 && (
              <span className="flex h-11 items-center rounded-full bg-white/10 px-3 text-xs text-white">
                {Math.round(zoom * 100)}%
              </span>
            )}
          </div>

          {/* Prev / Next */}
          {items.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous image"
                onClick={(e) => {
                  e.stopPropagation()
                  step(-1)
                }}
                className="absolute left-2 sm:left-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition-colors hover:bg-white/25"
                style={navBtn}
              >
                ‹
              </button>
              <button
                type="button"
                aria-label="Next image"
                onClick={(e) => {
                  e.stopPropagation()
                  step(1)
                }}
                className="absolute right-2 sm:right-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition-colors hover:bg-white/25"
              >
                ›
              </button>
            </>
          )}

          {/* Image */}
          {/* eslint-disable-next-line @next/next/no-img-element -- full-resolution original, uncropped/unoptimized by design */}
          <img
            src={current.url}
            alt={current.alt}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => {
              e.stopPropagation()
              setZoom((z) => (z > 1 ? 1 : 2))
            }}
            draggable={false}
            className="max-h-[86vh] max-w-[92vw] select-none object-contain transition-transform duration-200"
            style={{ transform: `scale(${zoom})`, cursor: zoom > 1 ? 'zoom-out' : 'zoom-in' }}
          />

          {/* Caption bar */}
          <div
            className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-10 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            {current.alt && <p className="text-sm font-medium text-white">{current.alt}</p>}
            <p className="mt-1 text-xs text-white/60">
              {current.category ? `${CATEGORY_LABELS[current.category] ?? current.category} · ` : ''}
              {openIndex! + 1} / {items.length}
            </p>
          </div>
        </div>
      )}
    </>
  )
}

export default MediaLightboxGrid
