import { describe, it, expect } from 'vitest'
import { isPublicRead, isPublishedOrAuthenticated } from '../readAccess'

// Helper — avoids importing Payload types in tests
function req(user: object | null = null) {
  return { user } as any
}

describe('isPublicRead', () => {
  it('allows anonymous visitors', () => {
    expect(isPublicRead({ req: req(null) } as any)).toBe(true)
  })

  it('allows authenticated users', () => {
    expect(isPublicRead({ req: req({ role: 'parish-editor' }) } as any)).toBe(true)
  })
})

describe('isPublishedOrAuthenticated', () => {
  it('lets any authenticated user read drafts', () => {
    expect(isPublishedOrAuthenticated({ req: req({ role: 'media-editor' }) } as any)).toBe(true)
  })

  it('constrains anonymous visitors to published documents', () => {
    // A where-clause, not `true` — so ?draft=true cannot leak unpublished content.
    expect(isPublishedOrAuthenticated({ req: req(null) } as any)).toEqual({
      _status: { equals: 'published' },
    })
  })
})
