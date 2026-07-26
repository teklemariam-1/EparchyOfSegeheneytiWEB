import { describe, it, expect } from 'vitest'
import { parseNewsView, DEFAULT_NEWS_VIEW, NEWS_VIEW_COOKIE } from '../view'

/**
 * The view is read from a cookie on the server so the first byte of HTML is
 * already the right layout. That means an untrusted string decides which
 * component renders — it must never be able to break the page.
 */

describe('parseNewsView', () => {
  it('accepts the two known views', () => {
    expect(parseNewsView('grid')).toBe('grid')
    expect(parseNewsView('magazine')).toBe('magazine')
  })

  it('falls back to the default when the cookie is absent', () => {
    expect(parseNewsView(undefined)).toBe(DEFAULT_NEWS_VIEW)
  })

  it.each(['', 'GRID', 'list', 'magazine ', '../../etc/passwd', '<script>'])(
    'falls back rather than trusting %o',
    (value) => {
      expect(['grid', 'magazine']).toContain(parseNewsView(value))
    },
  )
})

describe('the cookie name', () => {
  it('is stable — changing it silently resets everyone’s choice', () => {
    expect(NEWS_VIEW_COOKIE).toBe('news-view')
  })
})
