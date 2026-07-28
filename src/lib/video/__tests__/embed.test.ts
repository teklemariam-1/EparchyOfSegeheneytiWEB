import { describe, it, expect } from 'vitest'
import { parseVideoUrl, isEmbeddableVideoUrl, VIDEO_FRAME_ORIGINS } from '../embed'

/**
 * The editor-facing promise is "paste the URL". These tests are mostly a list of
 * the shapes a real person actually pastes — YouTube's own share button, the
 * address bar, a live stream while it is on air — plus the refusals, which
 * matter more: the parsed value goes into an <iframe src>, so anything not
 * recognised must be refused rather than passed through.
 */

const ID = 'dQw4w9WgXcQ' // 11 chars, the real YouTube shape

describe('the shapes people paste', () => {
  it.each([
    ['address bar', `https://www.youtube.com/watch?v=${ID}`],
    ['share button', `https://youtu.be/${ID}`],
    ['share button with tracking param', `https://youtu.be/${ID}?si=AbCdEf`],
    ['live stream, while on air', `https://www.youtube.com/live/${ID}`],
    ['already an embed', `https://www.youtube.com/embed/${ID}`],
    ['short', `https://youtube.com/shorts/${ID}`],
    ['mobile', `https://m.youtube.com/watch?v=${ID}`],
    ['with a start time', `https://www.youtube.com/watch?v=${ID}&t=90s`],
  ])('accepts the %s form', (_label, url) => {
    const parsed = parseVideoUrl(url)
    expect(parsed?.provider).toBe('youtube')
    expect(parsed?.id).toBe(ID)
  })

  it('always produces the same embed URL whatever form was pasted', () => {
    const forms = [
      `https://www.youtube.com/watch?v=${ID}`,
      `https://youtu.be/${ID}`,
      `https://www.youtube.com/live/${ID}`,
    ]
    const embeds = new Set(forms.map((f) => parseVideoUrl(f)?.embedUrl))
    expect(embeds.size).toBe(1)
  })

  it('uses youtube-nocookie, so watching a liturgy does not set tracking cookies', () => {
    expect(parseVideoUrl(`https://youtu.be/${ID}`)?.embedUrl).toContain('youtube-nocookie.com')
  })

  it('keeps a canonical watch URL for a fallback link', () => {
    expect(parseVideoUrl(`https://youtu.be/${ID}`)?.watchUrl).toBe(
      `https://www.youtube.com/watch?v=${ID}`,
    )
  })
})

describe('Facebook', () => {
  it('accepts a watch link', () => {
    const parsed = parseVideoUrl('https://www.facebook.com/watch/?v=1234567890')
    expect(parsed?.provider).toBe('facebook')
    expect(parsed?.id).toBe('1234567890')
  })

  it('accepts a page video permalink', () => {
    const parsed = parseVideoUrl('https://www.facebook.com/EparchySegheneyti/videos/1234567890')
    expect(parsed?.id).toBe('1234567890')
  })

  it('percent-encodes the href it hands to the plugin', () => {
    const parsed = parseVideoUrl('https://www.facebook.com/watch/?v=1234567890')
    expect(parsed?.embedUrl).toContain(encodeURIComponent('https://www.facebook.com/watch/?v=1234567890'))
  })

  it('refuses a shortened fb.watch link, which carries no id', () => {
    // Embedding it would need a server-side redirect resolve. Refusing tells the
    // editor to paste the full link, which is a better outcome than a dead frame.
    expect(parseVideoUrl('https://fb.watch/abc123/')).toBeNull()
  })
})

describe('refusals — this is the security boundary', () => {
  it('refuses an unknown host', () => {
    // The result is interpolated into an <iframe src>. Anyone who can edit an
    // event could otherwise embed a page imitating the eparchy's own login.
    expect(parseVideoUrl('https://evil.example.com/embed/xyz')).toBeNull()
  })

  it('refuses a host that merely contains a provider name', () => {
    expect(parseVideoUrl('https://youtube.com.evil.example/watch?v=' + ID)).toBeNull()
    expect(parseVideoUrl('https://notyoutube.com/watch?v=' + ID)).toBeNull()
  })

  it.each(['javascript:alert(1)', 'data:text/html,<script>alert(1)</script>', 'file:///etc/passwd'])(
    'refuses the %o scheme',
    (bad) => {
      expect(parseVideoUrl(bad)).toBeNull()
    },
  )

  it('refuses a known host with no video in it', () => {
    expect(parseVideoUrl('https://www.youtube.com/')).toBeNull()
    expect(parseVideoUrl('https://www.youtube.com/@SomeChannel')).toBeNull()
  })

  it('refuses an id of the wrong shape', () => {
    expect(parseVideoUrl('https://www.youtube.com/watch?v=short')).toBeNull()
    expect(parseVideoUrl('https://www.youtube.com/watch?v=' + 'x'.repeat(40))).toBeNull()
  })

  it.each([null, undefined, '', '   ', 'not a url', 42 as unknown as string])(
    'refuses %o without throwing',
    (bad) => {
      expect(() => parseVideoUrl(bad)).not.toThrow()
      expect(parseVideoUrl(bad)).toBeNull()
    },
  )
})

describe('isEmbeddableVideoUrl', () => {
  it('mirrors the parser, so admin validation cannot disagree with rendering', () => {
    expect(isEmbeddableVideoUrl(`https://youtu.be/${ID}`)).toBe(true)
    expect(isEmbeddableVideoUrl('https://evil.example.com/x')).toBe(false)
  })
})

describe('CSP origins', () => {
  it('cover every host the parser can emit', () => {
    // If a provider is added without its origin, the player fails silently with
    // only a console error — the worst kind of bug to diagnose from a report.
    const emitted = [
      parseVideoUrl(`https://youtu.be/${ID}`),
      parseVideoUrl('https://www.facebook.com/watch/?v=1234567890'),
    ]
      .filter(Boolean)
      .map((v) => new URL(v!.embedUrl).origin)

    for (const origin of emitted) {
      expect(VIDEO_FRAME_ORIGINS as readonly string[]).toContain(origin)
    }
  })
})
