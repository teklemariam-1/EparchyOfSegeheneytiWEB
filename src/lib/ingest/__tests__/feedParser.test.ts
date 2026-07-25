import { describe, it, expect } from 'vitest'
import {
  decodeEntities,
  toPlainText,
  truncate,
  detectFeedFormat,
  parseFeed,
} from '../feedParser'

describe('decodeEntities', () => {
  it('decodes named entities', () => {
    expect(decodeEntities('Tom &amp; Jerry &lt;3 &quot;hi&quot;')).toBe('Tom & Jerry <3 "hi"')
  })

  it('decodes decimal numeric references, including Ge’ez', () => {
    // ጠ = U+1320 = 4896; the whole word "ትግርኛ"
    expect(decodeEntities('&#4725;&#4877;&#4653;&#4763;')).toBe('ትግርኛ')
  })

  it('decodes hex numeric references', () => {
    expect(decodeEntities('&#x12A0;')).toBe('አ')
  })

  it('leaves unknown/invalid entities untouched', () => {
    expect(decodeEntities('a &bogus; b &#999999999999;')).toBe('a &bogus; b &#999999999999;')
  })
})

describe('toPlainText', () => {
  it('strips tags, decodes entities and collapses whitespace', () => {
    expect(toPlainText('<p>Hello&nbsp;&amp;   <b>world</b></p>')).toBe('Hello & world')
  })
  it('drops the feed self "Read all" link', () => {
    expect(toPlainText('Body text <a href="x">Read all</a>')).toBe('Body text')
  })
  it('handles Ge’ez numeric entities inside markup', () => {
    expect(toPlainText('<title>&#4725;&#4877;&#4653;&#4763;</title>')).toBe('ትግርኛ')
  })
})

describe('truncate', () => {
  it('does not cut short text', () => {
    expect(truncate('short', 10)).toBe('short')
  })
  it('cuts on a word boundary and appends an ellipsis', () => {
    expect(truncate('one two three four', 9)).toBe('one two…')
  })
})

describe('detectFeedFormat', () => {
  it('detects RSS', () => {
    expect(detectFeedFormat('<?xml version="1.0"?><rss version="2.0"><channel></channel></rss>')).toBe('rss')
  })
  it('detects Atom', () => {
    expect(detectFeedFormat('<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"></feed>')).toBe('atom')
  })
  it('detects JSON Feed by content-type', () => {
    expect(detectFeedFormat('{"version":"https://jsonfeed.org/version/1.1","items":[]}', 'application/json')).toBe('json')
  })
  it('detects an HTML page (not a feed)', () => {
    expect(detectFeedFormat('<!doctype html><html><body>hi</body></html>', 'text/html')).toBe('html')
  })
})

const RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>Example</title>
    <item>
      <title>First &amp; Best</title>
      <link>https://example.org/first</link>
      <description>&lt;p&gt;Summary one&lt;/p&gt;</description>
      <pubDate>Wed, 01 Jan 2025 08:00:00 GMT</pubDate>
      <media:content url="https://example.org/one.jpg" />
    </item>
    <item>
      <title>Second</title>
      <link>https://example.org/second</link>
      <description>Summary two</description>
      <pubDate>Thu, 02 Jan 2025 08:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`

const ATOM = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Atom Example</title>
  <entry>
    <title>Atom Title</title>
    <link rel="alternate" href="https://example.org/atom-1" />
    <link rel="self" href="https://example.org/self" />
    <summary>Atom summary</summary>
    <published>2025-03-15T10:00:00Z</published>
  </entry>
</feed>`

const JSON_FEED = JSON.stringify({
  version: 'https://jsonfeed.org/version/1.1',
  title: 'JSON Example',
  items: [
    {
      title: 'JSON Title',
      url: 'https://example.org/json-1',
      content_text: 'JSON summary text',
      date_published: '2025-04-01T12:00:00Z',
      image: 'https://example.org/j.jpg',
    },
  ],
})

describe('parseFeed', () => {
  it('parses RSS 2.0 items with entities and images', () => {
    const { format, items } = parseFeed(RSS, 'application/rss+xml')
    expect(format).toBe('rss')
    expect(items).toHaveLength(2)
    expect(items[0]).toMatchObject({
      title: 'First & Best',
      summary: 'Summary one',
      link: 'https://example.org/first',
      imageUrl: 'https://example.org/one.jpg',
    })
    expect(items[0].publishedAt).toBe('2025-01-01T08:00:00.000Z')
  })

  it('parses Atom, extracting the alternate link href and published date', () => {
    const { format, items } = parseFeed(ATOM, 'application/atom+xml')
    expect(format).toBe('atom')
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({
      title: 'Atom Title',
      link: 'https://example.org/atom-1', // NOT the rel="self" link
      summary: 'Atom summary',
    })
    expect(items[0].publishedAt).toBe('2025-03-15T10:00:00.000Z')
  })

  it('parses JSON Feed', () => {
    const { format, items } = parseFeed(JSON_FEED, 'application/json')
    expect(format).toBe('json')
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({
      title: 'JSON Title',
      link: 'https://example.org/json-1',
      summary: 'JSON summary text',
      imageUrl: 'https://example.org/j.jpg',
    })
  })

  it('returns no items (and format html) for a web page', () => {
    const { format, items } = parseFeed('<!doctype html><html><body>not a feed</body></html>', 'text/html')
    expect(format).toBe('html')
    expect(items).toHaveLength(0)
  })

  it('tolerates a single item (not wrapped in an array)', () => {
    const one = `<rss version="2.0"><channel><item><title>Only</title><link>https://x.org/1</link></item></channel></rss>`
    const { items } = parseFeed(one)
    expect(items).toHaveLength(1)
    expect(items[0].title).toBe('Only')
  })

  it('skips items missing a title or link instead of throwing', () => {
    const bad = `<rss version="2.0"><channel><item><description>no title/link</description></item></channel></rss>`
    const { items } = parseFeed(bad)
    expect(items).toHaveLength(0)
  })
})
