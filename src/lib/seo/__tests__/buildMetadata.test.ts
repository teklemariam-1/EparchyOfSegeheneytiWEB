import { describe, it, expect } from 'vitest'
import { buildMetadata } from '../buildMetadata'

// ─── title formatting ────────────────────────────────────────────────────────

describe('buildMetadata — title', () => {
  it('appends site name for non-home pages', () => {
    const meta = buildMetadata({ title: 'News & Events' })
    const title = meta.title as { absolute: string }
    expect(title.absolute).toContain('News & Events')
    expect(title.absolute).toContain('Catholic Eparchy of Segeneyti')
  })

  it('uses the plain title string for the home page', () => {
    const meta = buildMetadata({ title: 'Welcome', isHome: true })
    expect(meta.title).toBe('Welcome')
  })
})

// ─── canonical URL ───────────────────────────────────────────────────────────

describe('buildMetadata — canonical URL', () => {
  it('sets canonical to SITE_URL when path is omitted', () => {
    const meta = buildMetadata({ title: 'Test' })
    expect(typeof meta.alternates?.canonical).toBe('string')
  })

  it('appends path to site URL for canonical', () => {
    const meta = buildMetadata({ title: 'News', path: '/news' })
    expect((meta.alternates?.canonical as string)).toContain('/news')
  })
})

// ─── description propagation ─────────────────────────────────────────────────

describe('buildMetadata — description', () => {
  it('passes description to openGraph', () => {
    const meta = buildMetadata({ title: 'T', description: 'Eparchy news feed' })
    expect(meta.openGraph?.description).toBe('Eparchy news feed')
  })

  it('passes description to twitter card', () => {
    const meta = buildMetadata({ title: 'T', description: 'Eparchy news feed' })
    expect(meta.twitter?.description).toBe('Eparchy news feed')
  })
})

// ─── OG image ────────────────────────────────────────────────────────────────

describe('buildMetadata — OG image', () => {
  it('uses the provided image URL', () => {
    const meta = buildMetadata({ title: 'T', image: 'https://cdn.example.com/hero.jpg' })
    const images = meta.openGraph?.images as Array<{ url: string }>
    expect(images[0].url).toBe('https://cdn.example.com/hero.jpg')
  })

  it('falls back to the default OG image when none supplied', () => {
    const meta = buildMetadata({ title: 'T' })
    const images = meta.openGraph?.images as Array<{ url: string }>
    expect(images[0].url).toContain('og-default.jpg')
  })

  it('propagates the same image to twitter', () => {
    const meta = buildMetadata({ title: 'T', image: 'https://cdn.example.com/hero.jpg' })
    const twitterImages = meta.twitter?.images as string[]
    expect(twitterImages[0]).toBe('https://cdn.example.com/hero.jpg')
  })
})

// ─── robots ──────────────────────────────────────────────────────────────────

describe('buildMetadata — robots', () => {
  it('allows indexing by default', () => {
    const meta = buildMetadata({ title: 'T' })
    const robots = meta.robots as { index: boolean; follow: boolean }
    expect(robots.index).toBe(true)
    expect(robots.follow).toBe(true)
  })

  it('disables indexing when noIndex is true', () => {
    const meta = buildMetadata({ title: 'T', noIndex: true })
    const robots = meta.robots as { index: boolean; follow: boolean }
    expect(robots.index).toBe(false)
    expect(robots.follow).toBe(false)
  })
})

// ─── openGraph type ───────────────────────────────────────────────────────────

describe('buildMetadata — openGraph type', () => {
  it('defaults to "website"', () => {
    const meta = buildMetadata({ title: 'T' })
    expect(meta.openGraph?.type).toBe('website')
  })

  it('uses "article" when specified', () => {
    const meta = buildMetadata({ title: 'T', type: 'article' })
    expect(meta.openGraph?.type).toBe('article')
  })
})
