import { describe, it, expect } from 'vitest'
import {
  resolveDateRange,
  countryName,
  countryFlag,
  deviceFromUserAgent,
  categorizeSource,
  primaryLanguage,
  normalizePath,
  contentBucket,
} from '../analytics'

const TODAY = '2026-07-23' // a Thursday

describe('resolveDateRange', () => {
  it('resolves fixed ranges', () => {
    expect(resolveDateRange('today', TODAY)).toMatchObject({ from: TODAY, to: TODAY })
    expect(resolveDateRange('yesterday', TODAY)).toMatchObject({ from: '2026-07-22', to: '2026-07-22' })
    expect(resolveDateRange('last-7-days', TODAY)).toMatchObject({ from: '2026-07-17', to: TODAY })
    expect(resolveDateRange('last-30-days', TODAY)).toMatchObject({ from: '2026-06-24', to: TODAY })
    expect(resolveDateRange('last-90-days', TODAY)).toMatchObject({ from: '2026-04-25', to: TODAY })
  })

  it('resolves week ranges from Monday', () => {
    expect(resolveDateRange('this-week', TODAY)).toMatchObject({ from: '2026-07-20', to: TODAY })
    expect(resolveDateRange('last-week', TODAY)).toMatchObject({ from: '2026-07-13', to: '2026-07-19' })
  })

  it('resolves month and year ranges', () => {
    expect(resolveDateRange('this-month', TODAY)).toMatchObject({ from: '2026-07-01', to: TODAY })
    expect(resolveDateRange('last-month', TODAY)).toMatchObject({ from: '2026-06-01', to: '2026-06-30' })
    expect(resolveDateRange('this-year', TODAY)).toMatchObject({ from: '2026-01-01', to: TODAY })
    expect(resolveDateRange('last-year', TODAY)).toMatchObject({ from: '2025-01-01', to: '2025-12-31' })
  })

  it('handles all-time, custom and bad input', () => {
    expect(resolveDateRange('all-time', TODAY).from).toBeNull()
    expect(resolveDateRange('custom', TODAY, '2026-01-05', '2026-02-10')).toMatchObject({
      from: '2026-01-05',
      to: '2026-02-10',
    })
    // to before from clamps to from
    expect(resolveDateRange('custom', TODAY, '2026-03-01', '2026-01-01').to).toBe('2026-03-01')
    // unknown key falls back to last 30 days
    expect(resolveDateRange('nonsense', TODAY).key).toBe('last-30-days')
  })
})

describe('country helpers', () => {
  it('resolves full names and flags', () => {
    expect(countryName('ER')).toBe('Eritrea')
    expect(countryName('IT')).toBe('Italy')
    expect(countryFlag('ER')).toBe('🇪🇷')
    expect(countryFlag('us')).toBe('🇺🇸')
  })
  it('falls back gracefully', () => {
    expect(countryName('Unknown')).toBe('Unknown')
    expect(countryFlag('Unknown')).toBe('🏳️')
  })
})

describe('deviceFromUserAgent', () => {
  it('classifies devices', () => {
    expect(deviceFromUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')).toBe('mobile')
    expect(deviceFromUserAgent('Mozilla/5.0 (Linux; Android 14; SM-G991B) Mobile Safari')).toBe('mobile')
    expect(deviceFromUserAgent('Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)')).toBe('tablet')
    expect(deviceFromUserAgent('Mozilla/5.0 (Linux; Android 14; SM-X710)')).toBe('tablet')
    expect(deviceFromUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe('desktop')
    expect(deviceFromUserAgent(null)).toBe('desktop')
  })
})

describe('categorizeSource', () => {
  it('buckets referrers', () => {
    expect(categorizeSource('')).toBe('direct')
    expect(categorizeSource(null)).toBe('direct')
    expect(categorizeSource('https://www.google.com/search?q=x')).toBe('google')
    expect(categorizeSource('https://www.google.it/')).toBe('google')
    expect(categorizeSource('https://www.bing.com/search')).toBe('bing')
    expect(categorizeSource('https://m.facebook.com/')).toBe('facebook')
    expect(categorizeSource('https://youtu.be/abc')).toBe('youtube')
    expect(categorizeSource('https://t.me/channel')).toBe('telegram')
    expect(categorizeSource('https://x.com/post')).toBe('x-twitter')
    expect(categorizeSource('https://t.co/xyz')).toBe('x-twitter')
    expect(categorizeSource('https://example.org/page')).toBe('referral')
  })
  it('treats own host as direct', () => {
    expect(categorizeSource('https://eparchy.example/news', 'eparchy.example')).toBe('direct')
  })
})

describe('primaryLanguage', () => {
  it('extracts the primary subtag', () => {
    expect(primaryLanguage('ti-ER,ti;q=0.9,en;q=0.8')).toBe('ti')
    expect(primaryLanguage('en-US,en;q=0.9')).toBe('en')
    expect(primaryLanguage('')).toBe('unknown')
    expect(primaryLanguage(null)).toBe('unknown')
  })
})

describe('normalizePath', () => {
  it('normalizes and rejects non-trackable paths', () => {
    expect(normalizePath('/news/some-slug?utm=1#x')).toBe('/news/some-slug')
    expect(normalizePath('/news/')).toBe('/news')
    expect(normalizePath('/')).toBe('/')
    expect(normalizePath('/admin/collections/news')).toBeNull()
    expect(normalizePath('/api/track')).toBeNull()
    expect(normalizePath('not-a-path')).toBeNull()
    expect(normalizePath(undefined)).toBeNull()
  })
})

describe('contentBucket', () => {
  it('groups paths into content areas', () => {
    expect(contentBucket('/')).toBe('Home')
    expect(contentBucket('/news/some-story')).toBe('News')
    expect(contentBucket('/geez-calendar')).toBe("Ge'ez Calendar")
    expect(contentBucket('/something-else')).toBe('Other pages')
  })
})
