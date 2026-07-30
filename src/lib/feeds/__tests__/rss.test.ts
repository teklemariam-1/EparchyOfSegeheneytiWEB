import { describe, it, expect } from 'vitest'
import { buildRssXml, escapeXml } from '../rss'

/**
 * One unescaped character corrupts the document for every subscriber, so
 * escaping is the property under test — with the site's real content shapes:
 * Ge'ez titles, ampersands, quotes.
 */

const channel = {
  title: 'Eparchy News',
  description: 'News & announcements',
  siteUrl: 'https://example.org/news',
  feedUrl: 'https://example.org/news/rss.xml',
  language: 'en',
}

describe('escaping', () => {
  it('escapes all five XML-hostile characters', () => {
    expect(escapeXml(`<&>"'`)).toBe('&lt;&amp;&gt;&quot;&apos;')
  })

  it('survives an ampersand in a title', () => {
    const xml = buildRssXml({ ...channel, items: [{ title: 'Schools & Clinics', url: 'https://example.org/news/a' }] })
    expect(xml).toContain('Schools &amp; Clinics')
    expect(xml).not.toContain('Schools & Clinics')
  })

  it('carries a Ge’ez title intact', () => {
    const title = 'ሠገነይቲ፦ ዜና'
    const xml = buildRssXml({ ...channel, items: [{ title, url: 'https://example.org/news/b' }] })
    expect(xml).toContain(title)
  })

  it('escapes a description that tries to close the tag', () => {
    const xml = buildRssXml({
      ...channel,
      items: [{ title: 't', url: 'https://example.org/x', description: '</description><evil>' }],
    })
    expect(xml).not.toContain('<evil>')
    expect(xml).toContain('&lt;evil&gt;')
  })
})

describe('document shape', () => {
  const xml = buildRssXml({
    ...channel,
    items: [
      { title: 'A', url: 'https://example.org/news/a', publishedAt: '2026-07-19T10:30:00.000Z', description: 'x' },
      { title: 'B', url: 'https://example.org/news/b', publishedAt: 'not-a-date' },
    ],
  })

  it('is RSS 2.0 with a self-referencing atom link', () => {
    expect(xml).toContain('<rss version="2.0"')
    expect(xml).toContain('rel="self"')
    expect(xml).toContain('https://example.org/news/rss.xml')
  })

  it('uses the article URL as a permalink guid', () => {
    expect(xml).toContain('<guid isPermaLink="true">https://example.org/news/a</guid>')
  })

  it('renders RFC 822 dates and omits unparseable ones', () => {
    expect(xml).toContain('<pubDate>Sun, 19 Jul 2026 10:30:00 GMT</pubDate>')
    // Item B: no pubDate at all rather than "Invalid Date".
    expect(xml).not.toContain('Invalid Date')
  })

  it('omits empty descriptions rather than emitting empty tags', () => {
    expect((xml.match(/<description>/g) ?? []).length).toBe(2) // channel + item A
  })
})
