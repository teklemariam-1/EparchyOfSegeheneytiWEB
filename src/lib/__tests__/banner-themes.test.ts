import { describe, it, expect } from 'vitest'
import { BANNER_THEMES, resolveBannerTheme, type BannerThemeColors } from '../banner-themes'

/** A theme rendered with no uploaded banner image. */
const plain = (theme: BannerThemeColors) => ({ ...theme, imageUrl: null, imageOverlayOpacity: 0 })

describe('resolveBannerTheme', () => {
  it('falls back to the default (brand red) theme when settings are missing', () => {
    expect(resolveBannerTheme(null)).toEqual(plain(BANNER_THEMES.default))
    expect(resolveBannerTheme(undefined)).toEqual(plain(BANNER_THEMES.default))
    expect(resolveBannerTheme({})).toEqual(plain(BANNER_THEMES.default))
  })

  it('returns the manually selected preset in manual mode', () => {
    expect(resolveBannerTheme({ mode: 'manual', theme: 'advent' })).toEqual(plain(BANNER_THEMES.advent))
  })

  it('ignores the schedule in manual mode', () => {
    const result = resolveBannerTheme(
      {
        mode: 'manual',
        theme: 'default',
        schedule: [{ theme: 'lent', startDate: '2026-01-01', endDate: '2026-12-31' }],
      },
      new Date('2026-06-15T12:00:00Z'),
    )
    expect(result).toEqual(plain(BANNER_THEMES.default))
  })

  it('picks the first matching schedule entry in scheduled mode', () => {
    const settings = {
      mode: 'scheduled' as const,
      theme: 'default' as const,
      schedule: [
        { theme: 'advent' as const, startDate: '2026-11-29', endDate: '2026-12-24' },
        { theme: 'christmas' as const, startDate: '2026-12-25', endDate: '2027-01-10' },
      ],
    }
    expect(resolveBannerTheme(settings, new Date('2026-12-01T12:00:00'))).toEqual(plain(BANNER_THEMES.advent))
    expect(resolveBannerTheme(settings, new Date('2026-12-30T12:00:00'))).toEqual(plain(BANNER_THEMES.christmas))
  })

  it('treats the end date as inclusive through the end of that day', () => {
    const settings = {
      mode: 'scheduled' as const,
      theme: 'default' as const,
      schedule: [{ theme: 'lent' as const, startDate: '2026-02-18', endDate: '2026-04-02' }],
    }
    expect(resolveBannerTheme(settings, new Date('2026-04-02T22:00:00'))).toEqual(plain(BANNER_THEMES.lent))
    expect(resolveBannerTheme(settings, new Date('2026-04-03T01:00:00'))).toEqual(plain(BANNER_THEMES.default))
  })

  it('falls back to the manual theme on dates outside every schedule entry', () => {
    const result = resolveBannerTheme(
      {
        mode: 'scheduled',
        theme: 'easter',
        schedule: [{ theme: 'advent', startDate: '2026-11-29', endDate: '2026-12-24' }],
      },
      new Date('2026-07-01T12:00:00'),
    )
    expect(result).toEqual(plain(BANNER_THEMES.easter))
  })

  it('applies custom colours and clamps/normalises pattern opacity', () => {
    const result = resolveBannerTheme({
      mode: 'manual',
      theme: 'custom',
      custom: {
        background: '#123456',
        subtitleColor: '#abcdef',
        accentColor: '#fff',
        patternOpacity: 250,
      },
    })
    expect(result).toEqual({
      background: '#123456',
      subtitle: '#abcdef',
      accent: '#fff',
      patternOpacity: 1,
      imageUrl: null,
      imageOverlayOpacity: 0,
    })
  })

  it('rejects invalid custom hex values and keeps safe defaults', () => {
    const result = resolveBannerTheme({
      mode: 'manual',
      theme: 'custom',
      custom: { background: 'red; } body { display: none', subtitleColor: '', accentColor: null },
    })
    expect(result).toEqual(plain(BANNER_THEMES.default))
  })

  it('replaces the design with the uploaded image: pattern hidden, tint only if requested', () => {
    const result = resolveBannerTheme({
      mode: 'manual',
      theme: 'advent',
      image: { image: { url: '/api/media/file/banner.jpg' }, overlayOpacity: 40 },
    })
    expect(result).toEqual({
      ...BANNER_THEMES.advent,
      patternOpacity: 0,
      imageUrl: '/api/media/file/banner.jpg',
      imageOverlayOpacity: 0.4,
    })
  })

  it('defaults the image overlay to 0 (exact image) and clamps out-of-range values', () => {
    const base = { mode: 'manual' as const, theme: 'default' as const }
    const withImage = (overlayOpacity?: number) =>
      resolveBannerTheme({ ...base, image: { image: { url: '/x.jpg' }, ...(overlayOpacity !== undefined ? { overlayOpacity } : {}) } })
    expect(withImage().imageOverlayOpacity).toBe(0)
    expect(withImage(500).imageOverlayOpacity).toBe(1)
    expect(withImage(-10).imageOverlayOpacity).toBe(0)
  })

  it('ignores unpopulated image relations (bare IDs) and applies images in scheduled mode too', () => {
    expect(resolveBannerTheme({ mode: 'manual', theme: 'default', image: { image: 42 } })).toEqual(
      plain(BANNER_THEMES.default),
    )
    const scheduled = resolveBannerTheme(
      {
        mode: 'scheduled',
        theme: 'default',
        image: { image: { url: '/x.jpg' }, overlayOpacity: 70 },
        schedule: [{ theme: 'advent', startDate: '2026-11-29', endDate: '2026-12-24' }],
      },
      new Date('2026-12-01T12:00:00'),
    )
    expect(scheduled).toEqual({
      ...BANNER_THEMES.advent,
      patternOpacity: 0,
      imageUrl: '/x.jpg',
      imageOverlayOpacity: 0.7,
    })
  })
})
