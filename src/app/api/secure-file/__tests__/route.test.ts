import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/payload/client', () => ({ getPayload: vi.fn() }))

import { getPayload } from '@/lib/payload/client'
import { GET } from '../[id]/route'

const req = (headers: Record<string, string> = {}) =>
  new Request('http://localhost/api/secure-file/1', { headers })

function mockPayload(opts: {
  media?: { url?: string | null; accessLevel?: string | null } | null | 'throw'
  user?: { role?: string } | null
}) {
  const findByID = vi.fn(async () => {
    if (opts.media === 'throw') throw new Error('not found')
    return opts.media
  })
  const auth = vi.fn(async () => ({ user: opts.user ?? null }))
  ;(getPayload as unknown as vi.Mock).mockResolvedValue({ findByID, auth })
  return { findByID, auth }
}

const call = async (headers?: Record<string, string>) =>
  GET(req(headers), { params: Promise.resolve({ id: '1' }) })

describe('GET /api/secure-file/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('redirects public assets straight to the file', async () => {
    mockPayload({ media: { url: 'https://blob/x.pdf', accessLevel: 'public' } })
    const res = await call()
    expect(res.status).toBe(307)
    expect(res.headers.get('Location')).toBe('https://blob/x.pdf')
    expect(res.headers.get('Cache-Control')).toContain('public')
  })

  it('treats missing accessLevel as public', async () => {
    mockPayload({ media: { url: 'https://blob/y.pdf' } })
    expect((await call()).status).toBe(307)
  })

  it('404s when the asset or its url is missing', async () => {
    mockPayload({ media: null })
    expect((await call()).status).toBe(404)
    mockPayload({ media: { url: null, accessLevel: 'public' } })
    expect((await call()).status).toBe(404)
    mockPayload({ media: 'throw' })
    expect((await call()).status).toBe(404)
  })

  it('403s restricted assets for anonymous requests', async () => {
    mockPayload({ media: { url: 'https://blob/secret.pdf', accessLevel: 'restricted' }, user: null })
    const res = await call()
    expect(res.status).toBe(403)
    expect(res.headers.get('Location')).toBeNull()
  })

  it('403s restricted assets for a non-elevated user', async () => {
    mockPayload({
      media: { url: 'https://blob/secret.pdf', accessLevel: 'restricted' },
      user: { role: 'parish-editor' },
    })
    expect((await call()).status).toBe(403)
  })

  it('redirects restricted assets for an elevated user, non-cacheable', async () => {
    mockPayload({
      media: { url: 'https://blob/secret.pdf', accessLevel: 'restricted' },
      user: { role: 'chancery-editor' },
    })
    const res = await call()
    expect(res.status).toBe(307)
    expect(res.headers.get('Location')).toBe('https://blob/secret.pdf')
    expect(res.headers.get('Cache-Control')).toContain('no-store')
  })
})
