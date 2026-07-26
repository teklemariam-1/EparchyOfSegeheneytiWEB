import { describe, it, expect } from 'vitest'
import { shareUrl, articleUrl } from '../share'

/**
 * Share links are the main way this audience circulates articles — WhatsApp
 * especially. A link that breaks on an apostrophe or a Ge'ez title is a story
 * that does not travel, so encoding is what these tests are really about.
 */

const SLUG = 'ukraine-35-years'
const PLAIN = 'A simple headline'

describe('articleUrl', () => {
  it('is absolute — share targets reject relative links', () => {
    expect(articleUrl(SLUG)).toMatch(/^https?:\/\//)
    expect(articleUrl(SLUG)).toContain(`/news/${SLUG}`)
  })

  it('carries no double slash from a trailing-slash site URL', () => {
    expect(articleUrl(SLUG).replace(/^https?:\/\//, '')).not.toContain('//')
  })
})

describe('WhatsApp', () => {
  it('uses the wa.me universal link so mobile opens the app directly', () => {
    expect(shareUrl('whatsapp', PLAIN, SLUG)).toMatch(/^https:\/\/wa\.me\/\?text=/)
  })

  it('carries both the title and the link in one message', () => {
    const decoded = decodeURIComponent(shareUrl('whatsapp', PLAIN, SLUG).split('text=')[1]!)
    expect(decoded).toContain(PLAIN)
    expect(decoded).toContain(articleUrl(SLUG))
  })

  it('encodes a title containing & and ? so the link is not truncated', () => {
    // Raw, these would terminate the query string and the shared link would
    // arrive broken — the single most likely real-world failure here.
    const url = shareUrl('whatsapp', 'Peace & hope? Yes', SLUG)
    expect(url).not.toContain('& hope')
    expect(url).not.toContain('? Yes')
    expect(decodeURIComponent(url)).toContain('Peace & hope? Yes')
  })

  it('survives a Ge’ez title', () => {
    const title = 'ኡክሬን፦ 35 ዓመታት'
    const url = shareUrl('whatsapp', title, SLUG)
    expect(url).toMatch(/^https:\/\/wa\.me\/\?text=%/)
    expect(decodeURIComponent(url)).toContain(title)
  })

  it('encodes the newline between title and link', () => {
    expect(shareUrl('whatsapp', PLAIN, SLUG)).toContain('%0A')
  })
})

describe('Facebook', () => {
  it('sends only the URL — Facebook reads Open Graph tags, not a caption', () => {
    const url = shareUrl('facebook', PLAIN, SLUG)
    expect(url).toContain('facebook.com/sharer/sharer.php?u=')
    expect(url).not.toContain('simple')
  })

  it('percent-encodes the shared URL', () => {
    expect(shareUrl('facebook', PLAIN, SLUG)).toContain(encodeURIComponent(articleUrl(SLUG)))
  })
})

describe('X', () => {
  it('sends the title and the URL as separate parameters', () => {
    const url = shareUrl('x', PLAIN, SLUG)
    expect(url).toContain('twitter.com/intent/tweet')
    expect(url).toContain(`text=${encodeURIComponent(PLAIN)}`)
    expect(url).toContain(`url=${encodeURIComponent(articleUrl(SLUG))}`)
  })
})

describe('every target', () => {
  it.each(['whatsapp', 'facebook', 'x'] as const)('%s produces a parseable https URL', (target) => {
    const url = shareUrl(target, "Quotes ' and \" and #hash", SLUG)
    expect(() => new URL(url)).not.toThrow()
    expect(new URL(url).protocol).toBe('https:')
  })

  it.each(['whatsapp', 'facebook', 'x'] as const)('%s never leaks a raw # into the query', (target) => {
    // An unencoded '#' turns everything after it into a fragment, silently
    // dropping the link from the shared message.
    const url = shareUrl(target, 'Tagged #Eparchy', SLUG)
    expect(url.split('?')[1] ?? '').not.toContain('#')
  })
})
